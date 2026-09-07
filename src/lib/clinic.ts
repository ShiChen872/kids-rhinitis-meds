import { formatShortDate, lastNDates } from './date'
import {
  LEVEL_LABELS,
  maxSymptomLevel,
  type AppState,
  type Medication,
} from './types'
import { isRainy } from './weather'

export const CLINIC_DAYS = 14

export type ClinicDay = {
  date: string
  maxSymptom: number
  tempMin: number | null
  weatherNote: string
  doses: Record<string, number>
}

export type ClinicMed = {
  id: string
  name: string
  planned: number
  taken: number
}

export type ClinicReport = {
  childName: string
  start: string
  end: string
  days: ClinicDay[]
  meds: ClinicMed[]
}

function weatherNote(state: AppState, date: string) {
  const weather = state.weatherLogs[date]
  if (!weather) return ''
  const parts: string[] = []
  if (weather.tempDrop) parts.push('降温')
  if (isRainy(weather.weatherCode, weather.precipitation)) parts.push('有雨')
  return parts.join('·')
}

function medsForReport(state: AppState, dates: string[]): Medication[] {
  const usedIds = new Set(
    state.doseLogs.filter((d) => dates.includes(d.date)).map((d) => d.medicationId),
  )
  const listed = state.medications.filter((m) => m.active || usedIds.has(m.id))
  return listed.length > 0 ? listed : state.medications
}

export function buildClinicReport(state: AppState, end?: string): ClinicReport {
  const dates = lastNDates(CLINIC_DAYS, end)
  const meds = medsForReport(state, dates)
  const days: ClinicDay[] = dates.map((date) => {
    const doses: Record<string, number> = {}
    for (const med of meds) {
      doses[med.id] = state.doseLogs.filter(
        (d) => d.medicationId === med.id && d.date === date,
      ).length
    }
    const weather = state.weatherLogs[date]
    return {
      date,
      maxSymptom: maxSymptomLevel(state.symptomLogs[date]),
      tempMin: weather ? weather.tempMin : null,
      weatherNote: weatherNote(state, date),
      doses,
    }
  })

  return {
    childName: state.settings.childName,
    start: dates[0],
    end: dates[dates.length - 1],
    days,
    meds: meds.map((med) => ({
      id: med.id,
      name: med.name,
      planned: med.timesPerDay * CLINIC_DAYS,
      taken: days.reduce((sum, day) => sum + (day.doses[med.id] ?? 0), 0),
    })),
  }
}

export function clinicReportText(report: ClinicReport) {
  const lines = [
    `${report.childName} 近${CLINIC_DAYS}天用药（${formatShortDate(report.start)}–${formatShortDate(report.end)}）`,
    '',
    ...report.meds.map((med) => `${med.name} ${med.taken}/${med.planned} 次`),
    '',
    '日期  最低温  变天  症状  用药',
  ]
  for (const day of report.days) {
    const doseBits = report.meds
      .map((med) => `${med.name.replace(/\s/g, '')}${day.doses[med.id] ?? 0}`)
      .join(' ')
    lines.push(
      `${formatShortDate(day.date)}  ${day.tempMin == null ? '—' : `${day.tempMin}°`}  ${day.weatherNote || '—'}  ${LEVEL_LABELS[day.maxSymptom as 0 | 1 | 2 | 3]}  ${doseBits}`,
    )
  }
  lines.push('', '仅供复诊对照，不能替代医嘱。')
  return lines.join('\n')
}
