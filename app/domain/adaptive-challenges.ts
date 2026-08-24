export type ChallengeTier = "facil" | "medio" | "dificil" | "especial"

export type AdaptiveChallenge = Readonly<{
  key: string
  title: string
  description: string
  icon: string
  xp: number
  tier: ChallengeTier
}>

export const adaptiveChallenges: readonly AdaptiveChallenge[] = [
  {
    key: "walk-3-days",
    tier: "facil",
    title: "Tres paseos postcomida",
    description: "Completa 3 caminatas de 10-15 min esta semana.",
    icon: "🚶",
    xp: 30,
  },
  {
    key: "strength-2",
    tier: "facil",
    title: "Dos sesiones de fuerza",
    description: "Completa dos sesiones de fuerza esta semana.",
    icon: "🏋️",
    xp: 30,
  },
  {
    key: "adherence-7-80",
    tier: "medio",
    title: "Semana al 80%",
    description: "Siete días con al menos el 80% de misiones completadas.",
    icon: "🎯",
    xp: 60,
  },
  {
    key: "strength-3-types",
    tier: "medio",
    title: "Las tres fuerzas",
    description: "Completa Fuerza A, B y C en la misma semana.",
    icon: "⚡",
    xp: 60,
  },
  {
    key: "adherence-4w-85",
    tier: "dificil",
    title: "Mes sólido",
    description: "Cuatro semanas consecutivas con adherencia superior al 85%.",
    icon: "🏆",
    xp: 120,
  },
  {
    key: "legendary-week",
    tier: "especial",
    title: "Semana legendaria",
    description: "Tres sesiones de fuerza y dos de cardio en una semana.",
    icon: "🌟",
    xp: 150,
  },
]

const tierRank: Readonly<Record<ChallengeTier, number>> = {
  facil: 1,
  medio: 2,
  dificil: 3,
  especial: 4,
}

export function tierForLevel(level: number): ChallengeTier {
  if (level >= 6) return "especial"
  if (level >= 5) return "dificil"
  if (level >= 3) return "medio"
  return "facil"
}

export function adaptiveChallengesFor(level: number): readonly AdaptiveChallenge[] {
  const rank = tierRank[tierForLevel(level)]
  return adaptiveChallenges.filter((challenge) => tierRank[challenge.tier] <= rank)
}
