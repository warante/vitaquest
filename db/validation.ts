import { z } from "zod"

export const isoDateSchema = z.iso.date()
export const profileIdSchema = z.uuid()

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

export const mealInputSchema = z.object({
  profileId: profileIdSchema,
  mealDate: isoDateSchema,
  mealType: z.string().trim().min(1).max(40),
  name: z.string().trim().min(1).max(160),
  notes: z.string().trim().max(500).optional(),
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

export type DailyRecordInput = z.infer<typeof dailyRecordInputSchema>
export type MealInput = z.infer<typeof mealInputSchema>
export type WorkoutInput = z.infer<typeof workoutInputSchema>
export type LabInput = z.infer<typeof labInputSchema>
