import crypto from 'crypto';
import { prisma } from '../config/index.js';
import { emitNewEmailNotification } from './socketService.js';
import { logAudit } from './auditService.js';

export interface SendEmailInput {
  senderId: string;
  senderEmail: string;
  senderName: string;
  to: string[]; // email addresses
  cc?: string[];
  bcc?: string[];
  subject: string;
  bodyHtml: string;
  bodyText?: string;
  isDraft?: boolean;
  threadId?: string;
  importance?: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  category?: 'GENERAL' | 'PROPOSAL' | 'QUOTATION' | 'SITE_UPDATE' | 'BILLING';
  attachments?: Array<{
    filename: string;
    originalName: string;
    mimeType: string;
    size: number;
    url: string;
  }>;
}

export class MailEngine {
  static async sendEmail(input: SendEmailInput) {
    const threadId = input.threadId || `thread_${crypto.randomUUID()}`;
    const cleanTo = [...new Set(input.to.map((e) => e.trim().toLowerCase()))].filter(Boolean);
    const cleanCc = [...new Set((input.cc || []).map((e) => e.trim().toLowerCase()))].filter(Boolean);
    const cleanBcc = [...new Set((input.bcc || []).map((e) => e.trim().toLowerCase()))].filter(Boolean);

    if (cleanTo.length === 0 && !input.isDraft) {
      throw new Error('At least one valid recipient is required.');
    }

    const plainText = input.bodyText || input.bodyHtml.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

    // 1. Create the Email record
    const email = await prisma.email.create({
      data: {
        threadId,
        senderId: input.senderId,
        senderEmail: input.senderEmail,
        senderName: input.senderName,
        subject: input.subject || '(No Subject)',
        bodyHtml: input.bodyHtml || '',
        bodyText: plainText,
        isDraft: !!input.isDraft,
        importance: input.importance || 'NORMAL',
        category: input.category || 'GENERAL',
        attachments: input.attachments && input.attachments.length > 0 ? {
          create: input.attachments.map((att) => ({
            filename: att.filename,
            originalName: att.originalName,
            mimeType: att.mimeType,
            size: att.size,
            url: att.url,
          })),
        } : undefined,
      },
      include: {
        attachments: true,
      },
    });

    // 2. Resolve internal user IDs for all recipient emails
    const allEmails = Array.from(new Set([...cleanTo, ...cleanCc, ...cleanBcc, input.senderEmail.toLowerCase()]));
    const users = await prisma.user.findMany({
      where: {
        email: { in: allEmails },
      },
      select: { id: true, email: true, name: true },
    });
    const userMap = new Map<string, { id: string; email: string; name: string }>(
      users.map((u: any) => [u.email.toLowerCase(), u])
    );

    // 3. Sender copy (SENT folder or DRAFTS folder)
    const senderUser = userMap.get(input.senderEmail.toLowerCase());
    await prisma.emailRecipient.create({
      data: {
        emailId: email.id,
        userId: senderUser ? senderUser.id : input.senderId,
        recipientEmail: input.senderEmail,
        recipientName: input.senderName,
        type: 'TO',
        folder: input.isDraft ? 'DRAFTS' : 'SENT',
        isRead: true,
      },
    });

    if (input.isDraft) {
      return email;
    }

    // 4. Create recipient entries for TO, CC, BCC
    const recipientRecords: Array<{
      emailId: string;
      userId: string | null;
      recipientEmail: string;
      recipientName: string | null;
      type: 'TO' | 'CC' | 'BCC';
      folder: 'INBOX';
      isRead: boolean;
    }> = [];

    // Helper to add
    const addRecipient = (address: string, type: 'TO' | 'CC' | 'BCC') => {
      const u = userMap.get(address);
      recipientRecords.push({
        emailId: email.id,
        userId: u ? u.id : null,
        recipientEmail: address,
        recipientName: u ? u.name : address.split('@')[0],
        type,
        folder: 'INBOX',
        isRead: false,
      });
    };

    cleanTo.forEach((e) => addRecipient(e, 'TO'));
    cleanCc.forEach((e) => addRecipient(e, 'CC'));
    cleanBcc.forEach((e) => addRecipient(e, 'BCC'));

    await prisma.emailRecipient.createMany({
      data: recipientRecords,
    });

    // 5. Update attachment storage quota for sender
    if (input.attachments && input.attachments.length > 0) {
      const totalBytes = input.attachments.reduce((acc, a) => acc + a.size, 0);
      await prisma.user.update({
        where: { id: input.senderId },
        data: {
          usedStorageBytes: {
            increment: totalBytes,
          },
        },
      });
    }

    // 6. Log audit event
    await logAudit({
      userId: input.senderId,
      action: 'EMAIL_SENT',
      details: {
        emailId: email.id,
        subject: email.subject,
        to: cleanTo,
        attachmentsCount: input.attachments?.length || 0,
      },
    });

    // 7. Push real-time Socket notification to internal recipients
    for (const r of recipientRecords) {
      if (r.userId) {
        emitNewEmailNotification(r.userId, {
          id: email.id,
          threadId: email.threadId,
          subject: email.subject,
          senderName: email.senderName,
          senderEmail: email.senderEmail,
          snippet: email.bodyText.substring(0, 120),
          createdAt: email.createdAt,
          importance: email.importance,
        });
      }
    }

    return email;
  }
}
