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
      <Image
        source={{ uri }}
        style={{ width: size, height: size, borderRadius: size / 2 }}
      />
    );
  }

  return (
    <View
      style={[
        styles.fallback,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: theme.surface,
        },
      ]}
    >
      <Text style={[styles.text, { fontSize: size * 0.4, color: theme.text }]}>
        {initials || "?"}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  fallback: { justifyContent: "center", alignItems: "center" },
  text: { fontWeight: "600" },
});
