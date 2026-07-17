// # Forgot Password Screen

import { useRouter } from "expo-router";
import React, { useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { Button } from "../../src/components/common/Button";
import { Input } from "../../src/components/common/Input";
import { useAuth } from "../../src/context/AuthContext";
import { useTheme } from "../../src/context/ThemeContext";

export default function ForgotPasswordScreen() {
  const { resetPassword } = useAuth();
  const { theme } = useTheme();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleReset = async () => {
    if (!email) return Alert.alert("Required", "Enter your email address");
    try {
      setLoading(true);
      await resetPassword(email);
      Alert.alert(
        "Success",
        "Verification reset link transmitted via your inbox.",
      );
      router.back();
    } catch (err: any) {
      Alert.alert("Error", err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Text style={[styles.title, { color: theme.text }]}>Reset Password</Text>
      <Input
        label="Email Address"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <Button
        title="Send Reset Email"
        onPress={handleReset}
        loading={loading}
      />
      <Pressable onPress={() => router.back()} style={styles.link}>
        <Text style={{ color: theme.primary }}>Back to Login</Text>
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
