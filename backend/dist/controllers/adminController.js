"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminController = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const crypto_1 = __importDefault(require("crypto"));
const index_js_1 = require("../config/index.js");
const auditService_js_1 = require("../services/auditService.js");
class AdminController {
    // 1. Get high-level company stats
    static async getDashboardStats(req, res) {
        try {
            const [totalUsers, activeUsers, totalEmails, totalChannels, totalClientRooms, auditLogsCount,] = await Promise.all([
                index_js_1.prisma.user.count(),
                index_js_1.prisma.user.count({ where: { isActive: true } }),
                index_js_1.prisma.email.count(),
                index_js_1.prisma.chatRoom.count({ where: { type: 'CHANNEL' } }),
                index_js_1.prisma.chatRoom.count({ where: { type: 'CLIENT_PROJECT' } }),
                index_js_1.prisma.auditLog.count(),
            ]);
            // Storage breakdown
            const usersStorage = await index_js_1.prisma.user.aggregate({
                _sum: {
                    usedStorageBytes: true,
                },
            });
            // Department distribution
            const usersByDept = await index_js_1.prisma.user.groupBy({
                by: ['department'],
                _count: {
                    _all: true,
                },
            });
            res.json({
                totalUsers,
                activeUsers,
                totalEmails,
                totalChannels,
                totalClientRooms,
                auditLogsCount,
                totalStorageUsedBytes: (usersStorage._sum.usedStorageBytes || 0n).toString(),
                departmentDistribution: usersByDept.map((d) => ({
                    department: d.department,
                    count: d._count._all,
                })),
                companyDomain: index_js_1.config.companyDomain,
            });
        }
        catch (error) {
            console.error('Admin stats error:', error);
            res.status(500).json({ error: 'Failed to retrieve dashboard statistics.' });
        }
    }
    // 2. List all employees & users
    static async listEmployees(req, res) {
        try {
            const { search, department, role, status } = req.query;
            const whereClause = {};
            if (search) {
                const queryStr = String(search).trim();
                whereClause.OR = [
                    { name: { contains: queryStr } },
                    { email: { contains: queryStr } },
                    { designation: { contains: queryStr } },
                ];
            }
            if (department && department !== 'ALL') {
                whereClause.department = String(department);
            }
            if (role && role !== 'ALL') {
                whereClause.role = String(role);
            }
            if (status) {
                whereClause.isActive = status === 'active';
            }
            const users = await index_js_1.prisma.user.findMany({
                where: whereClause,
                orderBy: { createdAt: 'desc' },
                select: {
                    id: true,
                    email: true,
                    name: true,
                    role: true,
                    department: true,
                    designation: true,
                    phone: true,
                    quotaBytes: true,
                    usedStorageBytes: true,
                    isActive: true,
                    forcePasswordReset: true,
                    createdAt: true,
                    updatedAt: true,
                    _count: {
                        select: {
                            sentEmails: true,
                            receivedEmails: true,
                        },
                    },
                },
            });
            const formattedUsers = users.map((u) => ({
                ...u,
                quotaBytes: u.quotaBytes.toString(),
                usedStorageBytes: u.usedStorageBytes.toString(),
            }));
            res.json({ users: formattedUsers });
        }
        catch (error) {
            console.error('List employees error:', error);
            res.status(500).json({ error: 'Failed to fetch employee list.' });
        }
    }
    // 3. Create a new employee email account
    static async createEmployee(req, res) {
        try {
            const { username, domain = index_js_1.config.companyDomain, name, password, role = 'EMPLOYEE', department = 'Design', designation = 'Interior Designer', phone, quotaGb = 5, } = req.body;
            if (!username || !name) {
                res.status(400).json({ error: 'Username (prefix) and Full Name are required.' });
                return;
            }
            // Format email e.g. priya.designer@cookscape.com
            const cleanPrefix = username.trim().toLowerCase().replace(/[^a-z0-9._-]/g, '');
            const fullEmail = `${cleanPrefix}@${domain.trim().toLowerCase()}`;
            // Check if email exists
            const existing = await index_js_1.prisma.user.findUnique({
                where: { email: fullEmail },
            });
            if (existing) {
                res.status(409).json({ error: `The email address ${fullEmail} is already registered.` });
                return;
            }
            // Generate or use custom password
            const initialPassword = password && password.trim() ? password.trim() : `Cookscape#${crypto_1.default.randomInt(1000, 9999)}`;
            const passwordHash = await bcryptjs_1.default.hash(initialPassword, 10);
            const quotaBytes = BigInt(quotaGb) * 1024n * 1024n * 1024n;
            const newUser = await index_js_1.prisma.user.create({
                data: {
                    email: fullEmail,
                    name: name.trim(),
                    passwordHash,
                    role,
                    department: department.trim(),
                    designation: designation.trim(),
                    phone: phone ? phone.trim() : null,
                    quotaBytes,
                    forcePasswordReset: true, // Prompt them to change on first login
                },
            });
            // Automatically add new employee to general company chat channel if exists
            const generalChannel = await index_js_1.prisma.chatRoom.findFirst({
                where: { name: 'general', type: 'CHANNEL' },
            });
            if (generalChannel) {
                await index_js_1.prisma.chatMember.create({
                    data: {
                        roomId: generalChannel.id,
                        userId: newUser.id,
                        role: 'MEMBER',
                    },
                });
            }
            // Log action
            await (0, auditService_js_1.logAudit)({
                userId: req.user?.id,
                action: 'EMPLOYEE_CREATED',
                ipAddress: req.ip,
                details: {
                    createdUserId: newUser.id,
                    createdEmail: fullEmail,
                    department,
                    role,
                },
            });
            res.status(201).json({
                message: `Employee account ${fullEmail} created successfully!`,
                employee: {
                    id: newUser.id,
                    email: newUser.email,
                    name: newUser.name,
                    role: newUser.role,
                    department: newUser.department,
                    designation: newUser.designation,
                    phone: newUser.phone,
                    quotaBytes: newUser.quotaBytes.toString(),
                    temporaryPassword: initialPassword,
                    forcePasswordReset: true,
                    createdAt: newUser.createdAt,
                },
            });
        }
        catch (error) {
            console.error('Create employee error:', error);
            res.status(500).json({ error: 'Failed to create employee account.' });
        }
    }
    // 4. Reset employee password by Admin
    static async resetEmployeePassword(req, res) {
        try {
            const id = String(req.params.id);
            const { newPassword } = req.body;
            const targetUser = await index_js_1.prisma.user.findUnique({
                where: { id },
            });
            if (!targetUser) {
                res.status(404).json({ error: 'Employee not found.' });
                return;
            }
            const generatedPassword = newPassword && newPassword.trim() ? newPassword.trim() : `Cookscape#${crypto_1.default.randomInt(1000, 9999)}`;
            const passwordHash = await bcryptjs_1.default.hash(generatedPassword, 10);
            await index_js_1.prisma.user.update({
                where: { id },
                data: {
                    passwordHash,
                    forcePasswordReset: true,
                },
            });
            await (0, auditService_js_1.logAudit)({
                userId: req.user?.id,
                action: 'ADMIN_PASSWORD_RESET',
                ipAddress: req.ip,
                userAgent: req.headers['user-agent'] ? String(req.headers['user-agent']) : undefined,
                details: {
                    targetUserId: id,
                    targetEmail: targetUser.email,
                },
            });
            res.json({
                message: `Password reset successfully for ${targetUser.email}`,
                temporaryPassword: generatedPassword,
            });
        }
        catch (error) {
            console.error('Reset password error:', error);
            res.status(500).json({ error: 'Failed to reset employee password.' });
        }
    }
    // 5. Update employee status or storage quota
    static async updateEmployee(req, res) {
        try {
            const id = String(req.params.id);
            const { name, department, designation, role, isActive, quotaGb, phone } = req.body;
            const dataToUpdate = {};
            if (name)
                dataToUpdate.name = name.trim();
            if (department)
                dataToUpdate.department = department.trim();
            if (designation)
                dataToUpdate.designation = designation.trim();
            if (role)
                dataToUpdate.role = role;
            if (typeof isActive === 'boolean')
                dataToUpdate.isActive = isActive;
            if (phone !== undefined)
                dataToUpdate.phone = phone ? phone.trim() : null;
            if (quotaGb)
                dataToUpdate.quotaBytes = BigInt(quotaGb) * 1024n * 1024n * 1024n;
            const updated = await index_js_1.prisma.user.update({
                where: { id },
                data: dataToUpdate,
            });
            await (0, auditService_js_1.logAudit)({
                userId: req.user?.id,
                action: 'EMPLOYEE_UPDATED',
                ipAddress: req.ip,
                userAgent: req.headers['user-agent'] ? String(req.headers['user-agent']) : undefined,
                details: { targetUserId: id, updates: req.body },
            });
            res.json({
                message: 'Employee details updated.',
                user: {
                    ...updated,
                    quotaBytes: updated.quotaBytes.toString(),
                    usedStorageBytes: updated.usedStorageBytes.toString(),
                },
            });
        }
        catch (error) {
            console.error('Update employee error:', error);
            res.status(500).json({ error: 'Failed to update employee details.' });
        }
    }
    // 6. View system audit logs
    static async getAuditLogs(req, res) {
        try {
            const { page = '1', limit = '30', action } = req.query;
            const pageNum = parseInt(String(page), 10);
            const limitNum = parseInt(String(limit), 10);
            const whereClause = {};
            if (action) {
                whereClause.action = String(action);
            }
            const [logs, total] = await Promise.all([
                index_js_1.prisma.auditLog.findMany({
                    where: whereClause,
                    orderBy: { createdAt: 'desc' },
                    skip: (pageNum - 1) * limitNum,
                    take: limitNum,
                    include: {
                        user: {
                            select: {
                                id: true,
                                name: true,
                                email: true,
                                role: true,
                            },
                        },
                    },
                }),
                index_js_1.prisma.auditLog.count({ where: whereClause }),
            ]);
            res.json({
                logs,
                total,
                page: pageNum,
                totalPages: Math.ceil(total / limitNum),
            });
        }
        catch (error) {
            console.error('Audit logs error:', error);
            res.status(500).json({ error: 'Failed to retrieve audit logs.' });
        }
    }
}
exports.AdminController = AdminController;
