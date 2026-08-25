"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const mailController_js_1 = require("../controllers/mailController.js");
const auth_js_1 = require("../middleware/auth.js");
const upload_js_1 = require("../middleware/upload.js");
const router = (0, express_1.Router)();
// Public Webhook & Testing Endpoints (No JWT required)
router.get('/test-smtp', mailController_js_1.MailController.testSmtpConnection);
router.post('/test-smtp', mailController_js_1.MailController.testSmtpConnection);
router.post('/inbound-webhook', mailController_js_1.MailController.handleInboundWebhook);
router.post('/simulate-inbound', mailController_js_1.MailController.simulateInboundEmail);
// Protected routes (JWT required)
router.use(auth_js_1.authenticate);
router.get('/', mailController_js_1.MailController.getEmails);
router.get('/counts', mailController_js_1.MailController.getMailFolderCounts);
router.get('/:emailId', mailController_js_1.MailController.getEmailDetail);
router.post('/send', mailController_js_1.MailController.sendEmail);
router.patch('/:emailId/status', mailController_js_1.MailController.updateStatus);
router.delete('/:emailId', mailController_js_1.MailController.deletePermanently);
router.post('/upload', upload_js_1.upload.single('file'), mailController_js_1.MailController.uploadAttachment);
exports.default = router;
