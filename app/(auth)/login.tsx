import * as AuthSession from "expo-auth-session";
import * as Google from "expo-auth-session/providers/google";
import { useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Button } from "../../src/components/common/Button";
import { Input } from "../../src/components/common/Input";
import { useAuth } from "../../src/context/AuthContext";
import { useTheme } from "../../src/context/ThemeContext";

// Required step for browser/popup-based OAuth flows in Expo
WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
  const { login, loginWithGoogle } = useAuth();
  const { theme } = useTheme();
  const router = useRouter();

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // Setup Expo Google Request handler hooks
  // Setup Expo Google Request handler hooks correctly for multi-platform environments
  const [request, response, promptAsync] = Google.useAuthRequest({
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
    androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
    iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
    // Highlight-start
    redirectUri: AuthSession.makeRedirectUri({
      scheme: "myapp", // Match the scheme defined in your app.json / app.config.js
      preferLocalhost: true, // Crucial for local Web development (localhost:8081)
    }),
    // Highlight-end
  });

  useEffect(() => {
    if (response?.type === "success" && response.authentication?.idToken) {
      const performGoogleLogin = async () => {
        try {
          setLoading(true);
          await loginWithGoogle(response.authentication!.idToken!);
        } catch (err: any) {
          Alert.alert("Google Authentication Error", err.message);
        } finally {
          setLoading(false);
        }
      };
      performGoogleLogin();
    }
  }, [response]);

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

  const handleGooglePress = async () => {
    try {
      setLoading(true);

      if (Platform.OS === "web") {
        // Full Page Redirect: Completely eliminates COOP popup handshake blocking on Web
        await promptAsync({
          showInRecents: true,
          windowFeatures: undefined, // Forces standard window navigation instead of a isolated popup
        });
      } else {
        // Standard mobile trigger behavior
        await promptAsync();
      }
    } catch (err: any) {
      Alert.alert("Google Authentication Error", err.message);
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

      {/* Modern secondary login partition layout */}
      <View style={styles.dividerContainer}>
        <View style={[styles.line, { backgroundColor: theme.border }]} />
        <Text style={[styles.dividerText, { color: theme.placeholder }]}>
          OR
        </Text>
        <View style={[styles.line, { backgroundColor: theme.border }]} />
      </View>

      <TouchableOpacity
        style={[
          styles.googleButton,
          { backgroundColor: theme.surface, borderColor: theme.border },
        ]}
        disabled={!request || loading}
        onPress={handleGooglePress} // <-- Route through our platform-smart handler
        activeOpacity={0.8}
      >
        <Text style={[styles.googleButtonText, { color: theme.text }]}>
          Sign In with Google
        </Text>
      </TouchableOpacity>

      <Pressable onPress={() => router.push("/register")} style={styles.link}>
        <Text style={{ color: theme.primary }}>
          Don't have an account? Sign up
        </Text>
      </Pressable>

      <Pressable
        onPress={() => router.push("/forgot-password")}
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
  dividerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 20,
  },
  line: { flex: 1, height: 1 },
  dividerText: {
    marginHorizontal: 10,
    paddingHorizontal: 10,
    fontSize: 14,
    fontWeight: "600",
  },
  googleButton: {
    height: 50,
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
    marginBottom: 8,
  },
  googleButtonText: { fontSize: 16, fontWeight: "600" },
});
