import { Router } from 'express';
import { createTask, getTasks, updateTask, deleteTask } from '../controllers/task.controller';
import { authenticateJWT } from '../middleware/auth';

const router = Router();

router.use(authenticateJWT as any);

router.get('/', getTasks as any);
router.post('/', createTask as any);
router.put('/:id', updateTask as any);
router.delete('/:id', deleteTask as any);

export default router;
