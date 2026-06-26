import { Router } from "express";
import { db, teamsTable, teamMembersTable, usersTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { requireAuth, requireAdmin, type AuthRequest } from "../middlewares/requireAuth";
import {
  GetTeamParams,
  CreateTeamBody,
  UpdateTeamParams,
  UpdateTeamBody,
  DeleteTeamParams,
  AddTeamMemberParams,
  AddTeamMemberBody,
  RemoveTeamMemberParams,
} from "@workspace/api-zod";
import { activityTable } from "@workspace/db";

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

async function teamWithMembers(team: typeof teamsTable.$inferSelect) {
  const memberRows = await db
    .select()
    .from(teamMembersTable)
    .where(eq(teamMembersTable.teamId, team.id));

  const members = await Promise.all(
    memberRows.map(async (row) => {
      const [user] = await db
        .select()
        .from(usersTable)
        .where(eq(usersTable.id, row.userId))
        .limit(1);
      return user ? safeUser(user) : null;
    })
  );

  return {
    ...team,
    description: team.description ?? null,
    members: members.filter(Boolean),
    createdAt: team.createdAt.toISOString(),
  };
}

router.get("/teams", requireAuth, async (_req, res): Promise<void> => {
  const teams = await db.select().from(teamsTable).orderBy(teamsTable.createdAt);
  const result = await Promise.all(teams.map(teamWithMembers));
  res.json(result);
});

router.post("/teams", requireAdmin, async (req: AuthRequest, res): Promise<void> => {
  const parsed = CreateTeamBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [team] = await db.insert(teamsTable).values(parsed.data).returning();

  await db.insert(activityTable).values({
    type: "member_added",
    description: `Team "${team.name}" was created`,
    userId: req.userId,
  });

  res.status(201).json(await teamWithMembers(team));
});

router.get("/teams/:id", requireAuth, async (req, res): Promise<void> => {
  const params = GetTeamParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [team] = await db
    .select()
    .from(teamsTable)
    .where(eq(teamsTable.id, params.data.id))
    .limit(1);

  if (!team) {
    res.status(404).json({ error: "Team not found" });
    return;
  }

  res.json(await teamWithMembers(team));
});

router.patch("/teams/:id", requireAdmin, async (req, res): Promise<void> => {
  const params = UpdateTeamParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateTeamBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [team] = await db
    .update(teamsTable)
    .set(parsed.data)
    .where(eq(teamsTable.id, params.data.id))
    .returning();

  if (!team) {
    res.status(404).json({ error: "Team not found" });
    return;
  }

  res.json(await teamWithMembers(team));
});

router.delete("/teams/:id", requireAdmin, async (req, res): Promise<void> => {
  const params = DeleteTeamParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [team] = await db
    .delete(teamsTable)
    .where(eq(teamsTable.id, params.data.id))
    .returning();
  if (!team) {
    res.status(404).json({ error: "Team not found" });
    return;
  }
  res.sendStatus(204);
});

router.post("/teams/:id/members", requireAdmin, async (req: AuthRequest, res): Promise<void> => {
  const params = AddTeamMemberParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = AddTeamMemberBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const existing = await db
    .select()
    .from(teamMembersTable)
    .where(
      and(
        eq(teamMembersTable.teamId, params.data.id),
        eq(teamMembersTable.userId, parsed.data.userId)
      )
    )
    .limit(1);

  if (existing.length === 0) {
    await db.insert(teamMembersTable).values({
      teamId: params.data.id,
      userId: parsed.data.userId,
    });
  }

  const [team] = await db
    .select()
    .from(teamsTable)
    .where(eq(teamsTable.id, params.data.id))
    .limit(1);

  if (!team) {
    res.status(404).json({ error: "Team not found" });
    return;
  }

  res.json(await teamWithMembers(team));
});

router.delete("/teams/:id/members/:userId", requireAdmin, async (req, res): Promise<void> => {
  const params = RemoveTeamMemberParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  await db
    .delete(teamMembersTable)
    .where(
      and(
        eq(teamMembersTable.teamId, params.data.id),
        eq(teamMembersTable.userId, params.data.userId)
      )
    );

  const [team] = await db
    .select()
    .from(teamsTable)
    .where(eq(teamsTable.id, params.data.id))
    .limit(1);

  if (!team) {
    res.status(404).json({ error: "Team not found" });
    return;
  }

  res.json(await teamWithMembers(team));
});

export default router;
