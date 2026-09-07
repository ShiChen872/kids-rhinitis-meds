import { addDays, todayStr } from './date'
import type { DoseLog, Medication, PackUnit } from './types'
import { PACK_UNIT_LABELS } from './types'

export type BottleStatus = {
  unit: PackUnit
  unitLabel: string
  packAmount: number
  doseAmount: number
  used: number
  remaining: number
  doseCount: number
  daysLeft: number
  emptyDate: string | null
  low: boolean
  empty: boolean
}

export function prettyAmount(value: number) {
  const rounded = Math.round(value * 10) / 10
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1)
}

export function bottleStatus(med: Medication, logs: DoseLog[], today = todayStr()): BottleStatus | null {
  if (
    med.packAmount == null ||
    med.packAmount <= 0 ||
    med.doseAmount == null ||
    med.doseAmount <= 0 ||
    !med.packUnit
  ) {
    return null
  }

  const openedAt = med.bottleOpenedAt
  const bottleLogs = openedAt
    ? logs.filter((d) => d.medicationId === med.id && d.takenAt >= openedAt)
    : []
  const used = bottleLogs.length * med.doseAmount
  const remaining = Math.max(0, Math.round((med.packAmount - used) * 10) / 10)
  const daily = med.doseAmount * med.timesPerDay
  const daysLeft = daily > 0 ? remaining / daily : 0
  const wholeDays = Math.max(0, Math.ceil(daysLeft - 1e-9))
  const empty = remaining <= 0
  const emptyDate = empty ? today : wholeDays > 0 ? addDays(today, Math.max(0, wholeDays - 1)) : today

  return {
    unit: med.packUnit,
    unitLabel: PACK_UNIT_LABELS[med.packUnit],
    packAmount: med.packAmount,
    doseAmount: med.doseAmount,
    used: Math.round(used * 10) / 10,
    remaining,
    doseCount: bottleLogs.length,
    daysLeft: Math.round(daysLeft * 10) / 10,
    emptyDate,
    low: empty || daysLeft <= 3,
    empty,
  }
}

export function bottleSummary(status: BottleStatus) {
  const remain = `${prettyAmount(status.remaining)}${status.unitLabel}`
  const pack = `${prettyAmount(status.packAmount)}${status.unitLabel}`
  if (status.empty) return `这瓶 ${pack} 已经用完，请开新一瓶`
  if (status.daysLeft < 1) return `这瓶还剩 ${remain}，今天或明天该换新`
  return `这瓶还剩 ${remain} / ${pack}，大约还能用 ${prettyAmount(status.daysLeft)} 天，预计 ${formatMonthDay(status.emptyDate)} 换新`
}

function formatMonthDay(date: string | null) {
  if (!date) return ''
  const [, m, d] = date.split('-')
  return `${Number(m)}月${Number(d)}日`
}
