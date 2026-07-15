import { Response } from 'express';
import prisma from '../config/db';
import { AuthRequest } from '../middleware/auth';

export const getActivities = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ message: 'Unauthorized' });

    let filterConditions = {};

    // Members can only view activities related to projects they belong to
    if (req.user.role !== 'ADMIN') {
      filterConditions = {
        OR: [
          {
            project: {
              teamMembers: {
                some: { userId: req.user.id }
              }
            }
          },
          {
            projectId: null // global/uncategorized logs
          }
        ]
      };
    }

    const activities = await prisma.activity.findMany({
      where: filterConditions,
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        user: {
          select: { id: true, name: true, photoUrl: true }
        },
        project: {
          select: { id: true, name: true }
        },
        task: {
          select: { id: true, title: true }
        }
      }
    });

    return res.status(200).json(activities);
  } catch (error: any) {
    console.error('Get activities error:', error);
    return res.status(500).json({ message: error.message || 'Internal Server Error' });
  }
};
