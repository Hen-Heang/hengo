"use client"

import { useCallback, useEffect, useRef, useState } from "react"

import { realtimeApi, voiceSessionsApi } from "@/lib/api"
import type { RealtimeBootstrap } from "@/lib/api/realtime"
import { buildBootstrapEvents, responseCreate } from "@/lib/realtime/events"
import {
  decideCorrection,
  DEFAULT_CORRECTION_POLICY,
  initialCorrectionState,
  type CorrectionPolicy,
} from "@/lib/realtime/correction-policy"
import {
  nextSessionStatus,
  type VoiceSessionEvent,
  type VoiceSessionStatus,
} from "@/lib/realtime/session-lifecycle"
import { buildVoiceSessionReport, type VoiceSessionReport } from "@/lib/realtime/session-report"
import type { SpeakingPace } from "@/lib/realtime/session-context"
import { shouldAnalyzeKoreanTurn } from "@/lib/learning/korean-text"
import type { TurnAnalysis } from "@/lib/ai/schemas/turn-analysis"

const EMPTY_BOOTSTRAP: RealtimeBootstrap = { history: [], createInitialResponse: true }

export type RealtimeVoicePhase =
  | "idle"
  | "connecting"
  | "listening"
  | "thinking"
  | "speaking"
  | "error"

export interface RealtimeVoiceTurn {
  id: string
  role: "user" | "assistant"
  text: string
  interrupted?: boolean
}

// One analyzed learner voice turn: the spoken Korean plus its structured
// analysis. Used for the live correction notice and the post-session report.
export interface VoiceCorrection {
  itemId: string
  originalText: string
  analysis: TurnAnalysis
}

type RealtimeServerEvent = {
  type?: string
  item_id?: string
  response_id?: string
  delta?: string
  transcript?: string
  error?: { message?: string }
  response?: {
    status?: string
    status_details?: { error?: { message?: string } } | null
  }
}

type UseRealtimeVoiceOptions = {
  conversationId?: string
  technicalMode: boolean
  // How aggressively to surface live corrections (fluency / balanced / accuracy).
  correctionPolicy?: CorrectionPolicy
  // Optional speaking-pace override (slow / clear / natural).
  pace?: SpeakingPace
  onTurnComplete?: (role: "user" | "assistant", text: string) => void | Promise<void>
}

function readableVoiceError(error: unknown): string {
  if (error instanceof DOMException && error.name === "NotAllowedError") {
    return "Microphone access is blocked. Allow microphone permission and try again."
  }
  if (error instanceof DOMException && error.name === "NotFoundError") {
    return "No microphone was found on this device."
  }
  if (error instanceof Error && error.message) return error.message
  return "The live voice session could not start."
}

