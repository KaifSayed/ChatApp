import Constants from "expo-constants";
import { Platform } from "react-native";
import { io, Socket } from "socket.io-client";

// Dynamically extract host IP from Expo bundler connection or fallback
const getSignalingHost = (): string => {
  if (Platform.OS === "web") return "localhost";

  const hostUri =
    Constants?.expoConfig?.hostUri ??
    (Constants as any)?.manifest2?.extra?.expoClient?.hostUri ??
    (Constants as any)?.manifest?.debuggerHost;

  if (hostUri) {
    const extractedIp = hostUri.split(":")[0];
    if (extractedIp) return extractedIp;
  }

  return (
    process.env.EXPO_PUBLIC_SIGNALING_SERVER_HOST ||
    process.env.REACT_NATIVE_PACKAGER_HOSTNAME ||
    "192.168.0.107"
  );
};

const SERVER_URL = `http://${getSignalingHost()}:3000`;

let socket: Socket | null = null;

export const initSocket = (): Socket => {
  if (!socket) {
    socket = io(SERVER_URL, {
      transports: ["websocket", "polling"],
      autoConnect: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 3000,
    });

    socket.on("connect", () => {
      console.log("[Socket] Connected to signaling server with ID:", socket?.id);
    });

    socket.on("connect_error", (err) => {
      console.warn(
        `[Socket] Signaling server notice at ${SERVER_URL}: ${err.message}. (Ensure the signaling server is running via 'npm run server' for WebRTC calls).`,
      );
    });
  }
  return socket;
};

export const getSocket = (): Socket | null => {
  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
