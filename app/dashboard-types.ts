export type DashboardAction = Readonly<{
  slug: string
  label: string
  detail: string
  icon: string
  completed: boolean
}>

export type DashboardDay = Readonly<{
  date: string
  label: string
  number: string
  completedActions: number
  totalActions: number
}>

export type DashboardResponse = Readonly<{
  profile: Readonly<{ displayName: string }>
  today: Readonly<{
    date: string
    actions: readonly DashboardAction[]
  }>
  week: readonly DashboardDay[]
}>
