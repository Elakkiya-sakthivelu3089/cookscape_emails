import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { config, prisma } from '../config/index.js';

let ioInstance: Server | null = null;
const onlineUsers = new Map<string, Set<string>>(); // userId -> Set of socketIds

export const initSocketService = (io: Server) => {
  ioInstance = io;

  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.replace('Bearer ', '');
      if (!token) {
        return next(new Error('Authentication error: Token required'));
      }

      const decoded = jwt.verify(token, config.jwtSecret) as { id: string; email: string; name: string };
      socket.data.user = decoded;
      next();
    } catch (err) {
      next(new Error('Authentication error: Invalid token'));
    }
  });

  io.on('connection', (socket: Socket) => {
    const user = socket.data.user;
    if (!user) return;

    const userId = user.id;

    // Register user to personal room for direct alerts & email updates
    socket.join(`user_${userId}`);

    // Update presence
    if (!onlineUsers.has(userId)) {
      onlineUsers.set(userId, new Set());
    }
    onlineUsers.get(userId)!.add(socket.id);

    // Broadcast presence update
    io.emit('user_presence_change', {
      userId,
      isOnline: true,
      onlineUserIds: Array.from(onlineUsers.keys()),
    });

    // Handle joining chat room
    socket.on('join_room', (roomId: string) => {
      socket.join(`room_${roomId}`);
    });

    // Handle leaving chat room
    socket.on('leave_room', (roomId: string) => {
      socket.leave(`room_${roomId}`);
    });

    // Handle typing events
    socket.on('typing_start', ({ roomId, userName }: { roomId: string; userName: string }) => {
      socket.to(`room_${roomId}`).emit('user_typing', { roomId, userId, userName });
    });

    socket.on('typing_stop', ({ roomId }: { roomId: string }) => {
      socket.to(`room_${roomId}`).emit('user_stop_typing', { roomId, userId });
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      const userSockets = onlineUsers.get(userId);
      if (userSockets) {
        userSockets.delete(socket.id);
        if (userSockets.size === 0) {
          onlineUsers.delete(userId);
          io.emit('user_presence_change', {
            userId,
            isOnline: false,
            onlineUserIds: Array.from(onlineUsers.keys()),
          });
        }
      }
    });
  });
};

export const getOnlineUserIds = (): string[] => {
  return Array.from(onlineUsers.keys());
};

export const emitNewEmailNotification = (userId: string, emailData: any) => {
  if (ioInstance) {
    ioInstance.to(`user_${userId}`).emit('new_email_received', emailData);
  }
};

export const emitChatMessage = (roomId: string, message: any) => {
  if (ioInstance) {
    ioInstance.to(`room_${roomId}`).emit('new_chat_message', message);
  }
};

export const emitRoomUpdate = (userIds: string[], roomData: any) => {
  if (ioInstance) {
    userIds.forEach((uid) => {
      ioInstance!.to(`user_${uid}`).emit('room_updated', roomData);
    });
  }
};
