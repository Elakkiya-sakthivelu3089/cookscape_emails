import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { EmailItem, FullEmailDetail, MailFolderCounts } from '../types/index.js';
import { api } from '../services/api.js';
import { getSocket } from '../services/socket.js';
import { useAuth } from './AuthContext.js';

interface MailContextType {
  emails: EmailItem[];
  currentFolder: string;
  selectedEmailId: string | null;
  selectedEmailDetail: FullEmailDetail | null;
  selectedThread: FullEmailDetail[];
  counts: MailFolderCounts;
  searchQuery: string;
  categoryFilter: string;
  isLoadingList: boolean;
  isLoadingDetail: boolean;
  isComposeOpen: boolean;
  composeDraftData: any | null;
  setCurrentFolder: (folder: string) => void;
  setSelectedEmailId: (id: string | null) => void;
  setSearchQuery: (query: string) => void;
  setCategoryFilter: (cat: string) => void;
  openCompose: (initialData?: any) => void;
  closeCompose: () => void;
  fetchEmails: () => Promise<void>;
  fetchCounts: () => Promise<void>;
  toggleStar: (emailId: string, currentStarred: boolean) => Promise<void>;
  markAsRead: (emailId: string, readState?: boolean) => Promise<void>;
  moveToTrash: (emailId: string) => Promise<void>;
  restoreFromTrash: (emailId: string) => Promise<void>;
  deletePermanently: (emailId: string) => Promise<void>;
  sendEmail: (data: any) => Promise<boolean>;
}

const MailContext = createContext<MailContextType | undefined>(undefined);

