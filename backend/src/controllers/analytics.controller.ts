import { Response } from 'express';
import prisma from '../config/db';
import { AuthRequest } from '../middleware/auth';

export const getDashboardStats = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ message: 'Unauthorized' });

    // Filter condition for projects user has access to
    const projectFilter: any = {};
    if (req.user.role !== 'ADMIN') {
      projectFilter.teamMembers = { some: { userId: req.user.id } };
    }

    // 1. Projects Count
    const totalProjects = await prisma.project.count({ where: projectFilter });

    // 2. Tasks Filter based on project access
    const taskFilter: any = {};
    if (req.user.role !== 'ADMIN') {
      taskFilter.project = { teamMembers: { some: { userId: req.user.id } } };
    }

    const totalTasks = await prisma.task.count({ where: taskFilter });
    const completedTasks = await prisma.task.count({
      where: { ...taskFilter, status: 'COMPLETED' }
    });
    const pendingTasks = await prisma.task.count({
      where: { ...taskFilter, status: { not: 'COMPLETED' } }
    });

    const now = new Date();
    const overdueTasks = await prisma.task.count({
      where: {
        ...taskFilter,
        status: { not: 'COMPLETED' },
        dueDate: { lt: now }
      }
    });

    // 3. AI Productivity Score (simple explainable formula for interviews)
    // Formula: (Completed Tasks / Total Tasks) * 100 - (Overdue Tasks * 5), bounded between 0 and 100
    let aiProductivityScore = 100;
    if (totalTasks > 0) {
      const completionRate = completedTasks / totalTasks;
      aiProductivityScore = Math.max(0, Math.min(100, Math.round(completionRate * 100 - overdueTasks * 5)));
    } else {
      aiProductivityScore = 0;
    }

    // 4. Upcoming Deadlines (limit to next 5 tasks with due dates in future)
    const upcomingDeadlines = await prisma.task.findMany({
      where: {
        ...taskFilter,
        status: { not: 'COMPLETED' },
        dueDate: { gte: now }
      },
      orderBy: { dueDate: 'asc' },
      take: 5,
      include: {
        project: { select: { name: true, color: true } }
      }
    });

    // 5. Recent Activities
    const recentActivities = await prisma.activity.findMany({
      where: req.user.role !== 'ADMIN' ? {
        OR: [
          { project: { teamMembers: { some: { userId: req.user.id } } } },
          { projectId: null }
        ]
      } : {},
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: {
        user: { select: { name: true, photoUrl: true } }
      }
    });

    // 6. Project progress details for charts
    const projects = await prisma.project.findMany({
      where: projectFilter,
      select: {
        id: true,
        name: true,
        color: true,
        _count: {
          select: { tasks: true }
        }
      }
    });

    const projectProgressChart = await Promise.all(
      projects.map(async (p) => {
        const completed = await prisma.task.count({
          where: { projectId: p.id, status: 'COMPLETED' }
        });
        return {
          name: p.name,
          color: p.color,
          total: p._count.tasks,
          completed,
          progress: p._count.tasks > 0 ? Math.round((completed / p._count.tasks) * 100) : 0
        };
      })
    );

    // 7. Tasks by Status (Pie Chart data)
    const todoCount = await prisma.task.count({ where: { ...taskFilter, status: 'TODO' } });
    const inProgressCount = await prisma.task.count({ where: { ...taskFilter, status: 'IN_PROGRESS' } });

    const tasksByStatus = [
      { name: 'To Do', value: todoCount, color: '#A78BFA' }, // purple-light
      { name: 'In Progress', value: inProgressCount, color: '#60A5FA' }, // blue-light
      { name: 'Completed', value: completedTasks, color: '#34D399' } // emerald-light
    ];

    // 8. Weekly Progress (last 7 days completed tasks)
    const weeklyProgress: { day: string; completed: number; created: number }[] = [];
    const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(now.getDate() - i);
      const startOfDay = new Date(d.setHours(0, 0, 0, 0));
      const endOfDay = new Date(d.setHours(23, 59, 59, 999));

      const dayCompleted = await prisma.task.count({
        where: {
          ...taskFilter,
          status: 'COMPLETED',
          updatedAt: { gte: startOfDay, lte: endOfDay }
        }
      });

      const dayCreated = await prisma.task.count({
        where: {
          ...taskFilter,
          createdAt: { gte: startOfDay, lte: endOfDay }
        }
      });

      weeklyProgress.push({
        day: daysOfWeek[startOfDay.getDay()],
        completed: dayCompleted,
        created: dayCreated
      });
    }

    return res.status(200).json({
      totalProjects,
      totalTasks,
      completedTasks,
      pendingTasks,
      overdueTasks,
      aiProductivityScore,
      upcomingDeadlines,
      recentActivities,
      projectProgressChart,
      tasksByStatus,
      weeklyProgress
    });
  } catch (error: any) {
    console.error('Get dashboard stats error:', error);
    return res.status(500).json({ message: error.message || 'Internal Server Error' });
  }
};
