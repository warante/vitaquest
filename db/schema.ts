import { integer, real, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core"

export const profiles = sqliteTable("profiles", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  displayName: text("display_name").notNull(),
  goalSummary: text("goal_summary"),
  breakfastPattern: text("breakfast_pattern"),
  trainingPattern: text("training_pattern"),
  stepsGoal: integer("steps_goal").default(8000).notNull(),
  fiberGoal: integer("fiber_goal").default(30).notNull(),
  strengthGoal: integer("strength_goal").default(3).notNull(),
  cardioGoal: integer("cardio_goal").default(150).notNull(),
  walksGoal: integer("walks_goal").default(10).notNull(),
  createdAt: integer("created_at", { mode: "timestamp" })
    .$defaultFn(() => new Date())
    .notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .$defaultFn(() => new Date())
    .notNull(),
})

export const dailyRecords = sqliteTable(
  "daily_records",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    profileId: text("profile_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    recordDate: text("record_date").notNull(),
    completedActions: integer("completed_actions").default(0).notNull(),
    totalActions: integer("total_actions").default(0).notNull(),
    xp: integer("xp").default(0).notNull(),
    streakDays: integer("streak_days").default(0).notNull(),
    createdAt: integer("created_at", { mode: "timestamp" })
      .$defaultFn(() => new Date())
      .notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp" })
      .$defaultFn(() => new Date())
      .notNull(),
  },
  (table) => [uniqueIndex("daily_records_profile_date_idx").on(table.profileId, table.recordDate)],
)

export const dailyActions = sqliteTable(
  "daily_actions",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    recordId: text("record_id")
      .notNull()
      .references(() => dailyRecords.id, { onDelete: "cascade" }),
    slug: text("slug").notNull(),
    label: text("label").notNull(),
    detail: text("detail").notNull(),
    icon: text("icon").notNull(),
    completed: integer("completed", { mode: "boolean" }).default(false).notNull(),
    completedAt: integer("completed_at", { mode: "timestamp" }),
  },
  (table) => [uniqueIndex("daily_actions_record_slug_idx").on(table.recordId, table.slug)],
)

export const meals = sqliteTable("meals", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  profileId: text("profile_id")
    .notNull()
    .references(() => profiles.id, { onDelete: "cascade" }),
  mealDate: text("meal_date").notNull(),
  mealType: text("meal_type").notNull(),
  name: text("name").notNull(),
  notes: text("notes"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .$defaultFn(() => new Date())
    .notNull(),
})

export const workouts = sqliteTable("workouts", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  profileId: text("profile_id")
    .notNull()
    .references(() => profiles.id, { onDelete: "cascade" }),
  workoutDate: text("workout_date").notNull(),
  activity: text("activity").notNull(),
  minutes: integer("minutes").notNull(),
  notes: text("notes"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .$defaultFn(() => new Date())
    .notNull(),
})

export const labRecords = sqliteTable("lab_records", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  profileId: text("profile_id")
    .notNull()
    .references(() => profiles.id, { onDelete: "cascade" }),
  measuredAt: text("measured_at").notNull(),
  marker: text("marker").notNull(),
  value: real("value").notNull(),
  unit: text("unit").notNull(),
  referenceRange: text("reference_range"),
  notes: text("notes"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .$defaultFn(() => new Date())
    .notNull(),
})

export const challenges = sqliteTable("challenges", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  profileId: text("profile_id")
    .notNull()
    .references(() => profiles.id, { onDelete: "cascade" }),
  slug: text("slug"),
  title: text("title").notNull(),
  detail: text("detail"),
  completed: integer("completed", { mode: "boolean" }).default(false).notNull(),
  createdAt: integer("created_at", { mode: "timestamp" })
    .$defaultFn(() => new Date())
    .notNull(),
})

export const trainingSessions = sqliteTable("training_sessions", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  profileId: text("profile_id")
    .notNull()
    .references(() => profiles.id, { onDelete: "cascade" }),
  sessionDate: text("session_date").notNull(),
  workoutType: text("workout_type").notNull(),
  durationMinutes: integer("duration_minutes").notNull(),
  rpe: integer("rpe"),
  feeling: text("feeling"),
  notes: text("notes"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .$defaultFn(() => new Date())
    .notNull(),
})

export const exerciseEntries = sqliteTable("exercise_entries", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  sessionId: text("session_id")
    .notNull()
    .references(() => trainingSessions.id, { onDelete: "cascade" }),
  exerciseName: text("exercise_name").notNull(),
  position: integer("position").default(0).notNull(),
  notes: text("notes"),
})

export const exerciseSets = sqliteTable("exercise_sets", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  entryId: text("entry_id")
    .notNull()
    .references(() => exerciseEntries.id, { onDelete: "cascade" }),
  setNumber: integer("set_number").notNull(),
  reps: integer("reps").notNull(),
  weight: real("weight"),
  weightUnit: text("weight_unit").default("kg").notNull(),
  completed: integer("completed", { mode: "boolean" }).default(true).notNull(),
  rpe: integer("rpe"),
})

export type Profile = typeof profiles.$inferSelect
export type DailyRecord = typeof dailyRecords.$inferSelect
export type DailyAction = typeof dailyActions.$inferSelect
export type Meal = typeof meals.$inferSelect
export type Workout = typeof workouts.$inferSelect
export type LabRecord = typeof labRecords.$inferSelect
export type Challenge = typeof challenges.$inferSelect
export type TrainingSession = typeof trainingSessions.$inferSelect
export type ExerciseEntry = typeof exerciseEntries.$inferSelect
export type ExerciseSet = typeof exerciseSets.$inferSelect
