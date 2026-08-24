import { Router } from 'express';
import { ContactController } from '../controllers/contactController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);

router.get('/', ContactController.searchContacts);

export default router;
