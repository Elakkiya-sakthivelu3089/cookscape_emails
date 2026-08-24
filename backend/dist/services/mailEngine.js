"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MailEngine = void 0;
const crypto_1 = __importDefault(require("crypto"));
const index_js_1 = require("../config/index.js");
const socketService_js_1 = require("./socketService.js");
const auditService_js_1 = require("./auditService.js");
class MailEngine {
    static async sendEmail(input) {
        const threadId = input.threadId || `thread_${crypto_1.default.randomUUID()}`;
        const cleanTo = [...new Set(input.to.map((e) => e.trim().toLowerCase()))].filter(Boolean);
        const cleanCc = [...new Set((input.cc || []).map((e) => e.trim().toLowerCase()))].filter(Boolean);
        const cleanBcc = [...new Set((input.bcc || []).map((e) => e.trim().toLowerCase()))].filter(Boolean);
        if (cleanTo.length === 0 && !input.isDraft) {
            throw new Error('At least one valid recipient is required.');
        }
        const plainText = input.bodyText || input.bodyHtml.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
        // 1. Create the Email record
        const email = await index_js_1.prisma.email.create({
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
        const users = await index_js_1.prisma.user.findMany({
            where: {
                email: { in: allEmails },
            },
            select: { id: true, email: true, name: true },
        });
        const userMap = new Map(users.map((u) => [u.email.toLowerCase(), u]));
        // 3. Sender copy (SENT folder or DRAFTS folder)
        const senderUser = userMap.get(input.senderEmail.toLowerCase());
        await index_js_1.prisma.emailRecipient.create({
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
        const recipientRecords = [];
        // Helper to add
        const addRecipient = (address, type) => {
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
        await index_js_1.prisma.emailRecipient.createMany({
            data: recipientRecords,
        });
        // 5. Update attachment storage quota for sender
        if (input.attachments && input.attachments.length > 0) {
            const totalBytes = input.attachments.reduce((acc, a) => acc + a.size, 0);
            await index_js_1.prisma.user.update({
                where: { id: input.senderId },
                data: {
                    usedStorageBytes: {
                        increment: totalBytes,
                    },
                },
            });
        }
        // 6. Log audit event
        await (0, auditService_js_1.logAudit)({
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
                (0, socketService_js_1.emitNewEmailNotification)(r.userId, {
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
exports.MailEngine = MailEngine;
