import { Router } from 'express';
import { getDashboardStats } from '../controllers/analytics.controller';
import { authenticateJWT } from '../middleware/auth';

const router = Router();

router.get('/dashboard', authenticateJWT as any, getDashboardStats as any);

export default router;
