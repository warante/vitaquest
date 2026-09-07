export type TemporalEvent = Readonly<{
  key: string
  title: string
  description: string
  icon: string
  xp: number
  period: string
}>

type MonthlyEvent = Omit<TemporalEvent, "period">

const monthlyEvents: readonly MonthlyEvent[] = [
  {
    key: "enero-movimiento",
    title: "Reto de enero: movimiento diario",
    description: "31 días con al menos un bloque de movimiento.",
    icon: "🚶",
    xp: 120,
  },
  {
    key: "febrero-hidratacion",
    title: "Febrero hidratado",
    description: "Agua como bebida principal durante todo el mes.",
    icon: "💧",
    xp: 120,
  },
  {
    key: "marzo-fuerza",
    title: "Marzo de fuerza",
    description: "Consolida tus tres sesiones de fuerza semanales.",
    icon: "🏋️",
    xp: 120,
  },
  {
    key: "abril-verde",
    title: "Abril verde",
    description: "Verdura en comida y cena cada día.",
    icon: "🥦",
    xp: 120,
  },
  {
    key: "mayo-z2",
    title: "Mayo en zona 2",
    description: "Cardio suave en zona 2 dos veces por semana.",
    icon: "🫀",
    xp: 120,
  },
  {
    key: "junio-fibra",
    title: "Junio de fibra",
    description: "Acércate a tu objetivo diario de fibra.",
    icon: "🌾",
    xp: 120,
  },
  {
    key: "julio-exterior",
    title: "Julio al aire libre",
    description: "Caminatas o rutas al aire libre cada semana.",
    icon: "🥾",
    xp: 120,
  },
  {
    key: "agosto-constancia",
    title: "Agosto de constancia",
    description: "Mantén una racha de 30 días.",
    icon: "🔥",
    xp: 120,
  },
  {
    key: "septiembre-proteina",
    title: "Septiembre de proteína",
    description: "Una fuente de proteína en cada comida.",
    icon: "🍗",
    xp: 120,
  },
  {
    key: "octubre-legumbres",
    title: "Octubre de legumbres",
    description: "Legumbres al menos dos veces por semana.",
    icon: "🫘",
    xp: 120,
  },
  {
    key: "noviembre-descanso",
    title: "Noviembre de descanso",
    description: "Prioriza un sueño reparador cada noche.",
    icon: "🌙",
    xp: 120,
  },
  {
    key: "diciembre-equilibrado",
    title: "Diciembre equilibrado",
    description: "Sin bebidas azucaradas ni ultraprocesados.",
    icon: "🚫",
    xp: 120,
  },
]

const monthNames = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
] as const

const fallbackEvent: MonthlyEvent = {
  key: "constancia",
  title: "Reto de constancia",
  description: "Mantén tu ritmo de hábitos durante todo el mes.",
  icon: "🔥",
  xp: 120,
}

export function monthlyEvent(date: string): TemporalEvent {
  const [yearText, monthText] = date.split("-")
  const year = Number(yearText)
  const month = Number(monthText)
  const isValid = Number.isInteger(year) && month >= 1 && month <= 12
  const monthIndex = isValid ? month - 1 : new Date().getUTCMonth()
  const event = monthlyEvents[monthIndex] ?? fallbackEvent
  const period = isValid ? `${monthNames[monthIndex]} ${year}` : ""
  return { ...event, period }
}
