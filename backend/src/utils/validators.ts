import { z } from 'zod';
import { Role, Priority, ProjectStatus, TaskStatus } from '@prisma/client';

export const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.nativeEnum(Role).optional(),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const updateProfileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').optional(),
  email: z.string().email('Invalid email address').optional(),
  photoUrl: z.string().url('Invalid URL').optional().or(z.literal('')),
  password: z.string().min(6, 'Password must be at least 6 characters').optional().or(z.literal('')),
});

export const projectSchema = z.object({
  name: z.string().min(3, 'Project name must be at least 3 characters'),
  description: z.string().optional(),
  priority: z.nativeEnum(Priority).default(Priority.MEDIUM),
  startDate: z.string().transform((val) => (val ? new Date(val) : undefined)).optional(),
  deadline: z.string().transform((val) => (val ? new Date(val) : undefined)).optional(),
  status: z.nativeEnum(ProjectStatus).default(ProjectStatus.ACTIVE),
  color: z.string().regex(/^#[0-9A-F]{6}$/i, 'Invalid hex color').default('#8B5CF6'),
  assignedMembers: z.array(z.string()).optional(), // List of user IDs
});

export const taskSchema = z.object({
  title: z.string().min(2, 'Task title must be at least 2 characters'),
  description: z.string().optional(),
  priority: z.nativeEnum(Priority).default(Priority.MEDIUM),
  status: z.nativeEnum(TaskStatus).default(TaskStatus.TODO),
  dueDate: z.string().transform((val) => (val ? new Date(val) : undefined)).optional().nullable(),
  assignedUserId: z.string().optional().nullable(),
  projectId: z.string().uuid('Invalid project ID'),
  isAiGenerated: z.boolean().default(false),
});
