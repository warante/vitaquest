export const LEVEL_TITLES = [
  "Novato",
  "Explorador",
  "Guerrero",
  "Veterano",
  "Maestro",
  "Leyenda",
] as const

export const LEVEL_THRESHOLDS = [0, 100, 300, 600, 1000, 1500] as const

export function levelForXp(xp: number): number {
  let level = 1
  for (let index = 0; index < LEVEL_THRESHOLDS.length; index++) {
    if (xp >= (LEVEL_THRESHOLDS[index] ?? 0)) level = index + 1
  }
  return level
}

export function levelTitle(level: number): string {
  return LEVEL_TITLES[Math.min(level, LEVEL_TITLES.length) - 1] ?? "Leyenda"
}

export type Theme = "verde" | "azul" | "purpura" | "dorado"

export function themeForLevel(level: number): Theme {
  if (level >= 6) return "dorado"
  if (level >= 5) return "purpura"
  if (level >= 3) return "azul"
  return "verde"
}

export type LevelProgress = Readonly<{
  level: number
  title: string
  currentXp: number
  nextThreshold: number | null
  progress: number
}>

export function levelProgress(totalXp: number): LevelProgress {
  const level = levelForXp(totalXp)
  const currentThreshold = LEVEL_THRESHOLDS[level - 1] ?? 0
  const nextThreshold = LEVEL_THRESHOLDS[level] ?? null
  const progress =
    nextThreshold === null
      ? 100
      : Math.round(((totalXp - currentThreshold) / (nextThreshold - currentThreshold)) * 100)
  return {
    level,
    title: levelTitle(level),
    currentXp: totalXp,
    nextThreshold,
    progress,
  }
}
