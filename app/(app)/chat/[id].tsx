// # 1:1 and Group Chat Screen (Dynamic Route)

import { useLocalSearchParams } from "expo-router";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { useTheme } from "../../../src/context/ThemeContext";

export default function ActiveChatScreen() {
  const { id } = useLocalSearchParams();
  const { theme } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Text style={{ color: theme.text, fontSize: 18 }}>
        Active Chat Dynamic Room: {id}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center" },
});
