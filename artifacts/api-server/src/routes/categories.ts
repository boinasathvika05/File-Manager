import { Router, type IRouter } from "express";
import { and, eq, sql } from "drizzle-orm";
import { db, categoriesTable, tasksTable } from "@workspace/db";
import {
  CreateCategoryBody,
  UpdateCategoryBody,
  UpdateCategoryParams,
  DeleteCategoryParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/categories", async (req, res): Promise<void> => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const userId = req.user!.id;

  const categories = await db
    .select({
      id: categoriesTable.id,
      userId: categoriesTable.userId,
      name: categoriesTable.name,
      color: categoriesTable.color,
      icon: categoriesTable.icon,
      taskCount: sql<number>`COUNT(${tasksTable.id})::int`,
      createdAt: categoriesTable.createdAt,
    })
    .from(categoriesTable)
    .leftJoin(
      tasksTable,
      and(
        eq(tasksTable.categoryId, categoriesTable.id),
        eq(tasksTable.isArchived, false),
      ),
    )
    .where(eq(categoriesTable.userId, userId))
    .groupBy(categoriesTable.id)
    .orderBy(categoriesTable.name);

  res.json(categories);
});

router.post("/categories", async (req, res): Promise<void> => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const parsed = CreateCategoryBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const userId = req.user!.id;
  const [category] = await db
    .insert(categoriesTable)
    .values({ ...parsed.data, userId })
    .returning();

  res.status(201).json({ ...category, taskCount: 0 });
});

router.patch("/categories/:id", async (req, res): Promise<void> => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const params = UpdateCategoryParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateCategoryBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const userId = req.user!.id;
  const [category] = await db
    .update(categoriesTable)
    .set(parsed.data)
    .where(
      and(
        eq(categoriesTable.id, params.data.id),
        eq(categoriesTable.userId, userId),
      ),
    )
    .returning();

  if (!category) {
    res.status(404).json({ error: "Category not found" });
    return;
  }

  res.json({ ...category, taskCount: 0 });
});

router.delete("/categories/:id", async (req, res): Promise<void> => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const params = DeleteCategoryParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const userId = req.user!.id;
  const [category] = await db
    .delete(categoriesTable)
    .where(
      and(
        eq(categoriesTable.id, params.data.id),
        eq(categoriesTable.userId, userId),
      ),
    )
    .returning();

  if (!category) {
    res.status(404).json({ error: "Category not found" });
    return;
  }

  res.sendStatus(204);
});

export default router;
