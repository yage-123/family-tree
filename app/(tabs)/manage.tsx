import { useMemo, useState } from "react";
import { Alert, FlatList, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import PersonEditorModal from "../../src/components/PersonEditorModal";
import { Person, useFamily } from "../../src/store/familyStore";

const genderLabel = (g?: string) => (g === "male" ? "男" : g === "female" ? "女" : g === "other" ? "その他" : "不明");
const bloodLabel = (b?: string) => (b === "A" || b === "B" || b === "AB" || b === "O" ? b : "不明");

export default function ManageScreen() {
  const { people, removePerson, resetAll } = useFamily();

  // 編集モーダル
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingPerson, setEditingPerson] = useState<Person | null>(null);

  const list = useMemo(() => [...people].reverse(), [people]);

  const onEdit = (p: Person) => {
    setEditingPerson(p);
    setEditorOpen(true);
  };

  const onDelete = (p: Person) => {
    Alert.alert("削除", `「${p.name}」を削除します。よろしいですか？\n（親子/夫婦の関係も自動で整理されます）`, [
      { text: "キャンセル", style: "cancel" },
      { text: "削除する", style: "destructive", onPress: () => removePerson(p.id) },
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>登録内容編集</Text>

        <TouchableOpacity
          onPress={() =>
            Alert.alert("全削除", "人物と関係を全部削除します。よろしいですか？", [
              { text: "キャンセル", style: "cancel" },
              { text: "削除する", style: "destructive", onPress: resetAll },
            ])
          }
        >
          <Text style={styles.dangerText}>全削除</Text>
        </TouchableOpacity>
      </View>

      {list.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.muted}>まだ人物がいません。</Text>
          <Text style={styles.muted}>「家族登録」タブで追加してね。</Text>
        </View>
      ) : (
        <FlatList
          data={list}
          keyExtractor={(p) => p.id}
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
          contentContainerStyle={{ paddingBottom: 24 }}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{item.name}</Text>

                <Text style={styles.meta}>
                  性別:{genderLabel(item.gender)} ／ 血液型:{bloodLabel(item.bloodType)}
                  {item.birthDate ? ` ／ 生年月日:${item.birthDate}` : ""}
                </Text>

                {!!item.note && <Text style={styles.note}>{item.note}</Text>}
              </View>

              <View style={{ gap: 8 }}>
                <TouchableOpacity style={styles.btn} onPress={() => onEdit(item)}>
                  <Text style={styles.btnText}>編集</Text>
                </TouchableOpacity>

                <TouchableOpacity style={[styles.btn, styles.btnDanger]} onPress={() => onDelete(item)}>
                  <Text style={[styles.btnText, styles.btnDangerText]}>削除</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        />
      )}

      {/* 編集モーダル */}
      <PersonEditorModal
        visible={editorOpen}
        person={editingPerson}
        onClose={() => setEditorOpen(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },

  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 12 },
  title: { fontSize: 22, fontWeight: "900" },

  dangerText: { color: "#b00020", fontWeight: "900" },

  empty: { flex: 1, justifyContent: "center", alignItems: "center", gap: 6 },
  muted: { color: "#666", fontWeight: "700" },

  card: {
    flexDirection: "row",
    gap: 12,
    backgroundColor: "#fff",
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#ddd",
    padding: 12,
  },
  name: { fontSize: 16, fontWeight: "900" },
  meta: { marginTop: 4, color: "#666", fontWeight: "800", lineHeight: 18 },
  note: { marginTop: 6, color: "#444", fontWeight: "700" },

  btn: {
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#ddd",
    backgroundColor: "#fafafa",
  },
  btnText: { fontWeight: "900" },

  btnDanger: { backgroundColor: "#fff5f5", borderColor: "#ffcccc" },
  btnDangerText: { color: "#b00020" },
});
