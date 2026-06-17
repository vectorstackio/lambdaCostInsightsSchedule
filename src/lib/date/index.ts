// lib/date/index.ts

export function getPreviousMonthYYYYMM(date = new Date()): string {
  const d = new Date(date)

  // move to previous month
  d.setMonth(d.getMonth() - 1)

  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')

  return `${year}-${month}`
}