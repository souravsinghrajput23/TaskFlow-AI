import api from '../lib/api';
import { AuthResponse, Project, Task, User, Activity, Notification, Role, Priority, ProjectStatus, TaskStatus } from '../types';

export const AuthService = {
  async login(email: string, password: string): Promise<AuthResponse> {
    const res = await api.post('/auth/login', { email, password });
    return res.data;
  },

  async register(name: string, email: string, password: string, role?: Role): Promise<AuthResponse> {
    const res = await api.post('/auth/register', { name, email, password, role });
    return res.data;
  },

  async getProfile(): Promise<User> {
    const res = await api.get('/auth/profile');
    return res.data;
  },

  async updateProfile(data: { name?: string; email?: string; photoUrl?: string; password?: string }): Promise<{ message: string; user: any }> {
    const res = await api.put('/auth/profile', data);
    return res.data;
  }
};

export const ProjectService = {
  async getProjects(): Promise<Project[]> {
    const res = await api.get('/projects');
    return res.data;
  },

  async getProjectById(id: string): Promise<Project & { tasks: Task[]; activities: Activity[] }> {
    const res = await api.get(`/projects/${id}`);
    return res.data;
  },

  async createProject(data: {
    name: string;
    description?: string;
    priority: Priority;
    startDate?: string;
    deadline?: string;
    status: ProjectStatus;
    color: string;
    assignedMembers?: string[];
  }): Promise<Project> {
    const res = await api.post('/projects', data);
    return res.data;
  },

  async updateProject(id: string, data: {
    name: string;
    description?: string;
    priority: Priority;
    startDate?: string;
    deadline?: string;
    status: ProjectStatus;
    color: string;
    assignedMembers?: string[];
  }): Promise<Project> {
    const res = await api.put(`/projects/${id}`, data);
    return res.data;
  },

  async deleteProject(id: string): Promise<{ message: string }> {
    const res = await api.delete(`/projects/${id}`);
    return res.data;
  }
};

export const TaskService = {
  async getTasks(params?: {
    projectId?: string;
    status?: TaskStatus;
    priority?: Priority;
    assignedUserId?: string;
    search?: string;
  }): Promise<Task[]> {
    const res = await api.get('/tasks', { params });
    return res.data;
  },

  async createTask(data: {
    title: string;
    description?: string;
    priority: Priority;
    status: TaskStatus;
    dueDate?: string | null;
    assignedUserId?: string | null;
    projectId: string;
    isAiGenerated?: boolean;
  }): Promise<Task> {
    const res = await api.post('/tasks', data);
    return res.data;
  },

  async updateTask(id: string, data: {
    title: string;
    description?: string | null;
    priority: Priority;
    status: TaskStatus;
    dueDate?: string | null;
    assignedUserId?: string | null;
    projectId: string;
  }): Promise<Task> {
    const res = await api.put(`/tasks/${id}`, data);
    return res.data;
  },

  async deleteTask(id: string): Promise<{ message: string }> {
    const res = await api.delete(`/tasks/${id}`);
    return res.data;
  }
};

export const TeamService = {
  async getTeamMembers(): Promise<User[]> {
    const res = await api.get('/team');
    return res.data;
  },

  async inviteMember(data: { name: string; email: string; role: Role; projectIds?: string[] }): Promise<{ message: string; user: User }> {
    const res = await api.post('/team/invite', data);
    return res.data;
  }
};

export const ActivityService = {
  async getActivities(): Promise<Activity[]> {
    const res = await api.get('/activity');
    return res.data;
  }
};

export const NotificationService = {
  async getNotifications(): Promise<Notification[]> {
    const res = await api.get('/notifications');
    return res.data;
  },

  async markAsRead(id: string): Promise<Notification> {
    const res = await api.put(`/notifications/${id}`);
    return res.data;
  },

  async markAllAsRead(): Promise<{ message: string }> {
    const res = await api.post('/notifications/read-all');
    return res.data;
  }
};

export const AiService = {
  async generateDescription(title: string): Promise<string> {
    const res = await api.post('/ai/generate-description', { title });
    return res.data.description;
  },

  async generateSubtasks(title: string, description?: string): Promise<string[]> {
    const res = await api.post('/ai/generate-subtasks', { title, description });
    return res.data.subtasks;
  },

  async suggestDeadline(title: string, description?: string): Promise<{ estimatedTime: string; reason: string }> {
    const res = await api.post('/ai/suggest-deadline', { title, description });
    return res.data;
  },

  async getDailySummary(): Promise<string> {
    const res = await api.post('/ai/daily-summary');
    return res.data.summary;
  },

  async getProjectSuggestions(projectId: string): Promise<string> {
    const res = await api.post('/ai/project-suggestions', { projectId });
    return res.data.suggestions;
  }
};

export const AnalyticsService = {
  async getDashboardStats(): Promise<{
    totalProjects: number;
    totalTasks: number;
    completedTasks: number;
    pendingTasks: number;
    overdueTasks: number;
    aiProductivityScore: number;
    upcomingDeadlines: any[];
    recentActivities: any[];
    projectProgressChart: any[];
    tasksByStatus: any[];
    weeklyProgress: any[];
  }> {
    const res = await api.get('/analytics/dashboard');
    return res.data;
  }
};
