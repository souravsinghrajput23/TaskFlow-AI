import { Router } from "express";
import { db, tasksTable, projectsTable, usersTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { requireAuth, type AuthRequest } from "../middlewares/requireAuth";
import {
  SuggestTasksBody,
  PrioritizeTasksBody,
  ScheduleWorkloadBody,
  GetUserInsightsParams,
  GetProjectRiskAlertsParams,
} from "@workspace/api-zod";
import { groqJson } from "../lib/groq";

const router = Router();

router.post("/ai/suggest-tasks", requireAuth, async (req, res): Promise<void> => {
  const parsed = SuggestTasksBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { prompt, projectId } = parsed.data;

  const [project] = await db
    .select()
    .from(projectsTable)
    .where(eq(projectsTable.id, projectId))
    .limit(1);

  const result = await groqJson<{
    suggestions: Array<{
      title: string;
      description: string;
      priority: string;
      estimatedHours: number | null;
    }>;
  }>(
    `You are a senior project manager helping break down work into actionable tasks.
Project: "${project?.name ?? "Unknown"}". Generate 3-5 concrete, actionable tasks based on the user's input.
Return JSON: { "suggestions": [{ "title": "string", "description": "string", "priority": "low|medium|high|urgent", "estimatedHours": number|null }] }`,
    prompt
  );

  res.json(result);
});

router.post("/ai/prioritize", requireAuth, async (req, res): Promise<void> => {
  const parsed = PrioritizeTasksBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { taskIds, context } = parsed.data;

  const tasks = await Promise.all(
    taskIds.map(async (id) => {
      const [t] = await db.select().from(tasksTable).where(eq(tasksTable.id, id)).limit(1);
      return t;
    })
  );

  const tasksInfo = tasks
    .filter(Boolean)
    .map((t) => `ID: ${t!.id}, Title: "${t!.title}", Due: ${t!.dueDate ?? "none"}, Current: ${t!.priority}`)
    .join("\n");

  const result = await groqJson<{
    prioritized: Array<{
      taskId: number;
      recommendedPriority: string;
      reasoning: string;
    }>;
  }>(
    `You are a senior PM. Analyze the following tasks and recommend priorities based on deadlines and dependencies.
Return JSON: { "prioritized": [{ "taskId": number, "recommendedPriority": "low|medium|high|urgent", "reasoning": "string" }] }`,
    `Tasks:\n${tasksInfo}\n\nContext: ${context ?? "No additional context"}`
  );

  res.json(result);
});

router.post("/ai/schedule", requireAuth, async (req, res): Promise<void> => {
  const parsed = ScheduleWorkloadBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { projectId, teamSize } = parsed.data;

  const tasks = await db
    .select()
    .from(tasksTable)
    .where(and(eq(tasksTable.projectId, projectId), eq(tasksTable.status, "todo")));

  const tasksInfo = tasks
    .map((t) => `ID: ${t.id}, Title: "${t.title}", Priority: ${t.priority}, Due: ${t.dueDate ?? "none"}`)
    .join("\n");

  const today = new Date().toISOString().split("T")[0];

  const result = await groqJson<{
    suggestions: Array<{
      taskId: number;
      taskTitle: string;
      suggestedDueDate: string;
      reasoning: string;
    }>;
    summary: string;
  }>(
    `You are a scheduling AI. Given a list of tasks and team size, suggest optimal due dates to balance workload.
Today is ${today}. Team size: ${teamSize ?? 1}.
Return JSON: { "suggestions": [{ "taskId": number, "taskTitle": "string", "suggestedDueDate": "YYYY-MM-DD", "reasoning": "string" }], "summary": "string" }`,
    `Tasks:\n${tasksInfo}`
  );

  res.json(result);
});

router.get("/ai/insights/:userId", requireAuth, async (req, res): Promise<void> => {
  const params = GetUserInsightsParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, params.data.userId))
    .limit(1);

  const userTasks = await db
    .select()
    .from(tasksTable)
    .where(eq(tasksTable.assignedTo, params.data.userId));

  const done = userTasks.filter((t) => t.status === "done").length;
  const total = userTasks.length;
  const overdue = userTasks.filter(
    (t) => t.dueDate && t.dueDate < new Date().toISOString().split("T")[0] && t.status !== "done"
  ).length;

  const result = await groqJson<{
    insights: string[];
    productivityScore: number;
    recommendations: string[];
    completionTrend: string;
  }>(
    `You are a productivity coach. Analyze this user's task data and provide actionable insights.
Return JSON: { "insights": ["string"], "productivityScore": number (0-100), "recommendations": ["string"], "completionTrend": "improving|declining|stable" }`,
    `User: ${user?.fullName ?? "Unknown"}
Total tasks: ${total}
Completed: ${done}
Overdue: ${overdue}
Completion rate: ${total > 0 ? Math.round((done / total) * 100) : 0}%`
  );

  res.json(result);
});

router.get("/ai/risk-alerts/:projectId", requireAuth, async (req, res): Promise<void> => {
  const params = GetProjectRiskAlertsParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [project] = await db
    .select()
    .from(projectsTable)
    .where(eq(projectsTable.id, params.data.projectId))
    .limit(1);

  const tasks = await db
    .select()
    .from(tasksTable)
    .where(eq(tasksTable.projectId, params.data.projectId));

  const today = new Date().toISOString().split("T")[0];
  const total = tasks.length;
  const done = tasks.filter((t) => t.status === "done").length;
  const overdue = tasks.filter(
    (t) => t.dueDate && t.dueDate < today && t.status !== "done"
  ).length;
  const urgent = tasks.filter(
    (t) => t.priority === "urgent" && t.status !== "done"
  ).length;
  const progressPercent = total > 0 ? (done / total) * 100 : 0;

  const result = await groqJson<{
    riskLevel: string;
    alerts: Array<{ type: string; message: string; severity: string }>;
    recommendations: string[];
    progressPercent: number;
  }>(
    `You are a project risk analyst. Analyze this project and return risk assessment.
Return JSON: { "riskLevel": "low|medium|high|critical", "alerts": [{ "type": "string", "message": "string", "severity": "info|warning|error" }], "recommendations": ["string"], "progressPercent": number }`,
    `Project: ${project?.name ?? "Unknown"}
Total tasks: ${total}, Done: ${done}, Overdue: ${overdue}, Urgent open: ${urgent}
Progress: ${Math.round(progressPercent)}%
Due date: ${project?.dueDate ?? "not set"}`
  );

  result.progressPercent = progressPercent;
  res.json(result);
});

export default router;
