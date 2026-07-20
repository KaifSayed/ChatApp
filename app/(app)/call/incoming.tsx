import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useCall } from "../../../src/context/CallContext";
import { useTheme } from "../../../src/context/ThemeContext";

export default function IncomingCallScreen() {
  const router = useRouter();
  const { callerId } = useLocalSearchParams();
  const { answerCall, endCall } = useCall();
  const { theme } = useTheme();

  const handleAnswer = async () => {
    await answerCall();
  };

  const handleDecline = () => {
    endCall();
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.background }]}
    >
      <View style={styles.topInfo}>
        <Ionicons
          name="person-circle-outline"
          size={100}
          color={theme.placeholder}
        />
        <Text style={[styles.title, { color: theme.text }]}>
          Incoming Call...
        </Text>
        <Text style={[styles.callerId, { color: theme.placeholder }]}>
          User: {callerId}
        </Text>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.actionBtn, styles.declineBtn]}
          onPress={handleDecline}
        >
          <Ionicons name="close" size={32} color="#fff" />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionBtn, styles.answerBtn]}
          onPress={handleAnswer}
        >
          <Ionicons name="call" size={32} color="#fff" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 60,
  },
  topInfo: {
    alignItems: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginTop: 20,
  },
  callerId: {
    fontSize: 18,
    marginTop: 8,
  },
  actions: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
    paddingHorizontal: 40,
  },
  actionBtn: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: "center",
    alignItems: "center",
  },
  declineBtn: {
    backgroundColor: "#FF3B30",
  },
  answerBtn: {
    backgroundColor: "#34C759",
  },
});
