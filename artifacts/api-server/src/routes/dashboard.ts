import { Router } from "express";
import { db, projectsTable, tasksTable, usersTable, activityTable } from "@workspace/db";
import { eq, sql, desc, lte } from "drizzle-orm";
import { requireAuth, type AuthRequest } from "../middlewares/requireAuth";

const router = Router();

function safeUser(u: typeof usersTable.$inferSelect) {
  return {
    id: u.id,
    fullName: u.fullName,
    email: u.email,
    role: u.role,
    avatarUrl: u.avatarUrl ?? null,
    createdAt: u.createdAt.toISOString(),
  };
}

router.get("/dashboard/summary", requireAuth, async (_req, res): Promise<void> => {
  const today = new Date().toISOString().split("T")[0];
  const sevenDaysLater = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];

  const [{ totalProjects }] = await db
    .select({ totalProjects: sql<number>`count(*)::int` })
    .from(projectsTable);

  const [{ totalTasks }] = await db
    .select({ totalTasks: sql<number>`count(*)::int` })
    .from(tasksTable);

  const [{ completedTasks }] = await db
    .select({ completedTasks: sql<number>`count(*)::int` })
    .from(tasksTable)
    .where(eq(tasksTable.status, "done"));

  const [{ activeMembers }] = await db
    .select({ activeMembers: sql<number>`count(*)::int` })
    .from(usersTable);

  // Overdue: due_date < today AND not done
  const overdueTasks = await db
    .select({ id: tasksTable.id })
    .from(tasksTable)
    .where(sql`${tasksTable.dueDate} < ${today} AND ${tasksTable.status} != 'done'`);

  const tasksDueSoon = await db
    .select({ id: tasksTable.id })
    .from(tasksTable)
    .where(
      sql`${tasksTable.dueDate} >= ${today} AND ${tasksTable.dueDate} <= ${sevenDaysLater} AND ${tasksTable.status} != 'done'`
    );

  // Status breakdown
  const statusRows = await db
    .select({
      status: tasksTable.status,
      count: sql<number>`count(*)::int`,
    })
    .from(tasksTable)
    .groupBy(tasksTable.status);

  const tasksByStatus: Record<string, number> = {};
  statusRows.forEach((r) => {
    tasksByStatus[r.status] = r.count;
  });

  // Priority breakdown
  const priorityRows = await db
    .select({
      priority: tasksTable.priority,
      count: sql<number>`count(*)::int`,
    })
    .from(tasksTable)
    .groupBy(tasksTable.priority);

  const tasksByPriority: Record<string, number> = {};
  priorityRows.forEach((r) => {
    tasksByPriority[r.priority] = r.count;
  });

  res.json({
    totalProjects,
    totalTasks,
    completedTasks,
    overdueTasks: overdueTasks.length,
    activeMembers,
    tasksDueSoon: tasksDueSoon.length,
    tasksByStatus,
    tasksByPriority,
  });
});

router.get("/dashboard/activity", requireAuth, async (_req, res): Promise<void> => {
  const activities = await db
    .select()
    .from(activityTable)
    .orderBy(desc(activityTable.createdAt))
    .limit(20);

  const result = await Promise.all(
    activities.map(async (a) => {
      let userName = null;
      if (a.userId) {
        const [user] = await db
          .select()
          .from(usersTable)
          .where(eq(usersTable.id, a.userId))
          .limit(1);
        userName = user?.fullName ?? null;
      }
      return {
        ...a,
        userId: a.userId ?? null,
        userName,
        projectId: a.projectId ?? null,
        taskId: a.taskId ?? null,
        createdAt: a.createdAt.toISOString(),
      };
    })
  );

  res.json(result);
});

router.get("/dashboard/my-tasks", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const tasks = await db
    .select()
    .from(tasksTable)
    .where(eq(tasksTable.assignedTo, req.userId!))
    .orderBy(tasksTable.dueDate)
    .limit(20);

  const result = await Promise.all(
    tasks.map(async (task) => {
      let assignedUser = undefined;
      if (task.assignedTo) {
        const [user] = await db
          .select()
          .from(usersTable)
          .where(eq(usersTable.id, task.assignedTo))
          .limit(1);
        assignedUser = user ? safeUser(user) : undefined;
      }
      return {
        ...task,
        description: task.description ?? null,
        assignedTo: task.assignedTo ?? null,
        dueDate: task.dueDate ?? null,
        assignedUser: assignedUser ?? null,
        createdAt: task.createdAt.toISOString(),
        updatedAt: task.updatedAt.toISOString(),
      };
    })
  );

  res.json(result);
});

export default router;
