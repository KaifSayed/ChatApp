// src/utils/webrtc.ts

let mediaDevices: any = {};
let RTCPeerConnection: any = class {};
let RTCSessionDescription: any = class {};
let RTCIceCandidate: any = class {};
let MediaStream: any = class {};
let RTCView: any = () => null;

try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const webrtc = require("react-native-webrtc");
  mediaDevices = webrtc.mediaDevices;
  RTCPeerConnection = webrtc.RTCPeerConnection;
  RTCSessionDescription = webrtc.RTCSessionDescription;
  RTCIceCandidate = webrtc.RTCIceCandidate;
  MediaStream = webrtc.MediaStream;
  RTCView = webrtc.RTCView;
} catch {
  console.warn(
    "Native WebRTC module unavailable. (Are you running in standard Expo Go?). Video calling requires a Development Client.",
  );
}

export {
  mediaDevices,
  MediaStream,
  RTCIceCandidate,
  RTCPeerConnection,
  RTCSessionDescription,
  RTCView,
};
