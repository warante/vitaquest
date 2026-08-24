export const workoutTypes = [
  { type: "fuerza_a", label: "Fuerza A" },
  { type: "fuerza_b", label: "Fuerza B" },
  { type: "fuerza_c", label: "Fuerza C" },
  { type: "cardio_z2", label: "Cardio Z2" },
  { type: "movilidad", label: "Movilidad" },
  { type: "descanso_activo", label: "Descanso activo" },
  { type: "custom", label: "Otro" },
] as const
export type WorkoutType = (typeof workoutTypes)[number]["type"]

export function workoutTypeLabel(type: string): string {
  return workoutTypes.find((item) => item.type === type)?.label ?? type
}

export const feelingOptions = [
  { key: "strong", label: "Fuerte", icon: "💪" },
  { key: "normal", label: "Normal", icon: "😐" },
  { key: "exhausted", label: "Agotado", icon: "😫" },
  { key: "sore", label: "Dolorido", icon: "🤕" },
] as const
export type FeelingKey = (typeof feelingOptions)[number]["key"]

export type ExerciseCategory =
  | "empuje_horizontal"
  | "empuje_vertical"
  | "traccion_horizontal"
  | "traccion_vertical"
  | "piernas_rodilla"
  | "piernas_cadera"
  | "core"
  | "cardio"
  | "movilidad"

export type LibraryExercise = Readonly<{
  name: string
  category: ExerciseCategory
  muscleGroups: readonly string[]
}>

export const exerciseLibrary: readonly LibraryExercise[] = [
  { name: "Press banca", category: "empuje_horizontal", muscleGroups: ["Pecho", "Tríceps"] },
  { name: "Press mancuernas", category: "empuje_horizontal", muscleGroups: ["Pecho", "Tríceps"] },
  { name: "Flexiones", category: "empuje_horizontal", muscleGroups: ["Pecho", "Tríceps"] },
  { name: "Press militar", category: "empuje_vertical", muscleGroups: ["Hombro"] },
  { name: "Press Arnold", category: "empuje_vertical", muscleGroups: ["Hombro"] },
  { name: "Elevaciones laterales", category: "empuje_vertical", muscleGroups: ["Hombro"] },
  { name: "Remo con barra", category: "traccion_horizontal", muscleGroups: ["Espalda", "Bíceps"] },
  { name: "Remo mancuerna", category: "traccion_horizontal", muscleGroups: ["Espalda", "Bíceps"] },
  { name: "Face pull", category: "traccion_horizontal", muscleGroups: ["Hombro posterior"] },
  { name: "Dominadas", category: "traccion_vertical", muscleGroups: ["Espalda", "Bíceps"] },
  { name: "Jalón al pecho", category: "traccion_vertical", muscleGroups: ["Espalda"] },
  { name: "Sentadilla", category: "piernas_rodilla", muscleGroups: ["Cuádriceps", "Glúteo"] },
  { name: "Zancadas", category: "piernas_rodilla", muscleGroups: ["Cuádriceps", "Glúteo"] },
  { name: "Prensa", category: "piernas_rodilla", muscleGroups: ["Cuádriceps"] },
  { name: "Peso muerto", category: "piernas_cadera", muscleGroups: ["Cadena posterior"] },
  { name: "Hip thrust", category: "piernas_cadera", muscleGroups: ["Glúteo"] },
  { name: "Curl femoral", category: "piernas_cadera", muscleGroups: ["Femoral"] },
  { name: "Plancha", category: "core", muscleGroups: ["Core"] },
  { name: "Crunch", category: "core", muscleGroups: ["Abdominal"] },
  { name: "Pallof press", category: "core", muscleGroups: ["Core"] },
  { name: "Cinta", category: "cardio", muscleGroups: ["Cardiovascular"] },
  { name: "Bicicleta", category: "cardio", muscleGroups: ["Cardiovascular"] },
  { name: "Remo (ergómetro)", category: "cardio", muscleGroups: ["Cardiovascular"] },
  { name: "Movilidad general", category: "movilidad", muscleGroups: ["Todo el cuerpo"] },
]

export const libraryNames: readonly string[] = exerciseLibrary.map((exercise) => exercise.name)

export function estimateOneRepMax(weight: number, reps: number): number {
  if (weight <= 0 || reps <= 0) return 0
  return weight * (1 + reps / 30)
}

export const weeklyPlan: readonly WorkoutType[] = [
  "fuerza_a",
  "cardio_z2",
  "fuerza_b",
  "cardio_z2",
  "fuerza_c",
  "movilidad",
  "descanso_activo",
]

export function suggestedExercises(type: string): readonly string[] {
  switch (type) {
    case "fuerza_a":
      return ["Press banca", "Remo mancuerna", "Sentadilla", "Plancha"]
    case "fuerza_b":
      return ["Dominadas", "Peso muerto", "Curl femoral", "Crunch"]
    case "fuerza_c":
      return ["Press militar", "Remo con barra", "Zancadas", "Face pull"]
    case "cardio_z2":
      return ["Cinta"]
    case "movilidad":
      return ["Movilidad general"]
    default:
      return []
  }
}
