import { Router } from 'express';
import { AdminController } from '../controllers/adminController.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';

const router = Router();

// Protect all admin routes with authentication and requireAdmin guard
router.use(authenticate, requireAdmin);

router.get('/dashboard-stats', AdminController.getDashboardStats);
router.get('/employees', AdminController.listEmployees);
router.post('/employees', AdminController.createEmployee);
router.put('/employees/:id', AdminController.updateEmployee);
router.post('/employees/:id/reset-password', AdminController.resetEmployeePassword);
router.get('/audit-logs', AdminController.getAuditLogs);

export default router;
