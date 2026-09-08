import type { DoseLog, Medication } from './types'

export type DoseNudge = {
  medicationId: string
  name: string
  used: number
  timesPerDay: number
  remaining: string[]
  line: string
}

function slotLabels(timesPerDay: number): string[] {
  if (timesPerDay <= 1) return ['今天']
  if (timesPerDay === 2) return ['上午', '晚上']
  if (timesPerDay === 3) return ['早上', '中午', '晚上']
  return Array.from({ length: timesPerDay }, (_, i) => `第${i + 1}次`)
}

export function remainingSlots(timesPerDay: number, used: number): string[] {
  if (used >= timesPerDay) return []
  return slotLabels(timesPerDay).slice(Math.max(0, used))
}

export function missingDoseLine(timesPerDay: number, used: number): string | null {
  const remaining = remainingSlots(timesPerDay, used)
  if (remaining.length === 0) return null
  if (timesPerDay <= 1) return '今天还没记'
  if (remaining.length === 1) return `${remaining[0]}那次还没记`
  return `${remaining.join('、')}还没记`
}

export function usedOnDate(doseLogs: DoseLog[], medicationId: string, date: string): number {
  return doseLogs.filter((d) => d.medicationId === medicationId && d.date === date).length
}

export function incompleteDoses(
  medications: Medication[],
  doseLogs: DoseLog[],
  date: string,
): DoseNudge[] {
  return medications.flatMap((med) => {
    const used = usedOnDate(doseLogs, med.id, date)
    const remaining = remainingSlots(med.timesPerDay, used)
    const line = missingDoseLine(med.timesPerDay, used)
    if (!line) return []
    return [
      {
        medicationId: med.id,
        name: med.name,
        used,
        timesPerDay: med.timesPerDay,
        remaining,
        line,
      },
    ]
  })
}