export function useRealtimeVoice({
  conversationId,
  technicalMode,
  correctionPolicy = DEFAULT_CORRECTION_POLICY,
  pace,
  onTurnComplete,
}: UseRealtimeVoiceOptions) {
  const [phase, setPhase] = useState<RealtimeVoicePhase>("idle")
  const [turns, setTurns] = useState<RealtimeVoiceTurn[]>([])
  const [userCaption, setUserCaption] = useState("")
  const [assistantCaption, setAssistantCaption] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isMuted, setIsMuted] = useState(false)
  const [supported, setSupported] = useState(false)
  const [model, setModel] = useState<string | null>(null)
  const [learnerLevel, setLearnerLevel] = useState<string | null>(null)
  const [speechRate, setSpeechRate] = useState<number | null>(null)
  const [scenarioTitle, setScenarioTitle] = useState<string | null>(null)
  // Compact correction shown live during the session (per correction policy);
  // null when nothing is currently surfaced.
  const [liveCorrection, setLiveCorrection] = useState<VoiceCorrection | null>(null)
  // Session lifecycle status (distinct from the per-turn `phase`).
  const [sessionStatus, setSessionStatus] = useState<VoiceSessionStatus>("idle")
  // Post-session report, set once the learner ends a session with real turns.
  const [sessionReport, setSessionReport] = useState<VoiceSessionReport | null>(null)

  const peerRef = useRef<RTCPeerConnection | null>(null)
  const bootstrapRef = useRef<RealtimeBootstrap>(EMPTY_BOOTSTRAP)
  const channelRef = useRef<RTCDataChannel | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const startAbortRef = useRef<AbortController | null>(null)
  const closingRef = useRef(false)
  const mountedRef = useRef(true)
  const onTurnCompleteRef = useRef(onTurnComplete)
  const persistedTurnIdsRef = useRef(new Set<string>())
  const currentUserRef = useRef<{ id: string; text: string } | null>(null)
  const currentAssistantRef = useRef<{ id: string; text: string } | null>(null)
  // Learning-analysis state. Read through refs so the analysis callback stays
  // stable and never re-subscribes the data channel mid-session.
  const analyzedItemIdsRef = useRef(new Set<string>())
  const correctionStateRef = useRef(initialCorrectionState())
  const collectedCorrectionsRef = useRef<VoiceCorrection[]>([])
  const correctionPolicyRef = useRef(correctionPolicy)
  const conversationIdRef = useRef(conversationId)
  const technicalModeRef = useRef(technicalMode)
  const paceRef = useRef(pace)
  // Mirror of `turns` so stop() can build the report from the final list without
  // waiting for the async setTurns to flush.
  const turnsRef = useRef<RealtimeVoiceTurn[]>([])
  // Session metadata captured at connect time, for the report + persistence.
  const sessionMetaRef = useRef<{
    startedAt: number
    learnerLevel: string
    model: string | null
    scenarioTitle: string | null
  }>({ startedAt: 0, learnerLevel: "BEGINNER", model: null, scenarioTitle: null })
  const sessionStatusRef = useRef<VoiceSessionStatus>("idle")

  useEffect(() => {
    onTurnCompleteRef.current = onTurnComplete
  }, [onTurnComplete])

  useEffect(() => {
    correctionPolicyRef.current = correctionPolicy
  }, [correctionPolicy])

  useEffect(() => {
    conversationIdRef.current = conversationId
  }, [conversationId])

  useEffect(() => {
    technicalModeRef.current = technicalMode
  }, [technicalMode])

  useEffect(() => {
    paceRef.current = pace
  }, [pace])

  // Advances the lifecycle status through the pure state machine.
  const advanceStatus = useCallback((event: VoiceSessionEvent) => {
    const next = nextSessionStatus(sessionStatusRef.current, event)
    sessionStatusRef.current = next
    setSessionStatus(next)
  }, [])

  useEffect(() => {
    setSupported(
      typeof window !== "undefined" &&
        typeof RTCPeerConnection !== "undefined" &&
        Boolean(navigator.mediaDevices?.getUserMedia),
    )
  }, [])

  const closeConnection = useCallback(() => {
    closingRef.current = true
    startAbortRef.current?.abort()
    startAbortRef.current = null

    channelRef.current?.close()
    channelRef.current = null

    peerRef.current?.close()
    peerRef.current = null

    streamRef.current?.getTracks().forEach((track) => track.stop())
    streamRef.current = null

    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.srcObject = null
      audioRef.current.remove()
      audioRef.current = null
    }
  }, [])

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
      closeConnection()
    }
  }, [closeConnection])

  const commitTurn = useCallback(
    (turn: RealtimeVoiceTurn, persist: boolean) => {
      const text = turn.text.replace(/\s+/g, " ").trim()
      if (!text) return
      const normalized = { ...turn, text }

      setTurns((current) => {
        const existingIndex = current.findIndex((item) => item.id === normalized.id)
        const next =
          existingIndex === -1
            ? [...current, normalized]
            : current.map((item, index) => (index === existingIndex ? normalized : item))
        turnsRef.current = next
        return next
      })

      if (!persist || persistedTurnIdsRef.current.has(normalized.id)) return
      persistedTurnIdsRef.current.add(normalized.id)
      void onTurnCompleteRef.current?.(normalized.role, normalized.text)
    },
    [],
  )

  // Fire-and-forget analysis of a completed learner turn. Runs the shared
  // Korean turn-analysis + correction-SRS pipeline server-side and, per the
  // correction policy, may surface a compact live correction. Never awaited by
  // the event loop, so it can't delay the live assistant response. Deduped per
  // realtime item id; failures are swallowed inside realtimeApi.analyzeTurn.
  const analyzeUserTurn = useCallback(async (itemId: string, rawText: string) => {
    const conversationId = conversationIdRef.current
    if (!conversationId) return
    const text = rawText.replace(/\s+/g, " ").trim()
    if (!text) return
    if (analyzedItemIdsRef.current.has(itemId)) return
    if (!shouldAnalyzeKoreanTurn(text)) return
    analyzedItemIdsRef.current.add(itemId)

    const state = correctionStateRef.current
    state.userTurnIndex += 1

    const analysis = await realtimeApi.analyzeTurn(conversationId, itemId, text)
    if (!analysis || !mountedRef.current) return

    const decision = decideCorrection({ policy: correctionPolicyRef.current, analysis, state })
    if (decision.collect) {
      collectedCorrectionsRef.current.push({ itemId, originalText: text, analysis })
    }
    if (decision.show) {
      state.lastShownAtTurn = state.userTurnIndex
      setLiveCorrection({ itemId, originalText: text, analysis })
    }
  }, [])

  const handleServerEvent = useCallback(
    (event: RealtimeServerEvent) => {
      switch (event.type) {
        case "input_audio_buffer.speech_started": {
          const interrupted = currentAssistantRef.current
          if (interrupted?.text.trim()) {
            commitTurn(
              { id: interrupted.id, role: "assistant", text: interrupted.text, interrupted: true },
              false,
            )
          }
          currentAssistantRef.current = null
          currentUserRef.current = null
          setAssistantCaption("")
          setUserCaption("")
          setPhase("listening")
          break
        }
        case "input_audio_buffer.speech_stopped":
          setPhase("thinking")
          break
        case "conversation.item.input_audio_transcription.delta": {
          const id = event.item_id || "user-live"
          const previous = currentUserRef.current?.id === id ? currentUserRef.current.text : ""
          const text = previous + (event.delta || "")
          currentUserRef.current = { id, text }
          setUserCaption(text)
          break
        }
        case "conversation.item.input_audio_transcription.completed": {
          const id = event.item_id || currentUserRef.current?.id || crypto.randomUUID()
          const text = event.transcript || currentUserRef.current?.text || ""
          currentUserRef.current = null
          setUserCaption(text)
          commitTurn({ id, role: "user", text }, true)
          void analyzeUserTurn(id, text)
          break
        }
        case "conversation.item.input_audio_transcription.failed":
          setError("I could not create a subtitle for that turn. Please try speaking again.")
          break
        case "response.created":
          setPhase("thinking")
          break
        case "response.output_audio_transcript.delta": {
          const id = event.item_id || event.response_id || "assistant-live"
          const previous = currentAssistantRef.current?.id === id ? currentAssistantRef.current.text : ""
          const text = previous + (event.delta || "")
          currentAssistantRef.current = { id, text }
          setAssistantCaption(text)
          setPhase("speaking")
          break
        }
        case "response.output_audio_transcript.done": {
          const id = event.item_id || currentAssistantRef.current?.id || crypto.randomUUID()
          const text = event.transcript || currentAssistantRef.current?.text || ""
          currentAssistantRef.current = null
          setAssistantCaption(text)
          commitTurn({ id, role: "assistant", text }, true)
          break
        }
        case "output_audio_buffer.started":
          setPhase("speaking")
          break
        case "output_audio_buffer.stopped":
          setPhase("listening")
          break
        case "response.done": {
          const responseError = event.response?.status_details?.error?.message
          if (event.response?.status === "failed" || responseError) {
            setError(responseError || "Hengo could not finish that reply.")
            setPhase("error")
          } else if (event.response?.status === "cancelled") {
            const interrupted = currentAssistantRef.current
            if (interrupted?.text.trim()) {
              commitTurn(
                { id: interrupted.id, role: "assistant", text: interrupted.text, interrupted: true },
                true,
              )
              currentAssistantRef.current = null
            }
            setPhase("listening")
          }
          break
        }
        case "error":
          setError(event.error?.message || "The realtime voice connection reported an error.")
          setPhase("error")
          break
      }
    },
    [commitTurn, analyzeUserTurn],
  )

  const start = useCallback(async (overrides?: {
    correctionPolicy?: CorrectionPolicy
    pace?: SpeakingPace
    technicalMode?: boolean
  }) => {
    if (!conversationId || phase === "connecting" || (phase !== "idle" && phase !== "error")) return
    // Apply per-session overrides synchronously (from the setup sheet) so the
    // very first session uses them without waiting for a prop-sync render.
    if (overrides?.correctionPolicy) correctionPolicyRef.current = overrides.correctionPolicy
    if (overrides?.pace) paceRef.current = overrides.pace
    if (overrides?.technicalMode !== undefined) technicalModeRef.current = overrides.technicalMode
    if (!navigator.mediaDevices?.getUserMedia || typeof RTCPeerConnection === "undefined") {
      setError("Live voice is not supported in this browser.")
      setPhase("error")
      return
    }

    closeConnection()
    closingRef.current = false
    setPhase("connecting")
    setError(null)
    setTurns([])
    setUserCaption("")
    setAssistantCaption("")
    setIsMuted(false)
    setLearnerLevel(null)
    setSpeechRate(null)
    setScenarioTitle(null)
    setLiveCorrection(null)
    setSessionReport(null)
    advanceStatus("start")
    bootstrapRef.current = EMPTY_BOOTSTRAP
    persistedTurnIdsRef.current.clear()
    analyzedItemIdsRef.current.clear()
    correctionStateRef.current = initialCorrectionState()
    collectedCorrectionsRef.current = []
    turnsRef.current = []
    currentUserRef.current = null
    currentAssistantRef.current = null

    const controller = new AbortController()
    startAbortRef.current = controller

    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      })
      streamRef.current = mediaStream
      const credentials = await realtimeApi.createSession(
        conversationId,
        technicalModeRef.current,
        paceRef.current,
        controller.signal,
      )

      if (controller.signal.aborted || !mountedRef.current) {
        mediaStream.getTracks().forEach((track) => track.stop())
        return
      }

      setModel(credentials.model)
      setLearnerLevel(credentials.learnerLevel)
      setSpeechRate(credentials.speechRate)
      setScenarioTitle(credentials.scenarioTitle)
      sessionMetaRef.current = {
        startedAt: Date.now(),
        learnerLevel: credentials.learnerLevel,
        model: credentials.model,
        scenarioTitle: credentials.scenarioTitle,
      }

      // Seed the visible transcript with the recent history the server returned
      // so a resumed or reconnected session shows continuity, and mark those
      // ids as already persisted so the completion handler never re-saves them.
      bootstrapRef.current = credentials.bootstrap
      const seededTurns: RealtimeVoiceTurn[] = credentials.bootstrap.history.map((message) => ({
        id: message.id,
        role: message.role,
        text: message.text,
      }))
      persistedTurnIdsRef.current = new Set(seededTurns.map((turn) => turn.id))
      turnsRef.current = seededTurns
      if (seededTurns.length) setTurns(seededTurns)

      const peer = new RTCPeerConnection()
      peerRef.current = peer

      const remoteAudio = new Audio()
      remoteAudio.autoplay = true
      remoteAudio.setAttribute("playsinline", "true")
      audioRef.current = remoteAudio
      peer.ontrack = (trackEvent) => {
        remoteAudio.srcObject = trackEvent.streams[0]
        void remoteAudio.play().catch(() => {
          setError("Audio playback was blocked. End the session and start again to enable sound.")
        })
      }

      for (const track of mediaStream.getAudioTracks()) {
        peer.addTrack(track, mediaStream)
      }

      const channel = peer.createDataChannel("oai-events")
      channelRef.current = channel
      channel.addEventListener("message", (messageEvent) => {
        try {
          handleServerEvent(JSON.parse(String(messageEvent.data)) as RealtimeServerEvent)
        } catch {
          // Ignore malformed diagnostic events; normal audio can continue.
        }
      })
      channel.addEventListener("open", () => {
        if (!mountedRef.current) return
        advanceStatus("connected")
        // Replay recent history into the fresh realtime context, then let the
        // assistant speak first only when it's genuinely its turn (greet a new
        // conversation, or answer a pending learner message). Otherwise wait.
        const bootstrap = bootstrapRef.current
        for (const event of buildBootstrapEvents(bootstrap.history)) {
          channel.send(JSON.stringify(event))
        }
        if (bootstrap.createInitialResponse) {
          setPhase("thinking")
          channel.send(JSON.stringify(responseCreate()))
        } else {
          setPhase("listening")
        }
      })
      channel.addEventListener("close", () => {
        if (mountedRef.current && !closingRef.current && peer.connectionState !== "closed") {
          setError("The live voice connection ended.")
          setPhase("error")
          advanceStatus("fail")
        }
      })

      peer.addEventListener("connectionstatechange", () => {
        if (!mountedRef.current) return
        if (
          !closingRef.current &&
          (peer.connectionState === "failed" || peer.connectionState === "disconnected")
        ) {
          setError("The live voice connection was interrupted.")
          setPhase("error")
          advanceStatus("fail")
        }
      })

      const offer = await peer.createOffer()
      await peer.setLocalDescription(offer)
      const sdpResponse = await fetch("https://api.openai.com/v1/realtime/calls", {
        method: "POST",
        body: offer.sdp,
        headers: {
          Authorization: `Bearer ${credentials.clientSecret}`,
          "Content-Type": "application/sdp",
        },
        signal: controller.signal,
      })

      if (!sdpResponse.ok) {
        throw new Error("OpenAI could not establish the live audio connection.")
      }

      await peer.setRemoteDescription({
        type: "answer",
        sdp: await sdpResponse.text(),
      })
      startAbortRef.current = null
    } catch (startError) {
      closeConnection()
      if (startError instanceof DOMException && startError.name === "AbortError") return
      if (!mountedRef.current) return
      setError(readableVoiceError(startError))
      setPhase("error")
      advanceStatus("fail")
    }
  }, [advanceStatus, closeConnection, conversationId, handleServerEvent, phase])

  const stop = useCallback(() => {
    const userTurn = currentUserRef.current
    if (userTurn?.text.trim()) {
      commitTurn({ ...userTurn, role: "user" }, true)
      // Capture the final utterance for the session report even if the session
      // ended before its transcription completed (deduped if it already ran).
      void analyzeUserTurn(userTurn.id, userTurn.text)
    }
    const assistantTurn = currentAssistantRef.current
    if (assistantTurn?.text.trim()) {
      commitTurn({ ...assistantTurn, role: "assistant", interrupted: true }, true)
    }
    currentUserRef.current = null
    currentAssistantRef.current = null
    closeConnection()
    setPhase("idle")
    setError(null)
    setIsMuted(false)
    setLiveCorrection(null)

    // Build the post-session report from the final in-memory transcript. Only
    // when the learner actually spoke — opening and immediately closing yields
    // no report.
    advanceStatus("end")
    const meta = sessionMetaRef.current
    if (meta.startedAt > 0) {
      advanceStatus("summarize")
      const report = buildVoiceSessionReport({
        turns: turnsRef.current.map((turn) => ({ role: turn.role, text: turn.text })),
        corrections: collectedCorrectionsRef.current,
        startedAt: meta.startedAt,
        endedAt: Date.now(),
        scenarioTitle: meta.scenarioTitle,
      })
      if (report.metrics.userTurnCount > 0) {
        setSessionReport(report)
        // Best-effort persistence — a failure (incl. an unmigrated table) must
        // never hide the report the learner just earned.
        void voiceSessionsApi.record({
          conversationId: conversationIdRef.current ?? null,
          scenarioId: null,
          practiceMode: meta.scenarioTitle ? "scenario" : technicalModeRef.current ? "developer" : "free",
          correctionPolicy: correctionPolicyRef.current,
          learnerLevel: meta.learnerLevel,
          model: meta.model,
          status: "completed",
          startedAt: new Date(meta.startedAt).toISOString(),
          endedAt: new Date().toISOString(),
          report,
        })
      }
      advanceStatus("summaryReady")
    }
    sessionMetaRef.current = { startedAt: 0, learnerLevel: "BEGINNER", model: null, scenarioTitle: null }
  }, [advanceStatus, closeConnection, commitTurn, analyzeUserTurn])

  const toggleMute = useCallback(() => {
    const track = streamRef.current?.getAudioTracks()[0]
    if (!track) return
    const nextMuted = track.enabled
    track.enabled = !nextMuted
    setIsMuted(nextMuted)
  }, [])

  return {
    supported,
    phase,
    isActive: phase !== "idle",
    turns,
    userCaption,
    assistantCaption,
    error,
    isMuted,
    model,
    learnerLevel,
    speechRate,
    scenarioTitle,
    liveCorrection,
    dismissLiveCorrection: useCallback(() => setLiveCorrection(null), []),
    // Snapshot of every real mistake collected this session, for the
    // post-session report (Phase 4). Read from a ref, so call it when ending.
    getSessionCorrections: useCallback((): VoiceCorrection[] => collectedCorrectionsRef.current, []),
    sessionStatus,
    sessionReport,
    dismissSessionReport: useCallback(() => {
      setSessionReport(null)
      advanceStatus("reset")
    }, [advanceStatus]),
    start,
    stop,
    toggleMute,
  }
}
