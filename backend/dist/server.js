"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const http_1 = __importDefault(require("http"));
const socket_io_1 = require("socket.io");
const cors_1 = __importDefault(require("cors"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const index_js_1 = require("./config/index.js");
const socketService_js_1 = require("./services/socketService.js");
const seedService_js_1 = require("./services/seedService.js");
const authRoutes_js_1 = __importDefault(require("./routes/authRoutes.js"));
const adminRoutes_js_1 = __importDefault(require("./routes/adminRoutes.js"));
const mailRoutes_js_1 = __importDefault(require("./routes/mailRoutes.js"));
const chatRoutes_js_1 = __importDefault(require("./routes/chatRoutes.js"));
const templateRoutes_js_1 = __importDefault(require("./routes/templateRoutes.js"));
const contactRoutes_js_1 = __importDefault(require("./routes/contactRoutes.js"));
const app = (0, express_1.default)();
const server = http_1.default.createServer(app);
// Initialize Socket.IO
const io = new socket_io_1.Server(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST'],
        credentials: true,
    },
});
(0, socketService_js_1.initSocketService)(io);
// Middleware
app.use((0, cors_1.default)({ origin: '*' }));
app.use(express_1.default.json({ limit: '50mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '50mb' }));
// Serve static uploaded files (renders, floor plans, attachments)
app.use('/uploads', express_1.default.static(index_js_1.config.uploadDir));
// API Routes
app.use('/api/auth', authRoutes_js_1.default);
app.use('/api/admin', adminRoutes_js_1.default);
app.use('/api/mail', mailRoutes_js_1.default);
app.use('/api/chat', chatRoutes_js_1.default);
app.use('/api/templates', templateRoutes_js_1.default);
app.use('/api/contacts', contactRoutes_js_1.default);
// Health check
app.get('/api/health', (_req, res) => {
    res.json({
        status: 'online',
        service: 'Cookscape In-House Mail & Chat Platform',
        domain: index_js_1.config.companyDomain,
        timestamp: new Date().toISOString(),
    });
});
// Database status diagnostic
app.get('/api/db-status', async (_req, res) => {
    try {
        const userCount = await index_js_1.prisma.user.count();
        res.json({
            status: 'connected',
            userCount,
            database: 'PostgreSQL online and tables verified',
        });
    }
    catch (err) {
        res.status(500).json({
            status: 'database_error',
            message: err.message,
            code: err.code,
            meta: err.meta,
            hint: 'Visit /api/db-init to auto-push schema and seed demo accounts',
        });
    }
});
// Dynamic Schema Path Resolver
function getSchemaPath() {
    let schemaPath = path_1.default.resolve(process.cwd(), 'backend/prisma/schema.prisma');
    if (!fs_1.default.existsSync(schemaPath)) {
        schemaPath = path_1.default.resolve(process.cwd(), 'prisma/schema.prisma');
    }
    return schemaPath;
}
// Safe Prisma DB Push runner using local or pinned Prisma 6
async function runPrismaDbPush(inheritStdio = false) {
    const { execSync } = await import('child_process');
    const schemaPath = getSchemaPath();
    const possiblePaths = [
        path_1.default.resolve(process.cwd(), 'backend/node_modules/.bin/prisma'),
        path_1.default.resolve(process.cwd(), 'node_modules/.bin/prisma'),
        path_1.default.resolve(process.cwd(), '../node_modules/.bin/prisma'),
    ];
    let command = `npx --yes prisma@6.4.1 db push --schema="${schemaPath}" --accept-data-loss`;
    for (const p of possiblePaths) {
        if (fs_1.default.existsSync(p)) {
            command = `"${p}" db push --schema="${schemaPath}" --accept-data-loss`;
            break;
        }
    }
    const options = { env: { ...process.env } };
    if (inheritStdio) {
        options.stdio = 'inherit';
    }
    const result = execSync(command, options);
    return result ? result.toString() : '';
}
// 1-Click Database Initializer & Seeder endpoint
app.get('/api/db-init', async (_req, res) => {
    try {
        const output = await runPrismaDbPush(false);
        await (0, seedService_js_1.seedDatabase)();
        res.json({
            success: true,
            message: 'Database schema pushed and enterprise accounts seeded successfully!',
            output,
        });
    }
    catch (err) {
        console.error('db-init error:', err);
        res.status(500).json({
            success: false,
            error: err.message,
        });
    }
});
// Error handling middleware
app.use((err, _req, res, _next) => {
    console.error('Unhandled server error:', err);
    res.status(err.status || 500).json({
        error: err.message || 'Internal server error',
    });
});
// Handle server errors such as port in use
server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        console.error(`\n❌ Port ${index_js_1.config.port} is already in use by another running process.`);
        console.error(`💡 Tip: Run 'npm run clean' in the root directory to free up port 5000 and 5173, then retry 'npm run dev'.\n`);
        process.exit(1);
    }
    else {
        console.error('Server error:', err);
    }
});
// Graceful process termination
process.on('SIGINT', () => {
    server.close(() => {
        index_js_1.prisma.$disconnect();
        process.exit(0);
    });
});
// Start Server
const PORT = index_js_1.config.port;
server.listen(PORT, '0.0.0.0', async () => {
    console.log(`\n======================================================`);
    console.log(`🚀 COOKSCAPE IN-HOUSE MAIL & CHAT SERVICE RUNNING`);
    console.log(`📍 Binding: 0.0.0.0:${PORT}`);
    console.log(`📧 Domain: @${index_js_1.config.companyDomain}`);
    console.log(`📁 Uploads Directory: ${index_js_1.config.uploadDir}`);
    console.log(`======================================================\n`);
    try {
        console.log('⚡ Syncing database schema with Prisma...');
        try {
            await runPrismaDbPush(true);
            console.log('✅ Database schema verified and synced successfully.');
        }
        catch (pushErr) {
            console.warn('Note on schema push:', pushErr?.message || pushErr);
        }
        // Auto-seed if database has no users
        const userCount = await index_js_1.prisma.user.count();
        if (userCount === 0) {
            console.log('⚡ Seeding initial Cookscape enterprise accounts...');
            await (0, seedService_js_1.seedDatabase)();
            console.log('✅ Seed completed successfully!');
        }
    }
    catch (error) {
        console.error('Error during database initialization/seeding:', error);
    }
});
