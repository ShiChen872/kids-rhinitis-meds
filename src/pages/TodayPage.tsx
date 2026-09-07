import { Card } from '../components/Screen'
import { DoseCheckIn } from '../components/DoseCheckIn'
import { SymptomEditor } from '../components/SymptomEditor'
import { WeatherCompare } from '../components/WeatherCompare'
import { addDays, formatLongDate, todayStr } from '../lib/date'
import { useAppState } from '../lib/storage'
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
            <p className="mt-3 px-1 text-xs text-muted">漏记了去日历点那一天，用药和症状都能补。</p>
          ) : null}
        </div>

        <Card>
          <h2 className="text-sm font-medium text-muted">今日感觉</h2>
          <div className="mt-3">
            <SymptomEditor date={date} log={symptoms} />
          </div>
        </Card>
      </div>
    </div>
  )
}
