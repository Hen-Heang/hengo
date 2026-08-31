"use client"

import { useMemo } from "react"
import { useQuery } from "@tanstack/react-query"

import { fetchDailyForecast, type DailyWeather } from "@/lib/weather"
import { formatYMD } from "@/lib/calendar"

const WEATHER_QUERY_KEY = ["calendar-weather-forecast"]

// Open-Meteo's daily numbers don't move within a day, so an hour of
// staleness is plenty — this just avoids refetching on every view switch.
const STALE_TIME_MS = 60 * 60 * 1000

export function useWeatherForecast() {
  const { data, isError } = useQuery({
    queryKey: WEATHER_QUERY_KEY,
    queryFn: fetchDailyForecast,
    staleTime: STALE_TIME_MS,
    retry: 1,
  })

  const byDate = useMemo(() => {
    const map = new Map<string, DailyWeather>()
    data?.forEach((day) => map.set(day.date, day))
    return map
  }, [data])

  const getWeatherForDate = (date: Date): DailyWeather | undefined => byDate.get(formatYMD(date))

  return { getWeatherForDate, isError }
}
