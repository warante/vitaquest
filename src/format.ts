export function formatMetricValue(value: number, decimals: number): string {
  return value.toFixed(decimals).replace(".", ",")
}

export function formatShortDate(isoDate: string): string {
  const [year, month, day] = isoDate.split("-")
  if (!year || !month || !day) return isoDate
  return `${day}/${month}/${year.slice(2)}`
}
