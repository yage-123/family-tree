import { useMemo, useState } from "react";
import { FlatList, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import ScreenNav from "../../src/components/ScreenNav";
import { BloodType, Gender, useFamily } from "../../src/store/familyStore";

const genders: { key: Gender; label: string }[] = [
  { key: "male", label: "男" },
  { key: "female", label: "女" },
  { key: "other", label: "その他" },
  { key: "unknown", label: "不明" },
];

const bloodTypes: { key: BloodType; label: string }[] = [
  { key: "A", label: "A" },
  { key: "B", label: "B" },
  { key: "AB", label: "AB" },
  { key: "O", label: "O" },
  { key: "unknown", label: "不明" },
];

function spouseKey(a: string, b: string) {
  return [a, b].sort().join("<<<");
}

export default function PeopleScreen() {
  const { people, edges, spouses, addEdge, removeEdge, addSpouse, removeSpouse } = useFamily();

  const peopleById = useMemo(() => new Map(people.map((p) => [p.id, p])), [people]);

  const spouseOf = useMemo(() => {
    const m = new Map<string, string>();
    for (const s of spouses) {
      m.set(s.aId, s.bId);
      m.set(s.bId, s.aId);
    }
    return m;
  }, [spouses]);

  // 親の選び方を「基準人物」と「どっち側」を分ける
  const [selectedParentBase, setSelectedParentBase] = useState<string | null>(null);
  const [parentSide, setParentSide] = useState<"self" | "both">("self");

  const [selectedChild, setSelectedChild] = useState<string | null>(null);

  // 夫婦選択
  const [selectedSpA, setSelectedSpA] = useState<string | null>(null);
  const [selectedSpB, setSelectedSpB] = useState<string | null>(null);

  const hasSpouse = (id: string) => spouses.some((s) => s.aId === id || s.bId === id);

  return (
    <View style={styles.container}>
      <View style={{ marginTop: 25 }}>
        <ScreenNav title="編集" />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator
      >
        {/* 夫婦 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>夫婦（配偶者）をつなぐ</Text>
          <Text style={styles.muted}>2人選んで「夫婦にする」</Text>

          <Text style={styles.pickerLabel}>配偶者A</Text>
          <FlatList
            data={people}
            keyExtractor={(p) => p.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 8 }}
            renderItem={({ item }) => (
              <Chip
                label={`${item.name}${hasSpouse(item.id) ? "（既婚）" : ""}`}
                active={selectedSpA === item.id}
                onPress={() => setSelectedSpA(item.id)}
              />
            )}
          />

          <Text style={[styles.pickerLabel, { marginTop: 10 }]}>配偶者B</Text>
          <FlatList
            data={people}
            keyExtractor={(p) => p.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 8 }}
            renderItem={({ item }) => (
              <Chip
                label={`${item.name}${hasSpouse(item.id) ? "（既婚）" : ""}`}
                active={selectedSpB === item.id}
                onPress={() => setSelectedSpB(item.id)}
              />
            )}
          />

          <TouchableOpacity
            style={[styles.primaryBtn, { marginTop: 12 }]}
            onPress={() => {
              if (!selectedSpA || !selectedSpB) return;
              if (selectedSpA === selectedSpB) return;
              addSpouse(selectedSpA, selectedSpB);
            }}
          >
            <Text style={styles.primaryBtnText}>夫婦にする</Text>
          </TouchableOpacity>

          <View style={{ marginTop: 12, gap: 8 }}>
            {spouses.length === 0 ? (
              <Text style={styles.muted}>夫婦関係はまだありません</Text>
            ) : (
              spouses.map((s) => (
                <View key={spouseKey(s.aId, s.bId)} style={styles.edgeRow}>
                  <Text style={{ flex: 1, fontWeight: "900" }}>
                    {peopleById.get(s.aId)?.name ?? "?"} ⇄ {peopleById.get(s.bId)?.name ?? "?"}
                  </Text>
                  <TouchableOpacity onPress={() => removeSpouse(s.aId, s.bId)} style={styles.smallBtn}>
                    <Text style={styles.smallBtnText}>解除</Text>
                  </TouchableOpacity>
                </View>
              ))
            )}
          </View>
        </View>

        {/* 親子 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>親子関係をつなぐ</Text>
          <Text style={styles.muted}>親 → 子 を選んで「つなぐ」</Text>

          <Text style={styles.pickerLabel}>親</Text>
          <FlatList
            data={people}
            keyExtractor={(p) => p.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 8 }}
            renderItem={({ item }) => (
              <Chip
                label={item.name}
                active={selectedParentBase === item.id}
                onPress={() => {
                  setSelectedParentBase(item.id);
                  setParentSide("self"); // 親を選び直したら本人側に戻す
                }}
              />
            )}
          />

          {/* 既婚の親を選んだ時だけ「本人 or 両方」を選べる */}
          {selectedParentBase && spouseOf.get(selectedParentBase) ? (
            <View style={{ marginTop: 10, gap: 8 }}>
              <Text style={styles.muted}>どちらから線を引く？</Text>

              <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
                <Chip label="本人側" active={parentSide === "self"} onPress={() => setParentSide("self")} />
                <Chip label="両方" active={parentSide === "both"} onPress={() => setParentSide("both")} />
              </View>
            </View>
          ) : null}

          <Text style={[styles.pickerLabel, { marginTop: 10 }]}>子</Text>
          <FlatList
            data={people}
            keyExtractor={(p) => p.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 8 }}
            renderItem={({ item }) => (
              <Chip label={item.name} active={selectedChild === item.id} onPress={() => setSelectedChild(item.id)} />
            )}
          />

          <TouchableOpacity
            style={[styles.primaryBtn, { marginTop: 12 }]}
            onPress={() => {
              if (!selectedParentBase || !selectedChild) return;

              // 親と子が同一人物になるのを防ぐ
              if (selectedParentBase === selectedChild) return;

              const spouseId = spouseOf.get(selectedParentBase); // 既婚なら相手ID

              // 既婚で「両方」なら、本人＋配偶者の両方に同じ子を紐付ける
              if (spouseId && parentSide === "both") {
                // 子に「配偶者本人」を選んでた場合も防ぐ
                if (spouseId === selectedChild) return;

                // 本人 -> 子（必ず追加）
                addEdge(selectedParentBase, selectedChild);

                // 配偶者 -> 子（重複があれば追加しない）
                const exists = edges.some((e) => e.parentId === spouseId && e.childId === selectedChild);
                if (!exists) addEdge(spouseId, selectedChild);

                return;
              }

              // 未婚 or 本人側
              addEdge(selectedParentBase, selectedChild);
            }}
          >
            <Text style={styles.primaryBtnText}>つなぐ（親 → 子）</Text>
          </TouchableOpacity>

          <View style={{ marginTop: 12, gap: 8 }}>
            {edges.length === 0 ? (
              <Text style={styles.muted}>まだ親子関係がありません</Text>
            ) : (
              edges.map((e) => (
                <View key={`${e.parentId}->${e.childId}`} style={styles.edgeRow}>
                  <Text style={{ flex: 1, fontWeight: "900" }}>
                    {peopleById.get(e.parentId)?.name ?? "?"} → {peopleById.get(e.childId)?.name ?? "?"}
                  </Text>
                  <TouchableOpacity onPress={() => removeEdge(e.parentId, e.childId)} style={styles.smallBtn}>
                    <Text style={styles.smallBtnText}>解除</Text>
                  </TouchableOpacity>
                </View>
              ))
            )}
          </View>
        </View>

        {/* 末尾の余白 */}
        <View style={{ height: 24 }} />
      </ScrollView>
    </View>
  );
}

function Chip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity onPress={onPress} style={[styles.chip, active && styles.chipActive]}>
      <Text style={[styles.chipText, active && styles.chipTextActive]} numberOfLines={1}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  scrollContent: { paddingBottom: 40 },

  section: { marginTop: 18, gap: 10 },
  sectionTitle: { fontSize: 16, fontWeight: "900" },
  muted: { color: "#666" },

  primaryBtn: {
    backgroundColor: "#111",
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 14,
    alignItems: "center",
  },
  primaryBtnText: { color: "#fff", fontWeight: "900" },

  pickerLabel: { fontWeight: "900", marginTop: 6 },

  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#bbb",
    backgroundColor: "#fff",
    maxWidth: 180,
  },
  chipActive: { backgroundColor: "#111", borderColor: "#111" },
  chipText: { color: "#111", fontWeight: "900" },
  chipTextActive: { color: "#fff" },

  edgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 12,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#ddd",
    backgroundColor: "#fff",
  },
  smallBtn: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#ddd",
    backgroundColor: "#fafafa",
  },
  smallBtnText: { fontWeight: "900" },
});
