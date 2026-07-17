import {
  createUserWithEmailAndPassword,
  User as FirebaseUser,
  GoogleAuthProvider,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithCredential,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  where,
} from "firebase/firestore";
import React, { createContext, useContext, useEffect, useState } from "react";
import { auth, db } from "../services/firebase";

interface UserProfile {
  uid: string;
  email: string;
  username: string;
  displayName: string;
  photoURL: string | null;
  createdAt: string;
}

interface AuthContextType {
  user: FirebaseUser | null;
  profile: UserProfile | null;
  loading: boolean;
  login: (emailOrUsername: string, password: string) => Promise<void>;
  register: (
    email: string,
    username: string,
    displayName: string,
    password: string,
  ) => Promise<void>;
  loginWithGoogle: (idToken: string) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        const docRef = doc(db, "users", firebaseUser.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setProfile(docSnap.data() as UserProfile);
        } else {
          // If a Google user logs in for the first time, initialize their Firestore profile
          const initialProfile: UserProfile = {
            uid: firebaseUser.uid,
            email: firebaseUser.email || "",
            username:
              (firebaseUser.email?.split("@")[0] || "user") +
              Math.floor(Math.random() * 1000),
            displayName: firebaseUser.displayName || "Google User",
            photoURL: firebaseUser.photoURL || null,
            createdAt: new Date().toISOString(),
          };
          await setDoc(docRef, initialProfile);
          setProfile(initialProfile);
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const login = async (emailOrUsername: string, password: string) => {
    let email = emailOrUsername.trim();
    if (!email.includes("@")) {
      const q = query(
        collection(db, "users"),
        where("username", "==", email.toLowerCase()),
      );
      const querySnapshot = await getDocs(q);
      if (querySnapshot.empty) throw new Error("Username not found");
      email = querySnapshot.docs[0].data().email;
    }
    await signInWithEmailAndPassword(auth, email, password);
  };

  const register = async (
    email: string,
    username: string,
    displayName: string,
    password: string,
  ) => {
    const cleanUsername = username.toLowerCase().trim();
    const q = query(
      collection(db, "users"),
      where("username", "==", cleanUsername),
    );
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) throw new Error("Username is already taken");

    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email.trim(),
      password,
    );
    const uid = userCredential.user.uid;

    const newProfile: UserProfile = {
      uid,
      email: email.toLowerCase().trim(),
      username: cleanUsername,
      displayName: displayName.trim(),
      photoURL: null,
      createdAt: new Date().toISOString(),
    };

    await setDoc(doc(db, "users", uid), newProfile);
    setProfile(newProfile);
  };

  const loginWithGoogle = async (idToken: string) => {
    const credential = GoogleAuthProvider.credential(idToken);
    await signInWithCredential(auth, credential);
  };

  const logout = async () => {
    await signOut(auth);
  };

  const resetPassword = async (email: string) => {
    await sendPasswordResetEmail(auth, email.trim());
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        login,
        register,
        loginWithGoogle,
        logout,
        resetPassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
};
