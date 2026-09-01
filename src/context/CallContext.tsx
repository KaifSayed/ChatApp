import { useRouter } from "expo-router";
import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { Alert, Linking, PermissionsAndroid, Platform } from "react-native";
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
    participants?: string[],
  ) => Promise<void>;
  answerCall: () => Promise<void>;
  declineCall: () => void;
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

// Helper for cross-platform visual alerts
const displayAlert = (title: string, message: string) => {
  console.log(`[ALERT DISPLAYED] ${title}: ${message}`);
  if (Platform.OS === "web") {
    window.alert(`${title}\n\n${message}`);
  } else {
    Alert.alert(title, message);
  }
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

  // Use refs to avoid stale closure issues in socket callbacks
  const isCallingRef = useRef(false);
  const isGroupCallRef = useRef(false);
  const ringTimeoutTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const invitedParticipants = useRef<string[]>([]);
  const declinedParticipants = useRef<Set<string>>(new Set());

  const peerConnections = useRef<Map<string, any>>(new Map()); // targetUserId -> RTCPeerConnection
  const currentRoomId = useRef<string | null>(null);
  const currentCallTarget = useRef<string | null>(null);

  // Sync state with refs to keep socket callbacks accurate
  useEffect(() => {
    isCallingRef.current = isCalling;
  }, [isCalling]);

  useEffect(() => {
    isGroupCallRef.current = isGroupCall;
  }, [isGroupCall]);

  useEffect(() => {
    if (!user) {
      console.log("[CallContext] No authenticated user found.");
      return;
    }

    console.log(
      "[CallContext] Initializing socket connection for user:",
      user.uid,
    );
    const socket = initSocket();
    socket.emit("register", user.uid);

    socket.on("offer", async (data) => {
      console.log(
        "[Socket Event] 'offer' received from callerId:",
        data?.callerId,
      );
      if (isCallingRef.current) {
        if (currentRoomId.current && data.roomId === currentRoomId.current) {
          handleReceivedOffer(data);
        } else {
          console.log(
            "[Socket Event] Ignored offer because user is already in a call.",
          );
        }
      } else {
        setIncomingCall(data);
        router.push(`/(app)/call/incoming?callerId=${data.callerId}`);
      }
    });

    socket.on("group-call-invite", (data) => {
      console.log(
        "[Socket Event] 'group-call-invite' received from callerId:",
        data?.callerId,
      );
      if (!isCallingRef.current) {
        setIncomingCall(data);
        router.push(`/(app)/call/incoming?callerId=${data.callerId}`);
      }
    });

    socket.on("call-declined", (data) => {
      console.log(
        "[Socket Event] 'call-declined' received from userId:",
        data?.fromUserId,
      );

      if (isGroupCallRef.current) {
        if (data?.fromUserId) {
          declinedParticipants.current.add(data.fromUserId);
        }
        if (
          invitedParticipants.current.length > 0 &&
          declinedParticipants.current.size >=
            invitedParticipants.current.length
        ) {
          displayAlert("Call Ended", "All participants declined the call.");
          endCall(true);
        } else {
          displayAlert("Participant Declined", "A user declined the call.");
        }
      } else {
        displayAlert("Call Declined", "The recipient declined your call.");
        endCall(true);
      }
    });

    socket.on("answer", async (data) => {
      console.log(
        "[Socket Event] 'answer' received from answererId:",
        data?.answererId,
      );
      if (ringTimeoutTimer.current) {
        clearTimeout(ringTimeoutTimer.current);
        ringTimeoutTimer.current = null;
      }
      const pc = peerConnections.current.get(data.answererId);
      if (pc) {
        try {
          await pc.setRemoteDescription(new RTCSessionDescription(data.answer));
          console.log(
            "[WebRTC] Remote description successfully set on answer.",
          );
        } catch (e) {
          console.error(
            "[WebRTC Error] Error setting remote description on answer:",
            e,
          );
        }
      } else {
        console.warn(
          "[WebRTC Warning] PeerConnection not found for answererId:",
          data?.answererId,
        );
      }
    });

    socket.on("ice-candidate", async (data) => {
      console.log(
        "[Socket Event] 'ice-candidate' received from senderId:",
        data?.senderId,
      );
      const pc = peerConnections.current.get(data.senderId);
      if (pc && data.candidate) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
        } catch (e) {
          console.error("[WebRTC Error] Error adding ICE candidate:", e);
        }
      }
    });

    socket.on("user-joined", async (data) => {
      console.log("[Socket Event] 'user-joined' room:", data?.userId);
      if (ringTimeoutTimer.current) {
        clearTimeout(ringTimeoutTimer.current);
        ringTimeoutTimer.current = null;
      }
      if (localStream) {
        initiateCallTo(data.userId, localStream, currentRoomId.current!);
      }
    });

    socket.on("user-left", (data) => {
      console.log("[Socket Event] 'user-left' room:", data?.userId);
      removePeerConnection(data.userId);
    });

    socket.on("call-ended", (data) => {
      console.log("[Socket Event] 'call-ended' received from:", data?.enderId);
      if (!isGroupCallRef.current || !currentRoomId.current) {
        endCall(false);
      } else if (data.enderId) {
        removePeerConnection(data.enderId);
      }
    });

    return () => {
      console.log("[CallContext] Cleaning up socket event listeners.");
      socket.off("offer");
      socket.off("answer");
      socket.off("group-call-invite");
      socket.off("call-declined");
      socket.off("ice-candidate");
      socket.off("user-joined");
      socket.off("user-left");
      socket.off("call-ended");
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, localStream]);

  const addRemoteStream = (userId: string, stream: MediaStream) => {
    console.log("[CallContext] Adding remote stream for userId:", userId);
    setRemoteStreams((prev) => {
      const newMap = new Map(prev);
      newMap.set(userId, stream);
      return newMap;
    });
  };

  const removePeerConnection = (userId: string) => {
    console.log("[CallContext] Removing PeerConnection for userId:", userId);
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
    console.log("[Media Setup] Requesting user media. Video enabled:", isVideo);
    if (typeof window === "undefined" && Platform.OS === "web") return null;

    // Check if WebRTC mediaDevices module is available (requires dev build or web)
    if (!mediaDevices || typeof mediaDevices.getUserMedia !== "function") {
      console.warn(
        "[Media Setup] Native WebRTC module not detected. Running inside Expo Go?",
      );
      displayAlert(
        "Development Build Required",
        "Audio and video calls require a custom Development Build (or Web browser) because native WebRTC is not included in standard Expo Go.",
      );
      return null;
    }

    // Android runtime permissions check & request
    if (Platform.OS === "android") {
      try {
        const hasAudio = await PermissionsAndroid.check(
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
        );
        const hasCamera = isVideo
          ? await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.CAMERA)
          : true;

        if (!hasAudio || !hasCamera) {
          const reqs: any[] = [];
          if (!hasAudio) reqs.push(PermissionsAndroid.PERMISSIONS.RECORD_AUDIO);
          if (!hasCamera) reqs.push(PermissionsAndroid.PERMISSIONS.CAMERA);

          console.log("[Media Setup] Requesting Android permissions:", reqs);
          const res = await PermissionsAndroid.requestMultiple(reqs);
          console.log("[Media Setup] Permission results:", res);

          const audioGranted =
            hasAudio ||
            res[PermissionsAndroid.PERMISSIONS.RECORD_AUDIO] ===
              PermissionsAndroid.RESULTS.GRANTED;

          if (!audioGranted) {
            Alert.alert(
              "Microphone Permission Required",
              "ChatApp needs microphone access to make voice and video calls. Please enable it in your device settings.",
              [
                { text: "Cancel", style: "cancel" },
                {
                  text: "Open Settings",
                  onPress: () => Linking.openSettings(),
                },
              ],
            );
            return null;
          }
        }
      } catch (permErr) {
        console.warn("[Media Setup] Android permission error:", permErr);
      }
    }

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
        console.warn(
          "[Media Setup] Video media failed, attempting audio fallback:",
          err,
        );
      }
    }

    if (!stream) {
      try {
        stream = await mediaDevices.getUserMedia({ audio: true, video: false });
        setIsVideoEnabled(false);
      } catch (err) {
        console.error(
          "[Media Setup Error] Critical failure acquiring audio:",
          err,
        );
        Alert.alert(
          "Permission Error",
          "Unable to access microphone or camera. Please grant permissions in your device settings.",
          [
            { text: "Cancel", style: "cancel" },
            {
              text: "Open Settings",
              onPress: () => Linking.openSettings(),
            },
          ],
        );
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
    console.log(
      "[WebRTC] Creating RTCPeerConnection for targetUserId:",
      targetUserId,
    );
    const pc = new RTCPeerConnection(configuration);

    pc.onicecandidate = (event: any) => {
      if (event.candidate) {
        console.log(
          "[WebRTC] Discovered ICE candidate for target:",
          targetUserId,
        );
        const socket = getSocket();
        socket?.emit("ice-candidate", {
          targetUserId,
          candidate: event.candidate,
          roomId,
        });
      }
    };

    pc.ontrack = (event: any) => {
      console.log("[WebRTC] Track received from target:", targetUserId);
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
    console.log(
      "[CallContext] Initiating outgoing offer call to:",
      targetUserId,
    );
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
      console.error(
        "[WebRTC Error] Failed to create or set local offer description:",
        e,
      );
    }
  };

  const startCall = async (
    targetId: string,
    isVideo: boolean = true,
    isGroup: boolean = false,
    participants?: string[],
  ) => {
    if (!user) {
      console.warn(
        "[CallContext] Cannot start call without authenticated user.",
      );
      return;
    }

    console.log(
      `[CallContext] Starting call. Target: ${targetId}, IsGroup: ${isGroup}`,
    );
    setIsCalling(true);
    setIsGroupCall(isGroup);

    declinedParticipants.current.clear();
    invitedParticipants.current = participants || [];

    if (ringTimeoutTimer.current) clearTimeout(ringTimeoutTimer.current);
    ringTimeoutTimer.current = setTimeout(() => {
      console.log("[Call Ring] Call ring timed out after 30 seconds.");
      displayAlert("No Answer", "The call timed out after 30 seconds.");
      endCall(true);
    }, 30000);

    const stream = await setupMedia(isVideo);
    if (!stream) {
      setIsCalling(false);
      return;
    }

    const socket = getSocket();

    if (isGroup) {
      currentRoomId.current = targetId;
      socket?.emit("join-room", targetId);
      if (participants && participants.length > 0) {
        socket?.emit("group-call-invite", {
          roomId: targetId,
          callerId: user.uid,
          participants,
          isVideo,
        });
      }
    } else {
      currentCallTarget.current = targetId;
      initiateCallTo(targetId, stream);
    }

    router.push("/(app)/call/active");
  };

  const handleReceivedOffer = async (data: any) => {
    const { callerId, offer, roomId } = data;
    console.log(
      "[CallContext] Handling received offer from callerId:",
      callerId,
    );

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
      console.error(
        "[WebRTC Error] Error handling offer and emitting answer:",
        e,
      );
    }
  };

  const answerCall = async () => {
    if (!incomingCall || !user) {
      console.warn(
        "[CallContext] Answer call invoked with no active incoming call.",
      );
      return;
    }

    console.log(
      "[CallContext] Answering call from callerId:",
      incomingCall.callerId,
    );

    if (ringTimeoutTimer.current) {
      clearTimeout(ringTimeoutTimer.current);
      ringTimeoutTimer.current = null;
    }

    const { callerId, roomId } = incomingCall;
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

  const declineCall = () => {
    console.log("[CallContext] Declining incoming call.");
    if (incomingCall) {
      const socket = getSocket();
      const targetUserId = incomingCall.callerId || incomingCall.fromUserId;

      socket?.emit("call-declined", {
        targetUserId,
        callerId: targetUserId,
        fromUserId: user?.uid,
        roomId: incomingCall.roomId,
      });
      setIncomingCall(null);
    }

    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/(app)/(tabs)");
    }
  };

  const endCall = (emit: boolean = true) => {
    console.log("[CallContext] Ending call. Emit leave event:", emit);

    if (ringTimeoutTimer.current) {
      clearTimeout(ringTimeoutTimer.current);
      ringTimeoutTimer.current = null;
    }

    declinedParticipants.current.clear();
    invitedParticipants.current = [];
    const socket = getSocket();

    if (emit) {
      if (isGroupCallRef.current && currentRoomId.current) {
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
      } catch (e) {
        console.error("[Media Cleanup Error] Error stopping tracks:", e);
      }
    }

    setLocalStream(null);
    setRemoteStreams(new Map());
    setIsCalling(false);
    setIncomingCall(null);
    currentCallTarget.current = null;
    currentRoomId.current = null;
    setIsGroupCall(false);

    if (router.canGoBack()) {
      router.replace("/(app)/(tabs)");
    } else {
      router.back();
    }
  };

  const toggleMute = () => {
    if (localStream) {
      const audioTracks = localStream.getAudioTracks();
      if (audioTracks.length > 0) {
        const nextMuteState = audioTracks[0].enabled;
        audioTracks[0].enabled = !nextMuteState;
        setIsMuted(nextMuteState);
        console.log("[CallContext] Microphones muted:", nextMuteState);
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
        console.log("[CallContext] Video enabled:", nextVideoState);
      }
    }
  };

  const switchCamera = () => {
    if (localStream) {
      const videoTracks = localStream.getVideoTracks();
      if (videoTracks.length > 0) {
        if (typeof (videoTracks[0] as any)._switchCamera === "function") {
          (videoTracks[0] as any)._switchCamera();
          console.log("[CallContext] Switched camera.");
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
        declineCall,
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
