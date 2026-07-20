import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useRef } from "react";
import {
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useCall } from "../../../src/context/CallContext";
import { RTCView } from "../../../src/utils/webrtc";

const StreamView = ({
  stream,
  style,
  objectFit = "cover",
}: {
  stream: any;
  style: any;
  objectFit?: string;
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (Platform.OS === "web" && videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  if (Platform.OS === "web") {
    return (
      <video
        ref={videoRef}
        autoPlay
        playsInline
        style={{
          width: "100%",
          height: "100%",
          objectFit: objectFit as any,
          ...style,
        }}
      />
    );
  }

  return (
    <RTCView
      streamURL={stream?.toURL ? stream.toURL() : ""}
      style={style}
      objectFit={objectFit as any}
    />
  );
};

export default function ActiveCallScreen() {
  const {
    localStream,
    remoteStream,
    endCall,
    toggleMute,
    toggleVideo,
    switchCamera,
    isMuted,
    isVideoEnabled,
  } = useCall();

  return (
    <View style={styles.container}>
      {/* Remote Video / Audio View */}
      {remoteStream ? (
        <StreamView
          stream={remoteStream}
          style={styles.remoteVideo}
          objectFit="cover"
        />
      ) : (
        <View style={styles.remoteVideoPlaceholder}>
          <Ionicons name="person-circle-outline" size={100} color="#666" />
          <Text style={styles.connectingText}>Connecting call...</Text>
        </View>
      )}

      {/* Local Video Overlay */}
      {localStream && isVideoEnabled && (
        <View style={styles.localVideoContainer}>
          <StreamView
            stream={localStream}
            style={styles.localVideo}
            objectFit="cover"
          />
        </View>
      )}

      {/* Control Buttons */}
      <SafeAreaView style={styles.controlsContainer} edges={["bottom"]}>
        <View style={styles.controlsRow}>
          <TouchableOpacity
            style={[
              styles.controlBtn,
              isMuted ? styles.controlBtnActive : null,
            ]}
            onPress={toggleMute}
          >
            <Ionicons
              name={isMuted ? "mic-off" : "mic"}
              size={26}
              color={isMuted ? "#000" : "#fff"}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.controlBtn,
              !isVideoEnabled ? styles.controlBtnActive : null,
            ]}
            onPress={toggleVideo}
          >
            <Ionicons
              name={isVideoEnabled ? "videocam" : "videocam-off"}
              size={26}
              color={!isVideoEnabled ? "#000" : "#fff"}
            />
          </TouchableOpacity>

          <TouchableOpacity style={styles.controlBtn} onPress={switchCamera}>
            <Ionicons name="camera-reverse" size={26} color="#fff" />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.controlBtn, styles.endCallBtn]}
            onPress={() => endCall()}
          >
            <Ionicons name="call" size={26} color="#fff" />
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  remoteVideo: {
    flex: 1,
  },
  remoteVideoPlaceholder: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  connectingText: {
    color: "#fff",
    fontSize: 18,
    marginTop: 12,
  },
  localVideoContainer: {
    position: "absolute",
    top: 60,
    right: 20,
    width: 100,
    height: 150,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#222",
    ...Platform.select({
      web: { boxShadow: "0px 2px 8px rgba(0, 0, 0, 0.5)" },
      android: { elevation: 5 },
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.5,
        shadowRadius: 4,
      },
    }),
  },
  localVideo: {
    flex: 1,
  },
  controlsContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  controlsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "rgba(30, 30, 30, 0.8)",
    padding: 16,
    borderRadius: 30,
  },
  controlBtn: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  controlBtnActive: {
    backgroundColor: "#fff",
  },
  endCallBtn: {
    backgroundColor: "#FF3B30",
  },
});
