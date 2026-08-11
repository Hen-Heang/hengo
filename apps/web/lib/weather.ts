// Daily weather forecast via Open-Meteo (open-meteo.com) — free, keyless,
// global coverage. Fixed to the calendar's one location (Yeongdeungpo-gu,
// Seoul) rather than user geolocation, matching how holidays.ts is scoped to
// KR/KH rather than resolved per-user.
export const CALENDAR_WEATHER_LOCATION = {
  label: "Yeongdeungpo-gu, Seoul",
  latitude: 37.5219,
  longitude: 126.9245,
  timezone: "Asia/Seoul",
}

export interface DailyWeather {
  date: string // yyyy-MM-dd
  code: number // WMO weather code
  tempMaxC: number
  tempMinC: number
}

interface OpenMeteoDailyResponse {
  daily: {
    time: string[]
    weathercode: number[]
    temperature_2m_max: number[]
    temperature_2m_min: number[]
  }
}

const FORECAST_URL = "https://api.open-meteo.com/v1/forecast"

// Open-Meteo's free forecast endpoint caps daily data at 16 days out.
export async function fetchDailyForecast(): Promise<DailyWeather[]> {
  const params = new URLSearchParams({
    latitude: String(CALENDAR_WEATHER_LOCATION.latitude),
    longitude: String(CALENDAR_WEATHER_LOCATION.longitude),
    daily: "weathercode,temperature_2m_max,temperature_2m_min",
    timezone: CALENDAR_WEATHER_LOCATION.timezone,
    forecast_days: "16",
  })

  const res = await fetch(`${FORECAST_URL}?${params.toString()}`)
  if (!res.ok) {
    throw new Error(`Weather request failed: ${res.status}`)
  }
  const data: OpenMeteoDailyResponse = await res.json()

  return data.daily.time.map((date, i) => ({
    date,
    code: data.daily.weathercode[i],
    tempMaxC: data.daily.temperature_2m_max[i],
    tempMinC: data.daily.temperature_2m_min[i],
  }))
}

// WMO weather codes -> emoji + label. https://open-meteo.com/en/docs
const WEATHER_CODE_META: Record<number, { emoji: string; label: string }> = {
  0: { emoji: "☀️", label: "Clear sky" },
  1: { emoji: "🌤️", label: "Mainly clear" },
  2: { emoji: "⛅", label: "Partly cloudy" },
  3: { emoji: "☁️", label: "Overcast" },
  45: { emoji: "🌫️", label: "Fog" },
  48: { emoji: "🌫️", label: "Freezing fog" },
  51: { emoji: "🌦️", label: "Light drizzle" },
  53: { emoji: "🌦️", label: "Drizzle" },
  55: { emoji: "🌦️", label: "Dense drizzle" },
  56: { emoji: "🌧️", label: "Freezing drizzle" },
  57: { emoji: "🌧️", label: "Freezing drizzle" },
  61: { emoji: "🌧️", label: "Light rain" },
  63: { emoji: "🌧️", label: "Rain" },
  65: { emoji: "🌧️", label: "Heavy rain" },
  66: { emoji: "🌧️", label: "Freezing rain" },
  67: { emoji: "🌧️", label: "Freezing rain" },
  71: { emoji: "🌨️", label: "Light snow" },
  73: { emoji: "🌨️", label: "Snow" },
  75: { emoji: "🌨️", label: "Heavy snow" },
  77: { emoji: "🌨️", label: "Snow grains" },
  80: { emoji: "🌦️", label: "Light showers" },
  81: { emoji: "🌦️", label: "Showers" },
  82: { emoji: "⛈️", label: "Violent showers" },
  85: { emoji: "🌨️", label: "Snow showers" },
  86: { emoji: "🌨️", label: "Heavy snow showers" },
  95: { emoji: "⛈️", label: "Thunderstorm" },
  96: { emoji: "⛈️", label: "Thunderstorm, slight hail" },
  99: { emoji: "⛈️", label: "Thunderstorm, heavy hail" },
}

export function getWeatherCodeMeta(code: number): { emoji: string; label: string } {
  return WEATHER_CODE_META[code] ?? { emoji: "🌡️", label: "Unknown" }
}
