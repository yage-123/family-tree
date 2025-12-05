import React, { useMemo, useState } from "react";
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Svg, { Line } from "react-native-svg";
import PersonEditorModal from "../../src/components/PersonEditorModal";
import { Person, useFamily } from "../../src/store/familyStore";

// --- 見た目調整用 ---
const CARD_W = 170;
const CARD_H = 92;
const LEVEL_GAP_Y = 70;
const SIBLING_GAP_X = 200;
const PAD = 30;
const MARK_W = 26;       // ⇄ の固定幅
const COUPLE_GAP = 10;   // UnitBox内のgapと合わせる（今のstyles.unitのgapに合わせる）


// --- birthDate(YYYY-MM-DD) → 年齢（雑でOK） ---
function calcAge(birthDate?: string) {
  if (!birthDate) return "";
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(birthDate);
  if (!m) return "";
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  const now = new Date();
  let age = now.getFullYear() - y;
  const beforeBirthday = now.getMonth() + 1 < mo || (now.getMonth() + 1 === mo && now.getDate() < d);
  if (beforeBirthday) age--;
  if (age < 0 || age > 130) return "";
  return String(age);
}

function genderLabel(g: string) {
  return g === "male" ? "男" : g === "female" ? "女" : g === "other" ? "その他" : "不明";
}
function bloodLabel(b: string) {
  return b === "A" || b === "B" || b === "AB" || b === "O" ? b : "不明";
}

// ---- 夫婦/単身を「ユニット」として扱う ----
type Unit =
  | { kind: "single"; unitId: string; aId: string; bId?: undefined }
  | { kind: "couple"; unitId: string; aId: string; bId: string };

type NodeBox = {
  unitId: string;
  kind: Unit["kind"];
  a: Person;
  b?: Person;
  x: number; // top-left
  y: number; // top-left
  w: number;
  h: number;
};

type Link = {
     fromUnitId: string; 
     toUnitId: string; 
     fromPersonId: string; 
     toPersonId: string;};


