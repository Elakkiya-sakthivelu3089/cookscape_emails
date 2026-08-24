import { Response } from 'express';
import { prisma } from '../config/index.js';
import { AuthRequest } from '../middleware/auth.js';
import { emitChatMessage, emitRoomUpdate } from '../services/socketService.js';
import { logAudit } from '../services/auditService.js';

export class ChatController {
  // 1. Get all rooms accessible to the user (Channels, Direct Chats, Client Rooms)
  static async getUserRooms(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const userId = req.user.id;

      // Find rooms where user is a member OR public company channels
      const rooms = await prisma.chatRoom.findMany({
        where: {
          isArchived: false,
          OR: [
            { type: 'CHANNEL' },
            { members: { some: { userId } } },
          ],
        },
        include: {
          members: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  avatar: true,
                  department: true,
                  role: true,
                },
              },
            },
          },
          messages: {
            orderBy: { createdAt: 'desc' },
            take: 1,
            include: {
              sender: {
                select: { id: true, name: true },
              },
            },
          },
          _count: {
            select: { messages: true },
          },
        },
        orderBy: { updatedAt: 'desc' },
      });

      const formatted = rooms.map((room) => {
        const lastMsg = room.messages[0] || null;
        const currentMember = room.members.find((m) => m.userId === userId);
        const otherMember = room.type === 'DIRECT' ? room.members.find((m) => m.userId !== userId)?.user : null;

        return {
          id: room.id,
          name: room.type === 'DIRECT' && otherMember ? otherMember.name : room.name,
          description: room.description,
          type: room.type,
          projectCode: room.projectCode,
          clientName: room.clientName,
          directUser: otherMember,
          membersCount: room.members.length,
          lastMessage: lastMsg ? {
            id: lastMsg.id,
            content: lastMsg.content,
            senderName: lastMsg.sender.name,
            createdAt: lastMsg.createdAt,
          } : null,
          lastReadAt: currentMember ? currentMember.lastReadAt : null,
          createdAt: room.createdAt,
          updatedAt: room.updatedAt,
        };
      });

      res.json({ rooms: formatted });
    } catch (error: any) {
      console.error('Get user rooms error:', error);
      res.status(500).json({ error: 'Failed to retrieve chat rooms.' });
    }
  }

  // 2. Get message history of a room
  static async getRoomMessages(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const roomId = String(req.params.roomId);
      const { limit = '100' } = req.query;
      const limitNum = parseInt(String(limit), 10);

      const room = await prisma.chatRoom.findUnique({
        where: { id: roomId },
        include: {
          members: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  role: true,
                  department: true,
                  avatar: true,
                },
              },
            },
          },
        },
      });

      if (!room) {
        res.status(404).json({ error: 'Chat room not found.' });
        return;
      }

      // Ensure membership if it's a direct or client room
      const isMember = room.members.some((m: any) => m.userId === req.user!.id);
      if (room.type !== 'CHANNEL' && !isMember && req.user.role !== 'SUPER_ADMIN') {
        res.status(403).json({ error: 'You do not have access to this conversation.' });
        return;
      }

      const messages = await prisma.chatMessage.findMany({
        where: { roomId },
        orderBy: { createdAt: 'asc' },
        take: limitNum,
        include: {
          sender: {
            select: {
              id: true,
              name: true,
              email: true,
              department: true,
              role: true,
              avatar: true,
            },
          },
          attachments: true,
        },
      });

      // Update user's lastReadAt in this room
      await prisma.chatMember.upsert({
        where: {
          roomId_userId: {
            roomId,
            userId: req.user.id,
          },
        },
        update: { lastReadAt: new Date() },
        create: {
          roomId,
          userId: req.user.id,
          lastReadAt: new Date(),
        },
      });

      res.json({
        room,
        messages,
      });
    } catch (error: any) {
      console.error('Get room messages error:', error);
      res.status(500).json({ error: 'Failed to retrieve chat messages.' });
    }
  }

  // 3. Send message to room
  static async sendMessage(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const roomId = String(req.params.roomId);
      const { content, attachments } = req.body;

      if ((!content || !content.trim()) && (!attachments || attachments.length === 0)) {
        res.status(400).json({ error: 'Message content or attachment is required.' });
        return;
      }

      const room = await prisma.chatRoom.findUnique({
        where: { id: roomId },
        include: { members: true },
      });

      if (!room) {
        res.status(404).json({ error: 'Room not found' });
        return;
      }

      // Create message
      const message = await prisma.chatMessage.create({
        data: {
          roomId,
          senderId: req.user.id,
          content: (content || '').trim(),
          attachments: attachments && attachments.length > 0 ? {
            create: attachments.map((att: any) => ({
              filename: att.filename,
              originalName: att.originalName,
              mimeType: att.mimeType,
              size: att.size,
              url: att.url,
            })),
          } : undefined,
        },
        include: {
          sender: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
              department: true,
              avatar: true,
            },
          },
          attachments: true,
        },
      });

      // Update room updatedAt
      await prisma.chatRoom.update({
        where: { id: roomId },
        data: { updatedAt: new Date() },
      });

      // Emit real-time message to socket room
      emitChatMessage(roomId, message);

      res.status(201).json({ message });
    } catch (error: any) {
      console.error('Send message error:', error);
      res.status(500).json({ error: 'Failed to send message.' });
    }
  }

  // 4. Create new Channel / Direct Message / Client Room
  static async createRoom(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const { name, description, type = 'CHANNEL', projectCode, clientName, memberUserIds = [] } = req.body;

      // If direct message, check if room already exists between these 2 users
      if (type === 'DIRECT') {
        const targetUserId = memberUserIds[0];
        if (!targetUserId) {
          res.status(400).json({ error: 'Direct chat target user is required.' });
          return;
        }

        const existingRoom = await prisma.chatRoom.findFirst({
          where: {
            type: 'DIRECT',
            AND: [
              { members: { some: { userId: req.user.id } } },
              { members: { some: { userId: targetUserId } } },
            ],
          },
        });

        if (existingRoom) {
          res.json({ room: existingRoom, message: 'Existing chat room opened.' });
          return;
        }
      }

      const allMembers = Array.from(new Set([req.user.id, ...memberUserIds]));

      const room = await prisma.chatRoom.create({
        data: {
          name: name ? name.trim() : (type === 'DIRECT' ? 'Direct Message' : 'New Room'),
          description: description ? description.trim() : null,
          type,
          projectCode: projectCode ? projectCode.trim() : null,
          clientName: clientName ? clientName.trim() : null,
          createdById: req.user.id,
          members: {
            create: allMembers.map((uid) => ({
              userId: uid,
              role: uid === req.user!.id ? 'ADMIN' : 'MEMBER',
            })),
          },
        },
        include: {
          members: {
            include: {
              user: {
                select: { id: true, name: true, email: true, role: true },
              },
            },
          },
        },
      });

      emitRoomUpdate(allMembers, room);

      res.status(201).json({
        message: 'Chat room created successfully.',
        room,
      });
    } catch (error: any) {
      console.error('Create room error:', error);
      res.status(500).json({ error: 'Failed to create chat room.' });
    }
  }
}
