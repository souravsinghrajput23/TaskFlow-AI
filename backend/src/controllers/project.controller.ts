import { Response } from 'express';
import prisma from '../config/db';
import { AuthRequest } from '../middleware/auth';
import { projectSchema } from '../utils/validators';

export const createProject = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ message: 'Unauthorized' });

    const parseResult = projectSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ message: 'Validation failed', errors: parseResult.error.errors });
    }

    const { name, description, priority, startDate, deadline, status, color, assignedMembers } = parseResult.data;

    const project = await prisma.project.create({
      data: {
        name,
        description,
        priority,
        startDate,
        deadline,
        status,
        color,
      },
    });

    // Create TeamMember connections
    // Note: Always add the creator (if they are admin) or members
    const membersToCreate = new Set<string>();
    membersToCreate.add(req.user.id); // Add self
    if (assignedMembers && assignedMembers.length > 0) {
      assignedMembers.forEach(id => membersToCreate.add(id));
    }

    await prisma.teamMember.createMany({
      data: Array.from(membersToCreate).map((userId) => ({
        userId,
        projectId: project.id,
      })),
      skipDuplicates: true,
    });

    // Create Activity Log
    await prisma.activity.create({
      data: {
        type: 'PROJECT_CREATE',
        description: `created project "${name}"`,
        userId: req.user.id,
        projectId: project.id,
      },
    });

    return res.status(201).json(project);
  } catch (error: any) {
    console.error('Create project error:', error);
    return res.status(500).json({ message: error.message || 'Internal Server Error' });
  }
};

export const getProjects = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ message: 'Unauthorized' });

    let projects;
    if (req.user.role === 'ADMIN') {
      // Admin can see everything
      projects = await prisma.project.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
          teamMembers: {
            include: {
              user: {
                select: { id: true, name: true, email: true, photoUrl: true, role: true }
              }
            }
          },
          _count: {
            select: { tasks: true }
          }
        }
      });
    } else {
      // Member only sees projects they are part of
      projects = await prisma.project.findMany({
        where: {
          teamMembers: {
            some: {
              userId: req.user.id,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        include: {
          teamMembers: {
            include: {
              user: {
                select: { id: true, name: true, email: true, photoUrl: true, role: true }
              }
            }
          },
          _count: {
            select: { tasks: true }
          }
        }
      });
    }

    // Append calculated stats
    const projectsWithProgress = await Promise.all(
      projects.map(async (project) => {
        const totalTasks = await prisma.task.count({ where: { projectId: project.id } });
        const completedTasks = await prisma.task.count({
          where: { projectId: project.id, status: 'COMPLETED' },
        });

        const progressPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

        return {
          ...project,
          totalTasks,
          completedTasks,
          progressPercent,
        };
      })
    );

    return res.status(200).json(projectsWithProgress);
  } catch (error: any) {
    console.error('Get projects error:', error);
    return res.status(500).json({ message: error.message || 'Internal Server Error' });
  }
};

export const getProjectById = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
    const { id } = req.params;

    // Check if project exists and user has access
    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        teamMembers: {
          include: {
            user: {
              select: { id: true, name: true, email: true, photoUrl: true, role: true }
            }
          }
        },
      },
    });

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Role check: Admin can see, Member only if they are a team member
    const isMember = project.teamMembers.some(tm => tm.userId === req.user?.id);
    if (req.user.role !== 'ADMIN' && !isMember) {
      return res.status(403).json({ message: 'Forbidden: You are not assigned to this project' });
    }

    // Fetch tasks
    const tasks = await prisma.task.findMany({
      where: { projectId: id },
      orderBy: { createdAt: 'desc' },
      include: {
        assignedUser: {
          select: { id: true, name: true, email: true, photoUrl: true }
        }
      }
    });

    // Fetch activities
    const activities = await prisma.activity.findMany({
      where: { projectId: id },
      orderBy: { createdAt: 'desc' },
      take: 15,
      include: {
        user: {
          select: { id: true, name: true, photoUrl: true }
        }
      }
    });

    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.status === 'COMPLETED').length;
    const progressPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    return res.status(200).json({
      ...project,
      tasks,
      activities,
      totalTasks,
      completedTasks,
      progressPercent,
    });
  } catch (error: any) {
    console.error('Get project details error:', error);
    return res.status(500).json({ message: error.message || 'Internal Server Error' });
  }
};

export const updateProject = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
    const { id } = req.params;

    const parseResult = projectSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ message: 'Validation failed', errors: parseResult.error.errors });
    }

    const { name, description, priority, startDate, deadline, status, color, assignedMembers } = parseResult.data;

    // Check project exists
    const existingProject = await prisma.project.findUnique({ where: { id } });
    if (!existingProject) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Update core project fields
    const updatedProject = await prisma.project.update({
      where: { id },
      data: {
        name,
        description,
        priority,
        startDate,
        deadline,
        status,
        color,
      },
    });

    // If status changed to COMPLETED, log it
    if (status === 'COMPLETED' && existingProject.status !== 'COMPLETED') {
      await prisma.activity.create({
        data: {
          type: 'PROJECT_COMPLETE',
          description: `completed project "${name}"`,
          userId: req.user.id,
          projectId: id,
        },
      });
    } else {
      await prisma.activity.create({
        data: {
          type: 'PROJECT_UPDATE',
          description: `updated project details for "${name}"`,
          userId: req.user.id,
          projectId: id,
        },
      });
    }

    // Sync team members if provided
    if (assignedMembers) {
      // Delete existing assignments
      await prisma.teamMember.deleteMany({ where: { projectId: id } });

      // Re-create team members
      const membersToCreate = new Set<string>();
      membersToCreate.add(req.user.id); // Add creator/self
      assignedMembers.forEach(uid => membersToCreate.add(uid));

      await prisma.teamMember.createMany({
        data: Array.from(membersToCreate).map((userId) => ({
          userId,
          projectId: id,
        })),
        skipDuplicates: true,
      });
    }

    return res.status(200).json(updatedProject);
  } catch (error: any) {
    console.error('Update project error:', error);
    return res.status(500).json({ message: error.message || 'Internal Server Error' });
  }
};

export const deleteProject = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
    const { id } = req.params;

    const existingProject = await prisma.project.findUnique({ where: { id } });
    if (!existingProject) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Log activity before deletion (Cascade deletes task activities, but we can log user activity generically)
    await prisma.activity.create({
      data: {
        type: 'PROJECT_DELETE',
        description: `deleted project "${existingProject.name}"`,
        userId: req.user.id,
      },
    });

    await prisma.project.delete({ where: { id } });

    return res.status(200).json({ message: 'Project deleted successfully' });
  } catch (error: any) {
    console.error('Delete project error:', error);
    return res.status(500).json({ message: error.message || 'Internal Server Error' });
  }
};
