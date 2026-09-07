import { useEffect, useMemo, useState } from 'react'
import { DoseCheckIn } from '../components/DoseCheckIn'
import { Card, Screen } from '../components/Screen'
import { SymptomEditor } from '../components/SymptomEditor'
import { WeatherCompare } from '../components/WeatherCompare'
import { formatLongDate, monthGrid, shiftMonth, todayStr } from '../lib/date'
import { useAppState } from '../lib/storage'
import { maxSymptomLevel } from '../lib/types'
import { useWeatherBackfill } from '../lib/useWeatherBackfill'
import { isRainy } from '../lib/weather'

const WEEKDAYS = ['日', '一', '二', '三', '四', '五', '六']

function levelColor(level: number, selected: boolean) {
  if (!selected) return 'bg-transparent'
  if (level <= 0) return 'bg-mint/80'
  if (level === 1) return 'bg-mint'
  if (level === 2) return 'bg-gold'
  return 'bg-coral'
}

export function CalendarPage({ focusDate }: { focusDate?: string | null }) {
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [selected, setSelected] = useState<string | null>(todayStr())
  const { medications, doseLogs, symptomLogs, weatherLogs } = useAppState()
  const cells = useMemo(() => monthGrid(year, month), [year, month])
  const today = todayStr()
  useWeatherBackfill()

  useEffect(() => {
    if (!focusDate) return
    const [y, m] = focusDate.split('-').map(Number)
    setYear(y)
    setMonth(m)
    setSelected(focusDate)
  }, [focusDate])

  const detailDate = selected
  const detailWeather = detailDate ? weatherLogs[detailDate] : undefined
  const detailSymptoms = detailDate ? symptomLogs[detailDate] : undefined

  return (
    <Screen title="日历" subtitle={`${year}年${month}月`}>
      <WeatherCompare weatherLogs={weatherLogs} symptomLogs={symptomLogs} />
      <Card className="mt-4">
        <div className="mb-3 flex items-center justify-between">
          <button
            type="button"
            className="min-h-10 min-w-10 rounded-xl bg-paper px-3 text-lg"
            onClick={() => {
              const next = shiftMonth(year, month, -1)
              setYear(next.year)
              setMonth(next.month)
            }}
          >
            ‹
          </button>
          <p className="font-medium">
            {year}年{month}月
          </p>
          <button
            type="button"
            className="min-h-10 min-w-10 rounded-xl bg-paper px-3 text-lg"
            onClick={() => {
              const next = shiftMonth(year, month, 1)
              setYear(next.year)
              setMonth(next.month)
            }}
          >
            ›
          </button>
        </div>
        <div className="grid grid-cols-7 gap-1 text-center text-xs text-muted">
          {WEEKDAYS.map((w) => (
            <div key={w} className="py-1">
              {w}
            </div>
          ))}
        </div>
        <div className="mt-1 grid grid-cols-7 gap-1">
          {cells.map((date, i) => {
            if (!date) return <div key={`e-${i}`} />
            const level = maxSymptomLevel(symptomLogs[date])
            const hasLog = Boolean(symptomLogs[date] || doseLogs.some((d) => d.date === date))
            const dayWeather = weatherLogs[date]
            const weatherChange = Boolean(
              dayWeather &&
                (dayWeather.tempDrop || isRainy(dayWeather.weatherCode, dayWeather.precipitation)),
            )
            const isToday = date === today
            const isSel = date === selected
            const day = Number(date.slice(8))
            return (
              <button
                key={date}
                type="button"
                onClick={() => setSelected(date)}
                className={`flex min-h-11 flex-col items-center justify-center rounded-2xl text-sm ${
                  isSel ? 'ring-2 ring-teal' : ''
                } ${isToday ? 'font-semibold' : ''} ${weatherChange ? 'bg-gold/25' : ''}`}
              >
                {day}
                <span className="mt-1 flex items-center gap-0.5">
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${
                      hasLog ? levelColor(level, true) : 'bg-line'
                    }`}
                  />
                  {weatherChange ? <span className="h-1.5 w-1.5 rounded-full bg-coral" /> : null}
                </span>
              </button>
            )
          })}
        </div>
        <p className="mt-3 text-center text-xs text-muted">圆点：症状轻重 · 红点：降温或下雨</p>
      </Card>

      {detailDate ? (
        <Card className="mt-4">
          <h2 className="font-semibold">{formatLongDate(detailDate)}</h2>
          {detailWeather ? (
            <p className="mt-2 text-sm text-muted">
              {detailWeather.tempMax}° / {detailWeather.tempMin}° · {detailWeather.conditionLabel}
              {detailWeather.tempDrop || isRainy(detailWeather.weatherCode, detailWeather.precipitation)
                ? ' · 天气变化'
                : ''}
            </p>
          ) : (
            <p className="mt-2 text-sm text-muted">当天没有天气记录</p>
          )}

          <div className="mt-4">
            {detailDate > today ? (
              <p className="text-sm text-muted">还没到这一天，不能补记。</p>
            ) : (
              <>
                <p className="mb-2 text-xs text-muted">可补记用药；点钟点可改时间。</p>
                <DoseCheckIn
                  date={detailDate}
                  medications={medications}
                  doseLogs={doseLogs}
                  canEdit
                />
                <h3 className="mt-5 text-sm font-medium text-muted">当天感觉</h3>
                <p className="mb-2 mt-1 text-xs text-muted">可补记症状；点轻重即可改。</p>
                <SymptomEditor date={detailDate} log={detailSymptoms} />
              </>
            )}
          </div>
        </Card>
      ) : null}
    </Screen>
  )
}
