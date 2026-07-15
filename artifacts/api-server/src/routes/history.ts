import { Router, type IRouter } from "express";
import { eq, desc } from "drizzle-orm";
import { db, taskHistoryTable } from "@workspace/db";
import { ListHistoryQueryParams } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/history", async (req, res): Promise<void> => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const parsed = ListHistoryQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const userId = req.user!.id;
  const { limit, offset } = parsed.data;

  const history = await db
    .select({
      id: taskHistoryTable.id,
      action: taskHistoryTable.action,
      taskTitle: taskHistoryTable.taskTitle,
      taskId: taskHistoryTable.taskId,
      metadata: taskHistoryTable.metadata,
      timestamp: taskHistoryTable.createdAt,
    })
    .from(taskHistoryTable)
    .where(eq(taskHistoryTable.userId, userId))
    .orderBy(desc(taskHistoryTable.createdAt))
    .limit(limit ?? 50)
    .offset(offset ?? 0);

  res.json(history);
});

export default router;
