// # Register Screen

import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
    Alert,
    Pressable,
    ScrollView,
    StyleSheet,
    Text
} from "react-native";
import { Button } from "../../src/components/common/Button";
import { Input } from "../../src/components/common/Input";
import { useAuth } from "../../src/context/AuthContext";
import { useTheme } from "../../src/context/ThemeContext";

export default function RegisterScreen() {
  const { register } = useAuth();
  const { theme } = useTheme();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!email || !username || !displayName || !password) {
      return Alert.alert("Error", "Please fill all required inputs");
    }
    try {
      setLoading(true);
      await register(email, username, displayName, password);
    } catch (err: any) {
      Alert.alert("Registration Error", err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView
      contentContainerStyle={[
        styles.container,
        { backgroundColor: theme.background },
      ]}
    >
      <Text style={[styles.title, { color: theme.text }]}>Create Account</Text>

      <Input
        label="Display Name"
        value={displayName}
        onChangeText={setDisplayName}
      />
      <Input
        label="Username"
        value={username}
        onChangeText={setUsername}
        autoCapitalize="none"
      />
      <Input
        label="Email Address"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <Input
        label="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        autoCapitalize="none"
      />

      <Button title="Register" onPress={handleRegister} loading={loading} />

      <Pressable onPress={() => router.back()} style={styles.link}>
        <Text style={{ color: theme.primary }}>
          Already registered? Log in here
        </Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: 24, justifyContent: "center" },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 24,
    textAlign: "center",
  },
  link: { marginTop: 16, alignItems: "center" },
});
