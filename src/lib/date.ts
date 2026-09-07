const WEEKDAYS = ['日', '一', '二', '三', '四', '五', '六']

export function todayStr(d = new Date()): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function parseDate(date: string): Date {
  const [y, m, d] = date.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function formatLongDate(date: string): string {
  const d = parseDate(date)
  return `${d.getMonth() + 1}月${d.getDate()}日 星期${WEEKDAYS[d.getDay()]}`
}

export function formatTime(iso: string): string {
  const d = new Date(iso)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

export function setLocalTime(date: string, hhmm: string): string | null {
  const match = /^(\d{1,2}):(\d{2})$/.exec(hhmm.trim())
  if (!match) return null
  const hours = Number(match[1])
  const minutes = Number(match[2])
  if (hours > 23 || minutes > 59) return null
  const d = parseDate(date)
  d.setHours(hours, minutes, 0, 0)
  return d.toISOString()
}

export function takenAtOnDate(date: string, from = new Date()): string {
  if (date === todayStr(from)) return from.toISOString()
  const d = parseDate(date)
  d.setHours(from.getHours(), from.getMinutes(), 0, 0)
  return d.toISOString()
}

export function shiftMonth(year: number, month: number, delta: number): { year: number; month: number } {
  const d = new Date(year, month - 1 + delta, 1)
  return { year: d.getFullYear(), month: d.getMonth() + 1 }
}

export function daysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate()
}

export function monthGrid(year: number, month: number): (string | null)[] {
  const first = new Date(year, month - 1, 1)
  const blanks = first.getDay()
  const count = daysInMonth(year, month)
  const cells: (string | null)[] = Array.from({ length: blanks }, () => null)
  for (let day = 1; day <= count; day += 1) {
    cells.push(
      `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
    )
  }
  while (cells.length % 7 !== 0) cells.push(null)
  return cells
}

export function addDays(date: string, delta: number): string {
  const d = parseDate(date)
  d.setDate(d.getDate() + delta)
  return todayStr(d)
}

export function lastNDates(n: number, end = todayStr()): string[] {
  return Array.from({ length: n }, (_, i) => addDays(end, -(n - 1 - i)))
}

export function formatShortDate(date: string): string {
  const d = parseDate(date)
  return `${d.getMonth() + 1}/${d.getDate()}`
}
