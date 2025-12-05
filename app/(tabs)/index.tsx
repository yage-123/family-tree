import { useState } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import PersonEditorModal from "../../src/components/PersonEditorModal";
import { buildChildrenMap, getSpouse, Person, useFamily } from "../../src/store/familyStore";

const genderLabel = (g: string) => (g === "male" ? "男" : g === "female" ? "女" : g === "other" ? "その他" : "不明");
const bloodLabel = (b: string) => (b === "A" || b === "B" || b === "AB" || b === "O" ? b : "不明");

export default function TreeScreen() {
  const { people, edges, spouses } = useFamily();

  const [editorOpen, setEditorOpen] = useState(false);
  const [editingPerson, setEditingPerson] = useState<Person | null>(null);

  // 人物カードタップ時の共通処理
  const onPressPerson = (p: Person) => {
    setEditingPerson(p);
    setEditorOpen(true);
  };

  if (people.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={styles.title}>家系図</Text>
        <Text style={styles.muted}>まだ人物がいません。「編集」タブで追加してね。</Text>
      </View>
    );
  }

  const peopleMap = new Map(people.map((p) => [p.id, p]));
  const childrenMap = buildChildrenMap(edges);
  const hasParent = new Set(edges.map((e) => e.childId));

  // ルート判定：本人が子じゃない、かつ「配偶者がいる場合は配偶者側も子じゃない」を優先
  const roots = people.filter((p) => {
    const sp = getSpouse(spouses, p.id);
    if (!sp) return !hasParent.has(p.id);
    return !hasParent.has(p.id) && !hasParent.has(sp);
  });

  return (
    <View style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>家系図</Text>

        {roots.length === 0 ? (
          <Text style={styles.muted}>ルートが見つかりません（全員が誰かの子 / 循環の可能性）。</Text>
        ) : (
          roots.map((r) => (
            <TreeNode
              key={r.id}
              id={r.id}
              level={0}
              peopleMap={peopleMap}
              childrenMap={childrenMap}
              spouses={spouses}
              renderedCouples={new Set<string>()}
              onPressPerson={onPressPerson}
            />
          ))
        )}
      </ScrollView>

      {/* ★ モーダルは画面末尾に1個だけ */}
      <PersonEditorModal
        visible={editorOpen}
        person={editingPerson}
        onClose={() => setEditorOpen(false)}
      />
    </View>
  );
}

function coupleKey(a: string, b: string) {
  return [a, b].sort().join("<<<");
}

function TreeNode({
  id,
  level,
  peopleMap,
  childrenMap,
  spouses,
  renderedCouples,
  onPressPerson,
}: {
  id: string;
  level: number;
  peopleMap: Map<string, Person>;
  childrenMap: Map<string, string[]>;
  spouses: any[];
  renderedCouples: Set<string>;
  onPressPerson: (p: Person) => void;
}) {
  const person = peopleMap.get(id);
  if (!person) return null;

  const spouseId = getSpouse(spouses, id);
  const spouse = spouseId ? peopleMap.get(spouseId) : null;

  // 夫婦は1回だけ描画（A側もB側も同じノードにならないように）
  if (spouseId) {
    const key = coupleKey(id, spouseId);
    if (renderedCouples.has(key)) return null;
    renderedCouples.add(key);
  }

  // 子供は「本人の子」＋「配偶者の子」をまとめて表示
  const kidsA = childrenMap.get(id) ?? [];
  const kidsB = spouseId ? (childrenMap.get(spouseId) ?? []) : [];
  const kids = [...new Set([...kidsA, ...kidsB])].filter((k) => k !== id && k !== spouseId);

  return (
    <View style={{ marginLeft: level * 14, marginTop: 10 }}>
      <View style={styles.coupleRow}>
        <PersonCard person={person} onPress={() => onPressPerson(person)} />
        {spouse ? (
          <>
            <Text style={styles.coupleMark}>⇄</Text>
            <PersonCard person={spouse} onPress={() => onPressPerson(spouse)} />
          </>
        ) : null}
      </View>

      {kids.map((kidId) => (
        <TreeNode
          key={`${id}->${kidId}`}
          id={kidId}
          level={level + 1}
          peopleMap={peopleMap}
          childrenMap={childrenMap}
          spouses={spouses}
          renderedCouples={renderedCouples}
          onPressPerson={onPressPerson}
        />
      ))}
    </View>
  );
}

function PersonCard({ person, onPress }: { person: Person; onPress: () => void }) {
  return (
    <TouchableOpacity activeOpacity={0.85} onPress={onPress}>
      <View style={styles.card}>
        <Text style={styles.cardName}>{person.name}</Text>
        <Text style={styles.cardMeta}>
          性別:{genderLabel(person.gender)} ／ 血液型:{bloodLabel(person.bloodType)}
        </Text>
        {!!person.note && <Text style={styles.cardNote}>{person.note}</Text>}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, paddingBottom: 40 },
  center: { flex: 1, padding: 16, gap: 8, justifyContent: "center" },
  title: { fontSize: 22, fontWeight: "900" },
  muted: { marginTop: 8, color: "#666", lineHeight: 20 },

  coupleRow: { flexDirection: "row", alignItems: "center", gap: 10, flexWrap: "wrap" },
  coupleMark: { fontWeight: "900", color: "#444" },

  card: {
    padding: 12,
    borderRadius: 14,
    backgroundColor: "#fff",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#ddd",
    minWidth: 220,
  },
  cardName: { fontSize: 16, fontWeight: "900" },
  cardMeta: { marginTop: 4, color: "#666", fontWeight: "800" },
  cardNote: { marginTop: 6, color: "#555" },
});

