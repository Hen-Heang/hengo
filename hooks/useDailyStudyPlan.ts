"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"

import { dailyStudyPlanApi, getApiErrorMessage } from "@/lib/api"
import {
  WEEKDAY_TOPICS,
  buildDailyStudyContent,
  calculateDailyProgress,
  generateModeSchedule,
  type DailySpeakingAttempt,
  type DailyStudyActivity,
  type DailyStudyMode,
  type DailyStudyPlan,
} from "@/lib/daily-study-plan"

const QUERY_KEY = ["daily-study-plan", "today"] as const

function elapsedSeconds(activity: DailyStudyActivity, now: number): number {
  if (activity.status !== "active" || !activity.startedAt) return activity.completedSeconds
  const running = Math.max(0, Math.floor((now - new Date(activity.startedAt).getTime()) / 1000))
  return activity.completedSeconds + running
}

export function useDailyStudyPlan() {
  const queryClient = useQueryClient()
  const [now, setNow] = useState(() => Date.now())
  const [saveError, setSaveError] = useState("")
  const savingRef = useRef(false)

  const planQuery = useQuery({
    queryKey: QUERY_KEY,
    queryFn: dailyStudyPlanApi.getOrCreateToday,
    staleTime: 30_000,
  })

  const plan = planQuery.data ?? null
  const activeActivity = plan?.activities.find((activity) => activity.status === "active") ?? null

  useEffect(() => {
    if (!activeActivity) return
    const timer = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(timer)
  }, [activeActivity])

  const persist = useCallback(async (next: DailyStudyPlan) => {
    queryClient.setQueryData(QUERY_KEY, next)
    savingRef.current = true
    setSaveError("")
    try {
      const saved = await dailyStudyPlanApi.update(next.id, {
        mode: next.mode,
        topicKey: next.topicKey,
        topicLabel: next.topicLabel,
        romanizationVisible: next.romanizationVisible,
        activities: next.activities,
        content: next.content,
        attempts: next.attempts,
        reflection: next.reflection,
        missionResult: next.missionResult,
        totalFocusSeconds: next.totalFocusSeconds,
        speakingSeconds: next.speakingSeconds,
      })
      queryClient.setQueryData(QUERY_KEY, saved)
    } catch (error) {
      setSaveError(getApiErrorMessage(error, "Could not save the study plan."))
      await queryClient.invalidateQueries({ queryKey: QUERY_KEY })
    } finally {
      savingRef.current = false
    }
  }, [queryClient])

  const updateActivities = useCallback((transform: (activities: DailyStudyActivity[]) => DailyStudyActivity[]) => {
    const current = queryClient.getQueryData<DailyStudyPlan>(QUERY_KEY)
    if (!current) return
    const nextActivities = transform(current.activities)
    const focusSeconds = nextActivities.reduce((sum, item) => sum + item.completedSeconds, 0)
    const speakingSeconds = nextActivities
      .filter((item) => item.type === "roleplay" || item.type === "correction_retry")
      .reduce((sum, item) => sum + item.completedSeconds, 0)
    void persist({
      ...current,
      activities: nextActivities,
      totalFocusSeconds: focusSeconds,
      speakingSeconds,
    })
  }, [persist, queryClient])

  const start = useCallback((activityId: string) => {
    const startedAt = new Date().toISOString()
    const tick = Date.now()
    updateActivities((activities) => activities.map((activity) => {
      if (activity.id === activityId) {
        return { ...activity, status: "active", startedAt, skipReason: null }
      }
      if (activity.status === "active") {
        return {
          ...activity,
          status: "pending",
          completedSeconds: elapsedSeconds(activity, tick),
          startedAt: null,
        }
      }
      return activity
    }))
    setNow(tick)
  }, [updateActivities])

  const pause = useCallback((activityId: string) => {
    const tick = Date.now()
    updateActivities((activities) => activities.map((activity) =>
      activity.id === activityId
        ? { ...activity, status: "pending", completedSeconds: elapsedSeconds(activity, tick), startedAt: null }
        : activity,
    ))
  }, [updateActivities])

  const complete = useCallback((activityId: string) => {
    const tick = Date.now()
    const completedAt = new Date(tick).toISOString()
    updateActivities((activities) => activities.map((activity) =>
      activity.id === activityId
        ? {
            ...activity,
            status: "completed",
            completedSeconds: elapsedSeconds(activity, tick),
            startedAt: null,
            completedAt,
          }
        : activity,
    ))
  }, [updateActivities])

  const skip = useCallback((activityId: string, reason: string | null) => {
    const tick = Date.now()
    updateActivities((activities) => activities.map((activity) =>
      activity.id === activityId
        ? {
            ...activity,
            status: "skipped",
            completedSeconds: elapsedSeconds(activity, tick),
            startedAt: null,
            skipReason: reason?.trim() || null,
          }
        : activity,
    ))
  }, [updateActivities])

  const changeTime = useCallback((activityId: string, plannedStart: string) => {
    updateActivities((activities) => activities.map((activity) =>
      activity.id === activityId ? { ...activity, plannedStart } : activity,
    ))
  }, [updateActivities])

  const changeMode = useCallback((mode: DailyStudyMode) => {
    const current = queryClient.getQueryData<DailyStudyPlan>(QUERY_KEY)
    if (!current || current.mode === mode) return
    void persist({ ...current, mode, activities: generateModeSchedule(mode), totalFocusSeconds: 0, speakingSeconds: 0 })
  }, [persist, queryClient])

  const changeTopic = useCallback((topicKey: string) => {
    const current = queryClient.getQueryData<DailyStudyPlan>(QUERY_KEY)
    const topic = WEEKDAY_TOPICS.find((item) => item.key === topicKey)
    if (!current || !topic) return
    void persist({
      ...current,
      topicKey,
      topicLabel: topic.label,
      content: buildDailyStudyContent(topicKey, current.studyDate),
      attempts: [],
    })
  }, [persist, queryClient])

  const updatePlanText = useCallback((field: "reflection" | "missionResult", value: string) => {
    const current = queryClient.getQueryData<DailyStudyPlan>(QUERY_KEY)
    if (!current) return
    void persist({ ...current, [field]: value })
  }, [persist, queryClient])

  const setRomanizationVisible = useCallback((visible: boolean) => {
    const current = queryClient.getQueryData<DailyStudyPlan>(QUERY_KEY)
    if (!current) return
    void persist({ ...current, romanizationVisible: visible })
  }, [persist, queryClient])

  const recordAttempt = useCallback((attempt: DailySpeakingAttempt) => {
    const current = queryClient.getQueryData<DailyStudyPlan>(QUERY_KEY)
    if (!current) return
    void persist({ ...current, attempts: [...current.attempts, attempt] })
  }, [persist, queryClient])

  const activitiesWithElapsed = useMemo(() => {
    if (!plan) return []
    return plan.activities.map((activity) => ({
      ...activity,
      completedSeconds: elapsedSeconds(activity, now),
    }))
  }, [now, plan])

  return {
    plan,
    activities: activitiesWithElapsed,
    progress: calculateDailyProgress(activitiesWithElapsed),
    loading: planQuery.isLoading,
    error: planQuery.error ? getApiErrorMessage(planQuery.error, "Could not load today's plan.") : saveError,
    saving: savingRef.current,
    reload: planQuery.refetch,
    start,
    pause,
    complete,
    skip,
    changeTime,
    changeMode,
    changeTopic,
    updatePlanText,
    setRomanizationVisible,
    recordAttempt,
  }
}
