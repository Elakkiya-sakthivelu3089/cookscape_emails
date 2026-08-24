import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma, config } from '../config/index.js';
import { AuthRequest } from '../middleware/auth.js';
import { logAudit } from '../services/auditService.js';
import { getOnlineUserIds } from '../services/socketService.js';

export class AuthController {
  static async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        res.status(400).json({ error: 'Email and password are required.' });
        return;
      }

      const cleanEmail = email.trim().toLowerCase();
      const user = await prisma.user.findUnique({
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

      const isMatch = await bcrypt.compare(password, user.passwordHash);
      if (!isMatch) {
        res.status(401).json({ error: 'Invalid email address or password.' });
        return;
      }

      const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role, name: user.name, department: user.department },
        config.jwtSecret,
        { expiresIn: '7d' }
      );

      await logAudit({
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
    } catch (error: any) {
      console.error('Login error:', error);
      res.status(500).json({ error: 'Internal server error during login.' });
    }
  }

  static async me(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const user = await prisma.user.findUnique({
        where: { id: req.user.id },
      });

      if (!user) {
        res.status(404).json({ error: 'User not found.' });
        return;
      }

      // Calculate unread counts
      const unreadEmailsCount = await prisma.emailRecipient.count({
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
        onlineUserIds: getOnlineUserIds(),
      });
    } catch (error: any) {
      console.error('Get profile error:', error);
      res.status(500).json({ error: 'Failed to fetch current user profile.' });
    }
  }

  static async changePassword(req: AuthRequest, res: Response): Promise<void> {
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

      const user = await prisma.user.findUnique({
        where: { id: req.user.id },
      });

      if (!user) {
        res.status(404).json({ error: 'User not found' });
        return;
      }

      // If not forced reset, require current password verification
      if (!user.forcePasswordReset && currentPassword) {
        const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
        if (!isMatch) {
          res.status(400).json({ error: 'Current password does not match.' });
          return;
        }
      }

      const passwordHash = await bcrypt.hash(newPassword, 10);
      await prisma.user.update({
        where: { id: user.id },
        data: {
          passwordHash,
          forcePasswordReset: false,
        },
      });

      await logAudit({
        userId: user.id,
        action: 'PASSWORD_CHANGED',
        ipAddress: req.ip,
      });

      res.json({ message: 'Password updated successfully.' });
    } catch (error: any) {
      console.error('Change password error:', error);
      res.status(500).json({ error: 'Failed to update password.' });
    }
  }

  static async updateProfile(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const { name, phone, signatureHtml, designation } = req.body;
      const updated = await prisma.user.update({
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
    } catch (error: any) {
      console.error('Update profile error:', error);
      res.status(500).json({ error: 'Failed to update profile.' });
    }
  }
}
