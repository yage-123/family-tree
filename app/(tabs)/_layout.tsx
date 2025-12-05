import { Tabs } from "expo-router";

export default function TabsLayout() {
  return (
    <Tabs initialRouteName="home" screenOptions={{ headerShown: true }}>
      <Tabs.Screen name="home" options={{ title: "Top" }} />
      <Tabs.Screen name="real-tree" options={{ title: "実話家系図" }} />
      <Tabs.Screen name="people" options={{ title: "家族登録" }} />
      <Tabs.Screen name="manage" options={{ title: "登録内容編集" }} />
      <Tabs.Screen name="settings" options={{ title: "環境設定" }} />
      <Tabs.Screen name="help" options={{ title: "説明書" }} />
    </Tabs>
  );
}
