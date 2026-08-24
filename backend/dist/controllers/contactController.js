"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContactController = void 0;
const index_js_1 = require("../config/index.js");
class ContactController {
    static async searchContacts(req, res) {
        try {
            const { q } = req.query;
            const queryStr = q ? String(q).trim() : '';
            const users = await index_js_1.prisma.user.findMany({
                where: {
                    isActive: true,
                    OR: queryStr ? [
                        { name: { contains: queryStr } },
                        { email: { contains: queryStr } },
                        { department: { contains: queryStr } },
                    ] : undefined,
                },
                select: {
                    id: true,
                    name: true,
                    email: true,
                    department: true,
                    designation: true,
                    avatar: true,
                    role: true,
                    phone: true,
                },
                orderBy: { name: 'asc' },
                take: 50,
            });
            res.json({ contacts: users });
        }
        catch (error) {
            console.error('Search contacts error:', error);
            res.status(500).json({ error: 'Failed to search directory.' });
        }
    }
}
exports.ContactController = ContactController;
