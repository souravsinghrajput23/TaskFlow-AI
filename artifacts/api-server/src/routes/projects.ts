import { Router } from "express";
import { db, projectsTable, tasksTable } from "@workspace/db";
import { eq, ilike, and, sql, lte } from "drizzle-orm";
import { requireAuth, type AuthRequest } from "../middlewares/requireAuth";
import {
  ListProjectsQueryParams,
  GetProjectParams,
  CreateProjectBody,
  UpdateProjectParams,
  UpdateProjectBody,
  DeleteProjectParams,
  GetProjectStatsParams,
} from "@workspace/api-zod";
import { activityTable } from "@workspace/db";

const router = Router();

router.get("/projects", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const qp = ListProjectsQueryParams.safeParse(req.query);
  const query = qp.success ? qp.data : {};

  let where = undefined as ReturnType<typeof and> | undefined;
  if (query.status) {
    where = eq(projectsTable.status, query.status);
  }
  if (query.search) {
    const searchCondition = ilike(projectsTable.name, `%${query.search}%`);
    where = where ? and(where, searchCondition) : searchCondition;
  }

  const projects = await db
    .select()
    .from(projectsTable)
    .where(where)
    .orderBy(projectsTable.createdAt);

  // Attach task counts
  const projectsWithCounts = await Promise.all(
    projects.map(async (p) => {
      const [{ count }] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(tasksTable)
        .where(eq(tasksTable.projectId, p.id));
      const [{ doneCount }] = await db
        .select({ doneCount: sql<number>`count(*)::int` })
        .from(tasksTable)
        .where(and(eq(tasksTable.projectId, p.id), eq(tasksTable.status, "done")));
      return {
        ...p,
        description: p.description ?? null,
        ownerId: p.ownerId ?? null,
        teamId: p.teamId ?? null,
        dueDate: p.dueDate ?? null,
        taskCount: count,
        completedTaskCount: doneCount,
        createdAt: p.createdAt.toISOString(),
        updatedAt: p.updatedAt.toISOString(),
      };
    })
  );

  res.json(projectsWithCounts);
});

router.post("/projects", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const parsed = CreateProjectBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [project] = await db
    .insert(projectsTable)
    .values({ ...parsed.data, ownerId: req.userId })
    .returning();

  await db.insert(activityTable).values({
    type: "project_created",
    description: `Project "${project.name}" was created`,
    userId: req.userId,
    projectId: project.id,
  });

  res.status(201).json({
    ...project,
    description: project.description ?? null,
    ownerId: project.ownerId ?? null,
    teamId: project.teamId ?? null,
    dueDate: project.dueDate ?? null,
    taskCount: 0,
    completedTaskCount: 0,
    createdAt: project.createdAt.toISOString(),
    updatedAt: project.updatedAt.toISOString(),
  });
});

router.get("/projects/:id", requireAuth, async (req, res): Promise<void> => {
  const params = GetProjectParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [project] = await db
    .select()
    .from(projectsTable)
    .where(eq(projectsTable.id, params.data.id))
    .limit(1);

  if (!project) {
    res.status(404).json({ error: "Project not found" });
    return;
  }

  const [{ count }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(tasksTable)
    .where(eq(tasksTable.projectId, project.id));
  const [{ doneCount }] = await db
    .select({ doneCount: sql<number>`count(*)::int` })
    .from(tasksTable)
    .where(and(eq(tasksTable.projectId, project.id), eq(tasksTable.status, "done")));

  res.json({
    ...project,
    description: project.description ?? null,
    ownerId: project.ownerId ?? null,
    teamId: project.teamId ?? null,
    dueDate: project.dueDate ?? null,
    taskCount: count,
    completedTaskCount: doneCount,
    createdAt: project.createdAt.toISOString(),
    updatedAt: project.updatedAt.toISOString(),
  });
});

router.patch("/projects/:id", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const params = UpdateProjectParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateProjectBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [project] = await db
    .update(projectsTable)
    .set(parsed.data)
    .where(eq(projectsTable.id, params.data.id))
    .returning();

  if (!project) {
    res.status(404).json({ error: "Project not found" });
    return;
  }

  res.json({
    ...project,
    description: project.description ?? null,
    ownerId: project.ownerId ?? null,
    teamId: project.teamId ?? null,
    dueDate: project.dueDate ?? null,
    taskCount: 0,
    completedTaskCount: 0,
    createdAt: project.createdAt.toISOString(),
    updatedAt: project.updatedAt.toISOString(),
  });
});

router.delete("/projects/:id", requireAuth, async (req, res): Promise<void> => {
  const params = DeleteProjectParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [project] = await db
    .delete(projectsTable)
    .where(eq(projectsTable.id, params.data.id))
    .returning();
  if (!project) {
    res.status(404).json({ error: "Project not found" });
    return;
  }
  res.sendStatus(204);
});

router.get("/projects/:id/stats", requireAuth, async (req, res): Promise<void> => {
  const params = GetProjectStatsParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const tasks = await db
    .select()
    .from(tasksTable)
    .where(eq(tasksTable.projectId, params.data.id));

  const total = tasks.length;
  const byStatus: Record<string, number> = {};
  tasks.forEach((t) => {
    byStatus[t.status] = (byStatus[t.status] ?? 0) + 1;
  });

  const today = new Date().toISOString().split("T")[0];
  const overdueTasks = tasks.filter(
    (t) => t.dueDate && t.dueDate < today && t.status !== "done"
  ).length;

  const completionRate = total > 0 ? ((byStatus["done"] ?? 0) / total) * 100 : 0;

  res.json({ total, byStatus, overdueTasks, completionRate });
});

export default router;
