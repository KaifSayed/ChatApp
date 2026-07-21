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
    remoteStreams,
    endCall,
    toggleMute,
    toggleVideo,
    switchCamera,
    isMuted,
    isVideoEnabled,
    isGroupCall,
  } = useCall();

  const remoteStreamEntries = Array.from(remoteStreams.entries());
  const participantsCount = remoteStreamEntries.length + 1; // +1 for local

  // Grid calculations
  const isGrid = isGroupCall && remoteStreamEntries.length > 0;

  const getGridStyle = (index: number) => {
    if (!isGrid) return styles.remoteVideoFullscreen;

    const total = participantsCount;
    if (total === 2) {
      return { width: "100%", height: "50%" };
    } else if (total === 3 || total === 4) {
      return { width: "50%", height: "50%" };
    } else {
      return { width: "33.33%", height: "33.33%" };
    }
  };

  return (
    <View style={styles.container}>
      {/* Remote Videos */}
      {remoteStreamEntries.length > 0 ? (
        isGrid ? (
          <View style={styles.gridContainer}>
            {remoteStreamEntries.map(([userId, stream], index) => (
              <View
                key={userId}
                style={[styles.gridCell, getGridStyle(index) as any]}
              >
                <StreamView
                  stream={stream}
                  style={styles.videoStream}
                  objectFit="cover"
                />
              </View>
            ))}
            {/* Local video in grid */}
            {localStream && isVideoEnabled && (
              <View
                style={[
                  styles.gridCell,
                  getGridStyle(remoteStreamEntries.length) as any,
                ]}
              >
                <StreamView
                  stream={localStream}
                  style={styles.videoStream}
                  objectFit="cover"
                />
              </View>
            )}
          </View>
        ) : (
          <StreamView
            stream={remoteStreamEntries[0][1]}
            style={styles.remoteVideoFullscreen}
            objectFit="cover"
          />
        )
      ) : (
        <View style={styles.remoteVideoPlaceholder}>
          <Ionicons
            name={isGroupCall ? "people-outline" : "person-circle-outline"}
            size={100}
            color="#666"
          />
          <Text style={styles.connectingText}>Connecting call...</Text>
        </View>
      )}

      {/* Local Video Overlay (for 1on1 calls) */}
      {!isGrid && localStream && isVideoEnabled && (
        <View style={styles.localVideoContainer}>
          <StreamView
            stream={localStream}
            style={styles.videoStream}
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
  remoteVideoFullscreen: {
    flex: 1,
    width: "100%",
    height: "100%",
  },
  gridContainer: {
    flex: 1,
    flexDirection: "row",
    flexWrap: "wrap",
    paddingBottom: 100, // Space for controls
  },
  gridCell: {
    borderWidth: 1,
    borderColor: "#000",
  },
  videoStream: {
    flex: 1,
    width: "100%",
    height: "100%",
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
