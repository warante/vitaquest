export type WeeklyChallenge = Readonly<{
  slug: string
  title: string
  detail: string
  icon: string
}>

export const weeklyChallenges: readonly WeeklyChallenge[] = [
  {
    slug: "post-meal-walks-10",
    title: "10 caminatas postcomida",
    detail: "Acumula 10 paseos de 10-15 min.",
    icon: "🎯",
  },
  {
    slug: "strength-3",
    title: "3 sesiones de fuerza",
    detail: "Completa Fuerza A, B y C.",
    icon: "🎯",
  },
  {
    slug: "legumes-2",
    title: "2 comidas con legumbres",
    detail: "Lentejas, garbanzos o alubias.",
    icon: "🎯",
  },
  {
    slug: "bluefish-2",
    title: "2 raciones de pescado azul",
    detail: "Salmón, sardinas, caballa...",
    icon: "🎯",
  },
  {
    slug: "no-sugary-7",
    title: "7 días sin bebidas azucaradas",
    detail: "Agua como bebida principal.",
    icon: "🎯",
  },
]
