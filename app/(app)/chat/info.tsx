import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { doc, getDoc } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Avatar } from "../../../src/components/common/Avatar";
import { useAuth } from "../../../src/context/AuthContext";
import { useCall } from "../../../src/context/CallContext";
import { useChat } from "../../../src/context/ChatContext";
import { useTheme } from "../../../src/context/ThemeContext";
import { db } from "../../../src/services/firebase";

export default function ChatInfoScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { theme } = useTheme();
  const { user } = useAuth();
  const { chats } = useChat();
  const { startCall } = useCall();

  const chatId = id as string;
  const chat = chats.find((c) => c.id === chatId);

  const [participants, setParticipants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!chat) return;

    const fetchParticipants = async () => {
      setLoading(true);
      try {
        const fetched = await Promise.all(
          chat.participants.map(async (uid) => {
            const userDoc = await getDoc(doc(db, "users", uid));
            if (userDoc.exists()) {
              return { uid, ...userDoc.data() };
            }
            return { uid, displayName: "Unknown User", username: "unknown" };
          })
        );
        setParticipants(fetched);
      } catch (error) {
        console.error("Failed to fetch participants:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchParticipants();
  }, [chat]);

  if (!chat) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
        <Text style={{ color: theme.text }}>Chat not found.</Text>
      </SafeAreaView>
    );
  }

  const isGroup = chat.type === "group";
  const title = isGroup ? chat.name || "Group Chat" : "Contact Info";

  const getOtherUser = () => {
    return participants.find((p) => p.uid !== user?.uid);
  };

  const otherUser = getOtherUser();

  const handleStartCall = (isVideo: boolean) => {
    if (isGroup) {
      startCall(chatId, isVideo, true);
    } else if (otherUser) {
      startCall(otherUser.uid, isVideo, false);
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]} edges={["top"]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>{title}</Text>
      </View>

      <View style={styles.content}>
        {/* Profile Info */}
        <View style={styles.profileSection}>
          <Avatar
            name={isGroup ? title : otherUser?.displayName || "User"}
            size={100}
            uri={isGroup ? chat.groupImage : otherUser?.photoURL}
          />
          <Text style={[styles.profileName, { color: theme.text }]}>
            {isGroup ? title : otherUser?.displayName}
          </Text>
          {!isGroup && otherUser && (
            <Text style={[styles.profileSub, { color: theme.placeholder }]}>
              @{otherUser.username}
            </Text>
          )}

          {/* Action Buttons */}
          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: theme.surface }]}
              onPress={() => handleStartCall(false)}
            >
              <Ionicons name="call" size={24} color={theme.primary} />
              <Text style={[styles.actionText, { color: theme.primary }]}>Audio</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: theme.surface }]}
              onPress={() => handleStartCall(true)}
            >
              <Ionicons name="videocam" size={24} color={theme.primary} />
              <Text style={[styles.actionText, { color: theme.primary }]}>Video</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Participants List (for Groups) */}
        {isGroup && (
          <View style={styles.participantsSection}>
            <Text style={[styles.sectionTitle, { color: theme.primary }]}>
              {participants.length} Participants
            </Text>
            {loading ? (
              <ActivityIndicator size="small" color={theme.primary} style={{ marginTop: 20 }} />
            ) : (
              <FlatList
                data={participants}
                keyExtractor={(item) => item.uid}
                style={styles.list}
                renderItem={({ item }) => (
                  <View style={[styles.userItem, { borderBottomColor: theme.border }]}>
                    <Avatar name={item.displayName} size={40} uri={item.photoURL} />
                    <View style={styles.userInfo}>
                      <Text style={[styles.displayName, { color: theme.text }]}>
                        {item.uid === user?.uid ? "You" : item.displayName}
                      </Text>
                      <Text style={[styles.username, { color: theme.placeholder }]}>
                        @{item.username}
                      </Text>
                    </View>
                  </View>
                )}
              />
            )}
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backBtn: { marginRight: 12 },
  headerTitle: { fontSize: 18, fontWeight: "600" },
  content: { flex: 1 },
  profileSection: {
    alignItems: "center",
    paddingVertical: 24,
  },
  profileName: { fontSize: 22, fontWeight: "bold", marginTop: 12 },
  profileSub: { fontSize: 16, marginTop: 4 },
  actionsRow: {
    flexDirection: "row",
    marginTop: 24,
    gap: 24,
  },
  actionBtn: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    minWidth: 100,
  },
  actionText: { marginTop: 8, fontWeight: "600" },
  participantsSection: {
    flex: 1,
    paddingHorizontal: 16,
  },
  sectionTitle: { fontSize: 14, fontWeight: "600", marginBottom: 12, textTransform: "uppercase" },
  list: { flex: 1 },
  userItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  userInfo: { flex: 1, marginLeft: 12 },
  displayName: { fontSize: 16, fontWeight: "500" },
  username: { fontSize: 14, marginTop: 2 },
});
