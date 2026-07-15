import { Router } from 'express';
import { getTeamMembers, inviteMember } from '../controllers/team.controller';
import { authenticateJWT, requireAdmin } from '../middleware/auth';

const router = Router();

router.use(authenticateJWT as any);

router.get('/', getTeamMembers as any);
router.post('/invite', requireAdmin as any, inviteMember as any);

export default router;
