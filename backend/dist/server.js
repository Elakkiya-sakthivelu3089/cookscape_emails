"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const http_1 = __importDefault(require("http"));
const socket_io_1 = require("socket.io");
const cors_1 = __importDefault(require("cors"));
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
server.listen(PORT, async () => {
    console.log(`\n======================================================`);
    console.log(`🚀 COOKSCAPE IN-HOUSE MAIL & CHAT SERVICE RUNNING`);
    console.log(`📍 URL: http://localhost:${PORT}`);
    console.log(`📧 Domain: @${index_js_1.config.companyDomain}`);
    console.log(`📁 Uploads Directory: ${index_js_1.config.uploadDir}`);
    console.log(`======================================================\n`);
    try {
        // Auto-seed if database is newly initialized
        const userCount = await index_js_1.prisma.user.count();
        if (userCount === 0) {
            console.log('⚡ Initializing and seeding Cookscape database...');
            await (0, seedService_js_1.seedDatabase)();
        }
    }
    catch (error) {
        console.error('Error during auto-seed check:', error);
    }
});
