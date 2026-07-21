// # Register Screen

import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
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
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.text }]}>
          Create Account
        </Text>
        <Text style={[styles.subtitle, { color: theme.placeholder }]}>
          Join the conversation today
        </Text>
      </View>

      <View style={styles.form}>
        <Input
          label="Display Name"
          value={displayName}
          onChangeText={setDisplayName}
          placeholder="e.g. John Doe"
        />
        <Input
          label="Username"
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
          placeholder="e.g. johndoe123"
        />
        <Input
          label="Email Address"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          placeholder="e.g. john@example.com"
        />
        <Input
          label="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoCapitalize="none"
          placeholder="Must be at least 6 characters"
        />

        <View style={styles.buttonContainer}>
          <Button title="Register" onPress={handleRegister} loading={loading} />
        </View>
      </View>

      <Pressable onPress={() => router.back()} style={styles.link}>
        <Text style={{ color: theme.primary, fontWeight: "600" }}>
          Already have an account? Log in here
        </Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: 24, justifyContent: "center" },
  header: { marginBottom: 32, alignItems: "center" },
  title: {
    fontSize: 32,
    fontWeight: "800",
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: "500",
  },
  form: { width: "100%" },
  buttonContainer: { marginTop: 8, marginBottom: 16 },
  link: { marginTop: 16, alignItems: "center", paddingVertical: 12 },
});
