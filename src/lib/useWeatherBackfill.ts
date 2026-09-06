import { useEffect, useState } from 'react'
import { lastNDates, todayStr } from './date'
import { getState, saveWeathers, useAppState } from './storage'
import { fetchWeatherRange } from './weather'

export const RECENT_DAYS = 7

export function useWeatherBackfill() {
  const { settings } = useAppState()
  const [error, setError] = useState('')
  const date = todayStr()

  useEffect(() => {
    let cancelled = false
    const { city, latitude, longitude } = settings
    if (latitude == null || longitude == null) return

    const dates = lastNDates(RECENT_DAYS)
    const cached = getState().weatherLogs
    const missing = dates.some((day) => {
      const log = cached[day]
      return !log || log.city !== city
    })
    if (!missing) return

    fetchWeatherRange({
      startDate: dates[0],
      endDate: dates[dates.length - 1],
      city,
      latitude,
      longitude,
    })
      .then((logs) => {
        if (cancelled) return
        saveWeathers(logs)
        setError('')
      })
      .catch(() => {
        if (!cancelled) setError('天气暂时拉不到，不影响打卡')
      })

    return () => {
      cancelled = true
    }
  }, [date, settings.city, settings.latitude, settings.longitude])

  return error
}
