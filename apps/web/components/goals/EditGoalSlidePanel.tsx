"use client"

import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "motion/react"
import { Calendar, FileText, Loader2, Save, Smile, Tag, Type, X } from "lucide-react"

import EmojiIconPicker from "@/components/ui/emoji-icon-picker"
import { Button } from "@/components/ui/button"
import { DateTimePicker } from "@/components/ui/date-time-picker"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { goalsApi } from "@/lib/api"
import type { Goal, GoalType } from "@/lib/goals"
import { useUpdateGoal } from "@/hooks/useGoalMutations"
import { toast } from "sonner"

interface EditGoalSlidePanelProps {
  isOpen: boolean
  goal: Goal | null
  onClose: () => void
  onSuccess: (updatedGoal: Goal) => void
}

const goalTypes: { value: GoalType; label: string }[] = [
  { value: "general", label: "General Goal" },
  { value: "travel", label: "Travel Plan" },
  { value: "finance", label: "Financial Goal" },
  { value: "education", label: "Education Goal" },
]

export function EditGoalSlidePanel({
  isOpen,
  goal,
  onClose,
  onSuccess,
}: EditGoalSlidePanelProps) {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [startDate, setStartDate] = useState<Date>(new Date())
  const [targetDate, setTargetDate] = useState<Date>(new Date())
  const [noDuration, setNoDuration] = useState(false)
  const [goalType, setGoalType] = useState<GoalType>("general")
  const [icon, setIcon] = useState<string | null>(null)

  const { updateGoal, isLoading } = useUpdateGoal()

  const applyGoalToForm = (g: Goal) => {
    setTitle(g.title || "")
    setDescription(g.description || "")
    setGoalType((g.metadata?.goal_type as GoalType) || "general")
    setIcon(g.metadata?.icon ?? null)
    const isForever = Boolean(g.no_duration || g.metadata?.no_duration || !g.target_date)
    setNoDuration(isForever)
    setTargetDate(g.target_date ? new Date(g.target_date) : new Date())
    setStartDate(new Date(g.metadata?.start_date || g.created_at))
  }

  // Hydrate from latest server data when the panel opens to avoid stale values.
  useEffect(() => {
    if (!isOpen || !goal?.id) return
    let active = true
    ;(async () => {
      try {
        const fresh = await goalsApi.get(goal.id)
        if (active && fresh) {
          applyGoalToForm(fresh)
          return
        }
      } catch {
        /* fall back to the goal passed in */
      }
      if (active) applyGoalToForm(goal)
    })()
    return () => {
      active = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, goal?.id])

  const handleSave = async () => {
    if (!goal || !title.trim()) {
      toast.error("Goal title is required")
      return
    }
    const result = await updateGoal(goal.id, {
      title: title.trim(),
      description: description.trim(),
      target_date: noDuration ? null : targetDate,
      no_duration: noDuration,
      start_date: startDate,
      metadata: {
        ...goal.metadata,
        goal_type: goalType,
        start_date: startDate.toISOString(),
        no_duration: noDuration,
        icon: icon ?? undefined,
      },
    })
    if (result.success && result.goal) {
      onSuccess(result.goal)
      onClose()
    }
  }

  const handleCancel = () => {
    if (goal) applyGoalToForm(goal)
    onClose()
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 z-50 flex h-[100dvh] w-full flex-col border-l border-border/60 bg-background shadow-2xl md:max-w-xl"
          >
            {/* Header */}
            <div className="flex-shrink-0 border-b border-border/60 px-4 py-4 sm:px-6">
              <div className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-2">
                  <Button variant="ghost" size="icon-sm" onClick={onClose} className="rounded-full">
                    <X className="h-5 w-5" />
                  </Button>
                  <h2 className="truncate text-xl font-bold">Edit Goal</h2>
                </div>
                <Button onClick={handleSave} disabled={isLoading || !title.trim()} size="sm">
                  {isLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                  Save
                </Button>
              </div>
              <p className="mt-1 pl-10 text-sm text-muted-foreground">Update your goal details</p>
            </div>

            {/* Form */}
            <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-4 py-4 sm:px-6 sm:space-y-6">
              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-sm font-medium">
                  <Smile className="h-4 w-4" /> Goal Icon
                </Label>
                <div className="flex items-center gap-3">
                  <EmojiIconPicker value={icon} onChange={setIcon} align="start">
                    <button
                      type="button"
                      className="flex h-14 w-14 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 text-3xl shadow-sm transition-all hover:scale-105 hover:border-primary/40 hover:bg-primary/20"
                    >
                      {icon ?? (
                        <span className="text-xl font-bold text-primary">
                          {goal?.title?.charAt(0)?.toUpperCase() || "G"}
                        </span>
                      )}
                    </button>
                  </EmojiIconPicker>
                  <div className="flex flex-col gap-1">
                    <p className="text-sm font-medium text-foreground">
                      {icon ? "Icon selected" : "No icon selected"}
                    </p>
                    <p className="text-xs text-muted-foreground">Click to pick an emoji icon</p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="title" className="flex items-center gap-2 text-sm font-medium">
                  <Type className="h-4 w-4" /> Goal Title
                </Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter goal title..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" className="flex items-center gap-2 text-sm font-medium">
                  <FileText className="h-4 w-4" /> Description
                </Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe your goal..."
                  rows={4}
                  className="resize-none"
                />
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-sm font-medium">
                  <Tag className="h-4 w-4" /> Goal Type
                </Label>
                <Select value={goalType} onValueChange={(v) => setGoalType(v as GoalType)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {goalTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-sm font-medium">
                  <Calendar className="h-4 w-4" /> Start Date
                </Label>
                <DateTimePicker
                  granularity="day"
                  value={startDate}
                  onChange={(d) => d && setStartDate(d)}
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between rounded-xl border border-border bg-muted/25 px-3 py-2">
                  <Label className="flex items-center gap-2 text-sm font-medium">
                    <Calendar className="h-4 w-4" /> Forever (No Due Date)
                  </Label>
                  <Switch checked={noDuration} onCheckedChange={setNoDuration} />
                </div>
                {!noDuration && (
                  <>
                    <Label className="flex items-center gap-2 text-sm font-medium">
                      <Calendar className="h-4 w-4" /> Due Date
                    </Label>
                    <DateTimePicker
                      granularity="day"
                      value={targetDate}
                      onChange={(d) => d && setTargetDate(d)}
                    />
                  </>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="flex-shrink-0 border-t border-border/60 px-4 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:px-6 sm:pb-4">
              <div className="flex gap-3">
                <Button variant="outline" onClick={handleCancel} disabled={isLoading} className="flex-1">
                  Cancel
                </Button>
                <Button onClick={handleSave} disabled={isLoading || !title.trim()} className="flex-1">
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" /> Save
                    </>
                  )}
                </Button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
