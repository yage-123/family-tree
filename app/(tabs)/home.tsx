import { router } from "expo-router";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

const ROUTES = {
  tree: "/(tabs)/real-tree",
  people: "/(tabs)/people",
  manage: "/(tabs)/manage",
  settings: "/(tabs)/settings",
  help: "/(tabs)/help",
} as const;

type Route = (typeof ROUTES)[keyof typeof ROUTES];

function MenuBtn({ label, to }: { label: string; to: Route }) {
  return (
    <TouchableOpacity style={styles.btn} onPress={() => router.push(to)}>
      <Text style={styles.btnText}>{label}</Text>
    </TouchableOpacity>
  );
}

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Top画面</Text>

      <MenuBtn label="家系図" to={ROUTES.tree} />
      <MenuBtn label="家族登録" to={ROUTES.people} />
      <MenuBtn label="登録内容編集" to={ROUTES.manage} />
      <MenuBtn label="環境設定" to={ROUTES.settings} />
      <MenuBtn label="説明書" to={ROUTES.help} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, gap: 12 },
  title: { fontSize: 22, fontWeight: "900", marginBottom: 8 },
  btn: {
    backgroundColor: "#111",
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 14,
  },
  btnText: { color: "#fff", fontWeight: "900", fontSize: 16 },
});
