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
const roomParticipants = new Map(); // roomId -> Set of userIds

io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  socket.on('register', (userId) => {
    activeUsers.set(socket.id, userId);
    userSockets.set(userId, socket.id);
    console.log(`User registered: ${userId} with socket ${socket.id}`);
  });

  socket.on('join-room', (roomId) => {
    const userId = activeUsers.get(socket.id);
    if (!userId) return;

    socket.join(roomId);
    
    if (!roomParticipants.has(roomId)) {
      roomParticipants.set(roomId, new Set());
    }
    roomParticipants.get(roomId).add(userId);
    
    console.log(`User ${userId} joined room ${roomId}`);
    
    socket.to(roomId).emit('user-joined', { userId, socketId: socket.id });
    
    const participants = Array.from(roomParticipants.get(roomId)).filter(id => id !== userId);
    socket.emit('room-participants', { participants });
  });

  socket.on('leave-room', (roomId) => {
    const userId = activeUsers.get(socket.id);
    if (!userId) return;

    socket.leave(roomId);
    if (roomParticipants.has(roomId)) {
      roomParticipants.get(roomId).delete(userId);
      if (roomParticipants.get(roomId).size === 0) {
        roomParticipants.delete(roomId);
      }
    }
    
    socket.to(roomId).emit('user-left', { userId, roomId });
    console.log(`User ${userId} left room ${roomId}`);
  });

  socket.on('offer', (data) => {
    const { targetUserId, offer, roomId } = data;
    const callerId = activeUsers.get(socket.id);
    const targetSocketId = userSockets.get(targetUserId);
    
    console.log(`Offer from ${callerId} to ${targetUserId}`);
    if (targetSocketId) {
      io.to(targetSocketId).emit('offer', {
        callerId,
        offer,
        roomId,
        isVideo: data.isVideo
      });
    }
  });

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
    }
  });

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
    }
  });

  socket.on('end-call', (data) => {
    const { targetUserId, roomId } = data;
    const enderId = activeUsers.get(socket.id);
    
    if (targetUserId) {
      const targetSocketId = userSockets.get(targetUserId);
      if (targetSocketId) {
        io.to(targetSocketId).emit('call-ended', { enderId, roomId });
      }
    } else if (roomId) {
      socket.to(roomId).emit('call-ended', { enderId, roomId });
    }
  });

  socket.on('disconnect', () => {
    const userId = activeUsers.get(socket.id);
    console.log(`User disconnected: ${socket.id} (User: ${userId})`);
    
    if (userId) {
      roomParticipants.forEach((participants, roomId) => {
        if (participants.has(userId)) {
          participants.delete(userId);
          socket.to(roomId).emit('user-left', { userId, roomId });
          if (participants.size === 0) {
            roomParticipants.delete(roomId);
          }
        }
      });
      
      activeUsers.delete(socket.id);
      userSockets.delete(userId);
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Signaling server running on port ${PORT}`);
});
