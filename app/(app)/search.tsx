import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Avatar } from "../../src/components/common/Avatar";
import { useAuth } from "../../src/context/AuthContext";
import { useChat } from "../../src/context/ChatContext";
import { useTheme } from "../../src/context/ThemeContext";
import { db } from "../../src/services/firebase";
import { collection, getDocs, query, where } from "firebase/firestore";
import { Ionicons } from "@expo/vector-icons";

interface SearchUser {
  uid: string;
  username: string;
  displayName: string;
  photoURL: string | null;
}

export default function SearchScreen() {
  const { theme } = useTheme();
  const { user } = useAuth();
  const { createPrivateChat } = useChat();
  const router = useRouter();

  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults] = useState<SearchUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [creatingChat, setCreatingChat] = useState(false);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setLoading(true);
    try {
      const usersRef = collection(db, "users");
      // Search by username or displayName (simplified query, usually requires algolia or similar for full text search)
      // Here we just do a basic match on username
      const q = query(
        usersRef, 
        where("username", ">=", searchQuery.toLowerCase().trim()),
        where("username", "<=", searchQuery.toLowerCase().trim() + "\uf8ff")
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

  const handleUserPress = async (otherUserId: string) => {
    if (creatingChat) return;
    setCreatingChat(true);
    try {
      const chatId = await createPrivateChat(otherUserId);
      router.replace(`/(app)/chat/${chatId}`);
    } catch (error) {
      console.error("Failed to create/open chat:", error);
      setCreatingChat(false);
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
        <View style={[styles.searchContainer, { backgroundColor: theme.surface }]}>
          <Ionicons name="search" size={20} color={theme.placeholder} style={styles.searchIcon} />
          <TextInput
            style={[styles.searchInput, { color: theme.text }]}
            placeholder="Search users by username..."
            placeholderTextColor={theme.placeholder}
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearch}
            autoCapitalize="none"
            returnKeyType="search"
          />
        </View>
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      ) : (
        <FlatList
          data={results}
          keyExtractor={(item) => item.uid}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.userItem, { borderBottomColor: theme.border }]}
              onPress={() => handleUserPress(item.uid)}
            >
              <Avatar name={item.displayName} size={50} uri={item.photoURL} />
              <View style={styles.userInfo}>
                <Text style={[styles.displayName, { color: theme.text }]}>
                  {item.displayName}
                </Text>
                <Text style={[styles.username, { color: theme.placeholder }]}>
                  @{item.username}
                </Text>
              </View>
              {creatingChat && <ActivityIndicator size="small" color={theme.primary} />}
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            searchQuery.length > 0 && !loading ? (
              <View style={styles.centerContainer}>
                <Text style={{ color: theme.placeholder }}>No users found.</Text>
              </View>
            ) : null
          }
        />
      )}
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
  backBtn: {
    marginRight: 12,
  },
  searchContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 40,
    fontSize: 16,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  listContent: {
    flexGrow: 1,
  },
  userItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  userInfo: {
    flex: 1,
    marginLeft: 16,
  },
  displayName: {
    fontSize: 16,
    fontWeight: "600",
  },
  username: {
    fontSize: 14,
    marginTop: 2,
  },
});
