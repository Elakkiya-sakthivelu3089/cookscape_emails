import { Router } from 'express';
import { MailController } from '../controllers/mailController.js';
import { authenticate } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';

const router = Router();

router.use(authenticate);

router.get('/', MailController.getEmails);
router.get('/counts', MailController.getMailFolderCounts);
router.get('/:emailId', MailController.getEmailDetail);
router.post('/send', MailController.sendEmail);
router.patch('/:emailId/status', MailController.updateStatus);
router.delete('/:emailId', MailController.deletePermanently);
router.post('/upload', upload.single('file'), MailController.uploadAttachment);

export default router;
