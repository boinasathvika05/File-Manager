import {
  pgTable,
  text,
  serial,
  integer,
  boolean,
  timestamp,
  date,
  pgEnum,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const historyActionEnum = pgEnum("history_action", [
  "created",
  "completed",
  "updated",
  "deleted",
  "archived",
  "restored",
  "login",
]);

// User gamification profiles
export const gamificationProfilesTable = pgTable("gamification_profiles", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull().unique(),
  totalXp: integer("total_xp").notNull().default(0),
  level: integer("level").notNull().default(1),
  currentStreak: integer("current_streak").notNull().default(0),
  longestStreak: integer("longest_streak").notNull().default(0),
  lastActiveDate: date("last_active_date", { mode: "string" }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export type GamificationProfile =
  typeof gamificationProfilesTable.$inferSelect;

// Achievements definitions + user unlock status
export const achievementsTable = pgTable("achievements", {
  id: serial("id").primaryKey(),
  key: text("key").notNull().unique(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  icon: text("icon").notNull(),
  xpReward: integer("xp_reward").notNull().default(50),
});

export type Achievement = typeof achievementsTable.$inferSelect;

export const userAchievementsTable = pgTable("user_achievements", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  achievementKey: text("achievement_key").notNull(),
  unlockedAt: timestamp("unlocked_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type UserAchievement = typeof userAchievementsTable.$inferSelect;

// Task history / activity log
export const taskHistoryTable = pgTable("task_history", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  taskId: integer("task_id"),
  taskTitle: text("task_title").notNull(),
  action: historyActionEnum("action").notNull(),
  metadata: text("metadata"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const insertTaskHistorySchema = createInsertSchema(
  taskHistoryTable,
).omit({
  id: true,
  createdAt: true,
});
export type InsertTaskHistory = z.infer<typeof insertTaskHistorySchema>;
export type TaskHistory = typeof taskHistoryTable.$inferSelect;
