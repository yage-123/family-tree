import { Ionicons } from "@expo/vector-icons";
import { router, useNavigation } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

type Props = {
  title: string;
  homeHref?: any; // expo-routerのHref型で詰まったら any でOK
  showBack?: boolean;
  showHome?: boolean;
};

export default function ScreenNav({
  title,
  homeHref = "/(tabs)/home",
  showBack = true,
  showHome = true,
}: Props) {
  const navigation = useNavigation();

  const goBack = () => {
    // ① まず react-navigation のスタックに戻れるなら戻る（これが一番確実）
    const canGoBack =
      typeof (navigation as any)?.canGoBack === "function"
        ? (navigation as any).canGoBack()
        : false;

    if (canGoBack && typeof (navigation as any)?.goBack === "function") {
      (navigation as any).goBack();
      return;
    }

    // ② 戻れないならホームに戻す（確実）
    router.replace(homeHref);
  };

  const goHome = () => {
    router.replace(homeHref);
  };

  return (
    <View style={styles.wrap}>
      <View style={styles.left}>
        {showBack ? (
          <Pressable onPress={goBack} style={styles.iconBtn} hitSlop={10}>
            <Ionicons name="chevron-back" size={26} color="#111" />
          </Pressable>
        ) : (
          <View style={styles.iconSpace} />
        )}
      </View>

      <View style={styles.center}>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
      </View>

      <View style={styles.right}>
        {showHome ? (
          <Pressable onPress={goHome} style={styles.iconBtn} hitSlop={10}>
            <Ionicons name="home-outline" size={22} color="#111" />
          </Pressable>
        ) : (
          <View style={styles.iconSpace} />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    backgroundColor: "rgba(255,255,255,0.92)",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(0,0,0,0.12)",
  },
  left: { width: 48, alignItems: "flex-start", justifyContent: "center" },
  right: { width: 48, alignItems: "flex-end", justifyContent: "center" },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },

  title: { fontSize: 16, fontWeight: "900", color: "#111" },

  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  iconSpace: { width: 40, height: 40 },
});
