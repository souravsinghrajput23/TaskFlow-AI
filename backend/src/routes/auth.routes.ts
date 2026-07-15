import { Router } from 'express';
import { register, login, getProfile, updateProfile } from '../controllers/auth.controller';
import { authenticateJWT } from '../middleware/auth';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.get('/profile', authenticateJWT as any, getProfile as any);
router.put('/profile', authenticateJWT as any, updateProfile as any);

export default router;
