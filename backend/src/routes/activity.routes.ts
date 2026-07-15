import { Router } from 'express';
import { getActivities } from '../controllers/activity.controller';
import { authenticateJWT } from '../middleware/auth';

const router = Router();

router.get('/', authenticateJWT as any, getActivities as any);

export default router;
