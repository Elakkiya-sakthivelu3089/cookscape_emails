import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { ChatRoom, ChatMessage } from '../types/index.js';
import { api } from '../services/api.js';
import { getSocket } from '../services/socket.js';
import { useAuth } from './AuthContext.js';

interface ChatContextType {
  rooms: ChatRoom[];
  activeRoomId: string | null;
  activeRoom: ChatRoom | null;
  messages: ChatMessage[];
  isLoadingRooms: boolean;
  isLoadingMessages: boolean;
  typingUsers: { [roomId: string]: string[] }; // roomId -> array of user names
  setActiveRoomId: (id: string | null) => void;
  fetchRooms: () => Promise<void>;
  sendMessage: (content: string, attachments?: any[]) => Promise<boolean>;
  sendTyping: (isTyping: boolean) => void;
  createRoom: (data: {
    name?: string;
    description?: string;
    type: 'CHANNEL' | 'DIRECT' | 'CLIENT_PROJECT';
    projectCode?: string;
    clientName?: string;
    memberUserIds?: string[];
  }) => Promise<{ success: boolean; room?: ChatRoom; error?: string }>;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoadingRooms, setIsLoadingRooms] = useState<boolean>(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState<boolean>(false);
  const [typingUsers, setTypingUsers] = useState<{ [roomId: string]: string[] }>({});

  const fetchRooms = useCallback(async () => {
    if (!user) return;
    setIsLoadingRooms(true);
    try {
      const res = await api.get('/chat/rooms');
      setRooms(res.data.rooms || []);
    } catch (err) {
      console.error('Failed to fetch chat rooms:', err);
    } finally {
      setIsLoadingRooms(false);
    }
  }, [user]);

  const fetchMessages = useCallback(async (roomId: string) => {
    setIsLoadingMessages(true);
    try {
      const res = await api.get(`/chat/rooms/${roomId}/messages`);
      setMessages(res.data.messages || []);
    } catch (err) {
      console.error('Failed to fetch messages:', err);
    } finally {
      setIsLoadingMessages(false);
    }
  }, []);

  // Fetch rooms on mount
  useEffect(() => {
    fetchRooms();
  }, [fetchRooms]);

  // Handle active room switch
  useEffect(() => {
    const socket = getSocket();
    if (activeRoomId) {
      fetchMessages(activeRoomId);
      if (socket) {
        socket.emit('join_room', activeRoomId);
      }
    }

    return () => {
      if (activeRoomId && socket) {
        socket.emit('leave_room', activeRoomId);
      }
    };
  }, [activeRoomId, fetchMessages]);

  // Socket listener for new messages & typing
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handleNewMessage = (newMsg: ChatMessage) => {
      if (newMsg.roomId === activeRoomId) {
        setMessages((prev) => [...prev, newMsg]);
      }

      // Update room lastMessage & sort
      setRooms((prev) =>
        prev.map((r) =>
          r.id === newMsg.roomId
            ? {
                ...r,
                lastMessage: {
                  id: newMsg.id,
                  content: newMsg.content,
                  senderName: newMsg.sender.name,
                  createdAt: newMsg.createdAt,
                },
                updatedAt: new Date().toISOString(),
              }
            : r
        )
      );
    };

    const handleUserTyping = (data: { roomId: string; userId: string; userName: string }) => {
      setTypingUsers((prev) => {
        const current = prev[data.roomId] || [];
        if (!current.includes(data.userName)) {
          return { ...prev, [data.roomId]: [...current, data.userName] };
        }
        return prev;
      });
    };

    const handleUserStopTyping = (data: { roomId: string; userId: string }) => {
      setTypingUsers((prev) => {
        const current = prev[data.roomId] || [];
        return {
          ...prev,
          [data.roomId]: current.filter((_name, i) => i !== 0), // remove
        };
      });
    };

    const handleRoomUpdated = () => {
      fetchRooms();
    };

    socket.on('new_chat_message', handleNewMessage);
    socket.on('user_typing', handleUserTyping);
    socket.on('user_stop_typing', handleUserStopTyping);
    socket.on('room_updated', handleRoomUpdated);

    return () => {
      socket.off('new_chat_message', handleNewMessage);
      socket.off('user_typing', handleUserTyping);
      socket.off('user_stop_typing', handleUserStopTyping);
      socket.off('room_updated', handleRoomUpdated);
    };
  }, [activeRoomId, fetchRooms]);

  const sendTyping = (isTyping: boolean) => {
    const socket = getSocket();
    if (!socket || !activeRoomId || !user) return;

    if (isTyping) {
      socket.emit('typing_start', { roomId: activeRoomId, userName: user.name });
    } else {
      socket.emit('typing_stop', { roomId: activeRoomId });
    }
  };

  const sendMessage = async (content: string, attachments?: any[]): Promise<boolean> => {
    if (!activeRoomId) return false;
    try {
      await api.post(`/chat/rooms/${activeRoomId}/messages`, {
        content,
        attachments,
      });
      sendTyping(false);
      return true;
    } catch (err) {
      console.error('Failed to send chat message:', err);
      return false;
    }
  };

  const createRoom = async (data: {
    name?: string;
    description?: string;
    type: 'CHANNEL' | 'DIRECT' | 'CLIENT_PROJECT';
    projectCode?: string;
    clientName?: string;
    memberUserIds?: string[];
  }) => {
    try {
      const res = await api.post('/chat/rooms', data);
      await fetchRooms();
      setActiveRoomId(res.data.room.id);
      return { success: true, room: res.data.room };
    } catch (err: any) {
      return { success: false, error: err.response?.data?.error || 'Failed to create room' };
    }
  };

  const activeRoom = rooms.find((r) => r.id === activeRoomId) || null;

  return (
    <ChatContext.Provider
      value={{
        rooms,
        activeRoomId,
        activeRoom,
        messages,
        isLoadingRooms,
        isLoadingMessages,
        typingUsers,
        setActiveRoomId,
        fetchRooms,
        sendMessage,
        sendTyping,
        createRoom,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};
