// # User Profile Screen

import React from "react";
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, Switch } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Avatar } from "../../../src/components/common/Avatar";
import { useAuth } from "../../../src/context/AuthContext";
import { useTheme } from "../../../src/context/ThemeContext";
import { Ionicons } from "@expo/vector-icons";

export default function ProfileScreen() {
  const { profile, logout } = useAuth();
  const { theme, isDark, toggleTheme } = useTheme();

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: theme.text }]}>Profile</Text>
        </View>

        <View style={[styles.profileCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
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
        </View>

        <Text style={[styles.sectionTitle, { color: theme.placeholder }]}>Settings</Text>

        <View style={[styles.settingsGroup, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <View style={[styles.settingRow, { borderBottomColor: theme.border, borderBottomWidth: StyleSheet.hairlineWidth }]}>
            <View style={styles.settingIconContainer}>
              <Ionicons name={isDark ? "moon" : "sunny"} size={22} color={theme.primary} />
            </View>
            <Text style={[styles.settingText, { color: theme.text }]}>Dark Mode</Text>
            <Switch
              value={isDark}
              onValueChange={toggleTheme}
              trackColor={{ false: theme.border, true: theme.primary }}
              thumbColor={"#fff"}
            />
          </View>

          <TouchableOpacity style={styles.settingRow} onPress={logout}>
            <View style={styles.settingIconContainer}>
              <Ionicons name="log-out-outline" size={24} color={theme.error} />
            </View>
            <Text style={[styles.settingText, { color: theme.error, fontWeight: "600" }]}>Log Out</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: {
    padding: 16,
  },
  header: {
    marginBottom: 24,
    paddingTop: 8,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "800",
  },
  profileCard: {
    alignItems: "center",
    padding: 24,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  name: { fontSize: 24, fontWeight: "bold", marginTop: 16 },
  username: { fontSize: 16, marginTop: 4 },
  email: { fontSize: 14, marginTop: 12, opacity: 0.8 },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    textTransform: "uppercase",
    marginBottom: 12,
    marginLeft: 8,
  },
  settingsGroup: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
  },
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
  },
  settingIconContainer: {
    width: 32,
    alignItems: "flex-start",
  },
  settingText: {
    flex: 1,
    fontSize: 16,
    fontWeight: "500",
  },
});
