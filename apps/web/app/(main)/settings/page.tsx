"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import {
  ArrowLeft,
  Mail,
  Cpu,
  CheckCircle2,
  LogOut,
  ChevronRight,
  ShieldCheck,
  Globe,
  Camera,
  Loader2,
  Bell,
  Send,
  AlarmClock,
  Check,
  Target,
  Type,
} from "lucide-react"
import { motion, AnimatePresence } from "motion/react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Skeleton } from "@/components/ui/skeleton"
import { authApi, userApi } from "@/lib/api"
import { getUserId } from "@/lib/auth-store"
import { refreshProfileImage } from "@/hooks/useProfileImage"
import { usePush } from "@/hooks/usePush"
import { cn } from "@/lib/utils"

const models = [
  { value: "gpt-5-mini", label: "GPT-5 mini", desc: "Latest · recommended" },
  { value: "gpt-4o", label: "GPT-4o", desc: "Balanced performance" },
  { value: "gpt-4o-mini", label: "GPT-4o mini", desc: "Fast & efficient" },
]

const countries = [
  "South Korea", "Cambodia", "Vietnam", "Thailand", "Philippines", "Indonesia",
  "Malaysia", "Singapore", "China", "Japan", "India", "United States",
  "United Kingdom", "Canada", "Australia", "Other",
]

function snapshotOf(fields: {
  displayName: string
  koreanLevel: string
  country: string
  nativeLanguage: string
  occupation: string
  yearsOfExperience: string
  learningGoal: string
  model: string
}) {
  return JSON.stringify(fields)
}

function SectionCard({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("overflow-hidden rounded-lg border border-border bg-card shadow-sm dark:bg-slate-900/40", className)}>
      {children}
    </div>
  )
}

function SectionRow({ children, last }: { children: React.ReactNode; last?: boolean }) {
  return (
    <div className={cn("px-4 py-4 sm:px-5", !last && "border-b border-border/60")}>
      {children}
    </div>
  )
}

function SectionHeader({ icon: Icon, title, description, color = "text-blue-500" }: {
  icon: React.ElementType
  title: string
  description?: string
  color?: string
}) {
  return (
    <div className="flex items-center gap-3">
      <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent/5", color)}>
        <Icon size={15} strokeWidth={2} />
      </div>
      <div>
        <p className="text-sm font-semibold text-foreground">{title}</p>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </div>
    </div>
  )
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="mb-1.5 block px-1 text-sm font-medium text-muted-foreground">
      {children}
    </label>
  )
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.05 } },
} as const

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: "easeOut" } },
} as const

