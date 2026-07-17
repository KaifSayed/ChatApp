import React from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Avatar } from "../../../src/components/common/Avatar";
import { useAuth } from "../../../src/context/AuthContext";
import { useTheme } from "../../../src/context/ThemeContext";

export default function HomeScreen() {
  const { profile, logout } = useAuth();
  const { theme } = useTheme();

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: theme.background }]}
      edges={["top", "left", "right"]}
    >
      {/* Dynamic WhatsApp-style Top Header Bar */}
      <View
        style={[
          styles.header,
          { backgroundColor: theme.surface, borderBottomColor: theme.border },
        ]}
      >
        <View style={styles.headerLeft}>
          <Avatar
            name={profile?.displayName || "User"}
            size={40}
            uri={profile?.photoURL}
          />
          <View style={styles.headerTextContainer}>
            <Text style={[styles.welcomeText, { color: theme.placeholder }]}>
              Hello,
            </Text>
            <Text style={[styles.profileName, { color: theme.text }]}>
              {profile?.displayName || "Chat User"}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.logoutButton, { borderColor: theme.border }]}
          onPress={logout}
          activeOpacity={0.7}
        >
          <Text style={[styles.logoutText, { color: theme.error }]}>
            Log Out
          </Text>
        </TouchableOpacity>
      </View>

      {/* Main Body Content */}
      <ScrollView contentContainerStyle={styles.content}>
        <View style={[styles.emptyState, { backgroundColor: theme.surface }]}>
          <Text style={[styles.emptyTitle, { color: theme.text }]}>
            No Recent Chats
          </Text>
          <Text style={[styles.emptySubtitle, { color: theme.placeholder }]}>
            Your conversations will show up here. Tap the search button to find
            friends and start chatting!
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerTextContainer: {
    marginLeft: 12,
  },
  welcomeText: {
    fontSize: 12,
  },
  profileName: {
    fontSize: 16,
    fontWeight: "700",
  },
  logoutButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
  },
  logoutText: {
    fontSize: 14,
    fontWeight: "600",
  },
  content: {
    flexGrow: 1,
    padding: 16,
    justifyContent: "center",
  },
  emptyState: {
    padding: 24,
    borderRadius: 12,
    alignItems: "center",
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },
});
