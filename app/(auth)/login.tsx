// # Login Screen (Email/Username + Password)

import { useRouter } from "expo-router";
import React, { useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { Button } from "../../src/components/common/Button";
import { Input } from "../../src/components/common/Input";
import { useAuth } from "../../src/context/AuthContext";
import { useTheme } from "../../src/context/ThemeContext";

export default function LoginScreen() {
  const { login } = useAuth();
  const { theme } = useTheme();
  const router = useRouter();

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!identifier || !password)
      return Alert.alert("Error", "Fill all values");
    try {
      setLoading(true);
      await login(identifier, password);
    } catch (err: any) {
      Alert.alert("Login Failed", err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Text style={[styles.title, { color: theme.text }]}>Welcome Back</Text>

      <Input
        label="Email or Username"
        value={identifier}
        onChangeText={setIdentifier}
        autoCapitalize="none"
      />
      <Input
        label="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        autoCapitalize="none"
      />

      <Button title="Log In" onPress={handleLogin} loading={loading} />

      <Pressable onPress={() => router.push("../register")} style={styles.link}>
        <Text style={{ color: theme.primary }}>
          Don't have an account? Sign up
        </Text>
      </Pressable>

      <Pressable
        onPress={() => router.push("../forgot-password")}
        style={styles.link}
      >
        <Text style={{ color: theme.placeholder }}>Forgot Password?</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, justifyContent: "center" },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 24,
    textAlign: "center",
  },
  link: { marginTop: 16, alignItems: "center" },
});
