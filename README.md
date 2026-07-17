# 💬 My Chat App

A modern real-time chat application built with **React Native**, **Expo**, **Expo Router**, **TypeScript**, **Firebase**, **Socket.IO**, and **WebRTC**.

The app provides secure authentication, one-to-one messaging, voice/video calling, user profiles, and a modular architecture for scalability.

---

## ✨ Features

- 🔐 User Authentication
  - Login
  - Register
  - Forgot Password

- 💬 Real-time Chat
  - One-to-one conversations
  - Chat list
  - Message bubbles
  - Chat information

- 📞 Voice & Video Calling
  - WebRTC integration
  - Incoming call screen
  - Active call room

- 👤 User Profile

- 🔍 Search users and chats

- 🎨 Theme Support
  - Light/Dark mode
  - Reusable UI components

- ⚡ Firebase Authentication & Database

- 🔌 Real-time Socket Communication

---

# 📁 Project Structure

```
my-chat-app/
├── app/
│   ├── (auth)/
│   │   ├── login.tsx
│   │   ├── register.tsx
│   │   └── forgot-password.tsx
│   │
│   ├── (app)/
│   │   ├── (tabs)/
│   │   │   ├── index.tsx
│   │   │   └── profile.tsx
│   │   │
│   │   ├── chat/
│   │   │   ├── [id].tsx
│   │   │   └── info.tsx
│   │   │
│   │   ├── call/
│   │   │   ├── room.tsx
│   │   │   └── incoming.tsx
│   │   │
│   │   └── search.tsx
│   │
│   ├── _layout.tsx
│   └── +not-found.tsx
│
├── src/
│   ├── components/
│   │   ├── common/
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Avatar.tsx
│   │   │   └── Loader.tsx
│   │   │
│   │   └── chat/
│   │       ├── ChatRow.tsx
│   │       └── MessageBubble.tsx
│   │
│   ├── context/
│   │   ├── AuthContext.tsx
│   │   └── ThemeContext.tsx
│   │
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   ├── useTheme.ts
│   │   └── useWebRTC.ts
│   │
│   ├── services/
│   │   ├── firebase.ts
│   │   └── socket.ts
│   │
│   ├── theme/
│   │   └── colors.ts
│   │
│   └── utils/
│       └── helpers.ts
│
├── app.json
├── package.json
└── tsconfig.json
```

---

# 📂 Folder Overview

## `app/`

Contains all application screens using **Expo Router** and file-based routing.

### `(auth)/`

Authentication screens.

- Login
- Register
- Forgot Password

### `(app)/`

Protected routes available after authentication.

#### `(tabs)/`

Bottom tab navigation.

- Home
- Profile

#### `chat/`

Chat screens.

- Individual conversation
- Chat information

#### `call/`

Calling screens.

- Active call room
- Incoming call

#### Other

- Search users/chats

---

## `src/components`

Reusable UI components.

### Common Components

- Button
- Input
- Avatar
- Loader

### Chat Components

- ChatRow
- MessageBubble

---

## `src/context`

Global state management.

- Authentication Context
- Theme Context

---

## `src/hooks`

Custom React hooks.

- useAuth
- useTheme
- useWebRTC

---

## `src/services`

Application services.

- Firebase
- Socket.IO

---

## `src/theme`

Theme colors and constants.

---

## `src/utils`

Shared helper functions.

---

# 🛠 Tech Stack

- React Native
- Expo
- Expo Router
- TypeScript
- Firebase
- Socket.IO
- WebRTC
- React Context API

---

# 🚀 Getting Started

## 1. Install dependencies

```bash
npm install
```

---

## 2. Start the app

```bash
npx expo start
```

The Expo CLI allows you to run the application using:

- 📱 Expo Go
- 🤖 Android Emulator
- 🍎 iOS Simulator
- 🛠 Development Build
- 🌐 Web Browser

---

## Development

Start building by editing files inside the **app/** directory.

This project uses **Expo Router**, which provides file-based routing for navigation.

---

## Reset the Project

To reset the project back to a clean Expo Router structure:

```bash
npm run reset-project
```

This moves the starter code into the **app-example** directory and creates a fresh **app** directory.

---

# 📜 Available Scripts

```bash
npm start          # Start Expo
npm run android    # Android
npm run ios        # iOS
npm run web        # Web
```

---

# 📚 Learn More

- Expo Documentation: https://docs.expo.dev
- Expo Router Documentation: https://docs.expo.dev/router/introduction
- Expo Tutorial: https://docs.expo.dev/tutorial/introduction

---

# 🤝 Community

- Expo GitHub: https://github.com/expo/expo
- Expo Discord: https://chat.expo.dev

---

# 🚀 Future Improvements

- Group chats
- Push notifications
- Read receipts
- Typing indicators
- Media sharing
- Message reactions
- Online/offline status
- End-to-end encryption

---

# 📄 License

This project is licensed under the **MIT License**.
