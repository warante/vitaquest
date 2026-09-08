import {
  type ChallengeRow,
  type DailyActionRow,
  type DailyRecordRow,
  db,
  type ExerciseEntryRow,
  type ExerciseSetRow,
  type LabRecordRow,
  type MealRow,
  PROFILE_ID,
  type ProfileRow,
  type SettingRow,
  type TrainingSessionRow,
} from "./database"

export async function getOrInitProfile(): Promise<ProfileRow> {
  const existing = await db.profile.get(PROFILE_ID)
  if (existing) return existing
  const now = new Date().toISOString()
  const profile: ProfileRow = {
    id: PROFILE_ID,
    displayName: "Usuario",
    goalSummary: null,
    breakfastPattern: null,
    trainingPattern: null,
    stepsGoal: 8000,
    fiberGoal: 30,
    strengthGoal: 3,
    cardioGoal: 150,
    walksGoal: 10,
    createdAt: now,
    updatedAt: now,
  }
  await db.profile.add(profile)
  return profile
}

export async function updateProfileGoals(goals: {
  stepsGoal: number
  fiberGoal: number
  strengthGoal: number
  cardioGoal: number
  walksGoal: number
}): Promise<void> {
  await db.profile.update(PROFILE_ID, {
    ...goals,
    updatedAt: new Date().toISOString(),
  })
}

export async function getDailyRecord(date: string): Promise<DailyRecordRow | undefined> {
  return db.dailyRecords.where({ profileId: PROFILE_ID, recordDate: date }).first()
}

export async function getDailyActionsForRecord(recordId: string): Promise<DailyActionRow[]> {
  return db.dailyActions.where({ recordId }).toArray()
}

export async function getMealsForDate(date: string): Promise<MealRow[]> {
  return db.meals.where({ profileId: PROFILE_ID, mealDate: date }).toArray()
}

export async function createDailyRecord(
  date: string,
  actions: readonly {
    slug: string
    label: string
    detail: string
    icon: string
    completed: boolean
  }[],
): Promise<DailyRecordRow> {
  const now = new Date().toISOString()
  const recordId = crypto.randomUUID()
  const record: DailyRecordRow = {
    id: recordId,
    profileId: PROFILE_ID,
    recordDate: date,
    completedActions: 0,
    totalActions: actions.length,
    xp: 0,
    streakDays: 0,
    createdAt: now,
    updatedAt: now,
  }
  await db.dailyRecords.add(record)
  const actionRows: DailyActionRow[] = actions.map((action) => ({
    id: crypto.randomUUID(),
    recordId,
    slug: action.slug,
    label: action.label,
    detail: action.detail,
    icon: action.icon,
    completed: action.completed,
    completedAt: action.completed ? now : null,
  }))
  if (actionRows.length > 0) {
    await db.dailyActions.bulkAdd(actionRows)
  }
  return record
}

export async function updateDailyActions(
  date: string,
  actions: readonly {
    slug: string
    label: string
    detail: string
    icon: string
    completed: boolean
  }[],
): Promise<void> {
  const record = await getDailyRecord(date)
  if (!record) return
  const now = new Date().toISOString()
  await db.dailyActions.where({ recordId: record.id }).delete()
  const actionRows: DailyActionRow[] = actions.map((action) => ({
    id: crypto.randomUUID(),
    recordId: record.id,
    slug: action.slug,
    label: action.label,
    detail: action.detail,
    icon: action.icon,
    completed: action.completed,
    completedAt: action.completed ? now : null,
  }))
  if (actionRows.length > 0) {
    await db.dailyActions.bulkAdd(actionRows)
  }
  const completedCount = actions.filter((a) => a.completed).length
  await db.dailyRecords.update(record.id, {
    completedActions: completedCount,
    totalActions: actions.length,
    updatedAt: now,
  })
}

export async function upsertMeal(date: string, mealType: string, name: string): Promise<void> {
  const existing = await db.meals.where({ profileId: PROFILE_ID, mealDate: date, mealType }).first()
  if (existing) {
    await db.meals.update(existing.id, { name })
  } else {
    await db.meals.add({
      id: crypto.randomUUID(),
      profileId: PROFILE_ID,
      mealDate: date,
      mealType,
      name,
      notes: null,
      createdAt: new Date().toISOString(),
    })
  }
}

