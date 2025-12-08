import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import {
  ImageBackground,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

// 背景画像：パスはあなたの構成に合わせて調整OK
const BG = require("../../assets/images/top1.png");

// ★ 画面ファイル名と一致させる（app/(tabs)/real-tree.tsx なら "/(tabs)/real-tree"）
const ROUTES = {
  tree: "/(tabs)/real-tree",
  people: "/(tabs)/people",
  personAdd: "/(tabs)/person-add",
  manage: "/(tabs)/manage",
  help: "/(tabs)/help",
  settings: "/(tabs)/settings",
} as const;

type Route = (typeof ROUTES)[keyof typeof ROUTES];

type TileItem = {
  id: string;
  label: string;
  to: Route;
  icon: React.ComponentProps<typeof Ionicons>["name"];
  params?: Record<string, string>;
};

// 中央（縦3つ）
const MAIN: TileItem[] = [
  { id: "tree",label: "家系図", to: ROUTES.tree, icon: "git-network-outline" },
  { id: "add",label: "家族登録", to: ROUTES.manage, icon: "person-add-outline" , },
  { id: "edit",label: "編集", to: ROUTES.people, icon: "create-outline" },
];

// 下（横2つ）
const BOTTOM: TileItem[] = [
  {id: "hel", label: "説明書", to: ROUTES.help, icon: "help-circle-outline" },
  {id: "set", label: "環境設定", to: ROUTES.settings, icon: "settings-outline" },
];

function Tile({
  item,
  variant,
}: {
  item: TileItem;
  variant: "main" | "bottom";
}) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.tileBase,
        variant === "main" ? styles.tileMain : styles.tileBottom,
        pressed && styles.pressed,
      ]}
      onPress={() => {
        if (item.params) {
        router.push({ pathname: item.to, params: item.params } as any);
        } else {
        router.push(item.to as any);
        }
      }}>
      <View style={styles.left}>
        <View style={styles.iconCircle}>
          <Ionicons name={item.icon} size={20} color="#111" />
        </View>
        <Text style={styles.label} numberOfLines={1}>
          {item.label}
        </Text>
      </View>

      {/* 右側の余白（見た目のバランス用） */}
      <View style={styles.rightPad} />
    </Pressable>
  );
}

export default function HomeScreen() {
  return (
    <View style={styles.root}>
      <ImageBackground source={BG} resizeMode="cover" style={styles.bg}>
        {/* 読みやすさ用の膜（濃さは好みで） */}
        <View style={styles.overlay} />


        {/* 中央：縦3つ */}
        <View style={styles.mainArea}>
          {MAIN.map((m) => (
            <Tile key={m.id} item={m} variant="main" />
          ))}
        </View>

        {/* 下：横2つ */}
        <View style={styles.bottomArea}>
          {BOTTOM.map((b) => (
            <View key={b.to} style={styles.bottomCell}>
              <Tile item={b} variant="bottom" />
            </View>
          ))}
        </View>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  bg: { flex: 1 },

  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.10)",
  },

  header: {
    paddingTop: 36,
    paddingHorizontal: 16,
    alignItems: "center",
    gap: 2,
  },
  headerTitle: {
    fontSize: 40,
    fontWeight: "900",
    color: "#fff",
    textShadowColor: "rgba(0,0,0,0.35)",
    textShadowRadius: 8,
    textShadowOffset: { width: 0, height: 3 },
  },

  // 中央に縦3つを配置
  mainArea: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 28,
    paddingHorizontal: 16,
    paddingTop:140,
  },

  // 下に横2つ
  bottomArea: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 16,
    paddingBottom: 22,
  },
  bottomCell: {
    flex: 1,
    alignItems: "center",
  },

  tileBase: {
    backgroundColor: "rgba(255,255,255,0.92)",
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(0,0,0,0.10)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    // 影（iOS）
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    // 影（Android）
    elevation: 2,
  },

  // 中央の3つは同じ幅で少し大きめ
  tileMain: {
    width: 210,
    paddingVertical: 20,
    paddingHorizontal: 12,
  },

  // 下の2つは少し小さめ・横幅はセルに合わせる
  tileBottom: {
    width: "100%",
    paddingVertical: 12,
    paddingHorizontal: 12,
  },

  pressed: { opacity: 0.88, transform: [{ scale: 0.99 }] },

  left: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  iconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "rgba(0,0,0,0.06)",
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    fontSize: 24,
    fontWeight: "900",
    color: "#111",
  },
  rightPad: { width: 6 },
});
