import { Tabs } from "expo-router";

export default function TabsLayout() {
  return (
    <Tabs>
      <Tabs.Screen name="index" options={{ title: "家系図" }} />
      <Tabs.Screen name="people" options={{ title: "編集" }} />
      <Tabs.Screen
                  name="realTree"
                        options={{ title: "実話家系図" }}/>
    </Tabs>
  );
}
