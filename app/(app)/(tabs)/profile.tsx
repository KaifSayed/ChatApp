// # User Profile Screen

import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Avatar } from "../../../src/components/common/Avatar";
import { Button } from "../../../src/components/common/Button";
import { useAuth } from "../../../src/context/AuthContext";
import { useTheme } from "../../../src/context/ThemeContext";

export default function ProfileScreen() {
  const { profile, logout } = useAuth();
  const { theme } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Avatar
        name={profile?.displayName || "User"}
        size={100}
        uri={profile?.photoURL}
      />
      <Text style={[styles.name, { color: theme.text }]}>
        {profile?.displayName}
      </Text>
      <Text style={[styles.username, { color: theme.placeholder }]}>
        @{profile?.username}
      </Text>
      <Text style={[styles.email, { color: theme.text }]}>
        {profile?.email}
      </Text>

      <Button title="Log Out" onPress={logout} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  name: { fontSize: 24, fontWeight: "bold", marginTop: 16 },
  username: { fontSize: 16, marginBottom: 8 },
  email: { fontSize: 14, marginBottom: 32 },
});
