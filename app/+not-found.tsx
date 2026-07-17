// # 404 Fallback

import { Link } from "expo-router";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { useTheme } from "../src/context/ThemeContext";

export default function NotFoundScreen() {
  const { theme } = useTheme();
  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Text style={[styles.title, { color: theme.text }]}>
        Oops! Page not found.
      </Text>
      <Link
        href="/(app)/(tabs)"
        style={[styles.link, { color: theme.primary }]}
      >
        Go back to recent chats
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  title: { fontSize: 20, fontWeight: "bold", marginBottom: 10 },
  link: { fontSize: 16, marginTop: 15 },
});
