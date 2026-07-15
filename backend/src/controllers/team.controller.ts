import { Response } from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../config/db';
import { AuthRequest } from '../middleware/auth';

export const getTeamMembers = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ message: 'Unauthorized' });

    // Fetch all users with projects and tasks statistics
    const users = await prisma.user.findMany({
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        photoUrl: true,
        createdAt: true,
        teamMembers: {
          select: {
            projectId: true,
            project: {
              select: { name: true }
            }
          }
        },
        tasks: {
          select: { id: true }
        }
      }
    });

    const formattedUsers = users.map(user => ({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      photoUrl: user.photoUrl,
      createdAt: user.createdAt,
      projectsCount: user.teamMembers.length,
      projectNames: user.teamMembers.map(tm => tm.project.name),
      tasksAssignedCount: user.tasks.length
    }));

    return res.status(200).json(formattedUsers);
  } catch (error: any) {
    console.error('Get team members error:', error);
    return res.status(500).json({ message: error.message || 'Internal Server Error' });
  }
};

export const inviteMember = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ message: 'Unauthorized' });

    // Only Admin can invite
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Forbidden: Admin role required to invite members' });
    }

    const { name, email, role, projectIds } = req.body;

    if (!name || !email) {
      return res.status(400).json({ message: 'Name and email are required' });
    }

    let user = await prisma.user.findUnique({ where: { email } });

    // If user does not exist, auto-create them with default password
    if (!user) {
      const defaultPassword = 'welcome123';
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(defaultPassword, salt);

      user = await prisma.user.create({
        data: {
          name,
          email,
          passwordHash,
          role: role || 'MEMBER',
        }
      });
    }

    // Assign user to project IDs if provided
    if (projectIds && Array.isArray(projectIds) && projectIds.length > 0) {
      const teamMembersData = projectIds.map(projectId => ({
        userId: user!.id,
        projectId
      }));

      await prisma.teamMember.createMany({
        data: teamMembersData,
        skipDuplicates: true
      });

      // Log project assignment activities
      for (const projectId of projectIds) {
        const project = await prisma.project.findUnique({ where: { id: projectId } });
        if (project) {
          await prisma.activity.create({
            data: {
              type: 'PROJECT_ASSIGN',
              description: `assigned user "${name}" to project "${project.name}"`,
              userId: req.user.id,
              projectId: project.id,
            }
          });
        }
      }
    }

    // Create Notification
    await prisma.notification.create({
      data: {
        userId: user.id,
        title: 'Project Invitation',
        message: `You have been added to TaskFlow AI by admin "${req.user.name}" with default password: welcome123`,
      }
    });

    return res.status(200).json({
      message: 'Member invited successfully',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error: any) {
    console.error('Invite member error:', error);
    return res.status(500).json({ message: error.message || 'Internal Server Error' });
  }
};
