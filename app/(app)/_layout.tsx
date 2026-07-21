import { Stack } from 'expo-router';
import { useTheme } from '../../src/context/ThemeContext';

export default function AppLayout() {
  const { theme } = useTheme();
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: theme.background } }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="chat/[id]" />
      <Stack.Screen name="chat/info" />
      <Stack.Screen name="call/active" />
      <Stack.Screen name="call/incoming" />
      <Stack.Screen name="call/room" />
      <Stack.Screen name="search" />
      <Stack.Screen name="create-group" />
    </Stack>
  );
}
