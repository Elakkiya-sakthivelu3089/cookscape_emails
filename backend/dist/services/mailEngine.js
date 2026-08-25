"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MailEngine = void 0;
exports.getSmtpTransporter = getSmtpTransporter;
const crypto_1 = __importDefault(require("crypto"));
const path_1 = __importDefault(require("path"));
const dns_1 = __importDefault(require("dns"));
const nodemailer_1 = __importDefault(require("nodemailer"));
const index_js_1 = require("../config/index.js");
const socketService_js_1 = require("./socketService.js");
const auditService_js_1 = require("./auditService.js");
// Force IPv4 over IPv6 to prevent ENETUNREACH in cloud containers like Render
try {
    dns_1.default.setDefaultResultOrder('ipv4first');
}
catch (_) { }
let transporter = null;
function getSmtpTransporter() {
    if (!transporter && index_js_1.config.smtp.user && index_js_1.config.smtp.pass) {
        const isGmail = index_js_1.config.smtp.host.includes('gmail') ||
            index_js_1.config.smtp.user.toLowerCase().includes('@gmail.com');
        const cleanPass = index_js_1.config.smtp.pass.replace(/\s+/g, '');
        if (isGmail) {
            // Use Nodemailer's optimized built-in Gmail service (connects in ~1s)
            transporter = nodemailer_1.default.createTransport({
                service: 'gmail',
                auth: {
                    user: index_js_1.config.smtp.user,
                    pass: cleanPass,
                },
                connectionTimeout: 20000,
                greetingTimeout: 20000,
                socketTimeout: 25000,
            });
        }
        else {
            const port = index_js_1.config.smtp.port || 587;
            const isSecure = port === 465;
            transporter = nodemailer_1.default.createTransport({
                host: index_js_1.config.smtp.host,
                port,
                secure: isSecure,
                auth: {
                    user: index_js_1.config.smtp.user,
                    pass: cleanPass,
                },
                connectionTimeout: 20000,
                greetingTimeout: 20000,
                socketTimeout: 25000,
            });
        }
    }
    return transporter;
}
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
        // 8. Dispatch to external email addresses via SMTP (e.g. Gmail, Yahoo, Outlook)
        const mailer = getSmtpTransporter();
        if (mailer) {
            const externalTo = cleanTo.filter((e) => !e.endsWith(`@${index_js_1.config.companyDomain}`));
            const externalCc = cleanCc.filter((e) => !e.endsWith(`@${index_js_1.config.companyDomain}`));
            const externalBcc = cleanBcc.filter((e) => !e.endsWith(`@${index_js_1.config.companyDomain}`));
            const allExternal = [...externalTo, ...externalCc, ...externalBcc];
            if (allExternal.length > 0) {
                try {
                    const mailOptions = {
                        from: `"${input.senderName} (${index_js_1.config.companyName})" <${index_js_1.config.smtp.user}>`,
                        replyTo: input.senderEmail,
                        to: externalTo.length > 0 ? externalTo : undefined,
                        cc: externalCc.length > 0 ? externalCc : undefined,
                        bcc: externalBcc.length > 0 ? externalBcc : undefined,
                        subject: input.subject || '(No Subject)',
                        html: input.bodyHtml,
                        text: plainText,
                        headers: {
                            'X-Cookscape-Thread-Id': threadId,
                            'X-Cookscape-Sender': input.senderEmail,
                        },
                    };
                    if (input.attachments && input.attachments.length > 0) {
                        mailOptions.attachments = input.attachments.map((att) => ({
                            filename: att.originalName,
                            path: path_1.default.resolve(index_js_1.config.uploadDir, att.filename),
                        }));
                    }
                    const info = await mailer.sendMail(mailOptions);
                    console.log(`[SMTP] External mail successfully sent to [${allExternal.join(', ')}]. Message ID: ${info.messageId}`);
                }
                catch (smtpErr) {
                    console.error('[SMTP] Error delivering external mail:', smtpErr.message);
                }
            }
        }
        return email;
    }
    /**
     * Process and store an incoming email from an external service (Gmail, Yahoo, Outlook, etc.)
     */
    static async receiveInboundEmail(input) {
        const cleanSenderEmail = input.senderEmail.trim().toLowerCase();
        const cleanRecipientEmail = input.recipientEmail.trim().toLowerCase();
        // 1. Resolve internal recipient user
        let recipientUser = null;
        if (input.recipientUserId) {
            recipientUser = await index_js_1.prisma.user.findUnique({ where: { id: input.recipientUserId } });
        }
        else {
            recipientUser = await index_js_1.prisma.user.findUnique({ where: { email: cleanRecipientEmail } });
        }
        // 2. Resolve or create external sender contact/user in DB
        let senderUser = await index_js_1.prisma.user.findUnique({ where: { email: cleanSenderEmail } });
        if (!senderUser) {
            const generatedName = input.senderName || cleanSenderEmail.split('@')[0];
            senderUser = await index_js_1.prisma.user.create({
                data: {
                    email: cleanSenderEmail,
                    name: generatedName,
                    passwordHash: '', // External user
                    role: 'CLIENT',
                    department: 'External Contact',
                    designation: 'Client / External Contact',
                    isActive: true,
                },
            });
        }
        const threadId = input.threadId || `thread_${crypto_1.default.randomUUID()}`;
        const plainText = input.bodyText || input.bodyHtml.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
        // 3. Create the Email record
        const email = await index_js_1.prisma.email.create({
            data: {
                threadId,
                senderId: senderUser.id,
                senderEmail: cleanSenderEmail,
                senderName: senderUser.name,
                subject: input.subject || '(No Subject)',
                bodyHtml: input.bodyHtml || '',
                bodyText: plainText,
                isDraft: false,
                importance: 'NORMAL',
                category: 'GENERAL',
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
        // 4. Create Recipient record in INBOX for the recipient
        await index_js_1.prisma.emailRecipient.create({
            data: {
                emailId: email.id,
                userId: recipientUser ? recipientUser.id : null,
                recipientEmail: cleanRecipientEmail,
                recipientName: recipientUser ? recipientUser.name : cleanRecipientEmail.split('@')[0],
                type: 'TO',
                folder: 'INBOX',
                isRead: false,
            },
        });
        // 5. Log audit and push real-time notification
        if (recipientUser) {
            await (0, auditService_js_1.logAudit)({
                userId: recipientUser.id,
                action: 'INBOUND_EMAIL_RECEIVED',
                details: {
                    emailId: email.id,
                    from: cleanSenderEmail,
                    subject: email.subject,
                },
            });
            (0, socketService_js_1.emitNewEmailNotification)(recipientUser.id, {
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
        return email;
    }
}
exports.MailEngine = MailEngine;
