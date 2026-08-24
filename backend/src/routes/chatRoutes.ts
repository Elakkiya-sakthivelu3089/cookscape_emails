import { Router } from 'express';
import { ChatController } from '../controllers/chatController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);

router.get('/rooms', ChatController.getUserRooms);
router.post('/rooms', ChatController.createRoom);
router.get('/rooms/:roomId/messages', ChatController.getRoomMessages);
router.post('/rooms/:roomId/messages', ChatController.sendMessage);

export default router;
