import React from "react";
import { Image, StyleSheet, Text, View } from "react-native";
import { useTheme } from "../../context/ThemeContext";

interface AvatarProps {
  uri?: string | null;
  name: string;
  size?: number;
}

export const Avatar: React.FC<AvatarProps> = ({ uri, name, size = 50 }) => {
  const { theme } = useTheme();

  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();

  if (uri) {
    return (
      <View style={[styles.container, { width: size, height: size, borderRadius: size / 2, borderColor: theme.border }]}>
        <Image
          source={{ uri }}
          style={{ width: "100%", height: "100%", borderRadius: size / 2 }}
        />
      </View>
    );
  }

  return (
    <View
      style={[
        styles.fallback,
        styles.container,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: theme.secondary,
          borderColor: theme.border,
        },
      ]}
    >
      <Text style={[styles.text, { fontSize: size * 0.35, color: theme.primary }]}>
        {initials || "?"}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderWidth: StyleSheet.hairlineWidth,
    overflow: "hidden",
  },
  fallback: { justifyContent: "center", alignItems: "center" },
  text: { fontWeight: "700", letterSpacing: 0.5 },
});