export default function RealTreeScreen() {
  const { people, edges, spouses } = useFamily();

  const [editorOpen, setEditorOpen] = useState(false);
  const [editingPerson, setEditingPerson] = useState<Person | null>(null);

  const peopleMap = useMemo(() => new Map(people.map((p) => [p.id, p])), [people]);

  // personId -> spouseId（1人1配偶者想定）
  const spouseOf = useMemo(() => {
    const m = new Map<string, string>();
    for (const s of spouses) {
      m.set(s.aId, s.bId);
      m.set(s.bId, s.aId);
    }
    return m;
  }, [spouses]);

  const hasParent = useMemo(() => new Set(edges.map((e) => e.childId)), [edges]);

  // unitId を personId から引けるようにする
  const { units, unitOfPerson } = useMemo(() => {
    const unitOf = new Map<string, string>();
    const list: Unit[] = [];
    const visited = new Set<string>();

    for (const p of people) {
      if (visited.has(p.id)) continue;

      const sp = spouseOf.get(p.id);
      if (sp && peopleMap.has(sp)) {
        // 夫婦ユニット（重複防止のため並び順で固定）
        const a = p.id < sp ? p.id : sp;
        const b = p.id < sp ? sp : p.id;
        const unitId = `u:${a}<<<${b}`;
        list.push({ kind: "couple", unitId, aId: a, bId: b });
        unitOf.set(a, unitId);
        unitOf.set(b, unitId);
        visited.add(a);
        visited.add(b);
      } else {
        // 単身ユニット
        const unitId = `u:${p.id}`;
        list.push({ kind: "single", unitId, aId: p.id });
        unitOf.set(p.id, unitId);
        visited.add(p.id);
      }
    }

    return { units: list, unitOfPerson: unitOf };
  }, [people, spouseOf, peopleMap]);

  // unit -> children units（親子は person 基準なので、夫婦は「夫 or 妻どちらかの子」も含める）
  const { childrenOfUnit, edgeLinks } = useMemo(() => {
  const childMap = new Map<string, Set<string>>(); // unitId -> child units
  const edgeLinks: Link[] = [];

  for (const e of edges) {
    const fromUnitId = unitOfPerson.get(e.parentId);
    const toUnitId = unitOfPerson.get(e.childId);
    if (!fromUnitId || !toUnitId) continue;

    // ★ どっちの親かを残す
    edgeLinks.push({ fromUnitId, toUnitId, fromPersonId: e.parentId, toPersonId: e.childId, });

    if (!childMap.has(fromUnitId)) childMap.set(fromUnitId, new Set());
    childMap.get(fromUnitId)!.add(toUnitId);
  }

  return { childrenOfUnit: childMap, edgeLinks };
}, [edges, unitOfPerson]);


  // ルートユニット（本人が子じゃない、かつ配偶者がいるなら配偶者も子じゃない）
  const roots = useMemo(() => {
    const rootUnits: string[] = [];
    for (const u of units) {
      const aIsChild = hasParent.has(u.aId);
      const bIsChild = u.kind === "couple" ? hasParent.has(u.bId) : false;
      if (!aIsChild && !bIsChild) rootUnits.push(u.unitId);
    }
    return rootUnits;
  }, [units, hasParent]);

  // ユニット幅
  const unitSize = (u: Unit) => {
  if (u.kind === "single") return { w: CARD_W, h: CARD_H };
  // 実表示は「カード + gap + MARK_W + gap + カード」
  return { w: CARD_W + COUPLE_GAP + MARK_W + COUPLE_GAP + CARD_W, h: CARD_H };
};

// レイアウト計算（木の幅を再帰で計算して x を割り当て）
const { boxes, links, canvasW, canvasH } = useMemo(() => {
  const boxes: NodeBox[] = [];

  const unitById = new Map(units.map((u) => [u.unitId, u]));
  const placed = new Set<string>();   // 既に配置済みユニット（重複配置しない）
  const inStack = new Set<string>();  // 循環検出用（保険）

  function layout(unitId: string, level: number, leftX: number): { width: number; centerX: number } {
    // ★ すでに配置済みなら、この親の配下には「再配置しない」
    if (placed.has(unitId)) {
      return { width: 0, centerX: leftX + CARD_W / 2 };
    }

    // ★ 循環（念のため）
    if (inStack.has(unitId)) {
      return { width: CARD_W, centerX: leftX + CARD_W / 2 };
    }
    inStack.add(unitId);

    const u = unitById.get(unitId);
    if (!u) {
      inStack.delete(unitId);
      return { width: CARD_W, centerX: leftX + CARD_W / 2 };
    }

    const size = unitSize(u);

    // ★ 既に配置済みの子は、この親のレイアウト計算から除外
    const kids = Array.from(childrenOfUnit.get(unitId) ?? []).filter((kid) => !placed.has(kid));

    // 子を先に配置
    let childLayouts: { id: string; width: number; centerX: number }[] = [];
    let childrenTotal = 0;

    if (kids.length > 0) {
      let xCursor = leftX;
      for (const kid of kids) {
        const r = layout(kid, level + 1, xCursor);
        childLayouts.push({ id: kid, width: r.width, centerX: r.centerX });
        xCursor += r.width + SIBLING_GAP_X;
        childrenTotal += r.width;
      }
      childrenTotal += SIBLING_GAP_X * (kids.length - 1);
    }

    const subtreeW = Math.max(size.w, kids.length ? childrenTotal : 0);
    const topY = PAD + level * (CARD_H + LEVEL_GAP_Y);

    // 親の中心を「子の左右中心」に合わせる
    let centerX = leftX + subtreeW / 2;
    if (kids.length) {
      const first = childLayouts[0].centerX;
      const last = childLayouts[childLayouts.length - 1].centerX;
      centerX = (first + last) / 2;
    }

    const nodeX = centerX - size.w / 2;

    const a = peopleMap.get(u.aId)!;
    const b = u.kind === "couple" ? peopleMap.get(u.bId)! : undefined;

    boxes.push({
      unitId,
      kind: u.kind,
      a,
      b,
      x: nodeX,
      y: topY,
      w: size.w,
      h: size.h,
    });

    // ★ 「配置済み」にする（多親ケースの再配置バグを止める）
    placed.add(unitId);
    inStack.delete(unitId);

    return { width: subtreeW, centerX };
  }

  // ルートを左から並べる
  let x = PAD;
  for (const r of roots.length ? roots : units.map((u) => u.unitId)) {
    const res = layout(r, 0, x);
    x += res.width + 80;
  }

  // ★ 左に飛び出す補正（欠け防止）
  if (boxes.length > 0) {
    const minX = Math.min(...boxes.map((b) => b.x));
    const shiftX = minX < PAD ? PAD - minX : 0;
    if (shiftX !== 0) {
      for (const b of boxes) b.x += shiftX;
    }
  }

  // ★ 描画する箱があるものだけ線を残す
  const boxUnitIds = new Set(boxes.map((b) => b.unitId));
  const links = edgeLinks.filter((l) => boxUnitIds.has(l.fromUnitId) && boxUnitIds.has(l.toUnitId));

  // canvasサイズ
  const maxX = boxes.length ? Math.max(...boxes.map((b) => b.x + b.w), PAD + 400) : PAD + 400;
  const maxY = boxes.length ? Math.max(...boxes.map((b) => b.y + b.h), PAD + 400) : PAD + 400;

  return {
    boxes,
    links,
    canvasW: maxX + PAD,
    canvasH: maxY + PAD,
  };
}, [peopleMap, units, roots, childrenOfUnit, edgeLinks]);


  if (people.length === 0) {
    return (
      <View style={[styles.center, { backgroundColor: stylesBg }]}>
        <Text style={styles.title}>実話家系図</Text>
        <Text style={styles.muted}>まだ人物がいません。「編集」タブで追加してね。</Text>
      </View>
    );
  }

  // unitId -> NodeBox
  const boxMap = useMemo(() => new Map(boxes.map((b) => [b.unitId, b])), [boxes]);

  const parentAnchorX = (parentBox: any, parentPersonId: string) => {
  // 単身なら中央
  if (parentBox.kind !== "couple") return parentBox.x + parentBox.w / 2;

  // 夫婦の左（a側）の人物が親なら、左カード中心
  if (parentBox.a.id === parentPersonId) {
    return parentBox.x + CARD_W / 2;
  }

  // 夫婦の右（b側）の人物が親なら、右カード中心
  if (parentBox.b?.id === parentPersonId) {
    return parentBox.x + (CARD_W + COUPLE_GAP + MARK_W + COUPLE_GAP) + CARD_W / 2;
  }

  // 念のため fallback
  return parentBox.x + parentBox.w / 2;
};
const childAnchorX = (childBox: any, childPersonId: string) => {
  if (childBox.kind !== "couple") return childBox.x + childBox.w / 2;

  // 左（a側）
  if (childBox.a.id === childPersonId) {
    return childBox.x + CARD_W / 2;
  }

  // 右（b側）
  if (childBox.b?.id === childPersonId) {
    return childBox.x + (CARD_W + COUPLE_GAP + MARK_W + COUPLE_GAP) + CARD_W / 2;
  }

  return childBox.x + childBox.w / 2;
};

  return (
    <View style={{ flex: 1, backgroundColor: stylesBg }}>
      {/* 横→縦の2重スクロールで “キャンバス” にする */}
      <ScrollView horizontal showsHorizontalScrollIndicator>
        <ScrollView showsVerticalScrollIndicator>
          <View style={{ width: canvasW, height: canvasH, backgroundColor: stylesBg }}>
            {/* 線（下地） */}
           <Svg width={canvasW} height={canvasH} style={StyleSheet.absoluteFill}>
  {links.map((ln, i) => {
    const a = boxMap.get(ln.fromUnitId);
    const b = boxMap.get(ln.toUnitId);
    if (!a || !b) return null;

    const x1 = parentAnchorX(a, ln.fromPersonId);
    const y1 = a.y + a.h;
    const x2 = childAnchorX(b, ln.toPersonId);
    const y2 = b.y;

    return (
      <React.Fragment key={`${ln.fromUnitId}->${ln.toUnitId}-${i}`}>
        <Line x1={x1} y1={y1} x2={x1} y2={y1 + 18} stroke="#111" strokeWidth={2} />
        <Line x1={x1} y1={y1 + 18} x2={x2} y2={y1 + 18} stroke="#111" strokeWidth={2} />
        <Line x1={x2} y1={y1 + 18} x2={x2} y2={y2} stroke="#111" strokeWidth={2} />
      </React.Fragment>
    );
  })}
</Svg>


            {/* 人物カード（上） */}
            {boxes.map((b) => (
              <UnitBox
                key={b.unitId}
                box={b}
                onPressPerson={(p) => {
                  setEditingPerson(p);
                  setEditorOpen(true);
                }}
              />
            ))}
          </View>
        </ScrollView>
      </ScrollView>

      {/* 編集モーダル */}
      <PersonEditorModal visible={editorOpen} person={editingPerson} onClose={() => setEditorOpen(false)} />
    </View>
  );
}

