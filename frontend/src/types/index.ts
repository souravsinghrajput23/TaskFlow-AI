export type Role = 'ADMIN' | 'MEMBER';
export type Priority = 'LOW' | 'MEDIUM' | 'HIGH';
export type ProjectStatus = 'ACTIVE' | 'COMPLETED' | 'ARCHIVED';
export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'COMPLETED';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  photoUrl?: string | null;
  createdAt: string;
  projectsCount?: number;
  projectNames?: string[];
  tasksAssignedCount?: number;
}

export interface TeamMember {
  id: string;
  userId: string;
  projectId: string;
  user: {
    id: string;
    name: string;
    email: string;
    photoUrl?: string | null;
    role: Role;
  };
}

export interface Project {
  id: string;
  name: string;
  description?: string | null;
  priority: Priority;
  startDate?: string | null;
  deadline?: string | null;
  status: ProjectStatus;
  color: string;
  createdAt: string;
  updatedAt: string;
  teamMembers?: TeamMember[];
  tasks?: Task[];
  activities?: Activity[];
  totalTasks?: number;
  completedTasks?: number;
  progressPercent?: number;
}

export interface Task {
  id: string;
  title: string;
  description?: string | null;
  priority: Priority;
  status: TaskStatus;
  dueDate?: string | null;
  assignedUserId?: string | null;
  assignedUser?: {
    id: string;
    name: string;
    email: string;
    photoUrl?: string | null;
  } | null;
  projectId: string;
  project?: {
    id: string;
    name: string;
    color: string;
  };
  isAiGenerated: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Activity {
  id: string;
  type: string;
  description: string;
  userId?: string | null;
  user?: {
    id: string;
    name: string;
    photoUrl?: string | null;
  } | null;
  projectId?: string | null;
  project?: {
    id: string;
    name: string;
  } | null;
  taskId?: string | null;
  task?: {
    id: string;
    title: string;
  } | null;
  createdAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export interface AuthResponse {
  token: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: Role;
    photoUrl?: string | null;
  };
}
