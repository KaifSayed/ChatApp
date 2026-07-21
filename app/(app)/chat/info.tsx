import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  arrayRemove,
  arrayUnion,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  updateDoc,
  where,
} from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
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
import { Button } from "../../../src/components/common/Button";
import { useAuth } from "../../../src/context/AuthContext";
import { useCall } from "../../../src/context/CallContext";
import { useChat } from "../../../src/context/ChatContext";
import { useTheme } from "../../../src/context/ThemeContext";
import { db } from "../../../src/services/firebase";

interface SearchUser {
  uid: string;
  username: string;
  displayName: string;
  photoURL: string | null;
}

export default function ChatInfoScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { theme } = useTheme();
  const { user } = useAuth();
  const { chats, createPrivateChat } = useChat();
  const { startCall } = useCall();

  const chatId = id as string;
  const chat = chats.find((c) => c.id === chatId);

  const [participants, setParticipants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Add members modal state
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchUser[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<SearchUser[]>([]);
  const [isAdding, setIsAdding] = useState(false);

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
          }),
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
      <SafeAreaView
        style={[styles.safeArea, { backgroundColor: theme.background }]}
      >
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

  // Navigate to or open 1-on-1 chat with participant
  const handleUserClick = async (participant: any) => {
    if (participant.uid === user?.uid) return;

    try {
      // 1. Check if a direct (1-on-1) chat already exists with this participant
      const existingChat = chats.find(
        (c) =>
          c.type === "private" &&
          c.participants.includes(participant.uid) &&
          c.participants.includes(user?.uid || ""),
      );

      if (existingChat) {
        // Navigate directly to existing chat
        router.push(`/(app)/chat/${existingChat.id}`);
      } else {
        // Create new direct chat and navigate
        const newChatId = await createChat(participant.uid);
        router.push(`/(app)/chat/${newChatId}`);
      }
    } catch (error) {
      console.error("Failed to open chat with participant:", error);
    }
  };

  // Search users to add
  const handleSearchUsers = async () => {
    if (!searchQuery.trim()) return;
    try {
      const usersRef = collection(db, "users");
      const q = query(
        usersRef,
        where("username", ">=", searchQuery.toLowerCase().trim()),
        where("username", "<=", searchQuery.toLowerCase().trim() + "\uf8ff"),
      );

      const snapshot = await getDocs(q);
      const fetched: SearchUser[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data() as SearchUser;
        if (!chat.participants.includes(data.uid)) {
          fetched.push(data);
        }
      });
      setSearchResults(fetched);
    } catch (error) {
      console.error("Error searching users:", error);
    }
  };

  const toggleUserSelection = (selectedUser: SearchUser) => {
    const isAlreadySelected = selectedUsers.some(
      (u) => u.uid === selectedUser.uid,
    );
    if (isAlreadySelected) {
      setSelectedUsers(selectedUsers.filter((u) => u.uid !== selectedUser.uid));
    } else {
      setSelectedUsers([...selectedUsers, selectedUser]);
    }
  };

  // Add members to Firestore group chat
  const handleAddMembers = async () => {
    if (selectedUsers.length === 0) return;
    setIsAdding(true);
    try {
      const newParticipantIds = selectedUsers.map((u) => u.uid);
      const chatRef = doc(db, "chats", chatId);

      await updateDoc(chatRef, {
        participants: arrayUnion(...newParticipantIds),
      });

      setAddModalVisible(false);
      setSelectedUsers([]);
      setSearchQuery("");
      setSearchResults([]);
    } catch (error) {
      console.error("Error adding members:", error);
    } finally {
      setIsAdding(false);
    }
  };

  // Leave group handler
  const handleLeaveGroup = () => {
    const confirmLeave = async () => {
      try {
        if (!user) return;
        const chatRef = doc(db, "chats", chatId);
        await updateDoc(chatRef, {
          participants: arrayRemove(user.uid),
        });
        router.replace("/(app)/(tabs)");
      } catch (error) {
        console.error("Error leaving group:", error);
      }
    };

    if (Platform.OS === "web") {
      if (window.confirm("Are you sure you want to leave this group?")) {
        confirmLeave();
      }
    } else {
      Alert.alert("Leave Group", "Are you sure you want to leave this group?", [
        { text: "Cancel", style: "cancel" },
        { text: "Leave", style: "destructive", onPress: confirmLeave },
      ]);
    }
  };

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: theme.background }]}
      edges={["top"]}
    >
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
              <Text style={[styles.actionText, { color: theme.primary }]}>
                Audio
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: theme.surface }]}
              onPress={() => handleStartCall(true)}
            >
              <Ionicons name="videocam" size={24} color={theme.primary} />
              <Text style={[styles.actionText, { color: theme.primary }]}>
                Video
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Group Details and Participants */}
        {isGroup && (
          <View style={styles.participantsSection}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: theme.primary }]}>
                {participants.length} Participants
              </Text>

              {/* Add Participant Trigger */}
              <TouchableOpacity
                style={styles.addMemberBtn}
                onPress={() => setAddModalVisible(true)}
              >
                <Ionicons name="person-add" size={18} color={theme.primary} />
                <Text style={[styles.addMemberText, { color: theme.primary }]}>
                  Add
                </Text>
              </TouchableOpacity>
            </View>

            {loading ? (
              <ActivityIndicator
                size="small"
                color={theme.primary}
                style={{ marginTop: 20 }}
              />
            ) : (
              <FlatList
                data={participants}
                keyExtractor={(item) => item.uid}
                style={styles.list}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[
                      styles.userItem,
                      { borderBottomColor: theme.border },
                    ]}
                    onPress={() => handleUserClick(item)}
                  >
                    <Avatar
                      name={item.displayName}
                      size={40}
                      uri={item.photoURL}
                    />
                    <View style={styles.userInfo}>
                      <Text style={[styles.displayName, { color: theme.text }]}>
                        {item.uid === user?.uid ? "You" : item.displayName}
                      </Text>
                      <Text
                        style={[styles.username, { color: theme.placeholder }]}
                      >
                        @{item.username}
                      </Text>
                    </View>
                    {item.uid !== user?.uid && (
                      <Ionicons
                        name="chatbubble-outline"
                        size={20}
                        color={theme.primary}
                      />
                    )}
                  </TouchableOpacity>
                )}
                ListFooterComponent={
                  <TouchableOpacity
                    style={[
                      styles.leaveGroupBtn,
                      { backgroundColor: theme.surface },
                    ]}
                    onPress={handleLeaveGroup}
                  >
                    <Ionicons
                      name="log-out-outline"
                      size={22}
                      color="#FF3B30"
                    />
                    <Text style={styles.leaveGroupText}>Exit Group</Text>
                  </TouchableOpacity>
                }
              />
            )}
          </View>
        )}
      </View>

      {/* Add Members Modal */}
      <Modal
        visible={addModalVisible}
        animationType="slide"
        transparent={false}
      >
        <SafeAreaView
          style={[styles.safeArea, { backgroundColor: theme.background }]}
        >
          <View style={[styles.header, { borderBottomColor: theme.border }]}>
            <TouchableOpacity
              onPress={() => setAddModalVisible(false)}
              style={styles.backBtn}
            >
              <Ionicons name="close" size={24} color={theme.text} />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: theme.text }]}>
              Add Members
            </Text>
          </View>

          <View style={{ flex: 1, padding: 16 }}>
            <View
              style={[
                styles.searchContainer,
                { backgroundColor: theme.surface },
              ]}
            >
              <Ionicons
                name="search"
                size={20}
                color={theme.placeholder}
                style={{ marginRight: 8 }}
              />
              <TextInput
                style={[styles.searchInput, { color: theme.text }]}
                placeholder="Search username..."
                placeholderTextColor={theme.placeholder}
                value={searchQuery}
                onChangeText={setSearchQuery}
                onSubmitEditing={handleSearchUsers}
                autoCapitalize="none"
              />
            </View>

            {selectedUsers.length > 0 && (
              <View style={styles.selectedContainer}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {selectedUsers.map((u) => (
                    <View
                      key={u.uid}
                      style={[
                        styles.selectedChip,
                        { backgroundColor: theme.surface },
                      ]}
                    >
                      <Text
                        style={[styles.selectedText, { color: theme.text }]}
                      >
                        {u.displayName}
                      </Text>
                      <TouchableOpacity onPress={() => toggleUserSelection(u)}>
                        <Ionicons
                          name="close-circle"
                          size={16}
                          color={theme.placeholder}
                        />
                      </TouchableOpacity>
                    </View>
                  ))}
                </ScrollView>
              </View>
            )}

            <FlatList
              data={searchResults}
              keyExtractor={(item) => item.uid}
              style={{ flex: 1 }}
              renderItem={({ item }) => {
                const isSelected = selectedUsers.some(
                  (u) => u.uid === item.uid,
                );
                return (
                  <TouchableOpacity
                    style={[
                      styles.userItem,
                      { borderBottomColor: theme.border },
                    ]}
                    onPress={() => toggleUserSelection(item)}
                  >
                    <Avatar
                      name={item.displayName}
                      size={40}
                      uri={item.photoURL}
                    />
                    <View style={styles.userInfo}>
                      <Text style={[styles.displayName, { color: theme.text }]}>
                        {item.displayName}
                      </Text>
                      <Text
                        style={[styles.username, { color: theme.placeholder }]}
                      >
                        @{item.username}
                      </Text>
                    </View>
                    <Ionicons
                      name={isSelected ? "checkmark-circle" : "ellipse-outline"}
                      size={24}
                      color={isSelected ? theme.primary : theme.placeholder}
                    />
                  </TouchableOpacity>
                );
              }}
            />

            <Button
              title="Add Selected Members"
              onPress={handleAddMembers}
              loading={isAdding}
              disabled={selectedUsers.length === 0}
            />
          </View>
        </SafeAreaView>
      </Modal>
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
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: { fontSize: 14, fontWeight: "600", textTransform: "uppercase" },
  addMemberBtn: { flexDirection: "row", alignItems: "center" },
  addMemberText: { marginLeft: 4, fontWeight: "600", fontSize: 14 },
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
  leaveGroupBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 24,
    marginBottom: 32,
  },
  leaveGroupText: {
    color: "#FF3B30",
    fontWeight: "600",
    fontSize: 16,
    marginLeft: 8,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  searchInput: { flex: 1, height: 40, fontSize: 16 },
  selectedContainer: { flexDirection: "row", marginBottom: 12 },
  selectedChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
  },
  selectedText: { fontSize: 12, marginRight: 4 },
});
