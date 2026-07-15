import { Router, type IRouter } from "express";
import { and, eq, ilike, or, lte, gte, sql } from "drizzle-orm";
import { db, tasksTable, categoriesTable, taskHistoryTable } from "@workspace/db";
import {
  CreateTaskBody,
  UpdateTaskBody,
  GetTaskParams,
  UpdateTaskParams,
  DeleteTaskParams,
  DuplicateTaskParams,
  ListTasksQueryParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

function getTodayStr() {
  return new Date().toISOString().split("T")[0];
}

function normalizeDateField(d: Date | string | null | undefined): string | null | undefined {
  if (d == null) return d;
  if (d instanceof Date) return d.toISOString().split("T")[0];
  return String(d);
}

function getTomorrowStr() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().split("T")[0];
}

function getWeekEndStr() {
  const d = new Date();
  d.setDate(d.getDate() + 7);
  return d.toISOString().split("T")[0];
}

function getMonthEndStr() {
  const d = new Date();
  d.setDate(d.getDate() + 30);
  return d.toISOString().split("T")[0];
}

async function logHistory(
  userId: string,
  taskId: number | null,
  taskTitle: string,
  action: "created" | "completed" | "updated" | "deleted" | "archived" | "restored",
  metadata?: string,
) {
  await db.insert(taskHistoryTable).values({ userId, taskId, taskTitle, action, metadata });
}

router.get("/tasks", async (req, res): Promise<void> => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const queryParsed = ListTasksQueryParams.safeParse(req.query);
  if (!queryParsed.success) {
    res.status(400).json({ error: queryParsed.error.message });
    return;
  }

  const { status, priority, categoryId, isFavorite, isArchived, search, filter } = queryParsed.data;
  const userId = req.user!.id;

  const conditions = [eq(tasksTable.userId, userId)];

  if (status) conditions.push(eq(tasksTable.status, status as any));
  if (priority) conditions.push(eq(tasksTable.priority, priority as any));
  if (categoryId != null) conditions.push(eq(tasksTable.categoryId, categoryId));
  if (isFavorite != null) conditions.push(eq(tasksTable.isFavorite, isFavorite));

  // Handle archived filter - default to excluding archived unless explicitly requested
  if (isArchived != null) {
    conditions.push(eq(tasksTable.isArchived, isArchived));
  } else if (!filter || filter !== "archived") {
    conditions.push(eq(tasksTable.isArchived, false));
  }

  if (search) {
    conditions.push(
      or(
        ilike(tasksTable.title, `%${search}%`),
        ilike(tasksTable.description, `%${search}%`),
        ilike(tasksTable.notes, `%${search}%`),
      )!,
    );
  }

  // Handle shorthand filters
  const today = getTodayStr();
  const tomorrow = getTomorrowStr();
  const weekEnd = getWeekEndStr();
  const monthEnd = getMonthEndStr();

  if (filter === "today") {
    conditions.push(eq(tasksTable.dueDate, today));
  } else if (filter === "tomorrow") {
    conditions.push(eq(tasksTable.dueDate, tomorrow));
  } else if (filter === "week") {
    conditions.push(
      and(
        gte(tasksTable.dueDate, today),
        lte(tasksTable.dueDate, weekEnd),
      )!,
    );
  } else if (filter === "month") {
    conditions.push(
      and(
        gte(tasksTable.dueDate, today),
        lte(tasksTable.dueDate, monthEnd),
      )!,
    );
  } else if (filter === "overdue") {
    conditions.push(
      and(
        lte(tasksTable.dueDate, today),
        sql`${tasksTable.status} != 'completed'`,
        sql`${tasksTable.dueDate} IS NOT NULL`,
      )!,
    );
  } else if (filter === "upcoming") {
    conditions.push(gte(tasksTable.dueDate, today));
  } else if (filter === "favorites") {
    conditions.push(eq(tasksTable.isFavorite, true));
  } else if (filter === "archived") {
    conditions.push(eq(tasksTable.isArchived, true));
  }

  const tasks = await db
    .select({
      id: tasksTable.id,
      userId: tasksTable.userId,
      title: tasksTable.title,
      description: tasksTable.description,
      status: tasksTable.status,
      priority: tasksTable.priority,
      categoryId: tasksTable.categoryId,
      categoryName: categoriesTable.name,
      categoryColor: categoriesTable.color,
      tags: tasksTable.tags,
      dueDate: tasksTable.dueDate,
      dueTime: tasksTable.dueTime,
      estimatedMinutes: tasksTable.estimatedMinutes,
      actualMinutes: tasksTable.actualMinutes,
      difficulty: tasksTable.difficulty,
      energyLevel: tasksTable.energyLevel,
      color: tasksTable.color,
      notes: tasksTable.notes,
      subtasks: tasksTable.subtasks,
      checklistItems: tasksTable.checklistItems,
      isFavorite: tasksTable.isFavorite,
      isArchived: tasksTable.isArchived,
      isPinned: tasksTable.isPinned,
      recurringRule: tasksTable.recurringRule,
      completedAt: tasksTable.completedAt,
      createdAt: tasksTable.createdAt,
      updatedAt: tasksTable.updatedAt,
    })
    .from(tasksTable)
    .leftJoin(categoriesTable, eq(tasksTable.categoryId, categoriesTable.id))
    .where(and(...conditions))
    .orderBy(
      sql`${tasksTable.isPinned} DESC`,
      tasksTable.createdAt,
    );

  res.json(tasks);
});

