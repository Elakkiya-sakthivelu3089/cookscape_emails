export type UserRole = 'SUPER_ADMIN' | 'ADMIN' | 'DESIGNER' | 'EMPLOYEE' | 'CLIENT';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  department: string;
  designation: string;
  avatar?: string;
  phone?: string;
  quotaBytes?: string;
  usedStorageBytes?: string;
  forcePasswordReset?: boolean;
  signatureHtml?: string;
  unreadEmailsCount?: number;
  isActive?: boolean;
  createdAt?: string;
}

export interface Attachment {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  createdAt?: string;
}

export interface EmailRecipientInfo {
  recipientEmail: string;
  recipientName?: string;
  type: 'TO' | 'CC' | 'BCC';
}

export interface EmailItem {
  recipientRecordId: string;
  folder: 'INBOX' | 'SENT' | 'DRAFTS' | 'TRASH' | 'SPAM' | 'ARCHIVE';
  isRead: boolean;
  isStarred: boolean;
  isArchived: boolean;
  isTrash: boolean;
  isSpam: boolean;
  labels: string[];
  emailId: string;
  threadId: string;
  subject: string;
  snippet: string;
  senderId: string;
  senderName: string;
  senderEmail: string;
  importance: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  category: 'GENERAL' | 'PROPOSAL' | 'QUOTATION' | 'SITE_UPDATE' | 'BILLING';
  isDraft: boolean;
  hasAttachments: boolean;
  attachmentsCount: number;
  attachments?: Attachment[];
  recipients?: EmailRecipientInfo[];
  createdAt: string;
}

export interface FullEmailDetail {
  id: string;
  threadId: string;
  senderId: string;
  senderEmail: string;
  senderName: string;
  subject: string;
  bodyHtml: string;
  bodyText: string;
  isDraft: boolean;
  importance: string;
  category: string;
  createdAt: string;
  attachments: Attachment[];
  recipients: Array<{
    id: string;
    recipientEmail: string;
    recipientName?: string;
    type: 'TO' | 'CC' | 'BCC';
    isRead: boolean;
  }>;
}

export interface ChatMessage {
  id: string;
  roomId: string;
  senderId: string;
  content: string;
  createdAt: string;
  sender: {
    id: string;
    name: string;
    email: string;
    role: string;
    department: string;
    avatar?: string;
  };
  attachments?: Attachment[];
}

export interface ChatRoom {
  id: string;
  name: string;
  description?: string;
  type: 'CHANNEL' | 'DIRECT' | 'CLIENT_PROJECT';
  projectCode?: string;
  clientName?: string;
  directUser?: {
    id: string;
    name: string;
    email: string;
    department: string;
    role: string;
    avatar?: string;
  };
  membersCount: number;
  lastMessage?: {
    id: string;
    content: string;
    senderName: string;
    createdAt: string;
  };
  lastReadAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface EmailTemplate {
  id: string;
  title: string;
  description?: string;
  category: 'PROPOSAL' | 'QUOTATION' | 'SITE_UPDATE' | 'MOODBOARD' | 'INVOICE';
  subject: string;
  bodyHtml: string;
  isDefault?: boolean;
  createdAt?: string;
}

export interface MailFolderCounts {
  inboxUnread: number;
  starredCount: number;
  sentCount: number;
  draftsCount: number;
  trashCount: number;
  spamCount: number;
}

export interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  totalEmails: number;
  totalChannels: number;
  totalClientRooms: number;
  auditLogsCount: number;
  totalStorageUsedBytes: string;
  departmentDistribution: Array<{ department: string; count: number }>;
  companyDomain: string;
}

export interface AuditLog {
  id: string;
  userId?: string;
  action: string;
  ipAddress?: string;
  userAgent?: string;
  details?: string;
  createdAt: string;
  user?: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
}
