import { asc, desc, eq, inArray } from "drizzle-orm"
import { NextResponse } from "next/server"
import { DatabaseConfigurationError, getDatabase } from "../../../db/client"
import { configuredProfileId } from "../../../db/config"
import {
  type ExerciseEntry,
  type ExerciseSet,
  exerciseEntries,
  exerciseSets,
  trainingSessions,
} from "../../../db/schema"
import { trainingSessionInputSchema } from "../../../db/validation"

export const runtime = "nodejs"

export async function GET(): Promise<NextResponse> {
  try {
    const profileId = configuredProfileId()
    const db = await getDatabase()
    const sessions = await db
      .select()
      .from(trainingSessions)
      .where(eq(trainingSessions.profileId, profileId))
      .orderBy(desc(trainingSessions.sessionDate), desc(trainingSessions.createdAt))
    const sessionIds = sessions.map((session) => session.id)
    const entries: ExerciseEntry[] =
      sessionIds.length > 0
        ? await db
            .select()
            .from(exerciseEntries)
            .where(inArray(exerciseEntries.sessionId, sessionIds))
            .orderBy(asc(exerciseEntries.position))
        : []
    const entryIds = entries.map((entry) => entry.id)
    const sets: ExerciseSet[] =
      entryIds.length > 0
        ? await db
            .select()
            .from(exerciseSets)
            .where(inArray(exerciseSets.entryId, entryIds))
            .orderBy(asc(exerciseSets.setNumber))
        : []
    const entriesBySession = new Map<string, ExerciseEntry[]>()
    for (const entry of entries) {
      const list = entriesBySession.get(entry.sessionId) ?? []
      list.push(entry)
      entriesBySession.set(entry.sessionId, list)
    }
    const setsByEntry = new Map<string, ExerciseSet[]>()
    for (const set of sets) {
      const list = setsByEntry.get(set.entryId) ?? []
      list.push(set)
      setsByEntry.set(set.entryId, list)
    }
    const result = sessions.map((session) => ({
      ...session,
      exercises: (entriesBySession.get(session.id) ?? []).map((entry) => ({
        ...entry,
        sets: setsByEntry.get(entry.id) ?? [],
      })),
    }))
    return NextResponse.json({ sessions: result })
  } catch (error) {
    if (error instanceof DatabaseConfigurationError) {
      return NextResponse.json({ error: error.message }, { status: 503 })
    }
    return NextResponse.json({ error: "No se pudieron leer las sesiones" }, { status: 500 })
  }
}

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const input = trainingSessionInputSchema.parse(await request.json())
    const profileId = configuredProfileId()
    const db = await getDatabase()
    const sessionId = await db.transaction(async (transaction) => {
      const [session] = await transaction
        .insert(trainingSessions)
        .values({
          profileId,
          sessionDate: input.sessionDate,
          workoutType: input.workoutType,
          durationMinutes: input.durationMinutes,
          rpe: input.rpe ?? null,
          feeling: input.feeling ?? null,
          notes: input.notes ?? null,
        })
        .returning({ id: trainingSessions.id })
      if (!session) throw new Error("Sesión no creada")
      for (const [index, exercise] of input.exercises.entries()) {
        const [entry] = await transaction
          .insert(exerciseEntries)
          .values({
            sessionId: session.id,
            exerciseName: exercise.exerciseName,
            position: index,
            notes: exercise.notes ?? null,
          })
          .returning({ id: exerciseEntries.id })
        if (!entry) throw new Error("Ejercicio no creado")
        await transaction.insert(exerciseSets).values(
          exercise.sets.map((set, setIndex) => ({
            entryId: entry.id,
            setNumber: setIndex + 1,
            reps: set.reps,
            weight: set.weight ?? null,
            weightUnit: set.weightUnit ?? "kg",
            completed: set.completed ?? true,
            rpe: set.rpe ?? null,
          })),
        )
      }
      return session.id
    })
    return NextResponse.json({ id: sessionId }, { status: 201 })
  } catch (error) {
    if (error instanceof DatabaseConfigurationError) {
      return NextResponse.json({ error: error.message }, { status: 503 })
    }
    if (error instanceof SyntaxError || (error instanceof Error && error.name === "ZodError")) {
      return NextResponse.json({ error: "Sesión no válida" }, { status: 400 })
    }
    return NextResponse.json({ error: "No se pudo guardar la sesión" }, { status: 500 })
  }
}