router.post("/tasks", async (req, res): Promise<void> => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const parsed = CreateTaskBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const userId = req.user!.id;
  const [task] = await db
    .insert(tasksTable)
    .values({ ...parsed.data, userId, dueDate: normalizeDateField(parsed.data.dueDate) } as any)
    .returning();

  await logHistory(userId, task.id, task.title, "created");

  // Fetch with category
  const [enriched] = await db
    .select({
      id: tasksTable.id,
      userId: tasksTable.userId,
      title: tasksTable.title,
      description: tasksTable.description,
      status: tasksTable.status,
      priority: tasksTable.priority,
      categoryId: tasksTable.categoryId,
      categoryName: categoriesTable.name,
      categoryColor: categoriesTable.color,
      tags: tasksTable.tags,
      dueDate: tasksTable.dueDate,
      dueTime: tasksTable.dueTime,
      estimatedMinutes: tasksTable.estimatedMinutes,
      actualMinutes: tasksTable.actualMinutes,
      difficulty: tasksTable.difficulty,
      energyLevel: tasksTable.energyLevel,
      color: tasksTable.color,
      notes: tasksTable.notes,
      subtasks: tasksTable.subtasks,
      checklistItems: tasksTable.checklistItems,
      isFavorite: tasksTable.isFavorite,
      isArchived: tasksTable.isArchived,
      isPinned: tasksTable.isPinned,
      recurringRule: tasksTable.recurringRule,
      completedAt: tasksTable.completedAt,
      createdAt: tasksTable.createdAt,
      updatedAt: tasksTable.updatedAt,
    })
    .from(tasksTable)
    .leftJoin(categoriesTable, eq(tasksTable.categoryId, categoriesTable.id))
    .where(eq(tasksTable.id, task.id));

  res.status(201).json(enriched);
});

router.get("/tasks/:id", async (req, res): Promise<void> => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const params = GetTaskParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const userId = req.user!.id;
  const [task] = await db
    .select({
      id: tasksTable.id,
      userId: tasksTable.userId,
      title: tasksTable.title,
      description: tasksTable.description,
      status: tasksTable.status,
      priority: tasksTable.priority,
      categoryId: tasksTable.categoryId,
      categoryName: categoriesTable.name,
      categoryColor: categoriesTable.color,
      tags: tasksTable.tags,
      dueDate: tasksTable.dueDate,
      dueTime: tasksTable.dueTime,
      estimatedMinutes: tasksTable.estimatedMinutes,
      actualMinutes: tasksTable.actualMinutes,
      difficulty: tasksTable.difficulty,
      energyLevel: tasksTable.energyLevel,
      color: tasksTable.color,
      notes: tasksTable.notes,
      subtasks: tasksTable.subtasks,
      checklistItems: tasksTable.checklistItems,
      isFavorite: tasksTable.isFavorite,
      isArchived: tasksTable.isArchived,
      isPinned: tasksTable.isPinned,
      recurringRule: tasksTable.recurringRule,
      completedAt: tasksTable.completedAt,
      createdAt: tasksTable.createdAt,
      updatedAt: tasksTable.updatedAt,
    })
    .from(tasksTable)
    .leftJoin(categoriesTable, eq(tasksTable.categoryId, categoriesTable.id))
    .where(and(eq(tasksTable.id, params.data.id), eq(tasksTable.userId, userId)));

  if (!task) {
    res.status(404).json({ error: "Task not found" });
    return;
  }

  res.json(task);
});

