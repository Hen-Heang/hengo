"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { ChevronLeft } from "lucide-react"
import { toast } from "sonner"
import { NoteEditor, type NoteEditorValues } from "@/components/notes/NoteEditor"
import { useNoteMutations } from "@/hooks/useNotes"
import { useSessionTimer } from "@/hooks/useSessionTimer"

const EMPTY: NoteEditorValues = {
  slug: "",
  title: "",
  description: "",
  icon: "common",
  category: "",
  noteType: "technical",
  tags: [],
  sourceUrl: "",
  pinned: false,
  content: "# New note\n\nStart writing in **markdown**.\n",
}

export default function NewNotePage() {
  useSessionTimer("notes")
  const router = useRouter()
  const { create } = useNoteMutations()

  const handleSave = async (values: NoteEditorValues) => {
    await create.mutateAsync({
      slug: values.slug,
      title: values.title,
      description: values.description,
      icon: values.icon,
      category: values.category || undefined,
      noteType: values.noteType,
      content: values.content,
      tags: values.tags,
      pinned: values.pinned,
      sourceUrl: values.sourceUrl.trim() || null,
    })
    toast.success("Note created")
    router.push(`/notes/${values.slug}`)
  }

  return (
    <div className="mx-auto max-w-4xl pb-6 sm:pb-8">
      <Link
        href="/notes"
        className="mb-4 inline-flex min-h-11 items-center gap-1.5 rounded-lg px-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
      >
        <ChevronLeft size={14} />
        All notes
      </Link>
      <NoteEditor
        mode="create"
        initial={EMPTY}
        onSave={handleSave}
        onCancel={() => router.push("/notes")}
      />
    </div>
  )
}
