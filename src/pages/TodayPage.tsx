import { Card } from '../components/Screen'
import { DoseCheckIn } from '../components/DoseCheckIn'
import { WeatherCompare } from '../components/WeatherCompare'
import { addDays, formatLongDate, todayStr } from '../lib/date'
import {
  updateSymptoms,
  useAppState,
} from '../lib/storage'
import {
  LEVEL_LABELS,
  OVERALL_LABELS,
  OVERALL_OPTIONS,
  SYMPTOM_KEYS,
  SYMPTOM_LABELS,
  type Overall,
  type SymptomKey,
  type SymptomLevel,
} from '../lib/types'
import { useWeatherBackfill } from '../lib/useWeatherBackfill'
import { isRainy } from '../lib/weather'

export function TodayPage({
  onGoMeds,
  onGoYesterday,
}: {
  onGoMeds: () => void
  onGoYesterday: () => void
}) {
  const { medications, doseLogs, symptomLogs, weatherLogs, settings } = useAppState()
  const date = todayStr()
  const yesterday = addDays(date, -1)
  const weather = weatherLogs[date]
  const symptoms = symptomLogs[date]
  const activeMeds = medications.filter((m) => m.active)
  const weatherError = useWeatherBackfill()
  const yesterdayIncomplete = activeMeds.some((med) => {
    const used = doseLogs.filter((d) => d.medicationId === med.id && d.date === yesterday).length
    return used < med.timesPerDay
  })

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

        <WeatherCompare weatherLogs={weatherLogs} symptomLogs={symptomLogs} />

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
            <DoseCheckIn
              date={date}
              medications={activeMeds}
              doseLogs={doseLogs}
              canEdit
              showBottle
            />
          )}
          {activeMeds.length > 0 && yesterdayIncomplete ? (
            <button
              type="button"
              onClick={onGoYesterday}
              className="mt-3 min-h-12 w-full rounded-2xl bg-gold/40 text-base font-medium"
            >
              昨天还有药没记完，去补记
            </button>
          ) : activeMeds.length > 0 ? (
            <p className="mt-3 px-1 text-xs text-muted">漏记了去日历点那一天；点钟点可改时间。</p>
          ) : null}
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
