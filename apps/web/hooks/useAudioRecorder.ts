"use client"

import { useCallback, useEffect, useReducer, useRef, useState } from "react"

import { preferredRecorderMimeType, validateAudioInput } from "@/lib/korean-coach/audio"
import { INITIAL_RECORDING_STATE, recordingReducer } from "@/lib/korean-coach/recording-state"

const MAX_RECORDING_MS = 60_000

function microphoneErrorMessage(error: unknown): string {
  if (error instanceof DOMException) {
    if (error.name === "NotAllowedError" || error.name === "SecurityError") {
      return "Microphone access is blocked. Allow it in your browser settings, then try again or use text input."
    }
    if (error.name === "NotFoundError" || error.name === "DevicesNotFoundError") {
      return "No microphone was found. Connect one or use text input."
    }
    if (error.name === "NotReadableError" || error.name === "TrackStartError") {
      return "The microphone is busy in another app. Close it there and try again."
    }
  }
  return "The microphone could not start. Check browser permission or use text input."
}

export function useAudioRecorder() {
  const [state, dispatch] = useReducer(recordingReducer, INITIAL_RECORDING_STATE)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const recorderRef = useRef<MediaRecorder | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const startedAtRef = useRef(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const cancelledRef = useRef(false)

  const isSupported =
    typeof window !== "undefined" &&
    typeof MediaRecorder !== "undefined" &&
    Boolean(navigator.mediaDevices?.getUserMedia)

  const clearTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current)
    timerRef.current = null
  }, [])

  const stopTracks = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop())
    streamRef.current = null
  }, [])

  const revokeAudioUrl = useCallback(() => {
    setAudioUrl((current) => {
      if (current) URL.revokeObjectURL(current)
      return null
    })
  }, [])

  const reset = useCallback(() => {
    cancelledRef.current = true
    if (recorderRef.current?.state === "recording") recorderRef.current.stop()
    clearTimer()
    stopTracks()
    recorderRef.current = null
    chunksRef.current = []
    setAudioBlob(null)
    revokeAudioUrl()
    dispatch({ type: "RESET" })
  }, [clearTimer, revokeAudioUrl, stopTracks])

  const stop = useCallback(() => {
    const recorder = recorderRef.current
    if (!recorder || recorder.state !== "recording") return
    clearTimer()
    dispatch({ type: "STOP" })
    recorder.stop()
  }, [clearTimer])

  const start = useCallback(async () => {
    if (!isSupported || state.phase === "requesting-permission" || state.phase === "recording") {
      if (!isSupported) {
        dispatch({
          type: "FAIL",
          message: "Audio recording is not supported in this browser. Use text input instead.",
        })
      }
      return
    }

    reset()
    cancelledRef.current = false
    dispatch({ type: "REQUEST_PERMISSION" })
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          channelCount: 1,
        },
      })
      streamRef.current = stream
      const mimeType = preferredRecorderMimeType((candidate) =>
        MediaRecorder.isTypeSupported(candidate),
      )
      const recorder = mimeType
        ? new MediaRecorder(stream, { mimeType, audioBitsPerSecond: 96_000 })
        : new MediaRecorder(stream, { audioBitsPerSecond: 96_000 })
      recorderRef.current = recorder
      chunksRef.current = []

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data)
      }
      recorder.onerror = () => {
        clearTimer()
        stopTracks()
        dispatch({
          type: "FAIL",
          message: "Recording stopped unexpectedly. Please try again or use text input.",
        })
      }
      recorder.onstop = () => {
        clearTimer()
        stopTracks()
        if (cancelledRef.current) return
        const durationMs = Date.now() - startedAtRef.current
        const type = recorder.mimeType || chunksRef.current[0]?.type || "audio/webm"
        const blob = new Blob(chunksRef.current, { type })
        chunksRef.current = []
        const validation = validateAudioInput({ size: blob.size, type: blob.type, durationMs })
        if (!validation.valid) {
          dispatch({
            type: "FAIL",
            message: validation.message ?? "That recording could not be used.",
          })
          return
        }
        setAudioBlob(blob)
        setAudioUrl((current) => {
          if (current) URL.revokeObjectURL(current)
          return URL.createObjectURL(blob)
        })
      }

      recorder.start(250)
      startedAtRef.current = Date.now()
      dispatch({ type: "START" })
      timerRef.current = setInterval(() => {
        const durationMs = Date.now() - startedAtRef.current
        dispatch({ type: "TICK", durationMs })
        if (durationMs >= MAX_RECORDING_MS) stop()
      }, 100)
    } catch (error) {
      clearTimer()
      stopTracks()
      dispatch({ type: "FAIL", message: microphoneErrorMessage(error) })
    }
  }, [clearTimer, isSupported, reset, state.phase, stop, stopTracks])

  const markProcessing = useCallback(() => dispatch({ type: "PROCESS" }), [])
  const markSuccess = useCallback(() => dispatch({ type: "SUCCESS" }), [])
  const markError = useCallback((message: string) => dispatch({ type: "FAIL", message }), [])

  useEffect(() => {
    return () => {
      clearTimer()
      if (recorderRef.current?.state === "recording") {
        cancelledRef.current = true
        recorderRef.current.stop()
      }
      stopTracks()
      if (audioUrl) URL.revokeObjectURL(audioUrl)
    }
  }, [audioUrl, clearTimer, stopTracks])

  return {
    state,
    audioBlob,
    audioUrl,
    isSupported,
    start,
    stop,
    cancel: reset,
    reset,
    markProcessing,
    markSuccess,
    markError,
  }
}
