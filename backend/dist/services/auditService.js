"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logAudit = void 0;
const index_js_1 = require("../config/index.js");
const logAudit = async (params) => {
    try {
        await index_js_1.prisma.auditLog.create({
            data: {
                userId: params.userId,
                action: params.action,
                ipAddress: params.ipAddress || '127.0.0.1',
                userAgent: params.userAgent || 'Cookscape-Client',
                details: params.details ? JSON.stringify(params.details) : undefined,
            },
        });
    }
    catch (error) {
        console.error('Failed to write audit log:', error);
    }
};
exports.logAudit = logAudit;
