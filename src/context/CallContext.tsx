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
  remoteStreams: Map<string, MediaStream>; // userId -> MediaStream
  isCalling: boolean;
  incomingCall: any; // Used for 1on1 offers or group call invites
  startCall: (
    targetUserIdOrRoomId: string,
    isVideo?: boolean,
    isGroup?: boolean,
  ) => Promise<void>;
  answerCall: () => Promise<void>;
  endCall: (emit?: boolean) => void;
  toggleMute: () => void;
  toggleVideo: () => void;
  switchCamera: () => void;
  isMuted: boolean;
  isVideoEnabled: boolean;
  isGroupCall: boolean;
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
  const [remoteStreams, setRemoteStreams] = useState<Map<string, MediaStream>>(
    new Map(),
  );
  const [isCalling, setIsCalling] = useState(false);
  const [incomingCall, setIncomingCall] = useState<any>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isGroupCall, setIsGroupCall] = useState(false);

  const peerConnections = useRef<Map<string, any>>(new Map()); // targetUserId -> RTCPeerConnection
  const currentRoomId = useRef<string | null>(null);
  const currentCallTarget = useRef<string | null>(null);

  useEffect(() => {
    if (!user) return;

    const socket = initSocket();
    socket.emit("register", user.uid);

    socket.on("offer", async (data) => {
      console.log("Received offer from", data.callerId);
      if (isCalling) {
        if (currentRoomId.current && data.roomId === currentRoomId.current) {
          handleReceivedOffer(data);
        } else {
          console.log("Ignored offer because already in a call.");
        }
      } else {
        setIncomingCall(data);
        router.push(`/(app)/call/incoming?callerId=${data.callerId}`);
      }
    });

    socket.on("answer", async (data) => {
      console.log("Received answer from", data.answererId);
      const pc = peerConnections.current.get(data.answererId);
      if (pc) {
        try {
          await pc.setRemoteDescription(new RTCSessionDescription(data.answer));
        } catch (e) {
          console.error("Error setting remote description on answer", e);
        }
      }
    });

    socket.on("ice-candidate", async (data) => {
      const pc = peerConnections.current.get(data.senderId);
      if (pc && data.candidate) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
        } catch (e) {
          console.error("Error adding ICE candidate", e);
        }
      }
    });

    socket.on("user-joined", async (data) => {
      console.log("User joined room:", data.userId);
      if (localStream) {
        initiateCallTo(data.userId, localStream, currentRoomId.current!);
      }
    });

    socket.on("user-left", (data) => {
      console.log("User left room:", data.userId);
      removePeerConnection(data.userId);
    });

    socket.on("call-ended", (data) => {
      if (!isGroupCall || !currentRoomId.current) {
        endCall(false);
      } else if (data.enderId) {
        removePeerConnection(data.enderId);
      }
    });

    return () => {
      socket.off("offer");
      socket.off("answer");
      socket.off("ice-candidate");
      socket.off("user-joined");
      socket.off("user-left");
      socket.off("call-ended");
    };
  }, [user, isCalling, localStream]);

  const addRemoteStream = (userId: string, stream: MediaStream) => {
    setRemoteStreams((prev) => {
      const newMap = new Map(prev);
      newMap.set(userId, stream);
      return newMap;
    });
  };

  const removePeerConnection = (userId: string) => {
    const pc = peerConnections.current.get(userId);
    if (pc) {
      pc.close();
      peerConnections.current.delete(userId);
    }
    setRemoteStreams((prev) => {
      const newMap = new Map(prev);
      newMap.delete(userId);
      return newMap;
    });
  };

  const setupMedia = async (isVideo: boolean = true) => {
    if (typeof window === "undefined" && Platform.OS === "web") return null;
    let stream: MediaStream | null = null;
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
        console.warn("Video failed, fallback to audio", err);
      }
    }
    if (!stream) {
      try {
        stream = await mediaDevices.getUserMedia({ audio: true, video: false });
        setIsVideoEnabled(false);
      } catch (err) {
        console.error("Critical: Failed to acquire audio", err);
        return null;
      }
    }
    setLocalStream(stream);
    setIsMuted(false);
    return stream;
  };

  const createPeerConnection = (
    targetUserId: string,
    stream: MediaStream,
    roomId?: string,
  ) => {
    const pc = new RTCPeerConnection(configuration);

    pc.onicecandidate = (event: any) => {
      if (event.candidate) {
        const socket = getSocket();
        socket?.emit("ice-candidate", {
          targetUserId,
          candidate: event.candidate,
          roomId,
        });
      }
    };

    pc.ontrack = (event: any) => {
      if (event.streams && event.streams[0]) {
        addRemoteStream(targetUserId, event.streams[0]);
      }
    };

    if (stream) {
      stream.getTracks().forEach((track: any) => pc.addTrack(track, stream));
    }

    peerConnections.current.set(targetUserId, pc);
    return pc;
  };

  const initiateCallTo = async (
    targetUserId: string,
    stream: MediaStream,
    roomId?: string,
  ) => {
    const pc = createPeerConnection(targetUserId, stream, roomId);
    try {
      const offer = await pc.createOffer({});
      await pc.setLocalDescription(offer);
      const socket = getSocket();
      socket?.emit("offer", {
        targetUserId,
        offer,
        roomId,
        isVideo: isVideoEnabled,
      });
    } catch (e) {
      console.error("Error creating offer", e);
    }
  };

  const startCall = async (
    targetId: string,
    isVideo: boolean = true,
    isGroup: boolean = false,
  ) => {
    if (!user) return;

    setIsCalling(true);
    setIsGroupCall(isGroup);

    const stream = await setupMedia(isVideo);
    if (!stream) {
      setIsCalling(false);
      return;
    }

    const socket = getSocket();

    if (isGroup) {
      currentRoomId.current = targetId; // targetId is chatId
      socket?.emit("join-room", targetId);
    } else {
      currentCallTarget.current = targetId;
      initiateCallTo(targetId, stream);
    }

    router.push("/(app)/call/active");
  };

  const handleReceivedOffer = async (data: any) => {
    const { callerId, offer, roomId } = data;
    let stream = localStream;
    if (!stream) {
      stream = await setupMedia(data.isVideo !== false);
    }

    if (!stream) return;

    const pc = createPeerConnection(callerId, stream, roomId);
    try {
      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      const socket = getSocket();
      socket?.emit("answer", { targetUserId: callerId, answer, roomId });
    } catch (e) {
      console.error("Error handling offer", e);
    }
  };

  const answerCall = async () => {
    if (!incomingCall || !user) return;

    const { callerId, roomId, isVideo } = incomingCall;
    setIsCalling(true);
    setIsGroupCall(!!roomId);

    if (roomId) {
      currentRoomId.current = roomId;
      const socket = getSocket();
      socket?.emit("join-room", roomId);
    } else {
      currentCallTarget.current = callerId;
    }

    await handleReceivedOffer(incomingCall);
    setIncomingCall(null);
    router.push("/(app)/call/active");
  };

  const endCall = (emit: boolean = true) => {
    const socket = getSocket();

    if (emit) {
      if (isGroupCall && currentRoomId.current) {
        socket?.emit("leave-room", currentRoomId.current);
      } else if (currentCallTarget.current) {
        socket?.emit("end-call", { targetUserId: currentCallTarget.current });
      }
    }

    peerConnections.current.forEach((pc) => pc.close());
    peerConnections.current.clear();

    if (localStream) {
      try {
        localStream.getTracks().forEach((t: any) => t.stop());
        if (typeof (localStream as any).release === "function") {
          (localStream as any).release();
        }
      } catch (e) {}
    }

    setLocalStream(null);
    setRemoteStreams(new Map());
    setIsCalling(false);
    setIncomingCall(null);
    currentCallTarget.current = null;
    currentRoomId.current = null;
    setIsGroupCall(false);

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
        remoteStreams,
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
        isGroupCall,
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
