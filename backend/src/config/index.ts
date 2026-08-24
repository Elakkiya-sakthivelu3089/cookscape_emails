import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

dotenv.config();

export const prisma = new PrismaClient();

export const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  jwtSecret: process.env.JWT_SECRET || 'cookscape_default_super_secret_2026',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  companyDomain: process.env.COMPANY_DOMAIN || 'cookscape.com',
  companyName: process.env.COMPANY_NAME || 'Cookscape Interior Designs',
  uploadDir: path.resolve(process.cwd(), process.env.UPLOAD_DIR || './uploads'),
  maxStoragePerUser: BigInt(5 * 1024 * 1024 * 1024), // 5 GB
};

// Ensure upload directory exists
if (!fs.existsSync(config.uploadDir)) {
  fs.mkdirSync(config.uploadDir, { recursive: true });
}
