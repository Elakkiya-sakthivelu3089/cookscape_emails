"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = exports.prisma = void 0;
const client_1 = require("@prisma/client");
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
dotenv_1.default.config();
exports.prisma = new client_1.PrismaClient();
exports.config = {
    port: parseInt(process.env.PORT || '5000', 10),
    jwtSecret: process.env.JWT_SECRET || 'cookscape_default_super_secret_2026',
    clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
    companyDomain: process.env.COMPANY_DOMAIN || 'cookscape.com',
    companyName: process.env.COMPANY_NAME || 'Cookscape Interior Designs',
    uploadDir: path_1.default.resolve(process.cwd(), process.env.UPLOAD_DIR || './uploads'),
    maxStoragePerUser: BigInt(5 * 1024 * 1024 * 1024), // 5 GB
};
// Ensure upload directory exists
if (!fs_1.default.existsSync(exports.config.uploadDir)) {
    fs_1.default.mkdirSync(exports.config.uploadDir, { recursive: true });
}
