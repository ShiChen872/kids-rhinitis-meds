import { Card } from './Screen'
import { formatShortDate, lastNDates } from '../lib/date'
import { RECENT_DAYS } from '../lib/useWeatherBackfill'
import { LEVEL_LABELS, maxSymptomLevel, type SymptomLog, type WeatherLog } from '../lib/types'
import { isRainy } from '../lib/weather'

function barClass(level: number) {
  if (level <= 0) return 'bg-mint/70'
  if (level === 1) return 'bg-mint'
  if (level === 2) return 'bg-gold'
  return 'bg-coral'
}

export function WeatherCompare({
  weatherLogs,
  symptomLogs,
}: {
  weatherLogs: Record<string, WeatherLog>
  symptomLogs: Record<string, SymptomLog>
}) {
  const dates = lastNDates(RECENT_DAYS)

  return (
    <Card>
      <h2 className="text-sm font-medium text-muted">近7天 · 天气 × 症状</h2>
      <p className="mt-1 text-xs text-muted">看降温、下雨的日子，症状会不会变重</p>
      <div className="mt-3 space-y-2">
        {dates.map((date) => {
          const weather = weatherLogs[date]
          const level = maxSymptomLevel(symptomLogs[date])
          const rainy = weather
            ? isRainy(weather.weatherCode, weather.precipitation)
            : false
          const changed = Boolean(weather?.tempDrop || rainy)
          return (
            <div key={date} className="flex items-center gap-2 text-sm">
              <span className="w-10 shrink-0 text-muted">{formatShortDate(date)}</span>
              <span className="w-10 shrink-0 font-medium">
                {weather ? `${weather.tempMin}°` : '—'}
              </span>
              <span className="w-14 shrink-0 text-xs text-coral">
                {weather?.tempDrop ? '降温' : rainy ? '有雨' : ''}
              </span>
              <span className="flex min-w-0 flex-1 gap-0.5">
                {([0, 1, 2, 3] as const).map((n) => (
                  <span
                    key={n}
                    className={`h-2 flex-1 rounded-full ${
                      n <= level ? barClass(level) : 'bg-paper'
                    }`}
                  />
                ))}
              </span>
              <span className={`w-6 shrink-0 text-right text-xs ${changed ? 'text-coral' : 'text-muted'}`}>
                {LEVEL_LABELS[level]}
              </span>
            </div>
          )
        })}
      </div>
    </Card>
  )
}
