import { Response } from 'express';
import { prisma } from '../config/index.js';
import { AuthRequest } from '../middleware/auth.js';

export class ContactController {
  static async searchContacts(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { q } = req.query;
      const queryStr = q ? String(q).trim() : '';

      const users = await prisma.user.findMany({
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
    } catch (error: any) {
      console.error('Search contacts error:', error);
      res.status(500).json({ error: 'Failed to search directory.' });
    }
  }
}
