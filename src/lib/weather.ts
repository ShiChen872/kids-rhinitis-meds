import { addDays } from './date'
import type { WeatherLog } from './types'

const CONDITION: Record<number, string> = {
  0: '晴',
  1: '大部晴',
  2: '多云',
  3: '阴',
  45: '雾',
  48: '雾',
  51: '小毛毛雨',
  53: '毛毛雨',
  55: '毛毛雨',
  61: '小雨',
  63: '中雨',
  65: '大雨',
  71: '小雪',
  73: '中雪',
  75: '大雪',
  80: '阵雨',
  81: '阵雨',
  82: '强阵雨',
  95: '雷雨',
  96: '雷雨',
  99: '雷雨',
}

export function conditionLabel(code: number): string {
  return CONDITION[code] ?? '天气变化'
}

export function isRainy(code: number, precipitation: number): boolean {
  return precipitation >= 0.5 || (code >= 51 && code <= 67) || (code >= 80 && code <= 99)
}

export type GeoResult = {
  name: string
  latitude: number
  longitude: number
}

export async function geocodeCity(name: string): Promise<GeoResult | null> {
  const q = name.trim()
  if (!q) return null
  const url = new URL('https://geocoding-api.open-meteo.com/v1/search')
  url.searchParams.set('name', q)
  url.searchParams.set('count', '1')
  url.searchParams.set('language', 'zh')
  url.searchParams.set('format', 'json')
  const res = await fetch(url)
  if (!res.ok) throw new Error('城市查找失败')
  const data = (await res.json()) as {
    results?: { name: string; latitude: number; longitude: number }[]
  }
  const first = data.results?.[0]
  if (!first) return null
  return {
    name: first.name,
    latitude: first.latitude,
    longitude: first.longitude,
  }
}

export async function fetchWeather(opts: {
  date: string
  city: string
  latitude: number
  longitude: number
  yesterdayMin?: number
}): Promise<WeatherLog> {
  const url = new URL('https://api.open-meteo.com/v1/forecast')
  url.searchParams.set('latitude', String(opts.latitude))
  url.searchParams.set('longitude', String(opts.longitude))
  url.searchParams.set(
    'daily',
    'weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,relative_humidity_2m_mean',
  )
  url.searchParams.set('timezone', 'auto')
  const yesterday = addDays(opts.date, -1)
  url.searchParams.set('start_date', yesterday)
  url.searchParams.set('end_date', opts.date)

  const res = await fetch(url)
  if (!res.ok) throw new Error('天气获取失败')
  const data = (await res.json()) as {
    daily: {
      time: string[]
      weather_code: number[]
      temperature_2m_max: number[]
      temperature_2m_min: number[]
      precipitation_sum: number[]
      relative_humidity_2m_mean: number[]
    }
  }
  const i = data.daily.time.indexOf(opts.date)
  if (i < 0) throw new Error('当天没有天气数据')

  const weatherCode = data.daily.weather_code[i]
  const tempMin = data.daily.temperature_2m_min[i]
  const precipitation = data.daily.precipitation_sum[i] ?? 0
  const y = data.daily.time.indexOf(yesterday)
  const yesterdayMin =
    y >= 0 ? data.daily.temperature_2m_min[y] : opts.yesterdayMin
  const tempDrop =
    typeof yesterdayMin === 'number' && yesterdayMin - tempMin >= 5

  return {
    date: opts.date,
    city: opts.city,
    tempMax: Math.round(data.daily.temperature_2m_max[i]),
    tempMin: Math.round(tempMin),
    humidity: Math.round(data.daily.relative_humidity_2m_mean[i] ?? 0),
    weatherCode,
    conditionLabel: conditionLabel(weatherCode),
    precipitation,
    tempDrop,
  }
}

export async function fetchWeatherRange(opts: {
  startDate: string
  endDate: string
  city: string
  latitude: number
  longitude: number
}): Promise<WeatherLog[]> {
  const url = new URL('https://api.open-meteo.com/v1/forecast')
  url.searchParams.set('latitude', String(opts.latitude))
  url.searchParams.set('longitude', String(opts.longitude))
  url.searchParams.set(
    'daily',
    'weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,relative_humidity_2m_mean',
  )
  url.searchParams.set('timezone', 'auto')
  const prelude = addDays(opts.startDate, -1)
  url.searchParams.set('start_date', prelude)
  url.searchParams.set('end_date', opts.endDate)

  const res = await fetch(url)
  if (!res.ok) throw new Error('天气获取失败')
  const data = (await res.json()) as {
    daily: {
      time: string[]
      weather_code: number[]
      temperature_2m_max: number[]
      temperature_2m_min: number[]
      precipitation_sum: number[]
      relative_humidity_2m_mean: number[]
    }
  }

  const mins = new Map<string, number>()
  data.daily.time.forEach((day, index) => {
    mins.set(day, data.daily.temperature_2m_min[index])
  })

  const logs: WeatherLog[] = []
  data.daily.time.forEach((day, index) => {
    if (day < opts.startDate || day > opts.endDate) return
    const tempMin = data.daily.temperature_2m_min[index]
    const precipitation = data.daily.precipitation_sum[index] ?? 0
    const weatherCode = data.daily.weather_code[index]
    const prevMin = mins.get(addDays(day, -1))
    logs.push({
      date: day,
      city: opts.city,
      tempMax: Math.round(data.daily.temperature_2m_max[index]),
      tempMin: Math.round(tempMin),
      humidity: Math.round(data.daily.relative_humidity_2m_mean[index] ?? 0),
      weatherCode,
      conditionLabel: conditionLabel(weatherCode),
      precipitation,
      tempDrop: typeof prevMin === 'number' && prevMin - tempMin >= 5,
    })
  })
  return logs
}
