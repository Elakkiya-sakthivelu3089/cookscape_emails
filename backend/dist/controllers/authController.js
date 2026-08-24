"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const index_js_1 = require("../config/index.js");
const auditService_js_1 = require("../services/auditService.js");
const socketService_js_1 = require("../services/socketService.js");
class AuthController {
    static async login(req, res) {
        try {
            const { email, password } = req.body;
            if (!email || !password) {
                res.status(400).json({ error: 'Email and password are required.' });
                return;
            }
            const cleanEmail = email.trim().toLowerCase();
            const user = await index_js_1.prisma.user.findUnique({
                where: { email: cleanEmail },
            });
            if (!user) {
                res.status(401).json({ error: 'Invalid email address or password.' });
                return;
            }
            if (!user.isActive) {
                res.status(403).json({ error: 'This Cookscape employee account has been deactivated. Please contact Administrator.' });
                return;
            }
            const isMatch = await bcryptjs_1.default.compare(password, user.passwordHash);
            if (!isMatch) {
                res.status(401).json({ error: 'Invalid email address or password.' });
                return;
            }
            const token = jsonwebtoken_1.default.sign({ id: user.id, email: user.email, role: user.role, name: user.name, department: user.department }, index_js_1.config.jwtSecret, { expiresIn: '7d' });
            await (0, auditService_js_1.logAudit)({
                userId: user.id,
                action: 'LOGIN_SUCCESS',
                ipAddress: req.ip,
                userAgent: req.headers['user-agent'],
            });
            res.json({
                message: 'Login successful',
                token,
                user: {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    role: user.role,
                    department: user.department,
                    designation: user.designation,
                    avatar: user.avatar,
                    phone: user.phone,
                    quotaBytes: user.quotaBytes.toString(),
                    usedStorageBytes: user.usedStorageBytes.toString(),
                    forcePasswordReset: user.forcePasswordReset,
                    signatureHtml: user.signatureHtml,
                },
            });
        }
        catch (error) {
            console.error('Login error:', error);
            res.status(500).json({ error: 'Internal server error during login.' });
        }
    }
    static async me(req, res) {
        try {
            if (!req.user) {
                res.status(401).json({ error: 'Unauthorized' });
                return;
            }
            const user = await index_js_1.prisma.user.findUnique({
                where: { id: req.user.id },
            });
            if (!user) {
                res.status(404).json({ error: 'User not found.' });
                return;
            }
            // Calculate unread counts
            const unreadEmailsCount = await index_js_1.prisma.emailRecipient.count({
                where: {
                    userId: user.id,
                    folder: 'INBOX',
                    isRead: false,
                },
            });
            res.json({
                user: {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    role: user.role,
                    department: user.department,
                    designation: user.designation,
                    avatar: user.avatar,
                    phone: user.phone,
                    quotaBytes: user.quotaBytes.toString(),
                    usedStorageBytes: user.usedStorageBytes.toString(),
                    forcePasswordReset: user.forcePasswordReset,
                    signatureHtml: user.signatureHtml,
                    unreadEmailsCount,
                },
                onlineUserIds: (0, socketService_js_1.getOnlineUserIds)(),
            });
        }
        catch (error) {
            console.error('Get profile error:', error);
            res.status(500).json({ error: 'Failed to fetch current user profile.' });
        }
    }
    static async changePassword(req, res) {
        try {
            if (!req.user) {
                res.status(401).json({ error: 'Unauthorized' });
                return;
            }
            const { currentPassword, newPassword } = req.body;
            if (!newPassword || newPassword.length < 6) {
                res.status(400).json({ error: 'New password must be at least 6 characters long.' });
                return;
            }
            const user = await index_js_1.prisma.user.findUnique({
                where: { id: req.user.id },
            });
            if (!user) {
                res.status(404).json({ error: 'User not found' });
                return;
            }
            // If not forced reset, require current password verification
            if (!user.forcePasswordReset && currentPassword) {
                const isMatch = await bcryptjs_1.default.compare(currentPassword, user.passwordHash);
                if (!isMatch) {
                    res.status(400).json({ error: 'Current password does not match.' });
                    return;
                }
            }
            const passwordHash = await bcryptjs_1.default.hash(newPassword, 10);
            await index_js_1.prisma.user.update({
                where: { id: user.id },
                data: {
                    passwordHash,
                    forcePasswordReset: false,
                },
            });
            await (0, auditService_js_1.logAudit)({
                userId: user.id,
                action: 'PASSWORD_CHANGED',
                ipAddress: req.ip,
            });
            res.json({ message: 'Password updated successfully.' });
        }
        catch (error) {
            console.error('Change password error:', error);
            res.status(500).json({ error: 'Failed to update password.' });
        }
    }
    static async updateProfile(req, res) {
        try {
            if (!req.user) {
                res.status(401).json({ error: 'Unauthorized' });
                return;
            }
            const { name, phone, signatureHtml, designation } = req.body;
            const updated = await index_js_1.prisma.user.update({
                where: { id: req.user.id },
                data: {
                    name: name ? name.trim() : undefined,
                    phone: phone ? phone.trim() : undefined,
                    signatureHtml: signatureHtml !== undefined ? signatureHtml : undefined,
                    designation: designation ? designation.trim() : undefined,
                },
            });
            res.json({
                message: 'Profile updated successfully',
                user: {
                    id: updated.id,
                    email: updated.email,
                    name: updated.name,
                    role: updated.role,
                    department: updated.department,
                    designation: updated.designation,
                    phone: updated.phone,
                    signatureHtml: updated.signatureHtml,
                },
            });
        }
        catch (error) {
            console.error('Update profile error:', error);
            res.status(500).json({ error: 'Failed to update profile.' });
        }
    }
}
exports.AuthController = AuthController;
