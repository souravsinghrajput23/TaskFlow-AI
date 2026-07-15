import { PrismaClient, Role, Priority, ProjectStatus, TaskStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Clean existing database
  await prisma.notification.deleteMany();
  await prisma.activity.deleteMany();
  await prisma.task.deleteMany();
  await prisma.teamMember.deleteMany();
  await prisma.project.deleteMany();
  await prisma.user.deleteMany();

  // Create Users
  const salt = await bcrypt.genSalt(10);
  const adminPassword = await bcrypt.hash('admin123', salt);
  const memberPassword = await bcrypt.hash('member123', salt);

  const admin = await prisma.user.create({
    data: {
      name: 'Sarah Jenkins',
      email: 'admin@taskflow.com',
      passwordHash: adminPassword,
      role: Role.ADMIN,
      photoUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=150',
    },
  });

  const member1 = await prisma.user.create({
    data: {
      name: 'Alex Rivera',
      email: 'alex@taskflow.com',
      passwordHash: memberPassword,
      role: Role.MEMBER,
      photoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150',
    },
  });

  const member2 = await prisma.user.create({
    data: {
      name: 'Jane Doe',
      email: 'jane@taskflow.com',
      passwordHash: memberPassword,
      role: Role.MEMBER,
      photoUrl: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=150',
    },
  });

  console.log('Created users: Sarah (Admin), Alex (Member), Jane (Member)');

  // Create Projects
  const project1 = await prisma.project.create({
    data: {
      name: 'TaskFlow AI Website',
      description: 'Design and build the landing page and core dashboard interfaces for the TaskFlow application.',
      priority: Priority.HIGH,
      color: '#8B5CF6', // Purple
      startDate: new Date(),
      deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
      status: ProjectStatus.ACTIVE,
    },
  });

  const project2 = await prisma.project.create({
    data: {
      name: 'Mobile App Integration',
      description: 'Develop React Native wrappers and connect backend authentication/task events with mobile push notifications.',
      priority: Priority.MEDIUM,
      color: '#3B82F6', // Blue
      startDate: new Date(),
      deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      status: ProjectStatus.ACTIVE,
    },
  });

  console.log('Created projects: TaskFlow AI Website, Mobile App Integration');

  // Assign Team Members
  await prisma.teamMember.createMany({
    data: [
      { userId: admin.id, projectId: project1.id },
      { userId: member1.id, projectId: project1.id },
      { userId: member2.id, projectId: project1.id },
      { userId: admin.id, projectId: project2.id },
      { userId: member1.id, projectId: project2.id },
    ],
  });

  // Create Tasks for Project 1 (Website)
  const task1 = await prisma.task.create({
    data: {
      title: 'Design Dashboard UI Mockup',
      description: 'Create Figma design system for dark mode glassmorphic interfaces, defining sidebar, colors, and dashboard layout components.',
      priority: Priority.HIGH,
      status: TaskStatus.COMPLETED,
      dueDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago (completed)
      assignedUserId: member2.id,
      projectId: project1.id,
    },
  });

  const task2 = await prisma.task.create({
    data: {
      title: 'Implement JWT Auth API',
      description: 'Create endpoints for /api/auth/register, login, profile validation. Implement token signatures and bcrypt passwords encryption.',
      priority: Priority.HIGH,
      status: TaskStatus.COMPLETED,
      dueDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago (completed)
      assignedUserId: member1.id,
      projectId: project1.id,
    },
  });

  const task3 = await prisma.task.create({
    data: {
      title: 'Setup Groq SDK Integration',
      description: 'Configure Groq client and create services for Task description prompt generator and subtask parser controllers.',
      priority: Priority.HIGH,
      status: TaskStatus.IN_PROGRESS,
      dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
      assignedUserId: member1.id,
      projectId: project1.id,
      isAiGenerated: true,
    },
  });

  const task4 = await prisma.task.create({
    data: {
      title: 'Connect Analytics Recharts',
      description: 'Create backend controllers compiling counts and charts arrays, then connect them with Recharts UI graphs on dashboard.',
      priority: Priority.MEDIUM,
      status: TaskStatus.TODO,
      dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
      assignedUserId: member2.id,
      projectId: project1.id,
    },
  });

  const task5 = await prisma.task.create({
    data: {
      title: 'QA Testing and Production Build',
      description: 'Conduct end-to-end user route flow audits. Package server build using compiler and prepare client static exports.',
      priority: Priority.LOW,
      status: TaskStatus.TODO,
      dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), // 10 days from now
      assignedUserId: admin.id,
      projectId: project1.id,
    },
  });

  // Create Tasks for Project 2 (Mobile)
  await prisma.task.create({
    data: {
      title: 'Setup React Native Project Template',
      description: 'Initialize Expo template framework, configure TypeScript support, and setup native navigation stacks.',
      priority: Priority.MEDIUM,
      status: TaskStatus.IN_PROGRESS,
      dueDate: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000),
      assignedUserId: member1.id,
      projectId: project2.id,
    },
  });

  await prisma.task.create({
    data: {
      title: 'Create REST API Client Wrappers',
      description: 'Setup Axios interceptors matching auth tokens and define async actions binding project details state.',
      priority: Priority.MEDIUM,
      status: TaskStatus.TODO,
      dueDate: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000),
      assignedUserId: admin.id,
      projectId: project2.id,
    },
  });

  console.log('Created tasks with varying statuses and assignees');

  // Create Activity logs
  await prisma.activity.createMany({
    data: [
      {
        type: 'PROJECT_CREATE',
        description: 'created project "TaskFlow AI Website"',
        userId: admin.id,
        projectId: project1.id,
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      },
      {
        type: 'TASK_CREATE',
        description: 'created task "Design Dashboard UI Mockup"',
        userId: admin.id,
        projectId: project1.id,
        taskId: task1.id,
        createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
      },
      {
        type: 'TASK_COMPLETE',
        description: 'completed task "Design Dashboard UI Mockup"',
        userId: member2.id,
        projectId: project1.id,
        taskId: task1.id,
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      },
      {
        type: 'TASK_COMPLETE',
        description: 'completed task "Implement JWT Auth API"',
        userId: member1.id,
        projectId: project1.id,
        taskId: task2.id,
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      },
    ],
  });

  // Create Notifications
  await prisma.notification.createMany({
    data: [
      {
        userId: member1.id,
        title: 'Task Assigned',
        message: `You have been assigned to task "Setup Groq SDK Integration" in project "${project1.name}"`,
      },
      {
        userId: member2.id,
        title: 'Task Assigned',
        message: `You have been assigned to task "Connect Analytics Recharts" in project "${project1.name}"`,
      },
      {
        userId: admin.id,
        title: 'Task Completed',
        message: `Task "Implement JWT Auth API" was completed by Alex Rivera.`,
      },
    ],
  });

  console.log('Seeded activity logs and initial notifications.');
  console.log('Database Seeding Completed Successfully!');
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
