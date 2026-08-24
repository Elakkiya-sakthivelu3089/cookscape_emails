"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.emitRoomUpdate = exports.emitChatMessage = exports.emitNewEmailNotification = exports.getOnlineUserIds = exports.initSocketService = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const index_js_1 = require("../config/index.js");
let ioInstance = null;
const onlineUsers = new Map(); // userId -> Set of socketIds
const initSocketService = (io) => {
    ioInstance = io;
    io.use((socket, next) => {
        try {
            const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.replace('Bearer ', '');
            if (!token) {
                return next(new Error('Authentication error: Token required'));
            }
            const decoded = jsonwebtoken_1.default.verify(token, index_js_1.config.jwtSecret);
            socket.data.user = decoded;
            next();
        }
        catch (err) {
            next(new Error('Authentication error: Invalid token'));
        }
    });
    io.on('connection', (socket) => {
        const user = socket.data.user;
        if (!user)
            return;
        const userId = user.id;
        // Register user to personal room for direct alerts & email updates
        socket.join(`user_${userId}`);
        // Update presence
        if (!onlineUsers.has(userId)) {
            onlineUsers.set(userId, new Set());
        }
        onlineUsers.get(userId).add(socket.id);
        // Broadcast presence update
        io.emit('user_presence_change', {
            userId,
            isOnline: true,
            onlineUserIds: Array.from(onlineUsers.keys()),
        });
        // Handle joining chat room
        socket.on('join_room', (roomId) => {
            socket.join(`room_${roomId}`);
        });
        // Handle leaving chat room
        socket.on('leave_room', (roomId) => {
            socket.leave(`room_${roomId}`);
        });
        // Handle typing events
        socket.on('typing_start', ({ roomId, userName }) => {
            socket.to(`room_${roomId}`).emit('user_typing', { roomId, userId, userName });
        });
        socket.on('typing_stop', ({ roomId }) => {
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
exports.initSocketService = initSocketService;
const getOnlineUserIds = () => {
    return Array.from(onlineUsers.keys());
};
exports.getOnlineUserIds = getOnlineUserIds;
const emitNewEmailNotification = (userId, emailData) => {
    if (ioInstance) {
        ioInstance.to(`user_${userId}`).emit('new_email_received', emailData);
    }
};
exports.emitNewEmailNotification = emitNewEmailNotification;
const emitChatMessage = (roomId, message) => {
    if (ioInstance) {
        ioInstance.to(`room_${roomId}`).emit('new_chat_message', message);
    }
};
exports.emitChatMessage = emitChatMessage;
const emitRoomUpdate = (userIds, roomData) => {
    if (ioInstance) {
        userIds.forEach((uid) => {
            ioInstance.to(`user_${uid}`).emit('room_updated', roomData);
        });
    }
};
exports.emitRoomUpdate = emitRoomUpdate;
