import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import React, { useEffect, useRef, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MessageBubble } from "../../../src/components/chat/MessageBubble";
import { Avatar } from "../../../src/components/common/Avatar";
import { useAuth } from "../../../src/context/AuthContext";
import { useCall } from "../../../src/context/CallContext";
import { ChatMessage, useChat } from "../../../src/context/ChatContext";
import { useTheme } from "../../../src/context/ThemeContext";
import { db } from "../../../src/services/firebase";

export default function ActiveChatScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { theme } = useTheme();
  const { user } = useAuth();
  const { chats, sendMessage, markAsRead, updateTypingStatus, getUserProfile } =
    useChat();
  const { startCall } = useCall();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const scrollViewRef = useRef<ScrollView>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const chatId = id as string;
  const chat = chats.find((c) => c.id === chatId);

  useEffect(() => {
    if (!chatId) return;

    markAsRead(chatId);

    const q = query(
      collection(db, "chats", chatId, "messages"),
      orderBy("createdAt", "asc"),
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as ChatMessage[];
      setMessages(msgs);
      setTimeout(
        () => scrollViewRef.current?.scrollToEnd({ animated: true }),
        100,
      );
    });

    return unsubscribe;
  }, [chatId, markAsRead]);

  const handleSend = async () => {
    if (!inputText.trim()) return;
    const text = inputText.trim();
    setInputText("");

    // Clear typing indicator immediately upon send
    updateTypingStatus(chatId, false);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

    try {
      await sendMessage(chatId, text);
    } catch (error) {
      console.error("Failed to send message:", error);
    }
  };

  const handleTextChange = (text: string) => {
    setInputText(text);

    if (text.trim().length > 0) {
      updateTypingStatus(chatId, true);

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      typingTimeoutRef.current = setTimeout(() => {
        updateTypingStatus(chatId, false);
      }, 3000);
    } else {
      updateTypingStatus(chatId, false);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    }
  };

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/(app)/(tabs)");
    }
  };

  const getChatName = () => {
    if (!chat) return "Loading...";
    if (chat.type === "group") return chat.name || "Group Chat";
    const otherId = chat.participants?.find((p) => p !== user?.uid);
    if (!otherId) return "Chat";
    const otherProfile = getUserProfile(otherId);
    return otherProfile?.displayName || `User ${otherId.slice(0, 5)}`;
  };

  const handleStartCall = (isVideo: boolean) => {
    if (chat?.type === "group") {
      const targetParticipants = chat.participants?.filter(
        (p) => p !== user?.uid,
      );
      startCall(chatId, isVideo, true, targetParticipants);
    } else {
      const targetId = chat?.participants?.find((p) => p !== user?.uid);
      if (targetId) {
        startCall(targetId, isVideo, false);
      } else {
        console.warn("No valid target user found for call.");
      }
    }
  };

  const getTypingUsers = () => {
    if (!chat?.typing) return [];
    return Object.keys(chat.typing).filter((uid) => {
      if (uid === user?.uid) return false;
      return !!chat.typing![uid];
    });
  };

  const typingUsers = getTypingUsers();
  const typingNames = typingUsers.map(
    (uid) => getUserProfile(uid)?.displayName?.split(" ")[0] || "Someone",
  );

  let typingText = "";
  if (typingNames.length === 1) {
    typingText = `${typingNames[0]} is typing...`;
  } else if (typingNames.length > 1) {
    typingText = `${typingNames.join(", ")} are typing...`;
  }

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: theme.background }]}
      edges={["top", "bottom"]}
    >
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        {/* Header */}
        <View
          style={[
            styles.header,
            { backgroundColor: theme.surface, borderBottomColor: theme.border },
          ]}
        >
          <TouchableOpacity onPress={handleBack} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={theme.text} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerInfo}
            activeOpacity={0.7}
            onPress={() => router.push(`/(app)/chat/info?id=${chatId}`)}
          >
            <Avatar
              name={getChatName()}
              size={40}
              uri={
                chat?.type === "group"
                  ? chat.groupImage
                  : getUserProfile(
                      chat?.participants?.find((p) => p !== user?.uid) || "",
                    )?.photoURL
              }
            />
            <Text
              style={[styles.headerName, { color: theme.text }]}
              numberOfLines={1}
            >
              {getChatName()}
            </Text>
          </TouchableOpacity>
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => handleStartCall(true)}
            >
              <Ionicons
                name="videocam-outline"
                size={26}
                color={theme.primary}
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => handleStartCall(false)}
            >
              <Ionicons name="call-outline" size={24} color={theme.primary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Messages List */}
        <ScrollView
          ref={scrollViewRef}
          contentContainerStyle={styles.messageList}
          onContentSizeChange={() =>
            scrollViewRef.current?.scrollToEnd({ animated: true })
          }
        >
          {messages.map((msg) => {
            const isMe = msg.senderId === user?.uid;
            const senderProfile = getUserProfile(msg.senderId);
            return (
              <MessageBubble
                key={msg.id}
                msg={msg}
                isMe={isMe}
                isGroup={chat?.type === "group"}
                senderName={
                  senderProfile?.displayName ||
                  `User ${msg.senderId.slice(0, 5)}`
                }
                senderAvatar={senderProfile?.photoURL}
              />
            );
          })}
        </ScrollView>

        {/* Typing Indicator */}
        {typingUsers.length > 0 && (
          <View
            style={[
              styles.typingIndicator,
              { backgroundColor: theme.background },
            ]}
          >
            <Text
              style={{
                color: theme.placeholder,
                fontStyle: "italic",
                fontSize: 12,
              }}
            >
              {typingText}
            </Text>
          </View>
        )}

        {/* Input Area */}
        <View
          style={[
            styles.inputContainer,
            { backgroundColor: theme.surface, borderTopColor: theme.border },
          ]}
        >
          <TouchableOpacity style={styles.attachBtn}>
            <Ionicons name="add" size={28} color={theme.placeholder} />
          </TouchableOpacity>
          <View
            style={[
              styles.inputWrapper,
              { backgroundColor: theme.background, borderColor: theme.border },
            ]}
          >
            <TextInput
              style={[styles.input, { color: theme.text }]}
              placeholder="Type a message..."
              placeholderTextColor={theme.placeholder}
              value={inputText}
              onChangeText={handleTextChange}
              multiline
              maxLength={1000}
            />
          </View>
          <TouchableOpacity
            style={[
              styles.sendBtn,
              {
                backgroundColor: inputText.trim()
                  ? theme.primary
                  : theme.border,
              },
            ]}
            onPress={handleSend}
            disabled={!inputText.trim()}
          >
            <Ionicons
              name="send"
              size={16}
              color="#fff"
              style={{ marginLeft: 2 }}
            />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backBtn: {
    padding: 8,
    marginRight: 4,
  },
  headerInfo: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  headerName: {
    fontSize: 18,
    fontWeight: "700",
    marginLeft: 12,
    flex: 1,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  actionBtn: {
    padding: 8,
    marginLeft: 8,
  },
  messageList: {
    padding: 16,
    paddingBottom: 24,
  },
  typingIndicator: {
    paddingHorizontal: 24,
    paddingVertical: 8,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    padding: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  attachBtn: {
    padding: 8,
    marginRight: 4,
    marginBottom: 2,
  },
  inputWrapper: {
    flex: 1,
    borderRadius: 24,
    borderWidth: 1,
    minHeight: 48,
    maxHeight: 120,
    justifyContent: "center",
  },
  input: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    fontSize: 16,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 12,
    marginBottom: 2,
  },
});
