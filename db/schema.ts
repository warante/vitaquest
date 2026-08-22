import {
  boolean,
  date,
  integer,
  numeric,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core"

export const profiles = pgTable("profiles", {
  id: uuid("id").defaultRandom().primaryKey(),
  displayName: text("display_name").notNull(),
  goalSummary: text("goal_summary"),
  breakfastPattern: text("breakfast_pattern"),
  trainingPattern: text("training_pattern"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
})

export const dailyRecords = pgTable(
  "daily_records",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    profileId: uuid("profile_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    recordDate: date("record_date").notNull(),
    completedActions: integer("completed_actions").default(0).notNull(),
    totalActions: integer("total_actions").default(0).notNull(),
    xp: integer("xp").default(0).notNull(),
    streakDays: integer("streak_days").default(0).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [uniqueIndex("daily_records_profile_date_idx").on(table.profileId, table.recordDate)],
)

export const dailyActions = pgTable(
  "daily_actions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    recordId: uuid("record_id")
      .notNull()
      .references(() => dailyRecords.id, { onDelete: "cascade" }),
    slug: text("slug").notNull(),
    label: text("label").notNull(),
    detail: text("detail").notNull(),
    icon: text("icon").notNull(),
    completed: boolean("completed").default(false).notNull(),
    completedAt: timestamp("completed_at", { withTimezone: true }),
  },
  (table) => [uniqueIndex("daily_actions_record_slug_idx").on(table.recordId, table.slug)],
)

export const meals = pgTable("meals", {
  id: uuid("id").defaultRandom().primaryKey(),
  profileId: uuid("profile_id")
    .notNull()
    .references(() => profiles.id, { onDelete: "cascade" }),
  mealDate: date("meal_date").notNull(),
  mealType: text("meal_type").notNull(),
  name: text("name").notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
})

export const workouts = pgTable("workouts", {
  id: uuid("id").defaultRandom().primaryKey(),
  profileId: uuid("profile_id")
    .notNull()
    .references(() => profiles.id, { onDelete: "cascade" }),
  workoutDate: date("workout_date").notNull(),
  activity: text("activity").notNull(),
  minutes: integer("minutes").notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
})

export const labRecords = pgTable("lab_records", {
  id: uuid("id").defaultRandom().primaryKey(),
  profileId: uuid("profile_id")
    .notNull()
    .references(() => profiles.id, { onDelete: "cascade" }),
  measuredAt: date("measured_at").notNull(),
  marker: text("marker").notNull(),
  value: numeric("value", { precision: 12, scale: 4 }).notNull(),
  unit: text("unit").notNull(),
  referenceRange: text("reference_range"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
})

export type Profile = typeof profiles.$inferSelect
export type DailyRecord = typeof dailyRecords.$inferSelect
export type DailyAction = typeof dailyActions.$inferSelect
export type Meal = typeof meals.$inferSelect
export type Workout = typeof workouts.$inferSelect
export type LabRecord = typeof labRecords.$inferSelect
