import { useEffect, useState } from 'react'
import { Card } from '../components/Screen'
import { addDays, formatLongDate, formatTime, todayStr } from '../lib/date'
import {
  getState,
  logDose,
  saveWeather,
  undoLastDose,
  updateSymptoms,
  useAppState,
} from '../lib/storage'
import {
  FORM_LABELS,
  LEVEL_LABELS,
  OVERALL_LABELS,
  OVERALL_OPTIONS,
  SYMPTOM_KEYS,
  SYMPTOM_LABELS,
  type Overall,
  type SymptomKey,
  type SymptomLevel,
} from '../lib/types'
import { fetchWeather, isRainy } from '../lib/weather'

export function TodayPage({ onGoMeds }: { onGoMeds: () => void }) {
  const { medications, doseLogs, symptomLogs, weatherLogs, settings } = useAppState()
  const date = todayStr()
  const weather = weatherLogs[date]
  const symptoms = symptomLogs[date]
  const activeMeds = medications.filter((m) => m.active)
  const [weatherError, setWeatherError] = useState('')

  useEffect(() => {
    let cancelled = false
    const { city, latitude, longitude } = settings
    if (latitude == null || longitude == null) return
    const existing = getState().weatherLogs[date]
    if (existing && existing.city === city) return

    fetchWeather({
      date,
      city,
      latitude,
      longitude,
      yesterdayMin: getState().weatherLogs[addDays(date, -1)]?.tempMin,
    })
      .then((log) => {
        if (!cancelled) {
          saveWeather(log)
          setWeatherError('')
        }
      })
      .catch(() => {
        if (!cancelled) setWeatherError('天气暂时拉不到，不影响打卡')
      })

    return () => {
      cancelled = true
    }
  }, [date, settings.city, settings.latitude, settings.longitude])

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <header className="safe-top px-5 pb-3">
        <p className="text-sm text-muted">{settings.childName}的用药</p>
        <h1 className="mt-1 text-[22px] font-semibold tracking-tight">今日</h1>
        <p className="mt-1 text-sm text-muted">{formatLongDate(date)}</p>
      </header>

      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 pb-28">
        <Card>
          {weather ? (
            <div>
              <div className="flex items-baseline justify-between gap-3">
                <p className="text-lg font-semibold">
                  {weather.tempMax}° / {weather.tempMin}°
                </p>
                <p className="text-sm text-muted">
                  {weather.conditionLabel} · 湿度 {weather.humidity}%
                </p>
              </div>
              <p className="mt-1 text-xs text-muted">{weather.city}</p>
              {(weather.tempDrop || isRainy(weather.weatherCode, weather.precipitation)) && (
                <p className="mt-3 rounded-2xl bg-gold/30 px-3 py-2 text-sm">
                  天气变化
                  {weather.tempDrop ? '：较昨天明显降温' : ''}
                  {isRainy(weather.weatherCode, weather.precipitation) ? '：有降雨' : ''}
                </p>
              )}
            </div>
          ) : (
            <p className="text-sm text-muted">{weatherError || '正在获取天气…'}</p>
          )}
        </Card>

        <div>
          <h2 className="mb-2 px-1 text-sm font-medium text-muted">按医嘱打卡</h2>
          {activeMeds.length === 0 ? (
            <Card>
              <p className="text-sm text-muted">还没有启用中的药物。</p>
              <button
                type="button"
                onClick={onGoMeds}
                className="mt-3 min-h-12 w-full rounded-2xl bg-teal text-base font-medium text-white"
              >
                去添加药物
              </button>
            </Card>
          ) : (
            <div className="space-y-3">
              {activeMeds.map((med) => {
                const todays = doseLogs
                  .filter((d) => d.medicationId === med.id && d.date === date)
                  .sort((a, b) => a.takenAt.localeCompare(b.takenAt))
                const used = todays.length
                const over = used > med.timesPerDay
                return (
                  <Card key={med.id}>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold">{med.name}</p>
                        <p className="mt-1 text-sm text-muted">
                          {FORM_LABELS[med.form]} · {med.doseLabel || '按医嘱'} · 每天 {med.timesPerDay} 次
                        </p>
                      </div>
                      <p className={`text-sm font-medium ${over ? 'text-coral' : 'text-teal-dark'}`}>
                        已用 {used}/{med.timesPerDay}
                      </p>
                    </div>
                    {over ? <p className="mt-2 text-xs text-coral">已超医嘱，仍可记录</p> : null}
                    {todays.length > 0 ? (
                      <p className="mt-2 text-xs text-muted">
                        {todays.map((d) => formatTime(d.takenAt)).join('  ·  ')}
                      </p>
                    ) : null}
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => logDose(med.id, date)}
                        className="min-h-12 rounded-2xl bg-teal text-base font-medium text-white active:bg-teal-dark"
                      >
                        记一次
                      </button>
                      <button
                        type="button"
                        disabled={used === 0}
                        onClick={() => undoLastDose(med.id, date)}
                        className="min-h-12 rounded-2xl border border-line bg-paper text-base font-medium disabled:opacity-40"
                      >
                        撤销
                      </button>
                    </div>
                  </Card>
                )
              })}
            </div>
          )}
        </div>

        <Card>
          <h2 className="text-sm font-medium text-muted">今日感觉</h2>
          <div className="mt-3 space-y-4">
            {SYMPTOM_KEYS.map((key) => (
              <SymptomRow
                key={key}
                label={SYMPTOM_LABELS[key]}
                value={(symptoms?.[key] ?? 0) as SymptomLevel}
                onChange={(level) => updateSymptoms(date, { [key]: level } as Record<SymptomKey, SymptomLevel>)}
              />
            ))}
          </div>
          <div className="mt-5">
            <p className="text-sm text-muted">整体</p>
            <div className="mt-2 grid grid-cols-3 gap-2">
              {OVERALL_OPTIONS.map((opt) => {
                const active = symptoms?.overall === opt
                return (
                  <button
                    key={opt}
                    type="button"
                    onClick={() =>
                      updateSymptoms(date, { overall: (active ? null : opt) as Overall | null })
                    }
                    className={`min-h-11 rounded-2xl text-sm font-medium ${
                      active ? 'bg-teal text-white' : 'bg-paper text-ink'
                    }`}
                  >
                    {OVERALL_LABELS[opt]}
                  </button>
                )
              })}
            </div>
          </div>
          <label className="mt-4 block">
            <span className="text-sm text-muted">备注</span>
            <textarea
              value={symptoms?.note ?? ''}
              onChange={(e) => updateSymptoms(date, { note: e.target.value })}
              rows={2}
              placeholder="可选，比如夜里咳了几声"
              className="mt-2 w-full resize-none rounded-2xl border border-line bg-paper px-3 py-3 text-base outline-none"
            />
          </label>
        </Card>
      </div>
    </div>
  )
}

function SymptomRow({
  label,
  value,
  onChange,
}: {
  label: string
  value: SymptomLevel
  onChange: (level: SymptomLevel) => void
}) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <span className="text-sm">{label}</span>
        <span className="text-xs text-muted">{LEVEL_LABELS[value]}</span>
      </div>
      <div className="grid grid-cols-4 gap-2">
        {([0, 1, 2, 3] as SymptomLevel[]).map((level) => {
          const active = value === level
          const color =
            level === 0
              ? 'bg-mint/70'
              : level === 1
                ? 'bg-mint'
                : level === 2
                  ? 'bg-gold'
                  : 'bg-coral text-white'
          return (
            <button
              key={level}
              type="button"
              onClick={() => onChange(level)}
              className={`min-h-10 rounded-xl text-sm ${
                active ? `${color} font-semibold` : 'bg-paper text-muted'
              }`}
            >
              {LEVEL_LABELS[level]}
            </button>
          )
        })}
      </div>
    </div>
  )
}
