import { Text, View } from "react-native";
import ScreenNav from "../../src/components/ScreenNav";


export default function SettingsScreen() {
  return (
    <View style={{ flex: 1, padding: 16 }}>
       <View style={{ marginTop: 25 }}>
      <ScreenNav title="説明書" />
      </View>
      <Text style={{ fontSize: 18, fontWeight: "900" }}>説明書</Text>
      <Text style={{ marginTop: 8 }}>（ここは後で作る）</Text>
    </View>
  );
}