export const MailProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [emails, setEmails] = useState<EmailItem[]>([]);
  const [currentFolder, setCurrentFolder] = useState<string>('INBOX');
  const [selectedEmailId, setSelectedEmailId] = useState<string | null>(null);
  const [selectedEmailDetail, setSelectedEmailDetail] = useState<FullEmailDetail | null>(null);
  const [selectedThread, setSelectedThread] = useState<FullEmailDetail[]>([]);
  const [counts, setCounts] = useState<MailFolderCounts>({
    inboxUnread: 0,
    starredCount: 0,
    sentCount: 0,
    draftsCount: 0,
    trashCount: 0,
    spamCount: 0,
  });
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [isLoadingList, setIsLoadingList] = useState<boolean>(false);
  const [isLoadingDetail, setIsLoadingDetail] = useState<boolean>(false);
  const [isComposeOpen, setIsComposeOpen] = useState<boolean>(false);
  const [composeDraftData, setComposeDraftData] = useState<any | null>(null);

  const fetchCounts = useCallback(async () => {
    if (!user) return;
    try {
      const res = await api.get('/mail/counts');
      setCounts(res.data);
    } catch (err) {
      console.error('Failed to fetch mail counts:', err);
    }
  }, [user]);

  const fetchEmails = useCallback(async () => {
    if (!user) return;
    setIsLoadingList(true);
    try {
      const res = await api.get('/mail', {
        params: {
          folder: currentFolder,
          search: searchQuery || undefined,
          category: categoryFilter !== 'ALL' ? categoryFilter : undefined,
        },
      });
      setEmails(res.data.emails || []);
    } catch (err) {
      console.error('Failed to fetch emails:', err);
    } finally {
      setIsLoadingList(false);
    }
  }, [user, currentFolder, searchQuery, categoryFilter]);

  // Listen to socket for instant new emails
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handleNewEmail = (newEmail: any) => {
      fetchCounts();
      if (currentFolder === 'INBOX') {
        fetchEmails();
      }
    };

    socket.on('new_email_received', handleNewEmail);

    return () => {
      socket.off('new_email_received', handleNewEmail);
    };
  }, [currentFolder, fetchEmails, fetchCounts]);

  // Refetch when folder, search, or filter changes
  useEffect(() => {
    fetchEmails();
    fetchCounts();
  }, [fetchEmails, fetchCounts]);

  // Fetch detailed email when selectedEmailId changes
  useEffect(() => {
    const fetchDetail = async () => {
      if (!selectedEmailId) {
        setSelectedEmailDetail(null);
        setSelectedThread([]);
        return;
      }

      setIsLoadingDetail(true);
      try {
        const res = await api.get(`/mail/${selectedEmailId}`);
        setSelectedEmailDetail(res.data.email);
        setSelectedThread(res.data.thread || [res.data.email]);
        fetchCounts();
        // Update read state locally in emails list
        setEmails((prev) =>
          prev.map((e) => (e.emailId === selectedEmailId ? { ...e, isRead: true } : e))
        );
      } catch (err) {
        console.error('Failed to fetch email detail:', err);
      } finally {
        setIsLoadingDetail(false);
      }
    };

    fetchDetail();
  }, [selectedEmailId, fetchCounts]);

  const openCompose = (initialData?: any) => {
    setComposeDraftData(initialData || null);
    setIsComposeOpen(true);
  };

  const closeCompose = () => {
    setIsComposeOpen(false);
    setComposeDraftData(null);
  };

  const toggleStar = async (emailId: string, currentStarred: boolean) => {
    try {
      await api.patch(`/mail/${emailId}/status`, { isStarred: !currentStarred });
      setEmails((prev) =>
        prev.map((e) => (e.emailId === emailId ? { ...e, isStarred: !currentStarred } : e))
      );
      fetchCounts();
    } catch (err) {
      console.error('Failed to star email:', err);
    }
  };

  const markAsRead = async (emailId: string, readState = true) => {
    try {
      await api.patch(`/mail/${emailId}/status`, { isRead: readState });
      setEmails((prev) =>
        prev.map((e) => (e.emailId === emailId ? { ...e, isRead: readState } : e))
      );
      fetchCounts();
    } catch (err) {
      console.error('Failed to update read status:', err);
    }
  };

  const moveToTrash = async (emailId: string) => {
    try {
      await api.patch(`/mail/${emailId}/status`, { isTrash: true });
      setEmails((prev) => prev.filter((e) => e.emailId !== emailId));
      if (selectedEmailId === emailId) {
        setSelectedEmailId(null);
      }
      fetchCounts();
    } catch (err) {
      console.error('Failed to move email to trash:', err);
    }
  };

  const restoreFromTrash = async (emailId: string) => {
    try {
      await api.patch(`/mail/${emailId}/status`, { isTrash: false, folder: 'INBOX' });
      setEmails((prev) => prev.filter((e) => e.emailId !== emailId));
      fetchCounts();
    } catch (err) {
      console.error('Failed to restore email:', err);
    }
  };

  const deletePermanently = async (emailId: string) => {
    try {
      await api.delete(`/mail/${emailId}`);
      setEmails((prev) => prev.filter((e) => e.emailId !== emailId));
      if (selectedEmailId === emailId) {
        setSelectedEmailId(null);
      }
      fetchCounts();
    } catch (err) {
      console.error('Failed to permanently delete email:', err);
    }
  };

  const sendEmail = async (data: any): Promise<boolean> => {
    try {
      await api.post('/mail/send', data);
      closeCompose();
      fetchEmails();
      fetchCounts();
      return true;
    } catch (err: any) {
      console.error('Failed to send email:', err);
      alert(err.response?.data?.error || 'Failed to send email');
      return false;
    }
  };

  return (
    <MailContext.Provider
      value={{
        emails,
        currentFolder,
        selectedEmailId,
        selectedEmailDetail,
        selectedThread,
        counts,
        searchQuery,
        categoryFilter,
        isLoadingList,
        isLoadingDetail,
        isComposeOpen,
        composeDraftData,
        setCurrentFolder,
        setSelectedEmailId,
        setSearchQuery,
        setCategoryFilter,
        openCompose,
        closeCompose,
        fetchEmails,
        fetchCounts,
        toggleStar,
        markAsRead,
        moveToTrash,
        restoreFromTrash,
        deletePermanently,
        sendEmail,
      }}
    >
      {children}
    </MailContext.Provider>
  );
};

export const useMail = () => {
  const context = useContext(MailContext);
  if (!context) {
    throw new Error('useMail must be used within a MailProvider');
  }
  return context;
};
