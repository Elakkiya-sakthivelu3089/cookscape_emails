import { prisma } from '../config/index.js';

export interface LogParams {
  userId?: string;
  action: string;
  ipAddress?: string;
  userAgent?: string;
  details?: Record<string, any>;
}

export const logAudit = async (params: LogParams): Promise<void> => {
  try {
    await prisma.auditLog.create({
      data: {
        userId: params.userId,
        action: params.action,
        ipAddress: params.ipAddress || '127.0.0.1',
        userAgent: params.userAgent || 'Cookscape-Client',
        details: params.details ? JSON.stringify(params.details) : undefined,
      },
    });
  } catch (error) {
    console.error('Failed to write audit log:', error);
  }
};
