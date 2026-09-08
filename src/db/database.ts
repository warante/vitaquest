import Dexie, { type Table } from "dexie"

export interface ProfileRow {
  id: string
  displayName: string
  goalSummary: string | null
  breakfastPattern: string | null
  trainingPattern: string | null
  stepsGoal: number
  fiberGoal: number
  strengthGoal: number
  cardioGoal: number
  walksGoal: number
  createdAt: string
  updatedAt: string
}

export interface DailyRecordRow {
  id: string
  profileId: string
  recordDate: string
  completedActions: number
  totalActions: number
  xp: number
  streakDays: number
  createdAt: string
  updatedAt: string
}

export interface DailyActionRow {
  id: string
  recordId: string
  slug: string
  label: string
  detail: string
  icon: string
  completed: boolean
  completedAt: string | null
}

export interface MealRow {
  id: string
  profileId: string
  mealDate: string
  mealType: string
  name: string
  notes: string | null
  createdAt: string
}

export interface WorkoutRow {
  id: string
  profileId: string
  workoutDate: string
  activity: string
  minutes: number
  notes: string | null
  createdAt: string
}

export interface LabRecordRow {
  id: string
  profileId: string
  measuredAt: string
  marker: string
  value: number
  unit: string
  referenceRange: string | null
  notes: string | null
  createdAt: string
}

export interface ChallengeRow {
  id: string
  profileId: string
  slug: string | null
  title: string
  detail: string | null
  completed: boolean
  createdAt: string
}

export interface TrainingSessionRow {
  id: string
  profileId: string
  sessionDate: string
  workoutType: string
  durationMinutes: number
  rpe: number | null
  feeling: string | null
  notes: string | null
  createdAt: string
}

export interface ExerciseEntryRow {
  id: string
  sessionId: string
  exerciseName: string
  position: number
  notes: string | null
}

export interface ExerciseSetRow {
  id: string
  entryId: string
  setNumber: number
  reps: number
  weight: number | null
  weightUnit: string
  completed: boolean
  rpe: number | null
}

export interface SettingRow {
  key: string
  value: string
}

export class VitaQuestDB extends Dexie {
  profile!: Table<ProfileRow>
  dailyRecords!: Table<DailyRecordRow>
  dailyActions!: Table<DailyActionRow>
  meals!: Table<MealRow>
  workouts!: Table<WorkoutRow>
  labRecords!: Table<LabRecordRow>
  challenges!: Table<ChallengeRow>
  trainingSessions!: Table<TrainingSessionRow>
  exerciseEntries!: Table<ExerciseEntryRow>
  exerciseSets!: Table<ExerciseSetRow>
  settings!: Table<SettingRow>

  constructor() {
    super("vitaquest")
    this.version(1).stores({
      profile: "id",
      dailyRecords: "id, profileId, recordDate, [profileId+recordDate]",
      dailyActions: "id, recordId, slug, [recordId+slug]",
      meals: "id, profileId, mealDate, [profileId+mealDate+mealType]",
      workouts: "id, profileId, workoutDate",
      labRecords: "id, profileId, measuredAt, marker",
      challenges: "id, profileId, slug",
      trainingSessions: "id, profileId, sessionDate",
      exerciseEntries: "id, sessionId",
      exerciseSets: "id, entryId",
      settings: "key",
    })
  }
}

export const db = new VitaQuestDB()

export const PROFILE_ID = "local"
