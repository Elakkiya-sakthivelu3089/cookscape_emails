"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MailController = void 0;
const index_js_1 = require("../config/index.js");
const mailEngine_js_1 = require("../services/mailEngine.js");
class MailController {
    // 1. Get emails for current user in specified folder/view
    static async getEmails(req, res) {
        try {
            if (!req.user) {
                res.status(401).json({ error: 'Unauthorized' });
                return;
            }
            const { folder = 'INBOX', search, category, page = '1', limit = '50', } = req.query;
            const pageNum = Math.max(1, parseInt(String(page), 10));
            const limitNum = Math.min(100, Math.max(1, parseInt(String(limit), 10)));
            const userId = req.user.id;
            const userEmail = req.user.email.toLowerCase();
            const whereRecipient = {
                OR: [
                    { userId },
                    { recipientEmail: userEmail },
                ],
            };
            // Folder filtering
            if (folder === 'STARRED') {
                whereRecipient.isStarred = true;
                whereRecipient.isTrash = false;
                whereRecipient.isSpam = false;
            }
            else if (folder === 'TRASH') {
                whereRecipient.isTrash = true;
            }
            else if (folder === 'SPAM') {
                whereRecipient.isSpam = true;
            }
            else if (folder === 'ARCHIVE') {
                whereRecipient.isArchived = true;
                whereRecipient.isTrash = false;
            }
            else if (folder === 'SENT') {
                whereRecipient.folder = 'SENT';
                whereRecipient.isTrash = false;
            }
            else if (folder === 'DRAFTS') {
                whereRecipient.folder = 'DRAFTS';
                whereRecipient.isTrash = false;
            }
            else {
                // Default INBOX
                whereRecipient.folder = 'INBOX';
                whereRecipient.isTrash = false;
                whereRecipient.isSpam = false;
                whereRecipient.isArchived = false;
            }
            // Search & category filter on the related Email
            const emailFilter = {};
            if (category && category !== 'ALL') {
                emailFilter.category = String(category);
            }
            if (search) {
                const queryStr = String(search).trim();
                emailFilter.OR = [
                    { subject: { contains: queryStr } },
                    { bodyText: { contains: queryStr } },
                    { senderName: { contains: queryStr } },
                    { senderEmail: { contains: queryStr } },
                ];
            }
            if (Object.keys(emailFilter).length > 0) {
                whereRecipient.email = emailFilter;
            }
            const [items, total] = await Promise.all([
                index_js_1.prisma.emailRecipient.findMany({
                    where: whereRecipient,
                    orderBy: { createdAt: 'desc' },
                    skip: (pageNum - 1) * limitNum,
                    take: limitNum,
                    include: {
                        email: {
                            include: {
                                attachments: true,
                                recipients: {
                                    select: {
                                        recipientEmail: true,
                                        recipientName: true,
                                        type: true,
                                    },
                                },
                            },
                        },
                    },
                }),
                index_js_1.prisma.emailRecipient.count({ where: whereRecipient }),
            ]);
            const formatted = items.map((item) => ({
                recipientRecordId: item.id,
                folder: item.folder,
                isRead: item.isRead,
                isStarred: item.isStarred,
                isArchived: item.isArchived,
                isTrash: item.isTrash,
                isSpam: item.isSpam,
                labels: JSON.parse(item.labels || '[]'),
                emailId: item.email.id,
                threadId: item.email.threadId,
                subject: item.email.subject,
                snippet: item.email.bodyText.substring(0, 140),
                senderId: item.email.senderId,
                senderName: item.email.senderName,
                senderEmail: item.email.senderEmail,
                importance: item.email.importance,
                category: item.email.category,
                isDraft: item.email.isDraft,
                hasAttachments: item.email.attachments.length > 0,
                attachmentsCount: item.email.attachments.length,
                attachments: item.email.attachments,
                recipients: item.email.recipients,
                createdAt: item.email.createdAt,
            }));
            res.json({
                emails: formatted,
                total,
                page: pageNum,
                totalPages: Math.ceil(total / limitNum),
            });
        }
        catch (error) {
            console.error('Get emails error:', error);
            res.status(500).json({ error: 'Failed to retrieve emails.' });
        }
    }
    // 2. Get full thread and email details
    static async getEmailDetail(req, res) {
        try {
            if (!req.user) {
                res.status(401).json({ error: 'Unauthorized' });
                return;
            }
            const emailId = String(req.params.emailId);
            const targetEmail = await index_js_1.prisma.email.findUnique({
                where: { id: emailId },
                include: {
                    attachments: true,
                    recipients: true,
                },
            });
            if (!targetEmail) {
                res.status(404).json({ error: 'Email not found.' });
                return;
            }
            // Mark as read for this user
            await index_js_1.prisma.emailRecipient.updateMany({
                where: {
                    emailId: targetEmail.id,
                    userId: req.user.id,
                    isRead: false,
                },
                data: { isRead: true },
            });
            // Get entire thread history if there are multiple emails in the thread
            const threadEmails = await index_js_1.prisma.email.findMany({
                where: { threadId: targetEmail.threadId },
                orderBy: { createdAt: 'asc' },
                include: {
                    attachments: true,
                    recipients: true,
                },
            });
            res.json({
                email: targetEmail,
                thread: threadEmails,
            });
        }
        catch (error) {
            console.error('Get email detail error:', error);
            res.status(500).json({ error: 'Failed to retrieve email details.' });
        }
    }
    // 3. Compose and Send Email / Save Draft
    static async sendEmail(req, res) {
        try {
            if (!req.user) {
                res.status(401).json({ error: 'Unauthorized' });
                return;
            }
            const { to, cc, bcc, subject, bodyHtml, bodyText, isDraft, threadId, importance, category, attachments, } = req.body;
            if ((!to || to.length === 0) && !isDraft) {
                res.status(400).json({ error: 'Please specify at least one recipient.' });
                return;
            }
            const sentEmail = await mailEngine_js_1.MailEngine.sendEmail({
                senderId: req.user.id,
                senderEmail: req.user.email,
                senderName: req.user.name,
                to: to || [],
                cc: cc || [],
                bcc: bcc || [],
                subject: subject || (isDraft ? '(Draft No Subject)' : '(No Subject)'),
                bodyHtml: bodyHtml || '',
                bodyText: bodyText || '',
                isDraft: !!isDraft,
                threadId,
                importance,
                category,
                attachments,
            });
            res.status(201).json({
                message: isDraft ? 'Draft saved successfully' : 'Email sent successfully',
                email: sentEmail,
            });
        }
        catch (error) {
            console.error('Send email error:', error);
            res.status(500).json({ error: error.message || 'Failed to send email.' });
        }
    }
    // 4. Update status: Star, Unstar, Mark Read, Move to Trash / Spam / Archive
    static async updateStatus(req, res) {
        try {
            if (!req.user) {
                res.status(401).json({ error: 'Unauthorized' });
                return;
            }
            const emailId = String(req.params.emailId);
            const { isStarred, isRead, isTrash, isSpam, isArchived, folder } = req.body;
            const dataToUpdate = {};
            if (typeof isStarred === 'boolean')
                dataToUpdate.isStarred = isStarred;
            if (typeof isRead === 'boolean')
                dataToUpdate.isRead = isRead;
            if (typeof isTrash === 'boolean')
                dataToUpdate.isTrash = isTrash;
            if (typeof isSpam === 'boolean')
                dataToUpdate.isSpam = isSpam;
            if (typeof isArchived === 'boolean')
                dataToUpdate.isArchived = isArchived;
            if (folder)
                dataToUpdate.folder = folder;
            await index_js_1.prisma.emailRecipient.updateMany({
                where: {
                    emailId,
                    userId: req.user.id,
                },
                data: dataToUpdate,
            });
            res.json({ message: 'Email status updated successfully' });
        }
        catch (error) {
            console.error('Update status error:', error);
            res.status(500).json({ error: 'Failed to update email status.' });
        }
    }
    // 5. Delete Permanently
    static async deletePermanently(req, res) {
        try {
            if (!req.user) {
                res.status(401).json({ error: 'Unauthorized' });
                return;
            }
            const emailId = String(req.params.emailId);
            await index_js_1.prisma.emailRecipient.deleteMany({
                where: {
                    emailId,
                    userId: req.user.id,
                },
            });
            res.json({ message: 'Email removed permanently.' });
        }
        catch (error) {
            console.error('Delete email error:', error);
            res.status(500).json({ error: 'Failed to delete email.' });
        }
    }
    // 6. Get counts for folders (Inbox unread, Starred, Drafts, Sent, Trash)
    static async getMailFolderCounts(req, res) {
        try {
            if (!req.user) {
                res.status(401).json({ error: 'Unauthorized' });
                return;
            }
            const userId = req.user.id;
            const userEmail = req.user.email.toLowerCase();
            const [inboxUnread, starredCount, sentCount, draftsCount, trashCount, spamCount] = await Promise.all([
                index_js_1.prisma.emailRecipient.count({
                    where: {
                        OR: [{ userId }, { recipientEmail: userEmail }],
                        folder: 'INBOX',
                        isRead: false,
                        isTrash: false,
                        isSpam: false,
                        isArchived: false,
                    },
                }),
                index_js_1.prisma.emailRecipient.count({
                    where: {
                        OR: [{ userId }, { recipientEmail: userEmail }],
                        isStarred: true,
                        isTrash: false,
                        isSpam: false,
                    },
                }),
                index_js_1.prisma.emailRecipient.count({
                    where: {
                        OR: [{ userId }, { recipientEmail: userEmail }],
                        folder: 'SENT',
                        isTrash: false,
                    },
                }),
                index_js_1.prisma.emailRecipient.count({
                    where: {
                        OR: [{ userId }, { recipientEmail: userEmail }],
                        folder: 'DRAFTS',
                        isTrash: false,
                    },
                }),
                index_js_1.prisma.emailRecipient.count({
                    where: {
                        OR: [{ userId }, { recipientEmail: userEmail }],
                        isTrash: true,
                    },
                }),
                index_js_1.prisma.emailRecipient.count({
                    where: {
                        OR: [{ userId }, { recipientEmail: userEmail }],
                        isSpam: true,
                    },
                }),
            ]);
            res.json({
                inboxUnread,
                starredCount,
                sentCount,
                draftsCount,
                trashCount,
                spamCount,
            });
        }
        catch (error) {
            console.error('Mail counts error:', error);
            res.status(500).json({ error: 'Failed to retrieve folder counts.' });
        }
    }
    // 7. Upload file attachments (PDFs, 3D models, Floor plans, images)
    static async uploadAttachment(req, res) {
        try {
            if (!req.file) {
                res.status(400).json({ error: 'No file was uploaded.' });
                return;
            }
            const file = req.file;
            const fileUrl = `/uploads/${file.filename}`;
            res.json({
                filename: file.filename,
                originalName: file.originalname,
                mimeType: file.mimetype,
                size: file.size,
                url: fileUrl,
            });
        }
        catch (error) {
            console.error('Upload error:', error);
            res.status(500).json({ error: 'Failed to upload attachment.' });
        }
    }
}
exports.MailController = MailController;
