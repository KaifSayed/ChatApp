# ChatApp Development Plan

## Project Information

**Project Name:** ChatApp (Web & Mobile)

**Technology Stack:**

- React Native (Expo SDK 54)
- React Native Web
- Node.js
- Socket.IO
- WebRTC
- Firebase Cloud Messaging (FCM)

---

# Task 1: Project Analysis & Google Login Fix

## Goal

Understand the complete project architecture and resolve the existing Google Sign-In issue.

## Scope

- Analyze the entire codebase
- Review project structure and architecture
- Verify authentication flow
- Fix Google Login errors
- Ensure authentication works on:
  - Android
  - iOS
  - Web

## Deliverable

- Complete understanding of the existing project
- Fully functional Google authentication across supported platforms

---

# Task 2: Complete Chat Experience

## Goal

Build a full-featured real-time messaging experience similar to WhatsApp.

## Features

### Home

- Recent chats
- Last message preview
- Unread message count

### User Search

- Search users
- View profiles
- Start conversations

### One-to-One Chat

- Create private chats
- Real-time messaging

### Group Chat

- Create groups
- Add/remove members
- Group messaging

### Messaging Features

- Real-time messages
- Image sharing
- Typing indicator
- Online/offline status
- Read receipts
- Message timestamps

### Information Screens

- Chat information screen
- User profile screen

## Deliverable

A complete WhatsApp-like messaging experience supporting both private and group chats.

---

# Task 3: Voice & Video Calling

## Goal

Implement private and group voice/video calling using WebRTC.

## Backend

- Node.js signaling server
- Socket.IO integration
- WebRTC signaling

## Calling Features

### One-to-One

- Voice calls
- Video calls

### Group Calls

- Group voice calls
- Group video calls

### Call Screens

- Incoming call screen
- Outgoing call screen
- Active call interface

### In-Call Controls

- Mute microphone
- Toggle camera
- Switch front/back camera
- End call
- Call duration timer

### Group Call Management

- Participant management
- Join/leave handling
- Active participant updates

## Deliverable

Users can make reliable private and group voice/video calls with real-time communication.

---

# Task 4: Notifications & UI Enhancement

## Goal

Deliver a polished, responsive, and production-ready user experience.

## Notifications

### Firebase Cloud Messaging (FCM)

- New message notifications
- Incoming call notifications
- Missed call notifications
- Group invite notifications

## User Experience

### UI Improvements

- Modern chat interface
- Responsive layouts
- Dark mode support
- Smooth animations

### Loading States

- Loading skeletons
- Empty states
- Pull-to-refresh

### Reliability

- Comprehensive error handling
- Improved loading feedback
- Better user experience across network conditions

## Deliverable

A polished, responsive, modern, and user-friendly application with notifications and an enhanced UI.

---

# Final Deliverables

## Phase 1

- [x] Complete project analysis
- [x] Google Login fixed and verified

## Phase 2

- [x] Fully functional WhatsApp-like chat system
- [x] Private messaging
- [x] Group messaging
- [x] Real-time communication

## Phase 3

- [x] WebRTC voice calling
- [x] WebRTC video calling
- [x] Group voice/video calls

## Phase 4

- [x] Firebase push notifications
- [x] Modern UI/UX
- [x] Responsive layouts
- [x] Dark mode
- [x] Production-ready user experience

### Keep a track of everything in a "AGENTS.md".

## Bug Fixes
- [x] Fixed `react-native-webrtc` web bundler issue by creating a platform-specific stub (`webrtc.web.ts`) to rely on standard browser WebRTC APIs, preventing Metro bundler crashes on `event-target-shim`.
- [x] Installed missing `expo-device` package to resolve the `Unable to resolve module expo-device` Metro error inside `notifications.ts`.
