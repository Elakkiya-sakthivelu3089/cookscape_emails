"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireEmployee = exports.requireAdmin = exports.authenticate = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const index_js_1 = require("../config/index.js");
const authenticate = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            res.status(401).json({ error: 'Authentication required. No token provided.' });
            return;
        }
        const token = authHeader.split(' ')[1];
        const decoded = jsonwebtoken_1.default.verify(token, index_js_1.config.jwtSecret);
        const user = await index_js_1.prisma.user.findUnique({
            where: { id: decoded.id },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                department: true,
                isActive: true,
            },
        });
        if (!user || !user.isActive) {
            res.status(401).json({ error: 'User account is inactive or not found.' });
            return;
        }
        req.user = user;
        next();
    }
    catch (error) {
        res.status(401).json({ error: 'Invalid or expired session token.' });
    }
};
exports.authenticate = authenticate;
const requireAdmin = (req, res, next) => {
    if (!req.user || (req.user.role !== 'SUPER_ADMIN' && req.user.role !== 'ADMIN')) {
        res.status(403).json({ error: 'Forbidden. Admin privileges required.' });
        return;
    }
    next();
};
exports.requireAdmin = requireAdmin;
const requireEmployee = (req, res, next) => {
    if (!req.user || req.user.role === 'CLIENT') {
        res.status(403).json({ error: 'Forbidden. Employee access required.' });
        return;
    }
    next();
};
exports.requireEmployee = requireEmployee;
