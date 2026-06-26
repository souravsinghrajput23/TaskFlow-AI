import { Router } from "express";
import { db, tasksTable, usersTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { requireAuth, type AuthRequest } from "../middlewares/requireAuth";
import {
  ListTasksQueryParams,
  GetTaskParams,
  CreateTaskBody,
  UpdateTaskParams,
  UpdateTaskBody,
  DeleteTaskParams,
} from "@workspace/api-zod";
import { activityTable } from "@workspace/db";

const router = Router();

function safeUser(u: typeof usersTable.$inferSelect | undefined) {
  if (!u) return undefined;
  return {
    id: u.id,
    fullName: u.fullName,
    email: u.email,
    role: u.role,
    avatarUrl: u.avatarUrl ?? null,
    createdAt: u.createdAt.toISOString(),
  };
}

async function taskWithUser(task: typeof tasksTable.$inferSelect) {
  let assignedUser = undefined;
  if (task.assignedTo) {
    const [user] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, task.assignedTo))
      .limit(1);
    assignedUser = safeUser(user);
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
}

router.get("/tasks", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const qp = ListTasksQueryParams.safeParse(req.query);
  const query = qp.success ? qp.data : {};

  let conditions = [];
  if (query.projectId) conditions.push(eq(tasksTable.projectId, query.projectId));
  if (query.assignedTo) conditions.push(eq(tasksTable.assignedTo, query.assignedTo));
  if (query.status) conditions.push(eq(tasksTable.status, query.status));
  if (query.priority) conditions.push(eq(tasksTable.priority, query.priority));

  const tasks = await db
    .select()
    .from(tasksTable)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(tasksTable.createdAt);

  const result = await Promise.all(tasks.map(taskWithUser));
  res.json(result);
});

router.post("/tasks", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const parsed = CreateTaskBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [task] = await db.insert(tasksTable).values(parsed.data).returning();

  await db.insert(activityTable).values({
    type: "task_created",
    description: `Task "${task.title}" was created`,
    userId: req.userId,
    projectId: task.projectId,
    taskId: task.id,
  });

  res.status(201).json(await taskWithUser(task));
});

router.get("/tasks/:id", requireAuth, async (req, res): Promise<void> => {
  const params = GetTaskParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [task] = await db
    .select()
    .from(tasksTable)
    .where(eq(tasksTable.id, params.data.id))
    .limit(1);

  if (!task) {
    res.status(404).json({ error: "Task not found" });
    return;
  }

  res.json(await taskWithUser(task));
});

router.patch("/tasks/:id", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const params = UpdateTaskParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateTaskBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [task] = await db
    .update(tasksTable)
    .set(parsed.data)
    .where(eq(tasksTable.id, params.data.id))
    .returning();

  if (!task) {
    res.status(404).json({ error: "Task not found" });
    return;
  }

  if (parsed.data.status === "done") {
    await db.insert(activityTable).values({
      type: "task_completed",
      description: `Task "${task.title}" was completed`,
      userId: req.userId,
      projectId: task.projectId,
      taskId: task.id,
    });
  } else {
    await db.insert(activityTable).values({
      type: "task_updated",
      description: `Task "${task.title}" was updated`,
      userId: req.userId,
      projectId: task.projectId,
      taskId: task.id,
    });
  }

  res.json(await taskWithUser(task));
});

router.delete("/tasks/:id", requireAuth, async (req, res): Promise<void> => {
  const params = DeleteTaskParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [task] = await db
    .delete(tasksTable)
    .where(eq(tasksTable.id, params.data.id))
    .returning();
  if (!task) {
    res.status(404).json({ error: "Task not found" });
    return;
  }
  res.sendStatus(204);
});

export default router;
