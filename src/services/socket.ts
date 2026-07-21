import { Platform } from "react-native";
import { io, Socket } from "socket.io-client";

// In development, use your local IP address for the Android emulator or physical device.
// For Web, localhost is fine. Adjust the IP address to match your development machine's local IP.
const SERVER_URL =
  Platform.OS === "web" ? "http://localhost:3000" : "http://192.168.1.229:3000";

let socket: Socket | null = null;

export const initSocket = (): Socket => {
  if (!socket) {
    socket = io(SERVER_URL, {
      transports: ["websocket"], // Force WebSocket for React Native
      autoConnect: true,
    });

    socket.on("connect", () => {
      console.log("Connected to signaling server with ID:", socket?.id);
    });

    socket.on("connect_error", (err) => {
      console.error("Socket connection error:", err.message);
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
