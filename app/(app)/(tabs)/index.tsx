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

import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Chat, useChat } from "../../../src/context/ChatContext";

import { ChatRow } from "../../../src/components/chat/ChatRow";

export default function HomeScreen() {
  const { profile } = useAuth();
  const { theme } = useTheme();
  const { chats, loadingChats, getUserProfile } = useChat();
  const router = useRouter();

  const handleChatPress = (chat: Chat) => {
    router.push(`/(app)/chat/${chat.id}`);
  };

  const getChatName = (chat: Chat) => {
    if (chat.type === "group") return chat.name || "Group Chat";
    const otherParticipantId = chat.participants.find(
      (p) => p !== profile?.uid,
    );
    if (!otherParticipantId) return "Unknown User";
    const otherProfile = getUserProfile(otherParticipantId);
    return (
      otherProfile?.displayName || `User ${otherParticipantId.slice(0, 5)}...`
    );
  };

  const getChatImage = (chat: Chat) => {
    if (chat.type === "group") return chat.groupImage;
    const otherParticipantId = chat.participants.find(
      (p) => p !== profile?.uid,
    );
    if (!otherParticipantId) return undefined;
    const otherProfile = getUserProfile(otherParticipantId);
    return otherProfile?.photoURL;
  };

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

        <View style={styles.headerRight}>
          <TouchableOpacity
            style={styles.headerIconBtn}
            onPress={() => router.push("/(app)/search")}
          >
            <Ionicons name="search" size={24} color={theme.text} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Main Body Content */}
      <ScrollView
        contentContainerStyle={chats.length === 0 ? styles.content : undefined}
      >
        {loadingChats ? (
          <View
            style={[
              styles.emptyState,
              {
                backgroundColor: theme.surface,
                marginTop: 16,
                marginHorizontal: 16,
              },
            ]}
          >
            <Text style={[styles.emptyTitle, { color: theme.text }]}>
              Loading Chats...
            </Text>
          </View>
        ) : chats.length === 0 ? (
          <View style={[styles.emptyState, { backgroundColor: theme.surface }]}>
            <Text style={[styles.emptyTitle, { color: theme.text }]}>
              No Recent Chats
            </Text>
            <Text style={[styles.emptySubtitle, { color: theme.placeholder }]}>
              Your conversations will show up here. Tap the search button to
              find friends and start chatting!
            </Text>
          </View>
        ) : (
          chats.map((chat) => {
            const userUnreadCount = profile?.uid
              ? chat.unreadCount?.[profile.uid] || 0
              : 0;

            return (
              <ChatRow
                key={chat.id}
                chat={chat}
                chatName={getChatName(chat)}
                chatImage={getChatImage(chat)}
                userUnreadCount={userUnreadCount}
                onPress={handleChatPress}
              />
            );
          })
        )}
      </ScrollView>

      {/* FAB for Create Group */}
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: theme.primary }]}
        onPress={() => router.push("/(app)/create-group")}
      >
        <Ionicons name="people" size={24} color="#fff" />
      </TouchableOpacity>
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
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerIconBtn: {
    padding: 8,
  },
  fab: {
    position: "absolute",
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
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
