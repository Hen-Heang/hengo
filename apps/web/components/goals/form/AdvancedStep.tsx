"use client"

import { ChevronLeft, Loader2, Sparkles, Target } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import type { FormStepProps } from "@/lib/goal-form"

interface AdvancedStepProps extends FormStepProps {
  onPrevStep: () => void
  onSubmit: () => void
  isSubmitting: boolean
  isEdit?: boolean
}

// The AI switch is real: useGoalMutations routes to the new goal's plan
// builder (`?aiPlan=1`), which drafts tasks and requires an explicit
// confirmation before writing anything. It previously only fired a "coming
// soon" toast — see docs/goal-planning-scheduling-audit.md.
export function AdvancedStep({ form, onPrevStep, onSubmit, isSubmitting, isEdit = false }: AdvancedStepProps) {
  const generateTasksWithAI = form.watch("generate_tasks_with_ai") || false

  const handleSubmit = async () => {
    const result = await form.trigger(["title", "goal_type", "target_date"])
    if (result) onSubmit()
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <h3 className="text-lg font-semibold">AI task generation</h3>
        <p className="text-sm text-muted-foreground">
          AI drafts an action plan for your goal. You review and edit the draft before any task is
          saved.
        </p>
      </div>

      <div className="space-y-4">
        <FormField
          control={form.control}
          name="generate_tasks_with_ai"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-xl border border-primary/30 bg-primary/5 p-4">
              <div className="flex-1 space-y-0.5 pr-4">
                <FormLabel className="flex items-center gap-2 text-base font-semibold">
                  <Sparkles className="h-5 w-5 text-primary" />
                  Draft an action plan with AI
                </FormLabel>
                <p className="mt-2 text-sm text-muted-foreground">
                  After saving, you&apos;ll get a proposed task list to review, edit and confirm.
                </p>
              </div>
              <FormControl>
                <Switch checked={field.value} onCheckedChange={field.onChange} />
              </FormControl>
            </FormItem>
          )}
        />

        {generateTasksWithAI && (
          <FormField
            control={form.control}
            name="ai_prompt"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium">Additional instructions (optional)</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="E.g., I prefer morning workouts, focus on beginner tasks"
                    className="min-h-[100px]"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}
      </div>

      <div className="flex justify-between pt-4">
        <Button type="button" variant="outline" onClick={onPrevStep} disabled={isSubmitting}>
          <ChevronLeft className="h-4 w-4" />
          Back
        </Button>
        <Button type="button" onClick={handleSubmit} disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              {isEdit ? "Updating..." : "Creating..."}
            </>
          ) : (
            <>
              {generateTasksWithAI ? <Sparkles className="h-4 w-4" /> : <Target className="h-4 w-4" />}
              {isEdit ? "Update goal" : generateTasksWithAI ? "Create & draft plan" : "Create goal"}
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
