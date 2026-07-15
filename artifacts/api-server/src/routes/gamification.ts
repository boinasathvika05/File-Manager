import { Router, type IRouter } from "express";
import { and, eq } from "drizzle-orm";
import {
  db,
  gamificationProfilesTable,
  achievementsTable,
  userAchievementsTable,
} from "@workspace/db";

const router: IRouter = Router();

const LEVEL_NAMES = [
  "Beginner",
  "Apprentice",
  "Practitioner",
  "Achiever",
  "Expert",
  "Master",
  "Grandmaster",
  "Legend",
  "Mythic",
  "Transcendent",
];

function getLevelFromXp(xp: number): number {
  return Math.floor(Math.sqrt(xp / 100)) + 1;
}

function getXpToNextLevel(level: number): number {
  return (level * level) * 100;
}

function getLevelName(level: number): string {
  return LEVEL_NAMES[Math.min(level - 1, LEVEL_NAMES.length - 1)] ?? "Legend";
}

async function getOrCreateProfile(userId: string) {
  let [profile] = await db
    .select()
    .from(gamificationProfilesTable)
    .where(eq(gamificationProfilesTable.userId, userId));

  if (!profile) {
    [profile] = await db
      .insert(gamificationProfilesTable)
      .values({ userId })
      .returning();
  }
  return profile;
}

router.get("/gamification/profile", async (req, res): Promise<void> => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const userId = req.user!.id;
  const profile = await getOrCreateProfile(userId);
  const level = getLevelFromXp(profile.totalXp);
  const xpToNext = getXpToNextLevel(level) - profile.totalXp;

  // Count achievements
  const [unlockedCount] = await db
    .select({
      count: eq(userAchievementsTable.userId, userId),
    })
    .from(userAchievementsTable)
    .where(eq(userAchievementsTable.userId, userId));

  const allAchievements = await db.select().from(achievementsTable);

  const userAchievements = await db
    .select()
    .from(userAchievementsTable)
    .where(eq(userAchievementsTable.userId, userId));

  res.json({
    userId,
    totalXp: profile.totalXp,
    level,
    levelName: getLevelName(level),
    xpToNextLevel: Math.max(0, xpToNext),
    currentStreak: profile.currentStreak,
    longestStreak: profile.longestStreak,
    lastActiveDate: profile.lastActiveDate,
    unlockedAchievementsCount: userAchievements.length,
    totalAchievementsCount: allAchievements.length,
  });
});

router.get("/gamification/achievements", async (req, res): Promise<void> => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const userId = req.user!.id;

  const allAchievements = await db
    .select()
    .from(achievementsTable)
    .orderBy(achievementsTable.id);

  const userAchievements = await db
    .select()
    .from(userAchievementsTable)
    .where(eq(userAchievementsTable.userId, userId));

  const unlockedMap = new Map(
    userAchievements.map((ua) => [ua.achievementKey, ua.unlockedAt]),
  );

  const result = allAchievements.map((ach) => ({
    id: ach.id,
    key: ach.key,
    name: ach.name,
    description: ach.description,
    icon: ach.icon,
    xpReward: ach.xpReward,
    unlocked: unlockedMap.has(ach.key),
    unlockedAt: unlockedMap.get(ach.key)?.toISOString() ?? null,
  }));

  res.json(result);
});

export default router;
