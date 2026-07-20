import { useRouter } from "expo-router";
import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { Platform } from "react-native";
import { getSocket, initSocket } from "../services/socket";
import {
  mediaDevices,
  RTCIceCandidate,
  RTCPeerConnection,
  RTCSessionDescription,
} from "../utils/webrtc";
import { useAuth } from "./AuthContext";

interface CallContextType {
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  isCalling: boolean;
  incomingCall: any;
  startCall: (targetUserId: string, isVideo?: boolean) => Promise<void>;
  answerCall: () => Promise<void>;
  endCall: (emit?: boolean) => void;
  toggleMute: () => void;
  toggleVideo: () => void;
  switchCamera: () => void;
  isMuted: boolean;
  isVideoEnabled: boolean;
}

const CallContext = createContext<CallContextType | undefined>(undefined);

const configuration = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
  ],
};

export const CallProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { user } = useAuth();
  const router = useRouter();

  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isCalling, setIsCalling] = useState(false);
  const [incomingCall, setIncomingCall] = useState<any>(null);

  const [isMuted, setIsMuted] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);

  const pc = useRef<any>(null);
  const currentCallTarget = useRef<string | null>(null);

  useEffect(() => {
    if (!user) return;

    const socket = initSocket();
    socket.emit("register", user.uid);

    socket.on("offer", async (data) => {
      console.log("Received offer from", data.callerId);
      setIncomingCall(data);
      router.push(`/(app)/call/incoming?callerId=${data.callerId}`);
    });

    socket.on("answer", async (data) => {
      console.log("Received answer from", data.answererId);
      if (pc.current) {
        try {
          await pc.current.setRemoteDescription(
            new RTCSessionDescription(data.answer),
          );
        } catch (e) {
          console.error("Error setting remote description on answer", e);
        }
      }
    });

    socket.on("ice-candidate", async (data) => {
      if (pc.current && data.candidate) {
        try {
          await pc.current.addIceCandidate(new RTCIceCandidate(data.candidate));
        } catch (e) {
          console.error("Error adding ICE candidate", e);
        }
      }
    });

    socket.on("call-ended", () => {
      endCall(false);
    });

    return () => {
      socket.off("offer");
      socket.off("answer");
      socket.off("ice-candidate");
      socket.off("call-ended");
    };
  }, [user]);

  // Robust media acquisition with audio fallback
  const setupMedia = async (isVideo: boolean = true) => {
    if (typeof window === "undefined" && Platform.OS === "web") return null;

    let stream: MediaStream | null = null;

    // Try acquiring requested constraints (Audio + Optional Video)
    if (isVideo) {
      try {
        stream = await mediaDevices.getUserMedia({
          audio: true,
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            facingMode: "user",
          },
        });
        setIsVideoEnabled(true);
      } catch (err) {
        console.warn(
          "Video device acquisition failed, falling back to basic audio...",
          err,
        );
      }
    }

    // Fallback: If video failed or audio-only was requested, acquire audio stream
    if (!stream) {
      try {
        stream = await mediaDevices.getUserMedia({ audio: true, video: false });
        setIsVideoEnabled(false);
      } catch (err) {
        console.error("Critical: Failed to acquire audio stream:", err);
        return null;
      }
    }

    setLocalStream(stream);
    setIsMuted(false);
    return stream;
  };

  const setupPeerConnection = () => {
    const peerConnection = new RTCPeerConnection(configuration);
    const pcInstance = peerConnection as any;

    pcInstance.onicecandidate = (event: any) => {
      if (event.candidate && currentCallTarget.current) {
        const socket = getSocket();
        socket?.emit("ice-candidate", {
          targetUserId: currentCallTarget.current,
          candidate: event.candidate,
        });
      }
    };

    pcInstance.ontrack = (event: any) => {
      console.log("Received remote track:", event.streams);
      if (event.streams && event.streams[0]) {
        setRemoteStream(event.streams[0]);
      }
    };

    pc.current = peerConnection;
    return peerConnection;
  };

  const startCall = async (targetUserId: string, isVideo: boolean = true) => {
    if (!user) return;

    currentCallTarget.current = targetUserId;
    setIsCalling(true);

    const stream = await setupMedia(isVideo);
    const peerConnection = setupPeerConnection();

    if (stream) {
      stream.getTracks().forEach((track: any) => {
        peerConnection.addTrack(track, stream);
      });
    }

    try {
      const offer = await peerConnection.createOffer({});
      await peerConnection.setLocalDescription(offer);

      const socket = getSocket();
      socket?.emit("offer", {
        targetUserId,
        offer,
        isVideo: isVideoEnabled,
      });

      router.push("/(app)/call/active");
    } catch (err) {
      console.error("Failed to start call", err);
      endCall();
    }
  };

  const answerCall = async () => {
    if (!incomingCall || !user) return;

    currentCallTarget.current = incomingCall.callerId;
    setIsCalling(true);

    const isVideoCall = incomingCall.isVideo !== false;
    const stream = await setupMedia(isVideoCall);
    const peerConnection = setupPeerConnection();

    if (stream) {
      stream.getTracks().forEach((track: any) => {
        peerConnection.addTrack(track, stream);
      });
    }

    try {
      await peerConnection.setRemoteDescription(
        new RTCSessionDescription(incomingCall.offer),
      );

      const answer = await peerConnection.createAnswer();
      await peerConnection.setLocalDescription(answer);

      const socket = getSocket();
      socket?.emit("answer", {
        targetUserId: incomingCall.callerId,
        answer,
      });

      setIncomingCall(null);
      router.push("/(app)/call/active");
    } catch (err) {
      console.error("Failed to answer call", err);
      endCall();
    }
  };

  const endCall = (emit: boolean = true) => {
    if (emit && currentCallTarget.current) {
      const socket = getSocket();
      socket?.emit("end-call", { targetUserId: currentCallTarget.current });
    }

    if (pc.current) {
      try {
        pc.current.close();
      } catch (e) {
        console.log("Error closing PeerConnection", e);
      }
      pc.current = null;
    }

    if (localStream) {
      try {
        localStream.getTracks().forEach((t: any) => t.stop());
        // Some WebRTC implementations (e.g., react-native-webrtc) expose a release()
        // method on the stream. Guard with a runtime/type cast to avoid TS errors.
        if (typeof (localStream as any).release === "function") {
          (localStream as any).release();
        }
      } catch (e) {
        console.log("Error releasing tracks", e);
      }
    }

    setLocalStream(null);
    setRemoteStream(null);
    setIsCalling(false);
    setIncomingCall(null);
    currentCallTarget.current = null;

    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/(app)/(tabs)");
    }
  };

  const toggleMute = () => {
    if (localStream) {
      const audioTracks = localStream.getAudioTracks();
      if (audioTracks.length > 0) {
        const nextMuteState = audioTracks[0].enabled;
        audioTracks[0].enabled = !nextMuteState;
        setIsMuted(nextMuteState);
      }
    }
  };

  const toggleVideo = () => {
    if (localStream) {
      const videoTracks = localStream.getVideoTracks();
      if (videoTracks.length > 0) {
        const nextVideoState = !videoTracks[0].enabled;
        videoTracks[0].enabled = nextVideoState;
        setIsVideoEnabled(nextVideoState);
      }
    }
  };

  const switchCamera = () => {
    if (localStream) {
      const videoTracks = localStream.getVideoTracks();
      if (videoTracks.length > 0) {
        if (typeof (videoTracks[0] as any)._switchCamera === "function") {
          (videoTracks[0] as any)._switchCamera();
        }
      }
    }
  };

  return (
    <CallContext.Provider
      value={{
        localStream,
        remoteStream,
        isCalling,
        incomingCall,
        startCall,
        answerCall,
        endCall,
        toggleMute,
        toggleVideo,
        switchCamera,
        isMuted,
        isVideoEnabled,
      }}
    >
      {children}
    </CallContext.Provider>
  );
};

export const useCall = () => {
  const context = useContext(CallContext);
  if (!context) throw new Error("useCall must be used inside CallProvider");
  return context;
};
