import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export const initializeSocket = (token: string): Socket => {
  if (socket) {
    socket.disconnect();
  }

  const customUrl = typeof window !== 'undefined' ? localStorage.getItem('cookscape_api_url') : null;
  const envUrl = customUrl || import.meta.env.VITE_API_URL;
  const socketUrl = envUrl ? envUrl.trim().replace(/\/+$/, '').replace(/\/api$/, '') : window.location.origin;

  socket = io(socketUrl, {
    auth: { token },
    transports: ['websocket', 'polling'],
  });

  return socket;
};

export const getSocket = (): Socket | null => {
  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
