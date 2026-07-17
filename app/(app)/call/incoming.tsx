// # Incoming Call Modal/Screen

import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { useTheme } from "../../../src/context/ThemeContext";

export default function IncomingCallScreen() {
  const { theme } = useTheme();
  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Text style={{ color: theme.text, fontSize: 18 }}>
        Incoming Call Placeholder
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center" },
});
