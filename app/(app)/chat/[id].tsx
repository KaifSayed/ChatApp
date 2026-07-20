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
  const { chats, sendMessage, markAsRead } = useChat();
  const { startCall } = useCall();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const scrollViewRef = useRef<ScrollView>(null);

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
  }, [chatId]);

  const handleSend = async () => {
    if (!inputText.trim()) return;
    const text = inputText.trim();
    setInputText("");
    try {
      await sendMessage(chatId, text);
    } catch (error) {
      console.error("Failed to send message:", error);
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
    return otherId ? `User ${otherId.slice(0, 5)}` : "Chat";
  };

  const handleStartCall = (isVideo: boolean) => {
    const targetId = chat?.participants?.find((p) => p !== user?.uid);
    if (targetId) {
      startCall(targetId, isVideo);
    } else {
      console.warn("No valid target user found for call.");
    }
  };

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
              uri={chat?.type === "group" ? chat.groupImage : undefined}
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
                size={24}
                color={theme.primary}
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => handleStartCall(false)}
            >
              <Ionicons name="call-outline" size={22} color={theme.primary} />
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
            return (
              <View
                key={msg.id}
                style={[
                  styles.messageBubble,
                  isMe
                    ? [
                        styles.messageBubbleMe,
                        { backgroundColor: theme.primary },
                      ]
                    : [
                        styles.messageBubbleOther,
                        { backgroundColor: theme.surface },
                      ],
                ]}
              >
                <Text
                  style={[
                    styles.messageText,
                    { color: isMe ? "#fff" : theme.text },
                  ]}
                >
                  {msg.text}
                </Text>
                <Text
                  style={[
                    styles.messageTime,
                    {
                      color: isMe ? "rgba(255,255,255,0.7)" : theme.placeholder,
                    },
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
              </View>
            );
          })}
        </ScrollView>

        {/* Input Area */}
        <View
          style={[
            styles.inputContainer,
            { backgroundColor: theme.surface, borderTopColor: theme.border },
          ]}
        >
          <TouchableOpacity style={styles.attachBtn}>
            <Ionicons name="add" size={28} color={theme.primary} />
          </TouchableOpacity>
          <TextInput
            style={[
              styles.input,
              { backgroundColor: theme.background, color: theme.text },
            ]}
            placeholder="Type a message..."
            placeholderTextColor={theme.placeholder}
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxLength={1000}
          />
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
            <Ionicons name="send" size={18} color="#fff" />
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
    paddingVertical: 10,
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
    fontWeight: "600",
    marginLeft: 12,
    flex: 1,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  actionBtn: {
    padding: 10,
    marginLeft: 4,
  },
  messageList: {
    padding: 16,
    paddingBottom: 24,
  },
  messageBubble: {
    maxWidth: "80%",
    padding: 12,
    borderRadius: 16,
    marginBottom: 8,
  },
  messageBubbleMe: {
    alignSelf: "flex-end",
    borderBottomRightRadius: 4,
  },
  messageBubbleOther: {
    alignSelf: "flex-start",
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  messageTime: {
    fontSize: 11,
    alignSelf: "flex-end",
    marginTop: 4,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    padding: 12,
    borderTopWidth: 1,
  },
  attachBtn: {
    padding: 8,
    marginRight: 4,
  },
  input: {
    flex: 1,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 10,
    maxHeight: 100,
    minHeight: 40,
    fontSize: 16,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 12,
    marginBottom: 2,
  },
});
