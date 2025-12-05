import * as ImagePicker from "expo-image-picker";
import { useEffect, useMemo, useState } from "react";
import {
    Alert,
    Image,
    Modal,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { BloodType, Gender, Person, useFamily } from "../store/familyStore";

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

type Props = {
  visible: boolean;
  person: Person | null; // nullなら「追加」、Personなら「編集」
  onClose: () => void;
};

export default function PersonEditorModal({ visible, person, onClose }: Props) {
  const { addPerson, updatePerson } = useFamily();

  const isEdit = !!person?.id;

  const [name, setName] = useState("");
  const [note, setNote] = useState("");
  const [gender, setGender] = useState<Gender>("unknown");
  const [bloodType, setBloodType] = useState<BloodType>("unknown");
  const [birthDate, setBirthDate] = useState(""); // YYYY-MM-DD
  const [photoUri, setPhotoUri] = useState("");   // 空文字=未設定

  // モーダルを開くたびにフォームを初期化（編集ならpersonから流し込み）
  useEffect(() => {
    if (!visible) return;

    if (person) {
      setName(person.name ?? "");
      setNote(person.note ?? "");
      setGender(person.gender ?? "unknown");
      setBloodType(person.bloodType ?? "unknown");
      setBirthDate(person.birthDate ?? "");
      setPhotoUri(person.photoUri ?? "");
    } else {
      setName("");
      setNote("");
      setGender("unknown");
      setBloodType("unknown");
      setBirthDate("");
      setPhotoUri("");
    }
  }, [visible, person?.id]);

  const title = useMemo(() => (isEdit ? "人物を編集" : "人物を追加"), [isEdit]);
  const actionLabel = useMemo(() => (isEdit ? "更新" : "追加"), [isEdit]);

  async function pickPhoto() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("権限が必要です", "写真を選ぶためにフォトライブラリへのアクセスを許可してください。");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      setPhotoUri(result.assets[0]?.uri ?? "");
    }
  }

  function validateOrAlert() {
    if (!name.trim()) {
      Alert.alert("入力エラー", "名前を入力してね");
      return false;
    }
    const bd = birthDate.trim();
    const ok = /^\d{4}-\d{2}-\d{2}$/.test(bd);
    if (!ok) {
      Alert.alert("入力エラー", "生年月日は YYYY-MM-DD 形式で入力してね（例: 1994-03-15）");
      return false;
    }
    return true;
  }

  function handleSave() {
    if (!validateOrAlert()) return;

    const payload = {
      name: name.trim(),
      gender,
      bloodType,
      birthDate: birthDate.trim(),
      photoUri: photoUri ?? "",
      note: note ?? "",
    };

    if (person?.id) {
      updatePerson({ id: person.id, ...payload });
    } else {
      addPerson(payload);
    }

    onClose();
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={styles.card}>
        <Text style={styles.title}>{title}</Text>

        <TextInput value={name} onChangeText={setName} placeholder="名前" style={styles.input} />
        <TextInput value={note} onChangeText={setNote} placeholder="メモ（任意）" style={styles.input} />

        <Text style={styles.label}>顔写真</Text>
        <View style={styles.photoRow}>
          {photoUri ? (
            <Image source={{ uri: photoUri }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, { backgroundColor: "#eee" }]} />
          )}

          <TouchableOpacity style={styles.secondaryBtn} onPress={pickPhoto}>
            <Text style={styles.secondaryBtnText}>{photoUri ? "写真を変更" : "写真を選ぶ"}</Text>
          </TouchableOpacity>

          {!!photoUri && (
            <TouchableOpacity style={styles.secondaryBtn} onPress={() => setPhotoUri("")}>
              <Text style={[styles.secondaryBtnText, { color: "#b00020" }]}>削除</Text>
            </TouchableOpacity>
          )}
        </View>

        <Text style={styles.label}>性別</Text>
        <View style={styles.chipWrap}>
          {genders.map((g) => (
            <Chip key={g.key} label={g.label} active={gender === g.key} onPress={() => setGender(g.key)} />
          ))}
        </View>

        <Text style={styles.label}>血液型</Text>
        <View style={styles.chipWrap}>
          {bloodTypes.map((b) => (
            <Chip key={b.key} label={b.label} active={bloodType === b.key} onPress={() => setBloodType(b.key)} />
          ))}
        </View>

        <Text style={styles.label}>生年月日</Text>
        <TextInput
          value={birthDate}
          onChangeText={setBirthDate}
          placeholder="YYYY-MM-DD（例: 1994-03-15）"
          style={styles.input}
        />

        <View style={styles.btnRow}>
          <TouchableOpacity style={[styles.secondaryBtn, { flex: 1 }]} onPress={onClose}>
            <Text style={styles.secondaryBtnText}>キャンセル</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.primaryBtn, { flex: 1 }]} onPress={handleSave}>
            <Text style={styles.primaryBtnText}>{actionLabel}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
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
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.35)" },
  card: {
    position: "absolute",
    left: 16,
    right: 16,
    top: 90,
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#ddd",
  },
  title: { fontSize: 18, fontWeight: "900" },

  label: { fontWeight: "900", marginTop: 10 },

  input: {
    marginTop: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#ccc",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: "#fff",
  },

  photoRow: { flexDirection: "row", alignItems: "center", gap: 12, marginTop: 8 },
  avatar: { width: 64, height: 64, borderRadius: 32 },

  chipWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 8 },

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

  btnRow: { flexDirection: "row", gap: 10, marginTop: 14 },

  primaryBtn: {
    backgroundColor: "#111",
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 14,
    alignItems: "center",
  },
  primaryBtnText: { color: "#fff", fontWeight: "900" },

  secondaryBtn: {
    backgroundColor: "#fff",
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 14,
    alignItems: "center",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#ddd",
  },
  secondaryBtnText: { fontWeight: "900" },
});
