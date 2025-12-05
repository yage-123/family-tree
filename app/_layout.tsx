import { Stack } from "expo-router";
import { FamilyProvider } from "../src/store/familyStore";

export default function RootLayout() {
  return (
    <FamilyProvider>
      <Stack screenOptions={{ headerTitle: "FamilyTree" }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack>
    </FamilyProvider>
  );
}
