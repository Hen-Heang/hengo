"use client"

import { useState } from "react"
import { Pencil, Star, Trash2, Loader2 } from "lucide-react"

import { ReminderButton } from "@/components/reminders/ReminderButton"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface NoteActionsProps {
  pinned?: boolean
  onEdit: () => void
  onTogglePin?: () => Promise<void> | void
  onDelete: () => Promise<void> | void
  /** When provided, shows a reminder bell for this note. */
  noteId?: string
  noteSlug?: string
  noteTitle?: string
}

export function NoteActions({
  pinned = false,
  onEdit,
  onTogglePin,
  onDelete,
  noteId,
  noteSlug,
  noteTitle,
}: NoteActionsProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const [isPinning, setIsPinning] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const handleDelete = async (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault()
    if (isDeleting) return
    setIsDeleting(true)
    try {
      await onDelete()
      setShowConfirm(false)
    } catch {
      setIsDeleting(false)
    }
  }

  const handleTogglePin = async () => {
    if (!onTogglePin || isPinning) return
    setIsPinning(true)
    try {
      await onTogglePin()
    } finally {
      setIsPinning(false)
    }
  }

  return (
    <div className="flex items-center gap-2">
      {noteId && (
        <ReminderButton
          entityType="note"
          entityId={noteId}
          deepLink={noteSlug ? `https://hengo.henheang.site/notes/${noteSlug}` : undefined}
          defaultTitle={`Revisit: ${noteTitle ?? "note"}`}
        />
      )}
      {onTogglePin && (
        <Button
          type="button"
          variant="outline"
          size="icon-sm"
          onClick={handleTogglePin}
          disabled={isPinning}
          aria-pressed={pinned}
          aria-label={pinned ? "Unpin note" : "Pin note"}
          className={cn(
            "hover:border-blue-500/50",
            pinned ? "text-blue-600 dark:text-blue-400" : "text-muted-foreground",
          )}
        >
          <Star size={14} className={pinned ? "fill-current" : ""} />
        </Button>
      )}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={onEdit}
        className="text-muted-foreground hover:border-blue-500/50 hover:text-blue-600 dark:hover:text-blue-400"
      >
        <Pencil size={14} />
        Edit
      </Button>
      <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
        <AlertDialogTrigger asChild>
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            aria-label="Delete note"
            className="text-muted-foreground hover:border-red-500/50 hover:bg-red-500/10 hover:text-red-500"
          >
            <Trash2 size={14} />
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this note?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently deletes the note. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? <Loader2 size={16} className="animate-spin" /> : null}
              Delete note
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
