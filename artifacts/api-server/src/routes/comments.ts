import { Router } from "express";
import { db, commentsTable, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth, type AuthRequest } from "../middlewares/requireAuth";
import {
  ListCommentsParams,
  CreateCommentParams,
  CreateCommentBody,
  DeleteCommentParams,
} from "@workspace/api-zod";
import { activityTable, tasksTable } from "@workspace/db";

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

router.get("/tasks/:taskId/comments", requireAuth, async (req, res): Promise<void> => {
  const params = ListCommentsParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const comments = await db
    .select()
    .from(commentsTable)
    .where(eq(commentsTable.taskId, params.data.taskId))
    .orderBy(commentsTable.createdAt);

  const result = await Promise.all(
    comments.map(async (c) => {
      const [author] = await db
        .select()
        .from(usersTable)
        .where(eq(usersTable.id, c.authorId))
        .limit(1);
      return {
        ...c,
        author: author ? safeUser(author) : null,
        createdAt: c.createdAt.toISOString(),
      };
    })
  );

  res.json(result);
});

router.post("/tasks/:taskId/comments", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const params = CreateCommentParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = CreateCommentBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [comment] = await db
    .insert(commentsTable)
    .values({
      taskId: params.data.taskId,
      content: parsed.data.content,
      authorId: req.userId!,
    })
    .returning();

  const [task] = await db
    .select()
    .from(tasksTable)
    .where(eq(tasksTable.id, params.data.taskId))
    .limit(1);

  await db.insert(activityTable).values({
    type: "comment_added",
    description: `Comment added to task "${task?.title ?? "unknown"}"`,
    userId: req.userId,
    projectId: task?.projectId,
    taskId: params.data.taskId,
  });

  const [author] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, req.userId!))
    .limit(1);

  res.status(201).json({
    ...comment,
    author: author ? safeUser(author) : null,
    createdAt: comment.createdAt.toISOString(),
  });
});

router.delete("/comments/:id", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const params = DeleteCommentParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [comment] = await db
    .select()
    .from(commentsTable)
    .where(eq(commentsTable.id, params.data.id))
    .limit(1);

  if (!comment) {
    res.status(404).json({ error: "Comment not found" });
    return;
  }

  if (comment.authorId !== req.userId && req.userRole !== "admin") {
    res.status(403).json({ error: "Not authorized" });
    return;
  }

  await db.delete(commentsTable).where(eq(commentsTable.id, params.data.id));
  res.sendStatus(204);
});

export default router;
