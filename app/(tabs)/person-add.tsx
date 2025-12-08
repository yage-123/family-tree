import { router } from "expo-router";
import { StyleSheet, View } from "react-native";
import PersonEditorModal from "../../src/components/PersonEditorModal";

export default function PersonAddScreen() {
  return (
    <View style={styles.root}>
      {/* モーダルを「常に表示」にして、閉じたら戻る */}
      <PersonEditorModal
        visible={true}
        person={null}
        onClose={() => router.back()}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
