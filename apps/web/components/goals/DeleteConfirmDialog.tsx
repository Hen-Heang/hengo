"use client"

import { Loader2 } from "lucide-react"

import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"

interface DeleteConfirmDialogProps {
  isOpen: boolean
  isDeleting: string | null
  onCancel: () => void
  onConfirm: () => void | Promise<void>
  goalTitle: string
  itemType?: "goal" | "task"
}

export function DeleteConfirmDialog({
  isOpen,
  isDeleting,
  onCancel,
  onConfirm,
  goalTitle,
  itemType = "goal",
}: DeleteConfirmDialogProps) {
  const isTask = itemType === "task"
  return (
    <AlertDialog open={isOpen} onOpenChange={(open) => !open && onCancel()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{isTask ? "Delete task" : "Delete goal"}</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete <strong>{goalTitle}</strong>?
            {isTask ? " This cannot be undone." : " This also removes its tasks and cannot be undone."}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <Button variant="outline" onClick={onCancel} disabled={!!isDeleting}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={() => onConfirm()} disabled={!!isDeleting}>
            {isDeleting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Deleting...
              </>
            ) : (
              "Delete"
            )}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
