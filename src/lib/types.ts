export const MED_FORMS = ['spray', 'oral', 'drops', 'other'] as const
export type MedForm = (typeof MED_FORMS)[number]

export const FORM_LABELS: Record<MedForm, string> = {
  spray: '喷鼻',
  oral: '口服',
  drops: '滴鼻',
  other: '其他',
}

export type Medication = {
  id: string
  name: string
  form: MedForm
  timesPerDay: number
  doseLabel: string
  active: boolean
}

export type DoseLog = {
  id: string
  medicationId: string
  date: string
  takenAt: string
}

export type SymptomLevel = 0 | 1 | 2 | 3

export const SYMPTOM_KEYS = [
  'runnyNose',
  'congestion',
  'sneezing',
  'cough',
  'sleep',
] as const

export type SymptomKey = (typeof SYMPTOM_KEYS)[number]

export const SYMPTOM_LABELS: Record<SymptomKey, string> = {
  runnyNose: '流鼻涕',
  congestion: '鼻塞',
  sneezing: '打喷嚏',
  cough: '咳嗽',
  sleep: '夜间睡眠',
}

export const LEVEL_LABELS = ['无', '轻', '中', '重'] as const

export const OVERALL_OPTIONS = ['better', 'same', 'worse'] as const
export type Overall = (typeof OVERALL_OPTIONS)[number]

export const OVERALL_LABELS: Record<Overall, string> = {
  better: '好转',
  same: '差不多',
  worse: '加重',
}

export type SymptomLog = {
  date: string
  runnyNose: SymptomLevel
  congestion: SymptomLevel
  sneezing: SymptomLevel
  cough: SymptomLevel
  sleep: SymptomLevel
  overall: Overall | null
  note: string
}

export type WeatherLog = {
  date: string
  city: string
  tempMax: number
  tempMin: number
  humidity: number
  weatherCode: number
  conditionLabel: string
  precipitation: number
  tempDrop: boolean
}

export type Settings = {
  childName: string
  city: string
  latitude: number | null
  longitude: number | null
}

export type AppState = {
  medications: Medication[]
  doseLogs: DoseLog[]
  symptomLogs: Record<string, SymptomLog>
  weatherLogs: Record<string, WeatherLog>
  settings: Settings
}

export const STORAGE_KEY = 'rhinitis-log-v1'

export const defaultSettings: Settings = {
  childName: '宝宝',
  city: '北京',
  latitude: 39.9042,
  longitude: 116.4074,
}

export function emptySymptomLog(date: string): SymptomLog {
  return {
    date,
    runnyNose: 0,
    congestion: 0,
    sneezing: 0,
    cough: 0,
    sleep: 0,
    overall: null,
    note: '',
  }
}

export function defaultState(): AppState {
  return {
    medications: [],
    doseLogs: [],
    symptomLogs: {},
    weatherLogs: {},
    settings: { ...defaultSettings },
  }
}

export function maxSymptomLevel(log: SymptomLog | undefined): SymptomLevel {
  if (!log) return 0
  return Math.max(
    log.runnyNose,
    log.congestion,
    log.sneezing,
    log.cough,
    log.sleep,
  ) as SymptomLevel
}
