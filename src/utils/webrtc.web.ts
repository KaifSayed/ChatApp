import React from "react";
import { StyleSheet, View } from "react-native";

const isBrowser = typeof window !== "undefined";
// Stub/Polyfill for Web WebRTC API to avoid 'react-native-webrtc' bundling issues on web
export const RTCPeerConnection = isBrowser
  ? window.RTCPeerConnection ||
    (window as any).webkitRTCPeerConnection ||
    (window as any).mozRTCPeerConnection
  : (class {} as any);
export const mediaDevices = isBrowser ? navigator.mediaDevices : ({} as any);
export const RTCSessionDescription = isBrowser
  ? window.RTCSessionDescription
  : (class {} as any);
export const RTCIceCandidate = isBrowser
  ? window.RTCIceCandidate
  : (class {} as any);
export type MediaStream = any;

// Web compatible RTCView wrapper
export const RTCView = ({
  streamURL,
  style,
  objectFit,
  zOrder,
  ...props
}: any) => {
  const videoRef = React.useRef<HTMLVideoElement>(null);

  React.useEffect(() => {
    if (videoRef.current && streamURL && streamURL._tracks) {
      // streamURL here is typically the MediaStream object itself on web
      videoRef.current.srcObject = streamURL;
    }
  }, [streamURL]);

  return React.createElement(
    View,
    { style: [styles.container, style], ...props },
    React.createElement("video", {
      ref: videoRef,
      autoPlay: true,
      playsInline: true,
      style: {
        width: "100%",
        height: "100%",
        objectFit: objectFit === "cover" ? "cover" : "contain",
        zIndex: zOrder,
      },
    }),
  );
};

const styles = StyleSheet.create({
  container: {
    overflow: "hidden",
  },
});
