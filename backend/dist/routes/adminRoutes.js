"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const adminController_js_1 = require("../controllers/adminController.js");
const auth_js_1 = require("../middleware/auth.js");
const router = (0, express_1.Router)();
// Protect all admin routes with authentication and requireAdmin guard
router.use(auth_js_1.authenticate, auth_js_1.requireAdmin);
router.get('/dashboard-stats', adminController_js_1.AdminController.getDashboardStats);
router.get('/employees', adminController_js_1.AdminController.listEmployees);
router.post('/employees', adminController_js_1.AdminController.createEmployee);
router.put('/employees/:id', adminController_js_1.AdminController.updateEmployee);
router.post('/employees/:id/reset-password', adminController_js_1.AdminController.resetEmployeePassword);
router.get('/audit-logs', adminController_js_1.AdminController.getAuditLogs);
exports.default = router;
