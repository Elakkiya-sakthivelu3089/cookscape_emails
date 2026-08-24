import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types/index.js';
import { api } from '../services/api.js';
import { initializeSocket, disconnectSocket, getSocket } from '../services/socket.js';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  onlineUserIds: string[];
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<boolean>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<{ success: boolean; error?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('cookscape_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('cookscape_token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [onlineUserIds, setOnlineUserIds] = useState<string[]>([]);

  useEffect(() => {
    const verifySession = async () => {
      if (!token) {
        setIsLoading(false);
        return;
      }

      try {
        const res = await api.get('/auth/me');
        setUser(res.data.user);
        setOnlineUserIds(res.data.onlineUserIds || []);
        localStorage.setItem('cookscape_user', JSON.stringify(res.data.user));

        // Connect socket
        const socket = initializeSocket(token);
        socket.on('user_presence_change', (data: { userId: string; isOnline: boolean; onlineUserIds: string[] }) => {
          if (data.onlineUserIds) {
            setOnlineUserIds(data.onlineUserIds);
          }
        });
      } catch (err) {
        console.error('Session verification error:', err);
        logout();
      } finally {
        setIsLoading(false);
      }
    };

    verifySession();

    return () => {
      disconnectSocket();
    };
  }, [token]);

  const login = async (email: string, password: string) => {
    try {
      const res = await api.post('/auth/login', { email, password });
      const { token: receivedToken, user: receivedUser } = res.data;

      localStorage.setItem('cookscape_token', receivedToken);
      localStorage.setItem('cookscape_user', JSON.stringify(receivedUser));

      setToken(receivedToken);
      setUser(receivedUser);

      // Connect socket
      const socket = initializeSocket(receivedToken);
      socket.on('user_presence_change', (data: { userId: string; isOnline: boolean; onlineUserIds: string[] }) => {
        if (data.onlineUserIds) {
          setOnlineUserIds(data.onlineUserIds);
        }
      });

      return { success: true };
    } catch (err: any) {
      let errorMsg = 'Login failed. Please check your credentials.';
      if (err.response?.data?.error) {
        errorMsg = typeof err.response.data.error === 'string'
          ? err.response.data.error
          : err.response.data.error.message || JSON.stringify(err.response.data.error);
      } else if (err.message) {
        errorMsg = err.message;
      }
      return { success: false, error: errorMsg };
    }
  };

  const logout = () => {
    localStorage.removeItem('cookscape_token');
    localStorage.removeItem('cookscape_user');
    setToken(null);
    setUser(null);
    disconnectSocket();
  };

  const refreshUser = async () => {
    try {
      const res = await api.get('/auth/me');
      setUser(res.data.user);
      localStorage.setItem('cookscape_user', JSON.stringify(res.data.user));
    } catch (err) {
      console.error('Failed to refresh user:', err);
    }
  };

  const updateProfile = async (data: Partial<User>): Promise<boolean> => {
    try {
      const res = await api.put('/auth/profile', data);
      setUser((prev) => (prev ? { ...prev, ...res.data.user } : res.data.user));
      return true;
    } catch (err) {
      console.error('Profile update failed:', err);
      return false;
    }
  };

  const changePassword = async (currentPassword: string, newPassword: string) => {
    try {
      await api.post('/auth/change-password', { currentPassword, newPassword });
      if (user?.forcePasswordReset) {
        setUser((prev) => (prev ? { ...prev, forcePasswordReset: false } : null));
      }
      return { success: true };
    } catch (err: any) {
      let errorMsg = 'Password update failed';
      if (err.response?.data?.error) {
        errorMsg = typeof err.response.data.error === 'string'
          ? err.response.data.error
          : err.response.data.error.message || JSON.stringify(err.response.data.error);
      } else if (err.message) {
        errorMsg = err.message;
      }
      return { success: false, error: errorMsg };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        onlineUserIds,
        login,
        logout,
        refreshUser,
        updateProfile,
        changePassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
