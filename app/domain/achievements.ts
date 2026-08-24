export type AchievementCategory = "primeros_pasos" | "rachas" | "fuerza" | "cardio" | "analiticas"

export type Rarity = "comun" | "poco_comun" | "raro" | "epico" | "legendario"

export type AchievementDefinition = Readonly<{
  key: string
  name: string
  description: string
  icon: string
  category: AchievementCategory
  rarity: Rarity
}>

export const achievementDefinitions: readonly AchievementDefinition[] = [
  {
    key: "first-mission",
    name: "Primera misión",
    description: "Completa tu primera misión diaria.",
    icon: "🌱",
    category: "primeros_pasos",
    rarity: "comun",
  },
  {
    key: "first-session",
    name: "Primera sesión",
    description: "Registra tu primera sesión de entrenamiento.",
    icon: "🏋️",
    category: "primeros_pasos",
    rarity: "comun",
  },
  {
    key: "first-metric",
    name: "Primera analítica",
    description: "Registra tu primera métrica de salud.",
    icon: "🩺",
    category: "primeros_pasos",
    rarity: "comun",
  },
  {
    key: "streak-7",
    name: "Una semana en racha",
    description: "Mantén una racha de 7 días.",
    icon: "🔥",
    category: "rachas",
    rarity: "poco_comun",
  },
  {
    key: "streak-30",
    name: "Un mes imparable",
    description: "Mantén una racha de 30 días.",
    icon: "🏆",
    category: "rachas",
    rarity: "epico",
  },
  {
    key: "first-pr",
    name: "Primer récord",
    description: "Registra una serie con peso.",
    icon: "💪",
    category: "fuerza",
    rarity: "poco_comun",
  },
  {
    key: "strength-10",
    name: "Forjador de hierro",
    description: "Completa 10 sesiones de fuerza.",
    icon: "🏋️",
    category: "fuerza",
    rarity: "raro",
  },
  {
    key: "cardio-10",
    name: "Corazón de atleta",
    description: "Completa 10 sesiones de cardio.",
    icon: "🫀",
    category: "cardio",
    rarity: "raro",
  },
  {
    key: "trends-3",
    name: "Tendencias sanas",
    description: "Tres métricas con tendencia positiva.",
    icon: "📉",
    category: "analiticas",
    rarity: "raro",
  },
  {
    key: "data-5",
    name: "Coleccionista de datos",
    description: "Registra 5 o más analíticas.",
    icon: "📊",
    category: "analiticas",
    rarity: "raro",
  },
]

export type AchievementInput = Readonly<{
  completedActionsTotal: number
  streakDays: number
  strengthSessions: number
  cardioSessions: number
  sessionsTotal: number
  metricsCount: number
  positiveTrends: number
  hasPr: boolean
}>

export type AchievementState = Readonly<{
  key: string
  name: string
  description: string
  icon: string
  category: AchievementCategory
  rarity: Rarity
  unlocked: boolean
}>

function isUnlocked(key: string, input: AchievementInput): boolean {
  switch (key) {
    case "first-mission":
      return input.completedActionsTotal >= 1
    case "first-session":
      return input.sessionsTotal >= 1
    case "first-metric":
      return input.metricsCount >= 1
    case "streak-7":
      return input.streakDays >= 7
    case "streak-30":
      return input.streakDays >= 30
    case "first-pr":
      return input.hasPr
    case "strength-10":
      return input.strengthSessions >= 10
    case "cardio-10":
      return input.cardioSessions >= 10
    case "trends-3":
      return input.positiveTrends >= 3
    case "data-5":
      return input.metricsCount >= 5
    default:
      return false
  }
}

export function evaluateAchievements(input: AchievementInput): readonly AchievementState[] {
  return achievementDefinitions.map((definition) => ({
    ...definition,
    unlocked: isUnlocked(definition.key, input),
  }))
}
