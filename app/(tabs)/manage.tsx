import { useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  FlatList,
  NativeScrollEvent,
  NativeSyntheticEvent,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import PersonEditorModal from "../../src/components/PersonEditorModal";
import ScreenNav from "../../src/components/ScreenNav";
import { Person, useFamily } from "../../src/store/familyStore";

const genderLabel = (g?: string) =>
  g === "male" ? "男" : g === "female" ? "女" : g === "other" ? "その他" : "不明";
const bloodLabel = (b?: string) =>
  b === "A" || b === "B" || b === "AB" || b === "O" ? b : "不明";

export default function ManageScreen() {
  const { people, removePerson, resetAll } = useFamily();

  // 編集/追加モーダル（追加時は person=null）
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingPerson, setEditingPerson] = useState<Person | null>(null);

  const list = useMemo(() => [...people].reverse(), [people]);

  // ===== 「＋人物を追加」を出す制御 =====
  const [showAdd, setShowAdd] = useState(false);
  const [atBottom, setAtBottom] = useState(false);
  const idleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearIdle = () => {
    if (idleTimer.current) {
      clearTimeout(idleTimer.current);
      idleTimer.current = null;
    }
  };

  const startIdle = () => {
    clearIdle();
    idleTimer.current = setTimeout(() => {
      // 3秒アイドル後：一番下なら常に出す／一番下じゃなくても出す（仕様通り）
      setShowAdd(true);
    }, 3000);
  };

  // 初期：人がいないならすぐ出す（追加できないと困るので）
  useEffect(() => {
    if (list.length === 0) {
      setShowAdd(true);
      clearIdle();
      return;
    }
    // リストがある場合は「3秒後に出す」を開始
    startIdle();
    return clearIdle;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [list.length]);

  const onEdit = (p: Person) => {
    setEditingPerson(p);
    setEditorOpen(true);
  };

  const onAdd = () => {
    setEditingPerson(null);
    setEditorOpen(true);
  };

  const onDelete = (p: Person) => {
    Alert.alert(
      "削除",
      `「${p.name}」を削除します。よろしいですか？\n（親子/夫婦の関係も自動で整理されます）`,
      [
        { text: "キャンセル", style: "cancel" },
        { text: "削除する", style: "destructive", onPress: () => removePerson(p.id) },
      ]
    );
  };

  const checkAtBottom = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { layoutMeasurement, contentOffset, contentSize } = e.nativeEvent;
    const paddingToBottom = 24; // 判定を少し甘くする
    const isBottom =
      layoutMeasurement.height + contentOffset.y >= contentSize.height - paddingToBottom;
    setAtBottom(isBottom);
    return isBottom;
  };

  return (
    <View style={styles.container} onTouchStart={() => { if (!atBottom) { setShowAdd(false); startIdle(); } }}>
      <View style={{ marginTop: 25 }}>
        <ScreenNav title="家族登録" />
      </View>

      <View style={styles.headerRow}>
        <Text style={styles.title}>家族一覧</Text>

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
          <Text style={styles.muted}>下の「＋人物を追加」から追加してね。</Text>
        </View>
      ) : (
        <FlatList
          data={list}
          keyExtractor={(p) => p.id}
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
          contentContainerStyle={{ paddingBottom: 120 }} // 下の固定バー分の余白
          onScrollBeginDrag={() => {
            // スクロール開始：消す
            setShowAdd(false);
            clearIdle();
          }}
          onScroll={(e) => {
            // スクロール中：消す（下端に来たら出す）
            const bottom = checkAtBottom(e);
            if (bottom) {
              setShowAdd(true);
            } else {
              setShowAdd(false);
            }
          }}
          onScrollEndDrag={(e) => {
            // スクロール止まった：下端なら出す／それ以外は3秒待ち
            const bottom = checkAtBottom(e);
            if (bottom) {
              setShowAdd(true);
            } else {
              setShowAdd(false);
              startIdle();
            }
          }}
          onMomentumScrollEnd={(e) => {
            const bottom = checkAtBottom(e);
            if (bottom) {
              setShowAdd(true);
            } else {
              setShowAdd(false);
              startIdle();
            }
          }}
          scrollEventThrottle={16}
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

      {/* 画面下の「＋人物を追加」 */}
      {showAdd && (
        <View style={styles.addBar}>
          <TouchableOpacity style={styles.addBtn} onPress={onAdd}>
            <Text style={styles.addBtnText}>＋ 人物を追加</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* 編集/追加モーダル */}
      <PersonEditorModal
        visible={editorOpen}
        person={editingPerson} // nullなら追加
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

  // 下部固定バー
  addBar: {
    position: "absolute",
    left: 16,
    right: 16,
    bottom: 16,
  },
  addBtn: {
    backgroundColor: "#111",
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
  },
  addBtnText: { color: "#fff", fontWeight: "900", fontSize: 16 },
});

