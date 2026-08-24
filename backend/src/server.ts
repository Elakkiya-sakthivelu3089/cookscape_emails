import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import path from 'path';
import { config, prisma } from './config/index.js';
import { initSocketService } from './services/socketService.js';
import { seedDatabase } from './services/seedService.js';

import authRoutes from './routes/authRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import mailRoutes from './routes/mailRoutes.js';
import chatRoutes from './routes/chatRoutes.js';
import templateRoutes from './routes/templateRoutes.js';
import contactRoutes from './routes/contactRoutes.js';

const app = express();
const server = http.createServer(app);

// Initialize Socket.IO
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

initSocketService(io);

// Middleware
app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Serve static uploaded files (renders, floor plans, attachments)
app.use('/uploads', express.static(config.uploadDir));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/mail', mailRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/templates', templateRoutes);
app.use('/api/contacts', contactRoutes);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'online',
    service: 'Cookscape In-House Mail & Chat Platform',
    domain: config.companyDomain,
    timestamp: new Date().toISOString(),
  });
});

// Error handling middleware
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Unhandled server error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
  });
});

// Handle server errors such as port in use
server.on('error', (err: any) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`\n❌ Port ${config.port} is already in use by another running process.`);
    console.error(`💡 Tip: Run 'npm run clean' in the root directory to free up port 5000 and 5173, then retry 'npm run dev'.\n`);
    process.exit(1);
  } else {
    console.error('Server error:', err);
  }
});

// Graceful process termination
process.on('SIGINT', () => {
  server.close(() => {
    prisma.$disconnect();
    process.exit(0);
  });
});

// Start Server
const PORT = config.port;
server.listen(PORT, async () => {
  console.log(`\n======================================================`);
  console.log(`🚀 COOKSCAPE IN-HOUSE MAIL & CHAT SERVICE RUNNING`);
  console.log(`📍 URL: http://localhost:${PORT}`);
  console.log(`📧 Domain: @${config.companyDomain}`);
  console.log(`📁 Uploads Directory: ${config.uploadDir}`);
  console.log(`======================================================\n`);

  try {
    console.log('⚡ Syncing database schema with Prisma...');
    const { execSync } = await import('child_process');
    try {
      execSync('npx prisma db push --accept-data-loss', { stdio: 'inherit' });
      console.log('✅ Database schema verified and synced successfully.');
    } catch (pushErr: any) {
      console.warn('Note on schema push:', pushErr?.message || pushErr);
    }

    // Auto-seed if database has no users
    const userCount = await prisma.user.count();
    if (userCount === 0) {
      console.log('⚡ Seeding initial Cookscape enterprise accounts...');
      await seedDatabase();
      console.log('✅ Seed completed successfully!');
    }
  } catch (error) {
    console.error('Error during database initialization/seeding:', error);
  }
});
