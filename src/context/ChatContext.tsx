import {
  addDoc,
  collection,
  doc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";
import React, { createContext, useContext, useEffect, useState } from "react";
import { db } from "../services/firebase";
import { useAuth } from "./AuthContext";

export interface ChatMessage {
  id: string;
  text: string;
  senderId: string;
  createdAt: any;
  status: "sent" | "delivered" | "read";
  image?: string;
}

export interface Chat {
  id: string;
  type: "private" | "group";
  participants: string[];
  recentMessage?: {
    text: string;
    senderId: string;
    createdAt: any;
  };
  updatedAt: any;
  name?: string; // For groups
  groupImage?: string; // For groups
  unreadCount?: Record<string, number>;
  typing?: Record<string, any>;
}

interface ChatContextType {
  chats: Chat[];
  loadingChats: boolean;
  createPrivateChat: (otherUserId: string) => Promise<string>;
  createGroupChat: (name: string, participantIds: string[]) => Promise<string>;
  sendMessage: (chatId: string, text: string, image?: string) => Promise<void>;
  markAsRead: (chatId: string) => Promise<void>;
  updateTypingStatus: (chatId: string, isTyping: boolean) => Promise<void>;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { user } = useAuth();
  const [chats, setChats] = useState<Chat[]>([]);
  const [loadingChats, setLoadingChats] = useState(true);

  useEffect(() => {
    if (!user) {
      setChats([]);
      setLoadingChats(false);
      return;
    }

    // Subscribe to all chats where the current user is a participant
    const q = query(
      collection(db, "chats"),
      where("participants", "array-contains", user.uid),
      orderBy("updatedAt", "desc"),
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const updatedChats = snapshot.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      })) as Chat[];
      setChats(updatedChats);
      setLoadingChats(false);
    });

    return unsubscribe;
  }, [user]);

  const createPrivateChat = async (otherUserId: string) => {
    if (!user) throw new Error("Not authenticated");

    // Check if chat already exists
    const q = query(
      collection(db, "chats"),
      where("type", "==", "private"),
      where("participants", "array-contains", user.uid),
    );
    const snapshot = await getDocs(q);
    
    let existingChatId: string | null = null;
    snapshot.forEach((d) => {
      const data = d.data();
      if (data.participants.includes(otherUserId)) {
        existingChatId = d.id;
      }
    });

    if (existingChatId) return existingChatId;

    // Create new chat
    const newChatRef = doc(collection(db, "chats"));
    await setDoc(newChatRef, {
      type: "private",
      participants: [user.uid, otherUserId],
      updatedAt: serverTimestamp(),
      unreadCount: { [otherUserId]: 0, [user.uid]: 0 },
    });

    return newChatRef.id;
  };

  const createGroupChat = async (name: string, participantIds: string[]) => {
    if (!user) throw new Error("Not authenticated");

    const allParticipants = [user.uid, ...participantIds];
    const unreadCount = allParticipants.reduce((acc, p) => {
      acc[p] = 0;
      return acc;
    }, {} as Record<string, number>);

    const newChatRef = doc(collection(db, "chats"));
    await setDoc(newChatRef, {
      type: "group",
      name,
      participants: allParticipants,
      updatedAt: serverTimestamp(),
      unreadCount,
    });

    return newChatRef.id;
  };

  const sendMessage = async (chatId: string, text: string, image?: string) => {
    if (!user) throw new Error("Not authenticated");

    const chatRef = doc(db, "chats", chatId);
    const messageRef = collection(db, "chats", chatId, "messages");

    const messageData = {
      text,
      senderId: user.uid,
      createdAt: serverTimestamp(),
      status: "sent",
      ...(image ? { image } : {}),
    };

    await addDoc(messageRef, messageData);

    // Update the recent message in the chat document
    await updateDoc(chatRef, {
      recentMessage: {
        text: image ? "📷 Image" : text,
        senderId: user.uid,
        createdAt: serverTimestamp(),
      },
      updatedAt: serverTimestamp(),
    });
  };

  const markAsRead = async (chatId: string) => {
    if (!user) return;
    
    const chatRef = doc(db, "chats", chatId);
    await updateDoc(chatRef, {
      [`unreadCount.${user.uid}`]: 0
    });
  };

  const updateTypingStatus = async (chatId: string, isTyping: boolean) => {
    if (!user) return;
    
    const chatRef = doc(db, "chats", chatId);
    await updateDoc(chatRef, {
      [`typing.${user.uid}`]: isTyping ? serverTimestamp() : null
    });
  };

  return (
    <ChatContext.Provider
      value={{
        chats,
        loadingChats,
        createPrivateChat,
        createGroupChat,
        sendMessage,
        markAsRead,
        updateTypingStatus,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) throw new Error("useChat must be used inside ChatProvider");
  return context;
};