router.patch("/tasks/:id", async (req, res): Promise<void> => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

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

  const userId = req.user!.id;

  // Auto-set completedAt when marking complete
  const updateData: Record<string, unknown> = { ...parsed.data };
  if (parsed.data.status === "completed" && !parsed.data.completedAt) {
    updateData.completedAt = new Date();
  }
  if (parsed.data.status && parsed.data.status !== "completed") {
    updateData.completedAt = null;
  }

  const [task] = await db
    .update(tasksTable)
    .set(updateData as any)
    .where(and(eq(tasksTable.id, params.data.id), eq(tasksTable.userId, userId)))
    .returning();

  if (!task) {
    res.status(404).json({ error: "Task not found" });
    return;
  }

  const action =
    parsed.data.status === "completed"
      ? "completed"
      : parsed.data.isArchived
        ? "archived"
        : "updated";
  await logHistory(userId, task.id, task.title, action);

  // Fetch enriched
  const [enriched] = await db
    .select({
      id: tasksTable.id,
      userId: tasksTable.userId,
      title: tasksTable.title,
      description: tasksTable.description,
      status: tasksTable.status,
      priority: tasksTable.priority,
      categoryId: tasksTable.categoryId,
      categoryName: categoriesTable.name,
      categoryColor: categoriesTable.color,
      tags: tasksTable.tags,
      dueDate: tasksTable.dueDate,
      dueTime: tasksTable.dueTime,
      estimatedMinutes: tasksTable.estimatedMinutes,
      actualMinutes: tasksTable.actualMinutes,
      difficulty: tasksTable.difficulty,
      energyLevel: tasksTable.energyLevel,
      color: tasksTable.color,
      notes: tasksTable.notes,
      subtasks: tasksTable.subtasks,
      checklistItems: tasksTable.checklistItems,
      isFavorite: tasksTable.isFavorite,
      isArchived: tasksTable.isArchived,
      isPinned: tasksTable.isPinned,
      recurringRule: tasksTable.recurringRule,
      completedAt: tasksTable.completedAt,
      createdAt: tasksTable.createdAt,
      updatedAt: tasksTable.updatedAt,
    })
    .from(tasksTable)
    .leftJoin(categoriesTable, eq(tasksTable.categoryId, categoriesTable.id))
    .where(eq(tasksTable.id, task.id));

  res.json(enriched);
});

router.delete("/tasks/:id", async (req, res): Promise<void> => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const params = DeleteTaskParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const userId = req.user!.id;
  const [task] = await db
    .delete(tasksTable)
    .where(and(eq(tasksTable.id, params.data.id), eq(tasksTable.userId, userId)))
    .returning();

  if (!task) {
    res.status(404).json({ error: "Task not found" });
    return;
  }

  await logHistory(userId, null, task.title, "deleted");

  res.sendStatus(204);
});

router.post("/tasks/:id/duplicate", async (req, res): Promise<void> => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const params = DuplicateTaskParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const userId = req.user!.id;
  const [original] = await db
    .select()
    .from(tasksTable)
    .where(and(eq(tasksTable.id, params.data.id), eq(tasksTable.userId, userId)));

  if (!original) {
    res.status(404).json({ error: "Task not found" });
    return;
  }

  const { id, createdAt, updatedAt, completedAt, ...rest } = original;
  const [dup] = await db
    .insert(tasksTable)
    .values({ ...rest, title: `${original.title} (copy)`, status: "pending", completedAt: null })
    .returning();

  await logHistory(userId, dup.id, dup.title, "created");

  const [enriched] = await db
    .select({
      id: tasksTable.id,
      userId: tasksTable.userId,
      title: tasksTable.title,
      description: tasksTable.description,
      status: tasksTable.status,
      priority: tasksTable.priority,
      categoryId: tasksTable.categoryId,
      categoryName: categoriesTable.name,
      categoryColor: categoriesTable.color,
      tags: tasksTable.tags,
      dueDate: tasksTable.dueDate,
      dueTime: tasksTable.dueTime,
      estimatedMinutes: tasksTable.estimatedMinutes,
      actualMinutes: tasksTable.actualMinutes,
      difficulty: tasksTable.difficulty,
      energyLevel: tasksTable.energyLevel,
      color: tasksTable.color,
      notes: tasksTable.notes,
      subtasks: tasksTable.subtasks,
      checklistItems: tasksTable.checklistItems,
      isFavorite: tasksTable.isFavorite,
      isArchived: tasksTable.isArchived,
      isPinned: tasksTable.isPinned,
      recurringRule: tasksTable.recurringRule,
      completedAt: tasksTable.completedAt,
      createdAt: tasksTable.createdAt,
      updatedAt: tasksTable.updatedAt,
    })
    .from(tasksTable)
    .leftJoin(categoriesTable, eq(tasksTable.categoryId, categoriesTable.id))
    .where(eq(tasksTable.id, dup.id));

  res.status(201).json(enriched);
});

export default router;
