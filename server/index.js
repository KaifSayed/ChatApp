const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

const activeUsers = new Map(); // socket.id -> userId
const userSockets = new Map(); // userId -> socket.id

io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  // User registers their ID with the socket
  socket.on('register', (userId) => {
    activeUsers.set(socket.id, userId);
    userSockets.set(userId, socket.id);
    console.log(`User registered: ${userId} with socket ${socket.id}`);
  });

  // Join a specific call room (typically the chatId)
  socket.on('join-room', (roomId) => {
    socket.join(roomId);
    console.log(`Socket ${socket.id} joined room ${roomId}`);
    
    // Notify others in the room
    const userId = activeUsers.get(socket.id);
    if (userId) {
      socket.to(roomId).emit('user-joined', { userId, socketId: socket.id });
    }
  });

  // WebRTC Signaling: Offer
  socket.on('offer', (data) => {
    const { targetUserId, offer, roomId } = data;
    const callerId = activeUsers.get(socket.id);
    const targetSocketId = userSockets.get(targetUserId);
    
    console.log(`Offer from ${callerId} to ${targetUserId}`);
    if (targetSocketId) {
      io.to(targetSocketId).emit('offer', {
        callerId,
        offer,
        roomId
      });
    } else if (roomId) {
      // Fallback: send to room if target not found (useful for groups)
      socket.to(roomId).emit('offer', {
        callerId,
        offer,
        roomId
      });
    }
  });

  // WebRTC Signaling: Answer
  socket.on('answer', (data) => {
    const { targetUserId, answer, roomId } = data;
    const answererId = activeUsers.get(socket.id);
    const targetSocketId = userSockets.get(targetUserId);
    
    console.log(`Answer from ${answererId} to ${targetUserId}`);
    if (targetSocketId) {
      io.to(targetSocketId).emit('answer', {
        answererId,
        answer,
        roomId
      });
    } else if (roomId) {
      socket.to(roomId).emit('answer', {
        answererId,
        answer,
        roomId
      });
    }
  });

  // WebRTC Signaling: ICE Candidate
  socket.on('ice-candidate', (data) => {
    const { targetUserId, candidate, roomId } = data;
    const senderId = activeUsers.get(socket.id);
    const targetSocketId = userSockets.get(targetUserId);
    
    if (targetSocketId) {
      io.to(targetSocketId).emit('ice-candidate', {
        senderId,
        candidate,
        roomId
      });
    } else if (roomId) {
      socket.to(roomId).emit('ice-candidate', {
        senderId,
        candidate,
        roomId
      });
    }
  });

  // End Call
  socket.on('end-call', (data) => {
    const { targetUserId, roomId } = data;
    const enderId = activeUsers.get(socket.id);
    const targetSocketId = userSockets.get(targetUserId);
    
    if (targetSocketId) {
      io.to(targetSocketId).emit('call-ended', { enderId, roomId });
    } else if (roomId) {
      socket.to(roomId).emit('call-ended', { enderId, roomId });
    }
  });

  socket.on('disconnect', () => {
    const userId = activeUsers.get(socket.id);
    console.log(`User disconnected: ${socket.id} (User: ${userId})`);
    
    if (userId) {
      activeUsers.delete(socket.id);
      userSockets.delete(userId);
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Signaling server running on port ${PORT}`);
});
