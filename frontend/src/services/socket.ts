import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export const initializeSocket = (token: string): Socket => {
  if (socket) {
    socket.disconnect();
  }

  const customUrl = typeof window !== 'undefined' ? localStorage.getItem('cookscape_api_url') : null;
  const envUrl = customUrl || import.meta.env.VITE_API_URL;
  
  // If running locally and no custom URL configured, connect to localhost:5000 or origin proxy
  let socketUrl = window.location.origin;
  if (envUrl && envUrl.trim()) {
    socketUrl = envUrl.trim().replace(/\/+$/, '').replace(/\/api$/, '');
  } else if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
    socketUrl = 'http://localhost:5000';
  }

  socket = io(socketUrl, {
    auth: { token },
    transports: ['websocket', 'polling'],
    reconnectionAttempts: 5,
    reconnectionDelay: 2000,
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
