import { z } from "zod"

export const isoDateSchema = z.iso.date()
export const profileIdSchema = z.string().trim().min(1).max(80)

export const dailyRecordInputSchema = z.object({
  profileId: profileIdSchema,
  recordDate: isoDateSchema,
  completedActions: z.number().int().min(0),
  totalActions: z.number().int().min(0),
  xp: z.number().int().min(0),
  streakDays: z.number().int().min(0),
  actions: z.array(
    z.object({
      slug: z.string().trim().min(1).max(80),
      label: z.string().trim().min(1).max(120),
      detail: z.string().trim().max(240),
      icon: z.string().trim().max(8),
      completed: z.boolean(),
    }),
  ),
})

export const dashboardCreateSchema = z.object({
  recordDate: isoDateSchema,
})

export const dashboardUpdateSchema = z.object({
  recordDate: isoDateSchema,
  actions: z.array(
    z.object({
      slug: z.string().trim().min(1).max(80),
      label: z.string().trim().min(1).max(120),
      detail: z.string().trim().max(240),
      icon: z.string().trim().max(8),
      completed: z.boolean(),
    }),
  ),
})

export const settingsUpdateSchema = z.object({
  stepsGoal: z.number().int().min(1000).max(50000),
  fiberGoal: z.number().int().min(1).max(100),
  strengthGoal: z.number().int().min(0).max(7),
  cardioGoal: z.number().int().min(0).max(1000),
  walksGoal: z.number().int().min(0).max(50),
})

export const challengeCreateSchema = z.object({
  title: z.string().trim().min(1).max(120),
  detail: z.string().trim().max(240).optional(),
})

export const challengeUpdateSchema = z.object({
  id: z.string().trim().min(1).max(80),
  completed: z.boolean(),
})

export const mealInputSchema = z.object({
  profileId: profileIdSchema,
  mealDate: isoDateSchema,
  mealType: z.string().trim().min(1).max(40),
  name: z.string().trim().min(1).max(160),
  notes: z.string().trim().max(500).optional(),
})

export const mealSubstitutionSchema = z.object({
  mealDate: isoDateSchema,
  mealType: z.string().trim().min(1).max(40),
  name: z.string().trim().min(1).max(160),
})

export const workoutInputSchema = z.object({
  profileId: profileIdSchema,
  workoutDate: isoDateSchema,
  activity: z.string().trim().min(1).max(120),
  minutes: z.number().int().min(1).max(1440),
  notes: z.string().trim().max(500).optional(),
})

export const labInputSchema = z.object({
  profileId: profileIdSchema,
  measuredAt: isoDateSchema,
  marker: z.string().trim().min(1).max(80),
  value: z.number().finite(),
  unit: z.string().trim().min(1).max(40),
  referenceRange: z.string().trim().max(120).optional(),
  notes: z.string().trim().max(500).optional(),
})

export const metabolicMarkerInputSchema = z.object({
  marker: z.string().trim().min(1).max(80),
  value: z.number().finite(),
  unit: z.string().trim().max(40),
  measuredAt: isoDateSchema,
  notes: z.string().trim().max(500).optional(),
})

export const trainingSessionInputSchema = z.object({
  sessionDate: isoDateSchema,
  workoutType: z.string().trim().min(1).max(40),
  durationMinutes: z.number().int().min(1).max(1440),
  rpe: z.number().int().min(1).max(10).optional(),
  feeling: z.string().trim().max(40).optional(),
  notes: z.string().trim().max(500).optional(),
  exercises: z
    .array(
      z.object({
        exerciseName: z.string().trim().min(1).max(120),
        notes: z.string().trim().max(240).optional(),
        sets: z
          .array(
            z.object({
              reps: z.number().int().min(1).max(200),
              weight: z.number().finite().positive().max(1000).optional(),
              weightUnit: z.string().trim().max(20).optional(),
              completed: z.boolean().optional(),
              rpe: z.number().int().min(1).max(10).optional(),
            }),
          )
          .min(1),
      }),
    )
    .min(1),
})

export type DailyRecordInput = z.infer<typeof dailyRecordInputSchema>
export type MealInput = z.infer<typeof mealInputSchema>
export type MealSubstitution = z.infer<typeof mealSubstitutionSchema>
export type WorkoutInput = z.infer<typeof workoutInputSchema>
export type LabInput = z.infer<typeof labInputSchema>
export type MetabolicMarkerInput = z.infer<typeof metabolicMarkerInputSchema>
export type TrainingSessionInput = z.infer<typeof trainingSessionInputSchema>
