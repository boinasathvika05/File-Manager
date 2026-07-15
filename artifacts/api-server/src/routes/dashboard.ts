import { Router, type IRouter } from "express";
import { and, eq, gte, lte, sql, desc } from "drizzle-orm";
import {
  db,
  tasksTable,
  taskHistoryTable,
  gamificationProfilesTable,
} from "@workspace/db";

const router: IRouter = Router();

const MOTIVATIONAL_QUOTES = [
  "The secret of getting ahead is getting started.",
  "It always seems impossible until it's done.",
  "You don't have to be great to start, but you have to start to be great.",
  "Focus on being productive instead of busy.",
  "Small daily improvements over time lead to stunning results.",
  "Done is better than perfect.",
  "Productivity is never an accident. It is always the result of a commitment to excellence.",
  "The key is not to prioritize what's on your schedule, but to schedule your priorities.",
];

function getTodayStr() {
  return new Date().toISOString().split("T")[0];
}

router.get("/dashboard/stats", async (req, res): Promise<void> => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const userId = req.user!.id;
  const today = getTodayStr();

  // Get week start (Monday)
  const now = new Date();
  const dayOfWeek = now.getDay();
  const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - daysToMonday);
  const weekStartStr = weekStart.toISOString().split("T")[0];

  // Month start
  const monthStartStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;

  const [stats] = await db
    .select({
      totalTasks: sql<number>`COUNT(*)::int`,
      completedToday: sql<number>`SUM(CASE WHEN ${tasksTable.completedAt}::date = ${today}::date THEN 1 ELSE 0 END)::int`,
      pendingTasks: sql<number>`SUM(CASE WHEN ${tasksTable.status} = 'pending' THEN 1 ELSE 0 END)::int`,
      overdueTasks: sql<number>`SUM(CASE WHEN ${tasksTable.dueDate} < ${today} AND ${tasksTable.status} != 'completed' AND ${tasksTable.status} != 'archived' AND ${tasksTable.dueDate} IS NOT NULL THEN 1 ELSE 0 END)::int`,
      completedTotal: sql<number>`SUM(CASE WHEN ${tasksTable.status} = 'completed' THEN 1 ELSE 0 END)::int`,
      tasksCompletedThisWeek: sql<number>`SUM(CASE WHEN ${tasksTable.completedAt}::date >= ${weekStartStr}::date THEN 1 ELSE 0 END)::int`,
      tasksCompletedThisMonth: sql<number>`SUM(CASE WHEN ${tasksTable.completedAt}::date >= ${monthStartStr}::date THEN 1 ELSE 0 END)::int`,
    })
    .from(tasksTable)
    .where(eq(tasksTable.userId, userId));

  // Get gamification profile
  const [profile] = await db
    .select()
    .from(gamificationProfilesTable)
    .where(eq(gamificationProfilesTable.userId, userId));

  const total = stats?.totalTasks ?? 0;
  const completed = stats?.completedTotal ?? 0;
  const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
  const productivityScore = Math.min(
    100,
    completionRate * 0.4 +
      (profile?.currentStreak ?? 0) * 5 +
      (stats?.tasksCompletedThisWeek ?? 0) * 2,
  );

  const quote =
    MOTIVATIONAL_QUOTES[Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length)];

  res.json({
    totalTasks: total,
    completedToday: stats?.completedToday ?? 0,
    pendingTasks: stats?.pendingTasks ?? 0,
    overdueTasks: stats?.overdueTasks ?? 0,
    completionRate,
    currentStreak: profile?.currentStreak ?? 0,
    longestStreak: profile?.longestStreak ?? 0,
    totalXp: profile?.totalXp ?? 0,
    level: profile?.level ?? 1,
    tasksCompletedThisWeek: stats?.tasksCompletedThisWeek ?? 0,
    tasksCompletedThisMonth: stats?.tasksCompletedThisMonth ?? 0,
    productivityScore: Math.round(productivityScore),
    motivationalQuote: quote,
  });
});

router.get("/dashboard/activity", async (req, res): Promise<void> => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const userId = req.user!.id;
  const limit = Math.min(Number(req.query.limit) || 10, 50);

  const activity = await db
    .select({
      id: taskHistoryTable.id,
      action: taskHistoryTable.action,
      taskTitle: taskHistoryTable.taskTitle,
      taskId: taskHistoryTable.taskId,
      timestamp: taskHistoryTable.createdAt,
    })
    .from(taskHistoryTable)
    .where(eq(taskHistoryTable.userId, userId))
    .orderBy(desc(taskHistoryTable.createdAt))
    .limit(limit);

  res.json(activity);
});

router.get("/dashboard/weekly-progress", async (req, res): Promise<void> => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const userId = req.user!.id;
  const now = new Date();

  // Get last 7 days
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(now);
    d.setDate(now.getDate() - (6 - i));
    return d.toISOString().split("T")[0];
  });

  const weekStart = days[0];

  const completed = await db
    .select({
      date: sql<string>`${tasksTable.completedAt}::date::text`,
      count: sql<number>`COUNT(*)::int`,
    })
    .from(tasksTable)
    .where(
      and(
        eq(tasksTable.userId, userId),
        eq(tasksTable.status, "completed"),
        gte(sql`${tasksTable.completedAt}::date`, sql`${weekStart}::date`),
      ),
    )
    .groupBy(sql`${tasksTable.completedAt}::date`);

  const total = await db
    .select({
      date: sql<string>`DATE(${tasksTable.createdAt})::text`,
      count: sql<number>`COUNT(*)::int`,
    })
    .from(tasksTable)
    .where(
      and(
        eq(tasksTable.userId, userId),
        gte(sql`DATE(${tasksTable.createdAt})`, sql`${weekStart}::date`),
      ),
    )
    .groupBy(sql`DATE(${tasksTable.createdAt})`);

  const completedMap = Object.fromEntries(
    completed.map((r) => [r.date, r.count]),
  );
  const totalMap = Object.fromEntries(total.map((r) => [r.date, r.count]));

  const result = days.map((date) => ({
    date,
    completed: completedMap[date] ?? 0,
    total: totalMap[date] ?? 0,
  }));

  res.json(result);
});

router.get("/dashboard/monthly-progress", async (req, res): Promise<void> => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const userId = req.user!.id;
  const now = new Date();
  const days = Array.from({ length: 30 }, (_, i) => {
    const d = new Date(now);
    d.setDate(now.getDate() - (29 - i));
    return d.toISOString().split("T")[0];
  });

  const monthStart = days[0];

  const completed = await db
    .select({
      date: sql<string>`${tasksTable.completedAt}::date::text`,
      count: sql<number>`COUNT(*)::int`,
    })
    .from(tasksTable)
    .where(
      and(
        eq(tasksTable.userId, userId),
        eq(tasksTable.status, "completed"),
        gte(sql`${tasksTable.completedAt}::date`, sql`${monthStart}::date`),
      ),
    )
    .groupBy(sql`${tasksTable.completedAt}::date`);

  const completedMap = Object.fromEntries(
    completed.map((r) => [r.date, r.count]),
  );

  res.json(days.map((date) => ({ date, completed: completedMap[date] ?? 0, total: 0 })));
});

export default router;
