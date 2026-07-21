import { useRouter } from "expo-router";
import React, { useState } from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { Button } from "../../src/components/common/Button";
import { Input } from "../../src/components/common/Input";
import { useAuth } from "../../src/context/AuthContext";
import { useTheme } from "../../src/context/ThemeContext";
import { handleAuthError } from "../../src/utils/authErrors"; // Cross-platform alert helper

export default function ForgotPasswordScreen() {
  const { resetPassword } = useAuth();
  const { theme } = useTheme();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleReset = async () => {
    if (!email.trim()) {
      return handleAuthError(
        "Please enter your registered email address.",
        "Required Field",
      );
    }

    try {
      setLoading(true);
      await resetPassword(email);

      const successTitle = "Password Reset Link Sent";
      const successMsg = `A password reset link has been sent to ${email.trim()}.\n\nPlease check your email inbox (and spam folder) and click the link to reset your password.`;

      if (Platform.OS === "web") {
        window.alert(`${successTitle}\n\n${successMsg}`);
        router.back();
      } else {
        // Native iOS / Android Alert
        import("react-native").then(({ Alert }) => {
          Alert.alert(successTitle, successMsg, [
            { text: "OK", onPress: () => router.back() },
          ]);
        });
      }
    } catch (err: any) {
      handleAuthError(err, "Reset Password Failed");
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
        placeholder="Enter your registered email"
      />

      <Button title="Send Reset Link" onPress={handleReset} loading={loading} />

      <Pressable onPress={() => router.back()} style={styles.link}>
        <Text style={{ color: theme.primary, fontWeight: "600" }}>
          Back to Login
        </Text>
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
  link: { marginTop: 16, alignItems: "center", paddingVertical: 10 },
});
