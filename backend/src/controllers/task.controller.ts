import { Response } from 'express';
import prisma from '../config/db';
import { AuthRequest } from '../middleware/auth';
import { taskSchema } from '../utils/validators';

export const createTask = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ message: 'Unauthorized' });

    const parseResult = taskSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ message: 'Validation failed', errors: parseResult.error.errors });
    }

    const { title, description, priority, status, dueDate, assignedUserId, projectId, isAiGenerated } = parseResult.data;

    // Verify project exists and user is member or admin
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: { teamMembers: true },
    });

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const isMember = project.teamMembers.some(tm => tm.userId === req.user?.id);
    if (req.user.role !== 'ADMIN' && !isMember) {
      return res.status(403).json({ message: 'Forbidden: You are not a member of this project' });
    }

    const task = await prisma.task.create({
      data: {
        title,
        description,
        priority,
        status,
        dueDate,
        assignedUserId: assignedUserId || null,
        projectId,
        isAiGenerated,
      },
    });

    // Log Activity
    await prisma.activity.create({
      data: {
        type: 'TASK_CREATE',
        description: `created task "${title}"`,
        userId: req.user.id,
        projectId,
        taskId: task.id,
      },
    });

    // Notify assigned user
    if (assignedUserId && assignedUserId !== req.user.id) {
      await prisma.notification.create({
        data: {
          userId: assignedUserId,
          title: 'Task Assigned',
          message: `You have been assigned to task "${title}" in project "${project.name}"`,
        },
      });
    }

    return res.status(201).json(task);
  } catch (error: any) {
    console.error('Create task error:', error);
    return res.status(500).json({ message: error.message || 'Internal Server Error' });
  }
};

export const getTasks = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ message: 'Unauthorized' });

    const { projectId, status, priority, assignedUserId, search } = req.query;

    const filterConditions: any = {};

    if (projectId) {
      filterConditions.projectId = projectId as string;
    }

    if (status) {
      filterConditions.status = status as any;
    }

    if (priority) {
      filterConditions.priority = priority as any;
    }

    if (assignedUserId) {
      filterConditions.assignedUserId = assignedUserId as string;
    }

    if (search) {
      filterConditions.OR = [
        { title: { contains: search as string, mode: 'insensitive' } },
        { description: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    // Role check security: Members can only see tasks of projects they are members of
    if (req.user.role !== 'ADMIN') {
      filterConditions.project = {
        teamMembers: {
          some: {
            userId: req.user.id,
          },
        },
      };
    }

    const tasks = await prisma.task.findMany({
      where: filterConditions,
      orderBy: { createdAt: 'desc' },
      include: {
        assignedUser: {
          select: { id: true, name: true, email: true, photoUrl: true },
        },
        project: {
          select: { id: true, name: true, color: true },
        },
      },
    });

    return res.status(200).json(tasks);
  } catch (error: any) {
    console.error('Get tasks error:', error);
    return res.status(500).json({ message: error.message || 'Internal Server Error' });
  }
};

export const updateTask = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
    const { id } = req.params;

    const parseResult = taskSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ message: 'Validation failed', errors: parseResult.error.errors });
    }

    const { title, description, priority, status, dueDate, assignedUserId, projectId } = parseResult.data;

    // Check task exists
    const existingTask = await prisma.task.findUnique({
      where: { id },
      include: { project: { include: { teamMembers: true } } },
    });

    if (!existingTask) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Validate access
    const isMember = existingTask.project.teamMembers.some(tm => tm.userId === req.user?.id);
    if (req.user.role !== 'ADMIN' && !isMember) {
      return res.status(403).json({ message: 'Forbidden: You do not have access to this project' });
    }

    const updatedTask = await prisma.task.update({
      where: { id },
      data: {
        title,
        description,
        priority,
        status,
        dueDate,
        assignedUserId: assignedUserId || null,
      },
    });

    // Check if status changed
    if (status !== existingTask.status) {
      const type = status === 'COMPLETED' ? 'TASK_COMPLETE' : 'TASK_UPDATE';
      await prisma.activity.create({
        data: {
          type,
          description: status === 'COMPLETED' ? `completed task "${title}"` : `updated status of "${title}" to "${status}"`,
          userId: req.user.id,
          projectId: existingTask.projectId,
          taskId: id,
        },
      });

      // If status changed to COMPLETED, notify the project team/admin if needed
      // Simple notification logic:
      if (status === 'COMPLETED') {
        const adminUsers = await prisma.user.findMany({ where: { role: 'ADMIN' } });
        for (const admin of adminUsers) {
          if (admin.id !== req.user.id) {
            await prisma.notification.create({
              data: {
                userId: admin.id,
                title: 'Task Completed',
                message: `Task "${title}" in project "${existingTask.project.name}" was completed by ${req.user.name}`,
              },
            });
          }
        }
      }
    } else {
      await prisma.activity.create({
        data: {
          type: 'TASK_UPDATE',
          description: `updated task "${title}"`,
          userId: req.user.id,
          projectId: existingTask.projectId,
          taskId: id,
        },
      });
    }

    // Check if assigned user changed to notify them
    if (assignedUserId && assignedUserId !== existingTask.assignedUserId && assignedUserId !== req.user.id) {
      await prisma.notification.create({
        data: {
          userId: assignedUserId,
          title: 'Task Assigned',
          message: `You have been assigned to task "${title}" in project "${existingTask.project.name}"`,
        },
      });
    }

    return res.status(200).json(updatedTask);
  } catch (error: any) {
    console.error('Update task error:', error);
    return res.status(500).json({ message: error.message || 'Internal Server Error' });
  }
};

export const deleteTask = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
    const { id } = req.params;

    const existingTask = await prisma.task.findUnique({
      where: { id },
      include: { project: { include: { teamMembers: true } } },
    });

    if (!existingTask) {
      return res.status(404).json({ message: 'Task not found' });
    }

    const isMember = existingTask.project.teamMembers.some(tm => tm.userId === req.user?.id);
    if (req.user.role !== 'ADMIN' && !isMember) {
      return res.status(403).json({ message: 'Forbidden: You do not have access to this project' });
    }

    await prisma.activity.create({
      data: {
        type: 'TASK_DELETE',
        description: `deleted task "${existingTask.title}"`,
        userId: req.user.id,
        projectId: existingTask.projectId,
      },
    });

    await prisma.task.delete({ where: { id } });

    return res.status(200).json({ message: 'Task deleted successfully' });
  } catch (error: any) {
    console.error('Delete task error:', error);
    return res.status(500).json({ message: error.message || 'Internal Server Error' });
  }
};
