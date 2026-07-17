// # Root Layout (Theme Providers, Auth Guard)

import { Slot, useRouter, useSegments } from "expo-router";
import React, { useEffect } from "react";
import { Loader } from "../src/components/common/Loader";
import { AuthProvider, useAuth } from "../src/context/AuthContext";
import { ThemeProvider } from "../src/context/ThemeContext";

function RootLayoutNav() {
  const { user, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    const firstSegment = segments[0] as string | undefined;
    const inAuthGroup = firstSegment === "(auth)";

    if (!user && !inAuthGroup) {
      // Cast the route path string as any to bypass static path validation
      router.replace("/(auth)/login" as any);
    } else if (user && inAuthGroup) {
      router.replace("/(app)/(tabs)" as any);
    }
  }, [user, loading, segments]);

  if (loading) return <Loader />;

  return <Slot />;
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <RootLayoutNav />
      </AuthProvider>
    </ThemeProvider>
  );
}
