import * as AuthSession from "expo-auth-session";
import * as Google from "expo-auth-session/providers/google";
import { useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Button } from "../../src/components/common/Button";
import { Input } from "../../src/components/common/Input";
import { useAuth } from "../../src/context/AuthContext";
import { useTheme } from "../../src/context/ThemeContext";
import { handleAuthError } from "../../src/utils/authErrors";

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
  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    clientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
    androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
    iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
    redirectUri: AuthSession.makeRedirectUri({
      scheme: "myapp",
      preferLocalhost: true,
    }),
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
  }, [response, loginWithGoogle]);

  const handleLogin = async () => {
    if (!identifier || !password) {
      return handleAuthError("Please fill in all fields", "Validation Error");
    }

    try {
      setLoading(true);
      await login(identifier, password);
    } catch (err: any) {
      handleAuthError(err, "Login Failed");
    } finally {
      setLoading(false);
    }
  };

  const handleGooglePress = async () => {
    try {
      setLoading(true);

      if (Platform.OS === "web") {
        await promptAsync({
          showInRecents: true,
          windowFeatures: undefined,
        });
      } else {
        await promptAsync();
      }
    } catch (err: any) {
      Alert.alert("Google Authentication Error", err.message);
      setLoading(false);
    }
  };

  return (
    <ScrollView
      contentContainerStyle={[
        styles.scrollContainer,
        { backgroundColor: theme.background },
      ]}
      keyboardShouldPersistTaps="handled"
    >
      <View
        style={[
          styles.card,
          {
            backgroundColor: theme.surface || theme.background,
            borderColor: theme.border,
          },
        ]}
      >
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.text }]}>
            Welcome Back
          </Text>
          <Text style={[styles.subtitle, { color: theme.placeholder }]}>
            Sign in to continue your conversations
          </Text>
        </View>

        <View style={styles.form}>
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
        </View>

        {/* Divider */}
        <View style={styles.dividerContainer}>
          <View style={[styles.line, { backgroundColor: theme.border }]} />
          <Text style={[styles.dividerText, { color: theme.placeholder }]}>
            OR
          </Text>
          <View style={[styles.line, { backgroundColor: theme.border }]} />
        </View>

        {/* Google Sign In */}
        <TouchableOpacity
          style={[
            styles.googleButton,
            { backgroundColor: theme.surface, borderColor: theme.border },
          ]}
          disabled={!request || loading}
          onPress={handleGooglePress}
          activeOpacity={0.8}
        >
          <Text style={[styles.googleButtonText, { color: theme.text }]}>
            Sign In with Google
          </Text>
        </TouchableOpacity>

        {/* Footer Navigation */}
        <View style={styles.footer}>
          <Pressable
            onPress={() => router.push("/register")}
            style={styles.link}
          >
            <Text style={{ color: theme.primary, fontWeight: "600" }}>
              Don&apos;t have an account? Sign up
            </Text>
          </Pressable>

          <Pressable
            onPress={() => router.push("/forgot-password")}
            style={styles.link}
          >
            <Text style={{ color: theme.placeholder, fontWeight: "500" }}>
              Forgot Password?
            </Text>
          </Pressable>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  card: {
    width: "100%",
    maxWidth: 440, // Keeps the login card constrained on wider windows
    padding: 32,
    borderRadius: 20,
    borderWidth: Platform.OS === "web" ? 1 : 0,
    // Soft shadow for desktop view
    ...Platform.select({
      web: {
        boxShadow: "0px 8px 24px rgba(0, 0, 0, 0.06)",
      },
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  header: { marginBottom: 28, alignItems: "center" },
  title: {
    fontSize: 28,
    fontWeight: "800",
    marginBottom: 8,
    letterSpacing: 0.5,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 15,
    fontWeight: "500",
    textAlign: "center",
  },
  form: { width: "100%" },
  link: { marginTop: 14, alignItems: "center" },
  dividerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 20,
  },
  line: { flex: 1, height: 1 },
  dividerText: {
    marginHorizontal: 16,
    fontSize: 13,
    fontWeight: "600",
  },
  googleButton: {
    height: 50,
    borderRadius: 25,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
    marginBottom: 12,
  },
  googleButtonText: { fontSize: 15, fontWeight: "600", letterSpacing: 0.3 },
  footer: { alignItems: "center", marginTop: 8 },
});
