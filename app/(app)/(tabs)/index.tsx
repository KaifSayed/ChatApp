import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { useTheme } from "../../../src/context/ThemeContext";

export default function HomeScreen() {
  const { theme } = useTheme();
  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Text style={{ color: theme.text, fontSize: 24, fontWeight: "bold" }}>
        Recent Chats (Home)
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center" },
});
