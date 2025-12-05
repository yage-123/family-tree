import { Stack } from "expo-router";
import { FamilyProvider } from "../src/store/familyStore";

export default function RootLayout() {
  return (
    <FamilyProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
      </Stack>
    </FamilyProvider>
  );
}
