export type SpecialMission = Readonly<{
  key: string
  title: string
  description: string
  icon: string
  xp: number
}>

export const specialMissions: readonly SpecialMission[] = [
  {
    key: "extra-veggie",
    title: "Verdura extra",
    description: "Añade una verdura extra en la cena.",
    icon: "🥦",
    xp: 15,
  },
  {
    key: "mobility-10",
    title: "Movilidad",
    description: "Haz 10 minutos de movilidad antes de dormir.",
    icon: "🧘",
    xp: 15,
  },
  {
    key: "walk-1000",
    title: "Pasos extra",
    description: "Camina 1000 pasos más de tu objetivo.",
    icon: "👟",
    xp: 15,
  },
  {
    key: "legume-recipe",
    title: "Receta con legumbres",
    description: "Prueba una receta nueva con legumbres.",
    icon: "🫘",
    xp: 15,
  },
  {
    key: "meal-prep",
    title: "Meal prep",
    description: "Prepara 3 comidas para la próxima semana.",
    icon: "🥗",
    xp: 20,
  },
  {
    key: "outdoor-route",
    title: "Ruta al aire libre",
    description: "Haz una ruta de senderismo de 60+ minutos.",
    icon: "🥾",
    xp: 30,
  },
  {
    key: "water-extra",
    title: "Hidrátate",
    description: "Un vaso de agua extra en cada comida.",
    icon: "💧",
    xp: 10,
  },
  {
    key: "stretch-5",
    title: "Estira",
    description: "Estiramientos suaves al final del día.",
    icon: "🤸",
    xp: 10,
  },
]

function dayOfYearFor(date: string): number {
  const [year, month, day] = date.split("-").map(Number)
  if (!year || !month || !day) return 0
  const start = Date.UTC(year, 0, 0)
  const current = Date.UTC(year, month - 1, day)
  return Math.floor((current - start) / 86_400_000)
}

export function dailySpecialMission(date: string): SpecialMission {
  const index = dayOfYearFor(date) % specialMissions.length
  return specialMissions[index] ?? specialMissions[0] ?? specialMissionsFallback
}

const specialMissionsFallback: SpecialMission = {
  key: "water-extra",
  title: "Hidrátate",
  description: "Un vaso de agua extra en cada comida.",
  icon: "💧",
  xp: 10,
}
