import { Router } from 'express';
import { getNotifications, markAsRead, markAllAsRead } from '../controllers/notification.controller';
import { authenticateJWT } from '../middleware/auth';

const router = Router();

router.use(authenticateJWT as any);

router.get('/', getNotifications as any);
router.put('/:id', markAsRead as any);
router.post('/read-all', markAllAsRead as any);

export default router;
