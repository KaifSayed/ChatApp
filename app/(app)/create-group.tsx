import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { collection, getDocs, query, where } from "firebase/firestore";
import React, { useState } from "react";
import {
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Avatar } from "../../src/components/common/Avatar";
import { Button } from "../../src/components/common/Button";
import { Input } from "../../src/components/common/Input";
import { useAuth } from "../../src/context/AuthContext";
import { useChat } from "../../src/context/ChatContext";
import { useTheme } from "../../src/context/ThemeContext";
import { db } from "../../src/services/firebase";

interface SearchUser {
  uid: string;
  username: string;
  displayName: string;
  photoURL: string | null;
}

export default function CreateGroupScreen() {
  const { theme } = useTheme();
  const { user } = useAuth();
  const { createGroupChat } = useChat();
  const router = useRouter();

  const [groupName, setGroupName] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults] = useState<SearchUser[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<SearchUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setLoading(true);
    try {
      const usersRef = collection(db, "users");
      const q = query(
        usersRef,
        where("username", ">=", searchQuery.toLowerCase().trim()),
        where("username", "<=", searchQuery.toLowerCase().trim() + "\uf8ff"),
      );

      const snapshot = await getDocs(q);
      const fetchedUsers: SearchUser[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data() as SearchUser;
        if (data.uid !== user?.uid) {
          fetchedUsers.push(data);
        }
      });
      setResults(fetchedUsers);
    } catch (error) {
      console.error("Search failed:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleUserSelection = (userToToggle: SearchUser) => {
    const isSelected = selectedUsers.some((u) => u.uid === userToToggle.uid);
    if (isSelected) {
      setSelectedUsers(selectedUsers.filter((u) => u.uid !== userToToggle.uid));
    } else {
      setSelectedUsers([...selectedUsers, userToToggle]);
    }
  };

  const handleCreateGroup = async () => {
    if (!groupName.trim() || selectedUsers.length === 0) return;

    setCreating(true);
    try {
      const participantIds = selectedUsers.map((u) => u.uid);
      const chatId = await createGroupChat(groupName.trim(), participantIds);
      router.replace(`/(app)/chat/${chatId}`);
    } catch (error) {
      console.error("Failed to create group:", error);
      setCreating(false);
    }
  };

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: theme.background }]}
      edges={["top"]}
    >
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>
          New Group
        </Text>
      </View>

      <View style={styles.content}>
        <Input
          label="Group Name"
          value={groupName}
          onChangeText={setGroupName}
          placeholder="Enter group name"
        />

        <Text style={[styles.sectionTitle, { color: theme.text }]}>
          Add Members
        </Text>

        <View
          style={[styles.searchContainer, { backgroundColor: theme.surface }]}
        >
          <Ionicons
            name="search"
            size={20}
            color={theme.placeholder}
            style={styles.searchIcon}
          />
          <TextInput
            style={[styles.searchInput, { color: theme.text }]}
            placeholder="Search users..."
            placeholderTextColor={theme.placeholder}
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearch}
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
                  <Text style={[styles.selectedText, { color: theme.text }]}>
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
          data={results}
          keyExtractor={(item) => item.uid}
          style={styles.list}
          renderItem={({ item }) => {
            const isSelected = selectedUsers.some((u) => u.uid === item.uid);
            return (
              <TouchableOpacity
                style={[styles.userItem, { borderBottomColor: theme.border }]}
                onPress={() => toggleUserSelection(item)}
              >
                <Avatar name={item.displayName} size={40} uri={item.photoURL} />
                <View style={styles.userInfo}>
                  <Text style={[styles.displayName, { color: theme.text }]}>
                    {item.displayName}
                  </Text>
                  <Text style={[styles.username, { color: theme.placeholder }]}>
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

        <View style={styles.footer}>
          <Button
            title="Create Group"
            onPress={handleCreateGroup}
            loading={creating}
            disabled={!groupName.trim() || selectedUsers.length === 0}
          />
        </View>
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
  content: { flex: 1, padding: 16 },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginTop: 16,
    marginBottom: 8,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  searchIcon: { marginRight: 8 },
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
  footer: { marginTop: 16 },
});