const stylesBg = "#d9f5d9";

function UnitBox({ box, onPressPerson }: { box: NodeBox; onPressPerson: (p: Person) => void }) {
  if (box.kind === "single") {
    return (
      <View style={[styles.unit, { left: box.x, top: box.y, width: box.w, height: box.h }]}>
        <PersonTile person={box.a} onPress={() => onPressPerson(box.a)} />
      </View>
    );
  }

 return (
  <View style={[styles.unit, { left: box.x, top: box.y, width: box.w, height: box.h }]}>
    <PersonTile person={box.a} onPress={() => onPressPerson(box.a)} />

    <View style={{ width: MARK_W, alignItems: "center", justifyContent: "center" }}>
      <Text style={styles.coupleMark}>⇄</Text>
    </View>

    <PersonTile person={box.b!} onPress={() => onPressPerson(box.b!)} />
  </View>
    );
}

function PersonTile({ person, onPress }: { person: Person; onPress: () => void }) {
  const age = calcAge(person.birthDate);
  return (
    <TouchableOpacity activeOpacity={0.85} onPress={onPress}>
      <View style={styles.card}>
        <View style={styles.row}>
          {person.photoUri ? (
            <Image source={{ uri: person.photoUri }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, { backgroundColor: "#eee" }]} />
          )}

          <View style={{ flex: 1 }}>
            <Text style={styles.name} numberOfLines={1}>
              {person.name}{age ? `（${age}）` : ""}
            </Text>
            <Text style={styles.meta} numberOfLines={1}>
              性別:{genderLabel(person.gender)} ／ 血液型:{bloodLabel(person.bloodType)}
            </Text>
          </View>
        </View>

        {!!person.note && (
          <Text style={styles.note} numberOfLines={2}>
            {person.note}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, padding: 16, gap: 8, justifyContent: "center" },
  title: { fontSize: 22, fontWeight: "900" },
  muted: { marginTop: 8, color: "#666", lineHeight: 20 },

  unit: {
    position: "absolute",
    flexDirection: "row",
    alignItems: "center",
    gap: COUPLE_GAP,
  },
  coupleMark: { fontWeight: "900", color: "#7a2cff" }, // 紫っぽく（サンプルに近い）
  card: {
    width: CARD_W,
    minHeight: CARD_H,
    padding: 10,
    borderRadius: 14,
    backgroundColor: "#fff",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#ddd",
  },
  row: { flexDirection: "row", alignItems: "center", gap: 10 },
  avatar: { width: 44, height: 44, borderRadius: 22 },
  name: { fontSize: 15, fontWeight: "900" },
  meta: { marginTop: 2, color: "#666", fontWeight: "800", fontSize: 12 },
  note: { marginTop: 6, color: "#444", fontSize: 12, fontWeight: "700" },
});
