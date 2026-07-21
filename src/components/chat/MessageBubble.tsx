import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { ChatMessage } from "../../context/ChatContext";
import { useTheme } from "../../context/ThemeContext";
import { Avatar } from "../common/Avatar";

interface MessageBubbleProps {
  msg: ChatMessage;
  isMe: boolean;
  isGroup: boolean;
  senderName?: string;
  senderAvatar?: string;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  msg,
  isMe,
  isGroup,
  senderName,
  senderAvatar,
}) => {
  const { theme } = useTheme();

  return (
    <View style={styles.container}>
      {isGroup && !isMe && (
        <View style={styles.avatarContainer}>
          <Avatar name={senderName || "Unknown"} size={32} uri={senderAvatar} />
        </View>
      )}
      <View
        style={[
          styles.messageBubble,
          isMe
            ? [styles.messageBubbleMe, { backgroundColor: theme.primary }]
            : [
                styles.messageBubbleOther,
                { backgroundColor: theme.surface, borderColor: theme.border },
              ],
        ]}
      >
        {isGroup && !isMe && (
          <Text style={[styles.senderName, { color: theme.primary }]}>
            {senderName}
          </Text>
        )}
        <Text
          style={[styles.messageText, { color: isMe ? "#fff" : theme.text }]}
        >
          {msg.text}
        </Text>
        <View style={styles.messageFooter}>
          <Text
            style={[
              styles.messageTime,
              { color: isMe ? "rgba(255,255,255,0.7)" : theme.placeholder },
            ]}
          >
            {msg.createdAt
              ? new Date(
                  msg.createdAt.toDate?.() || Date.now(),
                ).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : ""}
          </Text>
          {isMe && (
            <View style={styles.statusIcon}>
              <Ionicons
                name={
                  msg.status === "read"
                    ? "checkmark-done"
                    : msg.status === "delivered"
                      ? "checkmark-done"
                      : "checkmark"
                }
                size={14}
                color={
                  msg.status === "read" ? "#34B7F1" : "rgba(255,255,255,0.7)"
                }
              />
            </View>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "flex-end",
    marginBottom: 8,
  },
  avatarContainer: {
    marginRight: 8,
    marginBottom: 4,
  },
  messageBubble: {
    maxWidth: "80%",
    padding: 12,
    borderRadius: 20,
  },
  messageBubbleMe: {
    alignSelf: "flex-end",
    borderBottomRightRadius: 4,
    marginLeft: "auto",
  },
  messageBubbleOther: {
    alignSelf: "flex-start",
    borderBottomLeftRadius: 4,
    borderWidth: StyleSheet.hairlineWidth,
  },
  senderName: {
    fontSize: 12,
    fontWeight: "bold",
    marginBottom: 4,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  messageFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    marginTop: 6,
  },
  messageTime: {
    fontSize: 11,
  },
  statusIcon: {
    marginLeft: 4,
  },
});
