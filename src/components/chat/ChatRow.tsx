import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Chat } from "../../context/ChatContext";
import { useTheme } from "../../context/ThemeContext";
import { Avatar } from "../common/Avatar";

interface ChatRowProps {
  chat: Chat;
  chatName: string;
  chatImage?: string;
  userUnreadCount: number;
  onPress: (chat: Chat) => void;
}

export const ChatRow: React.FC<ChatRowProps> = ({
  chat,
  chatName,
  chatImage,
  userUnreadCount,
  onPress,
}) => {
  const { theme } = useTheme();
  const isUnread = userUnreadCount > 0;

  return (
    <TouchableOpacity
      style={[styles.chatItem, { borderBottomColor: theme.border }]}
      onPress={() => onPress(chat)}
    >
      <Avatar name={chatName} size={50} uri={chatImage} />
      <View style={styles.chatItemInfo}>
        <View style={styles.chatItemHeader}>
          <Text
            style={[styles.chatItemName, { color: theme.text }]}
            numberOfLines={1}
          >
            {chatName}
          </Text>
          {chat.updatedAt && (
            <Text style={[styles.chatItemTime, { color: theme.placeholder }]}>
              {new Date(
                chat.updatedAt?.toDate?.() || Date.now(),
              ).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </Text>
          )}
        </View>
        <View style={styles.chatItemFooter}>
          <Text
            style={[
              styles.chatItemRecentMessage,
              {
                color: isUnread ? theme.text : theme.placeholder,
                fontWeight: isUnread ? "600" : "400",
              },
            ]}
            numberOfLines={1}
          >
            {chat.recentMessage?.text || "New Chat started"}
          </Text>
          {isUnread && (
            <View
              style={[styles.unreadBadge, { backgroundColor: theme.primary }]}
            >
              <Text style={styles.unreadBadgeText}>{userUnreadCount}</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
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
