import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { AiService } from '../services/ai.service';
import prisma from '../config/db';

export const generateDescription = async (req: AuthRequest, res: Response) => {
  try {
    const { title } = req.body;
    if (!title) {
      return res.status(400).json({ message: 'Task title is required' });
    }

    const description = await AiService.generateDescription(title);
    return res.status(200).json({ description });
  } catch (error: any) {
    console.error('AI Description error:', error);
    return res.status(500).json({ message: error.message || 'Internal Server Error' });
  }
};

export const generateSubtasks = async (req: AuthRequest, res: Response) => {
  try {
    const { title, description } = req.body;
    if (!title) {
      return res.status(400).json({ message: 'Task title is required' });
    }

    const subtasks = await AiService.generateSubtasks(title, description);
    return res.status(200).json({ subtasks });
  } catch (error: any) {
    console.error('AI Subtasks error:', error);
    return res.status(500).json({ message: error.message || 'Internal Server Error' });
  }
};

export const suggestDeadline = async (req: AuthRequest, res: Response) => {
  try {
    const { title, description } = req.body;
    if (!title) {
      return res.status(400).json({ message: 'Task title is required' });
    }

    const suggestion = await AiService.suggestDeadline(title, description);
    return res.status(200).json(suggestion);
  } catch (error: any) {
    console.error('AI Deadline suggestion error:', error);
    return res.status(500).json({ message: error.message || 'Internal Server Error' });
  }
};

export const dailySummary = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ message: 'Unauthorized' });

    // Fetch tasks completed today by this user, or by anyone in projects this user is part of
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    let conditions: any = {
      status: 'COMPLETED',
      updatedAt: { gte: startOfToday }
    };

    if (req.user.role !== 'ADMIN') {
      conditions.project = {
        teamMembers: {
          some: { userId: req.user.id }
        }
      };
    }

    const completedTasks = await prisma.task.findMany({
      where: conditions,
      select: { title: true }
    });

    const taskTitles = completedTasks.map(t => t.title);

    const summary = await AiService.generateDailySummary(taskTitles);
    return res.status(200).json({ summary });
  } catch (error: any) {
    console.error('AI Daily summary error:', error);
    return res.status(500).json({ message: error.message || 'Internal Server Error' });
  }
};

export const projectSuggestions = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
    
    const { projectId } = req.body;
    if (!projectId) {
      return res.status(400).json({ message: 'Project ID is required' });
    }

    // Verify project and access
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: { teamMembers: true }
    });

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const isMember = project.teamMembers.some(tm => tm.userId === req.user?.id);
    if (req.user.role !== 'ADMIN' && !isMember) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    // Compile metrics
    const total = await prisma.task.count({ where: { projectId } });
    const completed = await prisma.task.count({ where: { projectId, status: 'COMPLETED' } });
    const pending = await prisma.task.count({ where: { projectId, status: { not: 'COMPLETED' } } });
    
    const now = new Date();
    const overdue = await prisma.task.count({
      where: {
        projectId,
        status: { not: 'COMPLETED' },
        dueDate: { lt: now }
      }
    });

    const suggestions = await AiService.generateProjectSuggestions({ total, completed, pending, overdue });
    return res.status(200).json({ suggestions });
  } catch (error: any) {
    console.error('AI Project suggestions error:', error);
    return res.status(500).json({ message: error.message || 'Internal Server Error' });
  }
};
