import { Router } from 'express';
import { MailController } from '../controllers/mailController.js';
import { authenticate } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';

const router = Router();

// Public Webhook & Testing Endpoints (No JWT required)
router.get('/test-smtp', MailController.testSmtpConnection);
router.post('/test-smtp', MailController.testSmtpConnection);
router.post('/inbound-webhook', MailController.handleInboundWebhook);
router.post('/simulate-inbound', MailController.simulateInboundEmail);

// Protected routes (JWT required)
router.use(authenticate);

router.get('/', MailController.getEmails);
router.get('/counts', MailController.getMailFolderCounts);
router.get('/:emailId', MailController.getEmailDetail);
router.post('/send', MailController.sendEmail);
router.patch('/:emailId/status', MailController.updateStatus);
router.delete('/:emailId', MailController.deletePermanently);
router.post('/upload', upload.single('file'), MailController.uploadAttachment);

export default router;
