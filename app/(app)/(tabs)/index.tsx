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

import { useChat, Chat } from "../../../src/context/ChatContext";
import { useRouter } from "expo-router";

export default function HomeScreen() {
  const { profile, logout } = useAuth();
  const { theme } = useTheme();
  const { chats, loadingChats } = useChat();
  const router = useRouter();

  const handleChatPress = (chat: Chat) => {
    router.push(`/(app)/chat/${chat.id}`);
  };

  const getChatName = (chat: Chat) => {
    if (chat.type === "group") return chat.name || "Group Chat";
    // For private chats, the name is the other participant's ID for now
    // We would ideally fetch their profile to get the displayName
    const otherParticipantId = chat.participants.find((p) => p !== profile?.uid);
    return `User ${otherParticipantId?.slice(0, 5)}...`; // Placeholder name
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
      <ScrollView contentContainerStyle={chats.length === 0 ? styles.content : undefined}>
        {loadingChats ? (
          <View style={[styles.emptyState, { backgroundColor: theme.surface, marginTop: 16, marginHorizontal: 16 }]}>
             <Text style={[styles.emptyTitle, { color: theme.text }]}>Loading Chats...</Text>
          </View>
        ) : chats.length === 0 ? (
          <View style={[styles.emptyState, { backgroundColor: theme.surface }]}>
            <Text style={[styles.emptyTitle, { color: theme.text }]}>
              No Recent Chats
            </Text>
            <Text style={[styles.emptySubtitle, { color: theme.placeholder }]}>
              Your conversations will show up here. Tap the search button to find
              friends and start chatting!
            </Text>
          </View>
        ) : (
          chats.map((chat) => {
            const isUnread = chat.unreadCount?.[profile?.uid || ""] > 0;
            return (
              <TouchableOpacity
                key={chat.id}
                style={[styles.chatItem, { borderBottomColor: theme.border }]}
                onPress={() => handleChatPress(chat)}
              >
                <Avatar name={getChatName(chat)} size={50} uri={chat.type === "group" ? chat.groupImage : undefined} />
                <View style={styles.chatItemInfo}>
                  <View style={styles.chatItemHeader}>
                    <Text style={[styles.chatItemName, { color: theme.text }]} numberOfLines={1}>
                      {getChatName(chat)}
                    </Text>
                    {chat.updatedAt && (
                      <Text style={[styles.chatItemTime, { color: theme.placeholder }]}>
                        {new Date(chat.updatedAt?.toDate?.() || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </Text>
                    )}
                  </View>
                  <View style={styles.chatItemFooter}>
                     <Text style={[styles.chatItemRecentMessage, { color: isUnread ? theme.text : theme.placeholder, fontWeight: isUnread ? "600" : "400" }]} numberOfLines={1}>
                        {chat.recentMessage?.text || "New Chat started"}
                     </Text>
                     {isUnread && (
                       <View style={[styles.unreadBadge, { backgroundColor: theme.primary }]}>
                          <Text style={styles.unreadBadgeText}>{chat.unreadCount![profile!.uid]}</Text>
                       </View>
                     )}
                  </View>
                </View>
              </TouchableOpacity>
            );
          })
        )}
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
  chatItem: {
    flexDirection: "row",
    padding: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    alignItems: "center",
  },
  chatItemInfo: {
    flex: 1,
    marginLeft: 12,
    justifyContent: "center",
  },
  chatItemHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  chatItemName: {
    fontSize: 16,
    fontWeight: "600",
    flex: 1,
  },
  chatItemTime: {
    fontSize: 12,
    marginLeft: 8,
  },
  chatItemFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  chatItemRecentMessage: {
    fontSize: 14,
    flex: 1,
    paddingRight: 16,
  },
  unreadBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    minWidth: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  unreadBadgeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
  },
});