export async function getChallenges(): Promise<ChallengeRow[]> {
  return db.challenges.where({ profileId: PROFILE_ID }).toArray()
}

export async function createChallenge(title: string): Promise<ChallengeRow> {
  const challenge: ChallengeRow = {
    id: crypto.randomUUID(),
    profileId: PROFILE_ID,
    slug: null,
    title,
    detail: null,
    completed: false,
    createdAt: new Date().toISOString(),
  }
  await db.challenges.add(challenge)
  return challenge
}

export async function updateChallenge(id: string, completed: boolean): Promise<void> {
  await db.challenges.update(id, { completed })
}

export async function getLabRecords(): Promise<LabRecordRow[]> {
  return db.labRecords.where({ profileId: PROFILE_ID }).toArray()
}

export async function createLabRecord(data: {
  marker: string
  value: number
  unit: string
  measuredAt: string
  referenceRange?: string
  notes?: string
}): Promise<void> {
  await db.labRecords.add({
    id: crypto.randomUUID(),
    profileId: PROFILE_ID,
    measuredAt: data.measuredAt,
    marker: data.marker,
    value: data.value,
    unit: data.unit,
    referenceRange: data.referenceRange ?? null,
    notes: data.notes ?? null,
    createdAt: new Date().toISOString(),
  })
}

export async function getTrainingSessions(): Promise<
  (TrainingSessionRow & {
    exercises: (ExerciseEntryRow & { sets: ExerciseSetRow[] })[]
  })[]
> {
  const sessions = await db.trainingSessions
    .where({ profileId: PROFILE_ID })
    .reverse()
    .sortBy("sessionDate")
  const result = []
  for (const session of sessions) {
    const entries = await db.exerciseEntries.where({ sessionId: session.id }).toArray()
    const exercises = []
    for (const entry of entries) {
      const sets = await db.exerciseSets.where({ entryId: entry.id }).toArray()
      exercises.push({ ...entry, sets })
    }
    result.push({ ...session, exercises })
  }
  return result
}

export async function createTrainingSession(data: {
  sessionDate: string
  workoutType: string
  durationMinutes: number
  rpe?: number
  feeling?: string
  notes?: string
  exercises: {
    exerciseName: string
    notes?: string
    sets: {
      reps: number
      weight?: number
      weightUnit?: string
      completed?: boolean
      rpe?: number
    }[]
  }[]
}): Promise<void> {
  const sessionId = crypto.randomUUID()
  await db.trainingSessions.add({
    id: sessionId,
    profileId: PROFILE_ID,
    sessionDate: data.sessionDate,
    workoutType: data.workoutType,
    durationMinutes: data.durationMinutes,
    rpe: data.rpe ?? null,
    feeling: data.feeling ?? null,
    notes: data.notes ?? null,
    createdAt: new Date().toISOString(),
  })
  for (let i = 0; i < data.exercises.length; i++) {
    const exercise = data.exercises[i]
    const entryId = crypto.randomUUID()
    await db.exerciseEntries.add({
      id: entryId,
      sessionId,
      exerciseName: exercise.exerciseName,
      position: i,
      notes: exercise.notes ?? null,
    })
    for (let j = 0; j < exercise.sets.length; j++) {
      const set = exercise.sets[j]
      await db.exerciseSets.add({
        id: crypto.randomUUID(),
        entryId,
        setNumber: j + 1,
        reps: set.reps,
        weight: set.weight ?? null,
        weightUnit: set.weightUnit ?? "kg",
        completed: set.completed ?? true,
        rpe: set.rpe ?? null,
      })
    }
  }
}

export async function getAllDailyRecords(): Promise<DailyRecordRow[]> {
  return db.dailyRecords.where({ profileId: PROFILE_ID }).toArray()
}

export async function deleteDailyRecordsForWeek(dates: string[]): Promise<void> {
  for (const date of dates) {
    const record = await getDailyRecord(date)
    if (record) {
      await db.dailyActions.where({ recordId: record.id }).delete()
      await db.dailyRecords.delete(record.id)
    }
  }
}

