import { useSyncExternalStore } from 'react'
import {
  defaultState,
  emptySymptomLog,
  STORAGE_KEY,
  type AppState,
  type Medication,
  type Settings,
  type SymptomLog,
  type WeatherLog,
} from './types'
import { todayStr } from './date'

const listeners = new Set<() => void>()

function createId(): string {
  if (typeof crypto.randomUUID === 'function') return crypto.randomUUID()

  const values = new Uint32Array(4)
  crypto.getRandomValues(values)
  return Array.from(values, (value) => value.toString(16).padStart(8, '0')).join('-')
}

function load(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return defaultState()
    const parsed = JSON.parse(raw) as Partial<AppState>
    const base = defaultState()
    return {
      medications: parsed.medications ?? base.medications,
      doseLogs: parsed.doseLogs ?? base.doseLogs,
      symptomLogs: parsed.symptomLogs ?? base.symptomLogs,
      weatherLogs: parsed.weatherLogs ?? base.weatherLogs,
      settings: { ...base.settings, ...parsed.settings },
    }
  } catch {
    return defaultState()
  }
}

let state: AppState = load()

function emit(next: AppState) {
  state = next
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  listeners.forEach((fn) => fn())
}

function subscribe(fn: () => void) {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

export function getState(): AppState {
  return state
}

export function useAppState(): AppState {
  return useSyncExternalStore(subscribe, getState, getState)
}

export function replaceState(next: AppState) {
  emit(next)
}

export function resetAll() {
  emit(defaultState())
}

export function updateSettings(patch: Partial<Settings>) {
  emit({
    ...state,
    settings: { ...state.settings, ...patch },
  })
}

export function addMedication(input: Omit<Medication, 'id'>) {
  const med: Medication = { ...input, id: createId() }
  emit({ ...state, medications: [...state.medications, med] })
}

export function updateMedication(id: string, patch: Partial<Medication>) {
  emit({
    ...state,
    medications: state.medications.map((m) => (m.id === id ? { ...m, ...patch } : m)),
  })
}

export function removeMedication(id: string) {
  emit({
    ...state,
    medications: state.medications.filter((m) => m.id !== id),
  })
}

export function logDose(medicationId: string, date = todayStr()) {
  emit({
    ...state,
    doseLogs: [
      ...state.doseLogs,
      {
        id: createId(),
        medicationId,
        date,
        takenAt: new Date().toISOString(),
      },
    ],
  })
}

export function undoLastDose(medicationId: string, date = todayStr()) {
  const logs = state.doseLogs.filter((d) => d.medicationId === medicationId && d.date === date)
  const last = logs.at(-1)
  if (!last) return
  emit({
    ...state,
    doseLogs: state.doseLogs.filter((d) => d.id !== last.id),
  })
}

export function updateSymptoms(date: string, patch: Partial<SymptomLog>) {
  const current = state.symptomLogs[date] ?? emptySymptomLog(date)
  emit({
    ...state,
    symptomLogs: {
      ...state.symptomLogs,
      [date]: { ...current, ...patch, date },
    },
  })
}

export function saveWeather(log: WeatherLog) {
  emit({
    ...state,
    weatherLogs: { ...state.weatherLogs, [log.date]: log },
  })
}

export function dosesOn(date: string, medicationId: string) {
  return state.doseLogs.filter((d) => d.date === date && d.medicationId === medicationId)
}

export function parseBackup(raw: string): AppState {
  const parsed = JSON.parse(raw) as Partial<AppState>
  if (!parsed || typeof parsed !== 'object') throw new Error('备份格式不对')
  const base = defaultState()
  return {
    medications: Array.isArray(parsed.medications) ? parsed.medications : base.medications,
    doseLogs: Array.isArray(parsed.doseLogs) ? parsed.doseLogs : base.doseLogs,
    symptomLogs: parsed.symptomLogs ?? base.symptomLogs,
    weatherLogs: parsed.weatherLogs ?? base.weatherLogs,
    settings: { ...base.settings, ...parsed.settings },
  }
}
