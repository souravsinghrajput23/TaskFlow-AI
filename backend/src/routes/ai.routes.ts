import { Router } from 'express';
import {
  generateDescription,
  generateSubtasks,
  suggestDeadline,
  dailySummary,
  projectSuggestions,
} from '../controllers/ai.controller';
import { authenticateJWT } from '../middleware/auth';

const router = Router();

router.use(authenticateJWT as any);

router.post('/generate-description', generateDescription as any);
router.post('/generate-subtasks', generateSubtasks as any);
router.post('/suggest-deadline', suggestDeadline as any);
router.post('/daily-summary', dailySummary as any);
router.post('/project-suggestions', projectSuggestions as any);

export default router;
