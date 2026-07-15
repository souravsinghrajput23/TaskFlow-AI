import { Router } from 'express';
import { createProject, getProjects, getProjectById, updateProject, deleteProject } from '../controllers/project.controller';
import { authenticateJWT, requireAdmin } from '../middleware/auth';

const router = Router();

// All project routes require authentication
router.use(authenticateJWT as any);

router.get('/', getProjects as any);
router.post('/', requireAdmin as any, createProject as any);
router.get('/:id', getProjectById as any);
router.put('/:id', requireAdmin as any, updateProject as any);
router.delete('/:id', requireAdmin as any, deleteProject as any);

export default router;