export type AiSettings = Readonly<{
  endpoint: string
  apiKey: string
  enabled: boolean
  model: string
}>

const AI_KEYS = {
  endpoint: "ai:endpoint",
  apiKey: "ai:apiKey",
  enabled: "ai:enabled",
  model: "ai:model",
} as const

async function getSetting(key: string): Promise<string> {
  const row = await db.settings.get(key)
  return row?.value ?? ""
}

async function setSetting(key: string, value: string): Promise<void> {
  await db.settings.put({ key, value })
}

export async function getAiSettings(): Promise<AiSettings> {
  const [endpoint, apiKey, enabled, model] = await Promise.all([
    getSetting(AI_KEYS.endpoint),
    getSetting(AI_KEYS.apiKey),
    getSetting(AI_KEYS.enabled),
    getSetting(AI_KEYS.model),
  ])
  return { endpoint, apiKey, enabled: enabled === "true", model }
}

export async function saveAiSettings(settings: {
  endpoint?: string
  apiKey?: string
  enabled?: boolean
  model?: string
}): Promise<void> {
  const updates: Promise<void>[] = []
  if (settings.endpoint !== undefined) updates.push(setSetting(AI_KEYS.endpoint, settings.endpoint))
  if (settings.apiKey !== undefined) updates.push(setSetting(AI_KEYS.apiKey, settings.apiKey))
  if (settings.enabled !== undefined)
    updates.push(setSetting(AI_KEYS.enabled, settings.enabled ? "true" : "false"))
  if (settings.model !== undefined) updates.push(setSetting(AI_KEYS.model, settings.model))
  await Promise.all(updates)
}

export async function getAiSettingsRows(): Promise<SettingRow[]> {
  return db.settings
    .where("key")
    .anyOf([AI_KEYS.endpoint, AI_KEYS.apiKey, AI_KEYS.enabled, AI_KEYS.model])
    .toArray()
}

export async function exportAllData(): Promise<string> {
  const profile = await getOrInitProfile()
  const dailyRecords = await db.dailyRecords.where({ profileId: PROFILE_ID }).toArray()
  const dailyActions = await db.dailyActions.toArray()
  const meals = await db.meals.where({ profileId: PROFILE_ID }).toArray()
  const workouts = await db.workouts.where({ profileId: PROFILE_ID }).toArray()
  const labRecords = await db.labRecords.where({ profileId: PROFILE_ID }).toArray()
  const challenges = await db.challenges.where({ profileId: PROFILE_ID }).toArray()
  const trainingSessions = await db.trainingSessions.where({ profileId: PROFILE_ID }).toArray()
  const exerciseEntries = await db.exerciseEntries.toArray()
  const exerciseSets = await db.exerciseSets.toArray()

  const aiSettings = await getAiSettingsRows()

  const data = {
    exportedAt: new Date().toISOString(),
    version: 3,
    profile,
    dailyRecords,
    dailyActions,
    meals,
    workouts,
    labRecords,
    challenges,
    trainingSessions,
    exerciseEntries,
    exerciseSets,
    settings: aiSettings,
  }
  return JSON.stringify(data, null, 2)
}

export async function importAllData(json: string): Promise<void> {
  const data = JSON.parse(json)
  await db.transaction("rw", db.tables, async () => {
    for (const table of db.tables) {
      await table.clear()
    }
    if (data.profile) await db.profile.add(data.profile)
    if (data.dailyRecords) await db.dailyRecords.bulkAdd(data.dailyRecords)
    if (data.dailyActions) await db.dailyActions.bulkAdd(data.dailyActions)
    if (data.meals) await db.meals.bulkAdd(data.meals)
    if (data.workouts) await db.workouts.bulkAdd(data.workouts)
    if (data.labRecords) await db.labRecords.bulkAdd(data.labRecords)
    if (data.challenges) await db.challenges.bulkAdd(data.challenges)
    if (data.trainingSessions) await db.trainingSessions.bulkAdd(data.trainingSessions)
    if (data.exerciseEntries) await db.exerciseEntries.bulkAdd(data.exerciseEntries)
    if (data.exerciseSets) await db.exerciseSets.bulkAdd(data.exerciseSets)
    if (data.settings) await db.settings.bulkAdd(data.settings)
  })
}