export default function SettingsPage() {
  const router = useRouter()
  const push = usePush()
  const [displayName, setDisplayName] = useState("")
  const [email, setEmail] = useState("")
  const [koreanLevel, setKoreanLevel] = useState("BEGINNER")
  const [country, setCountry] = useState("")
  const [nativeLanguage, setNativeLanguage] = useState("")
  const [occupation, setOccupation] = useState("")
  const [yearsOfExperience, setYearsOfExperience] = useState("")
  const [learningGoal, setLearningGoal] = useState("")
  const [preferredModel, setPreferredModel] = useState("gpt-5-mini")
  const [customModel, setCustomModel] = useState("")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState("")
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [studyRemindersEnabled, setStudyRemindersEnabled] = useState(true)
  const [studyReminderHour, setStudyReminderHour] = useState(20)
  const [savingReminders, setSavingReminders] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const savedSnapshotRef = useRef<string | null>(null)

  useEffect(() => {
    const userId = getUserId()
    if (!userId) return
    userApi
      .getById(userId)
      .then((data) => {
        setDisplayName(data.displayName ?? "")
        setEmail(data.email ?? "")
        setKoreanLevel(data.koreanLevel ?? "BEGINNER")
        setCountry(data.country ?? "")
        setNativeLanguage(data.nativeLanguage ?? "")
        setOccupation(data.occupation ?? "")
        setYearsOfExperience(data.yearsOfExperience != null ? String(data.yearsOfExperience) : "")
        setLearningGoal(data.learningGoal ?? "")
        const model = data.preferredModel ?? "gpt-5-mini"
        setPreferredModel(model)
        if (!models.some((m) => m.value === model)) setCustomModel(model)
        setStudyRemindersEnabled(data.studyRemindersEnabled ?? true)
        setStudyReminderHour(data.studyReminderHour ?? 20)
        if (data.hasProfileImage) {
          userApi.getProfileImageUrl(userId).then(setAvatarUrl).catch(() => {})
        }
        savedSnapshotRef.current = snapshotOf({
          displayName: data.displayName ?? "",
          koreanLevel: data.koreanLevel ?? "BEGINNER",
          country: data.country ?? "",
          nativeLanguage: data.nativeLanguage ?? "",
          occupation: data.occupation ?? "",
          yearsOfExperience: data.yearsOfExperience != null ? String(data.yearsOfExperience) : "",
          learningGoal: data.learningGoal ?? "",
          model,
        })
      })
      .finally(() => setLoading(false))
  }, [])

  async function saveStudyReminders(enabled: boolean, hour: number) {
    const userId = getUserId()
    if (!userId) return
    const prevEnabled = studyRemindersEnabled
    const prevHour = studyReminderHour
    setStudyRemindersEnabled(enabled)
    setStudyReminderHour(hour)
    setSavingReminders(true)
    try {
      await userApi.updateStudyReminders(userId, enabled, hour)
    } catch {
      setStudyRemindersEnabled(prevEnabled)
      setStudyReminderHour(prevHour)
      toast.error("Could not save study reminders", { description: "Please try again." })
    } finally {
      setSavingReminders(false)
    }
  }

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ""
    if (!file) return
    const userId = getUserId()
    if (!userId) return
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setError("Only JPEG, PNG, or WebP images are allowed.")
      return
    }
    if (file.size > 2 * 1024 * 1024) {
      setError("Image must be 2 MB or smaller.")
      return
    }
    setUploadingAvatar(true)
    setError("")
    try {
      await userApi.uploadProfileImage(userId, file)
      const url = await userApi.getProfileImageUrl(userId)
      setAvatarUrl(url)
      refreshProfileImage()
    } catch {
      setError("Could not upload image. Please try again.")
    } finally {
      setUploadingAvatar(false)
    }
  }

  const activeModel = customModel || preferredModel

  const currentSnapshot = snapshotOf({
    displayName,
    koreanLevel,
    country,
    nativeLanguage,
    occupation,
    yearsOfExperience,
    learningGoal,
    model: activeModel,
  })
  const isDirty = savedSnapshotRef.current !== null && savedSnapshotRef.current !== currentSnapshot

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    const userId = getUserId()
    if (!userId) return
    setSaving(true)
    setError("")
    setSaved(false)
    try {
      await userApi.updateProfile(userId, {
        displayName,
        koreanLevel,
        country: country || undefined,
        nativeLanguage: nativeLanguage || undefined,
        occupation: occupation || undefined,
        yearsOfExperience: yearsOfExperience ? Number(yearsOfExperience) : undefined,
        learningGoal: learningGoal || undefined,
      })
      await userApi.updatePreferredModel(userId, activeModel)
      savedSnapshotRef.current = currentSnapshot
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch {
      setError("Failed to save. Please try again.")
    } finally {
      setSaving(false)
    }
  }

  function handleClose() {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back()
      return
    }
    router.push("/home")
  }

  async function handleSignOut() {
    try {
      await authApi.logout()
    } catch {
      /* ignore */
    }
    router.replace("/login")
  }

  const initials = displayName
    ? displayName.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()
    : email?.[0]?.toUpperCase() ?? "?"

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl space-y-4 pb-12">
        <div className="rounded-lg border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center gap-4">
            <Skeleton className="h-14 w-14 rounded-lg" />
            <div className="flex-1">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="mt-2 h-4 w-40" />
            </div>
          </div>
        </div>
        {[1, 2, 3].map((item) => (
          <div key={item} className="rounded-lg border border-border bg-card p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <Skeleton className="h-8 w-8 rounded-xl" />
              <div>
                <Skeleton className="h-4 w-28" />
                <Skeleton className="mt-1.5 h-3 w-40" />
              </div>
            </div>
            <div className="mt-5 space-y-3">
              <Skeleton className="h-11 w-full rounded-lg" />
              <Skeleton className="h-11 w-full rounded-lg" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <motion.form
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      onSubmit={handleSave}
      className="mx-auto max-w-3xl space-y-5 pb-24"
    >
      {/* Header */}
      <motion.div variants={itemVariants}>
        <div className="flex items-center gap-3 px-1 py-1">
          <button
            type="button"
            onClick={handleClose}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <ArrowLeft size={18} strokeWidth={2.5} />
          </button>
          <div>
            <h1 className="text-xl font-semibold text-foreground">Settings</h1>
            <p className="text-sm text-muted-foreground">Profile, preferences & account</p>
          </div>
        </div>
      </motion.div>

      {/* Profile identity + editable name/email */}
      <motion.div variants={itemVariants}>
        <SectionCard>
          <SectionRow>
            <div className="flex items-center gap-4">
              <div className="relative">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingAvatar}
                  title="Change profile photo"
                  className="group relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-linear-to-br from-blue-500 to-indigo-600 text-lg font-semibold text-white shadow-sm"
                >
                  {avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={avatarUrl} alt="Profile" className="h-full w-full object-cover" />
                  ) : (
                    <span>{initials}</span>
                  )}
                  <span className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                    {uploadingAvatar ? (
                      <Loader2 size={18} className="animate-spin text-white" />
                    ) : (
                      <Camera size={18} className="text-white" />
                    )}
                  </span>
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={handleAvatarChange}
                />
                <div className="absolute -right-1 -bottom-1 flex h-5 w-5 items-center justify-center rounded-full border-2 border-card bg-emerald-400">
                  <CheckCircle2 size={10} className="text-white" strokeWidth={4} />
                </div>
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-base font-semibold text-foreground">
                  {displayName || "Your name"}
                </p>
                <p className="truncate text-xs font-medium text-muted-foreground">{email}</p>
              </div>
            </div>
          </SectionRow>
          <SectionRow last>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <FieldLabel>Display name</FieldLabel>
                <Input
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Your name"
                  className="h-11 rounded-lg border-border bg-accent/5 px-4 font-semibold transition-colors focus:bg-background"
                />
              </div>
              <div>
                <FieldLabel>Email address</FieldLabel>
                <div className="flex h-11 items-center gap-2.5 rounded-lg border border-border bg-accent/5 px-4 opacity-60">
                  <Mail size={14} className="shrink-0 text-muted-foreground" strokeWidth={2} />
                  <span className="min-w-0 flex-1 truncate text-sm font-semibold text-foreground">{email}</span>
                  <span className="hidden shrink-0 items-center gap-1 text-xs font-medium text-muted-foreground sm:flex">
                    <ShieldCheck size={10} strokeWidth={3} /> Verified
                  </span>
                </div>
              </div>
            </div>
          </SectionRow>
        </SectionCard>
      </motion.div>

      {/* Learning goal */}
      <motion.div variants={itemVariants}>
        <SectionCard>
          <SectionRow>
            <SectionHeader
              icon={Target}
              title="Learning goal"
              description="Shapes the scenarios and phrasing the AI practices with you"
              color="text-violet-500"
            />
          </SectionRow>
          <SectionRow last>
            <FieldLabel>What are you working toward?</FieldLabel>
            <select
              value={learningGoal}
              onChange={(e) => setLearningGoal(e.target.value)}
              className="h-11 w-full rounded-lg border border-border bg-accent/5 px-3 text-sm font-semibold text-foreground outline-none transition-colors focus:bg-background focus:ring-2 focus:ring-blue-500/20 dark:bg-white/5"
            >
              <option value="">Select your main goal</option>
              {["Daily standup participation", "Team meeting communication", "Writing professional messages", "Technical discussion in Korean", "General workplace communication"].map((g) => <option key={g} value={g}>{g}</option>)}
            </select>
          </SectionRow>
        </SectionCard>
      </motion.div>

      {/* Romanization lives in Korean Coach preferences — the single source of
          truth (kori_korean_coach_preferences.romanization_mode) that Korean
          Coach and Phrasebook both read. Linked rather than duplicated here so
          there is only ever one control for it. */}
      <motion.div variants={itemVariants}>
        <SectionCard>
          <button
            type="button"
            onClick={() => router.push("/korean-coach/preferences")}
            className="group flex w-full items-center justify-between px-5 py-4 text-left transition-all hover:bg-accent/5 active:scale-[0.98] sm:px-6"
          >
            <SectionHeader
              icon={Type}
              title="Romanization & Korean Coach"
              description="Romanization, speech speed, and correction strictness"
              color="text-teal-500"
            />
            <ChevronRight
              size={14}
              strokeWidth={2}
              className="shrink-0 text-muted-foreground/60 transition-transform group-hover:translate-x-0.5"
            />
          </button>
        </SectionCard>
      </motion.div>

      {/* Background + Work */}
      <motion.div variants={itemVariants}>
        <SectionCard>
          <SectionRow>
            <SectionHeader icon={Globe} title="Background & Work" description="Helps the AI tailor examples to you" color="text-sky-500" />
          </SectionRow>
          <SectionRow last>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <FieldLabel>Country</FieldLabel>
                <select value={country} onChange={(e) => setCountry(e.target.value)} className="h-11 w-full rounded-lg border border-border bg-accent/5 px-3 text-sm font-semibold text-foreground outline-none transition-colors focus:bg-background focus:ring-2 focus:ring-blue-500/20 dark:bg-white/5">
                  <option value="">Select country</option>
                  {countries.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <FieldLabel>Native language</FieldLabel>
                <select value={nativeLanguage} onChange={(e) => setNativeLanguage(e.target.value)} className="h-11 w-full rounded-lg border border-border bg-accent/5 px-3 text-sm font-semibold text-foreground outline-none transition-colors focus:bg-background focus:ring-2 focus:ring-blue-500/20 dark:bg-white/5">
                  <option value="">Select language</option>
                  {["Khmer", "English", "Chinese", "Japanese", "Vietnamese", "Thai", "Indonesian", "Filipino", "Malay", "Other"].map((l) => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>
              <div>
                <FieldLabel>Occupation</FieldLabel>
                <select value={occupation} onChange={(e) => setOccupation(e.target.value)} className="h-11 w-full rounded-lg border border-border bg-accent/5 px-3 text-sm font-semibold text-foreground outline-none transition-colors focus:bg-background focus:ring-2 focus:ring-blue-500/20 dark:bg-white/5">
                  <option value="">Select role</option>
                  {["Frontend Developer", "Backend Developer", "Full-Stack Developer", "QA Engineer", "DevOps Engineer", "Product Manager", "Data Scientist", "Other"].map((o) => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
              <div>
                <FieldLabel>Years of experience</FieldLabel>
                <Input type="number" min={0} max={50} value={yearsOfExperience} onChange={(e) => setYearsOfExperience(e.target.value)} placeholder="e.g. 3" className="h-11 rounded-lg border-border bg-accent/5 px-4 font-semibold transition-colors focus:bg-background" />
              </div>
            </div>
          </SectionRow>
        </SectionCard>
      </motion.div>

      {/* AI Model */}
      <motion.div variants={itemVariants}>
        <SectionCard>
          <SectionRow>
            <SectionHeader
              icon={Cpu}
              title="AI Model"
              description="Powers your conversations and feedback"
              color="text-sky-500"
            />
          </SectionRow>
          <SectionRow last>
            <div className="space-y-4">
              <div className="grid gap-2 sm:grid-cols-3">
                {models.map((model) => {
                  const active = preferredModel === model.value && !customModel
                  return (
                    <button
                      key={model.value}
                      type="button"
                      onClick={() => { setPreferredModel(model.value); setCustomModel("") }}
                      className={cn(
                        "group relative flex min-h-11 flex-col gap-0.5 rounded-lg border px-4 py-3 text-left transition-colors",
                        active
                          ? "border-sky-500/30 bg-sky-500/5 ring-1 ring-sky-500/20"
                          : "border-border bg-accent/5 hover:border-sky-500/20 hover:bg-background"
                      )}
                    >
                      <p className={cn("text-sm font-semibold", active ? "text-foreground" : "text-muted-foreground")}>
                        {model.label}
                      </p>
                      <p className="text-xs text-muted-foreground">{model.desc}</p>
                      {active && (
                        <div className="absolute right-3 top-3 h-1.5 w-1.5 rounded-full bg-sky-500 shadow-[0_0_8px_rgba(14,165,233,0.6)]" />
                      )}
                    </button>
                  )
                })}
              </div>

              <div>
                <FieldLabel>Custom model</FieldLabel>
                <Input
                  value={customModel}
                  onChange={(e) => setCustomModel(e.target.value)}
                  placeholder="e.g. gpt-4-turbo"
                  className="h-11 rounded-lg border-border bg-accent/5 px-4 font-mono text-xs transition-colors focus:bg-background"
                />
              </div>
            </div>
          </SectionRow>
        </SectionCard>
      </motion.div>

      {/* Notifications */}
      <motion.div variants={itemVariants}>
        <SectionCard>
          <SectionRow>
            <SectionHeader icon={Bell} title="Notifications" color="text-violet-500" />
          </SectionRow>

          {/* Browser push */}
          <SectionRow>
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-foreground">Browser</p>
                <p className="text-xs text-muted-foreground">
                  {push.supported
                    ? push.webState === "denied"
                      ? "Blocked in browser settings."
                      : "Alerts when Hengo isn't open."
                    : "Not supported in this browser."}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {push.webEnabled && (
                  <Button type="button" variant="outline" size="sm" onClick={() => push.sendTest()}>
                    Send test
                  </Button>
                )}
                <Switch
                  checked={push.webEnabled}
                  disabled={!push.supported || push.webBusy || push.webState === "denied"}
                  onCheckedChange={(v) => (v ? push.enableWeb() : push.disableWeb())}
                  aria-label="Toggle browser notifications"
                />
              </div>
            </div>
          </SectionRow>

          {/* Telegram */}
          <SectionRow>
            <div className="flex items-center justify-between gap-4">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-sky-500/10 text-sky-500">
                  <Send size={14} strokeWidth={2} />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground">Telegram</p>
                  <p className="text-xs text-muted-foreground">
                    {push.telegramLinked ? "Connected" : "Get alerts in Telegram"}
                  </p>
                </div>
              </div>
              {push.telegramLinked ? (
                <div className="flex items-center gap-2">
                  <Button type="button" variant="outline" size="sm" onClick={() => push.sendTelegramTest()}>
                    Send test
                  </Button>
                  <Button type="button" variant="outline" size="sm" onClick={() => push.unlinkTelegram()}>
                    Disconnect
                  </Button>
                </div>
              ) : (
                <Button type="button" size="sm" onClick={() => push.linkTelegram()}>
                  Connect
                </Button>
              )}
            </div>
          </SectionRow>

          {/* Study reminders */}
          <SectionRow>
            <div className="flex items-center justify-between gap-4">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-500">
                  <AlarmClock size={14} strokeWidth={2} />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground">Daily reminders</p>
                  <p className="text-xs text-muted-foreground">
                    Review nudge + streak saver
                  </p>
                </div>
              </div>
              <Switch
                checked={studyRemindersEnabled}
                disabled={savingReminders}
                onCheckedChange={(v) => saveStudyReminders(v, studyReminderHour)}
                aria-label="Toggle daily study reminders"
              />
            </div>
            {studyRemindersEnabled && (
              <div className="mt-3 flex items-center justify-between gap-4 rounded-lg bg-accent/5 px-4 py-3 dark:bg-white/5">
                <label htmlFor="study-hour" className="text-sm font-medium text-muted-foreground">
                  Remind me at
                </label>
                <select
                  id="study-hour"
                  value={studyReminderHour}
                  disabled={savingReminders}
                  onChange={(e) => saveStudyReminders(studyRemindersEnabled, Number(e.target.value))}
                  className="h-11 rounded-lg border border-border bg-background px-3 text-sm font-semibold text-foreground outline-none transition-colors focus:ring-2 focus:ring-emerald-500/20"
                >
                  {Array.from({ length: 24 }, (_, h) => (
                    <option key={h} value={h}>
                      {h === 0 ? "12:00 AM" : h < 12 ? `${h}:00 AM` : h === 12 ? "12:00 PM" : `${h - 12}:00 PM`}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </SectionRow>

          <SectionRow last>
            <button
              type="button"
              onClick={() => router.push("/settings/reminders")}
              className="flex min-h-11 w-full items-center justify-between gap-4 text-left"
            >
              <div className="min-w-0">
                <p className="text-sm font-semibold text-foreground">Custom reminders</p>
                <p className="text-xs text-muted-foreground">
                  Manage reminders you&apos;ve set on tasks, habits, notes, and more
                </p>
              </div>
              <ChevronRight size={16} className="shrink-0 text-muted-foreground" />
            </button>
          </SectionRow>
        </SectionCard>
      </motion.div>

      {/* Account */}
      <motion.div variants={itemVariants}>
        <SectionCard>
          <button
            type="button"
            onClick={handleSignOut}
            className="group flex w-full items-center justify-between px-5 py-4 text-left transition-all hover:bg-red-500/5 active:scale-[0.98] sm:px-6"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-500/10 text-red-500">
                <LogOut size={16} strokeWidth={2} />
              </div>
              <div>
                <p className="text-sm font-semibold text-red-600 dark:text-red-400">Sign out</p>
                <p className="text-xs text-muted-foreground">End your session</p>
              </div>
            </div>
            <ChevronRight size={14} strokeWidth={2} className="text-muted-foreground/60 transition-transform group-hover:translate-x-0.5" />
          </button>
        </SectionCard>
      </motion.div>

      <motion.div variants={itemVariants} className="pt-2 text-center">
        <p className="text-xs text-muted-foreground">
          © 2026 Hen Heang · FullStack Developer
        </p>
      </motion.div>

      {/* Sticky save bar — only intrudes once there's something to save */}
      <AnimatePresence>
        {(isDirty || saving || saved) && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="sticky bottom-[calc(4.5rem+env(safe-area-inset-bottom))] z-30 mx-auto flex w-full max-w-3xl items-center gap-3 rounded-lg border border-border bg-card/95 p-3 shadow-md backdrop-blur-xl dark:bg-slate-900/90 lg:bottom-4"
          >
            <p className={cn("flex-1 truncate px-2 text-xs font-medium", error ? "text-destructive" : "text-muted-foreground")}>
              {error || "You have unsaved changes."}
            </p>
            <Button
              type="submit"
              disabled={saving || !isDirty}
              className="h-11 shrink-0 rounded-lg bg-blue-600 px-5 text-sm font-semibold text-white transition-colors hover:bg-blue-500 disabled:opacity-60"
            >
              {saving ? (
                <><Loader2 size={16} className="mr-2 animate-spin" /> Saving…</>
              ) : saved ? (
                <><Check size={16} className="mr-2" strokeWidth={3} /> Saved</>
              ) : (
                "Save changes"
              )}
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.form>
  )
}
