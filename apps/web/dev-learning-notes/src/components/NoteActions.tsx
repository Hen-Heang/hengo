"use client";

import { useState } from "react";
import { Pencil, Trash2, Loader2, AlertTriangle } from "lucide-react";
import { deleteNoteAction } from "@/app/actions/notes";

interface NoteActionsProps {
  slug: string;
  onEdit: () => void;
}

export function NoteActions({ slug, onEdit }: NoteActionsProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteNoteAction(slug);
    } catch (err) {
      console.error(err);
      setIsDeleting(false);
      setShowConfirm(false);
    }
  };

  if (showConfirm) {
    return (
      <div className="flex items-center gap-3 p-3 rounded-xl bg-red-500/10 border border-red-500/20 animate-in fade-in zoom-in-95">
        <AlertTriangle size={16} className="text-red-500" />
        <span className="text-xs font-bold text-red-600 dark:text-red-200">Are you sure?</span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowConfirm(false)}
            className="px-3 py-1 rounded-lg bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-[10px] font-bold text-zinc-600 dark:text-zinc-300 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="px-3 py-1 rounded-lg bg-red-600 hover:bg-red-500 text-[10px] font-bold text-white transition-all shadow-lg"
          >
            {isDeleting ? <Loader2 size={12} className="animate-spin" /> : "Delete"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={onEdit}
        className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-emerald-500/50 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-500 dark:text-zinc-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-all text-xs font-bold"
      >
        <Pencil size={14} />
        Edit Note
      </button>
      <button
        onClick={() => setShowConfirm(true)}
        className="p-1.5 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-red-500/50 hover:bg-red-500/10 text-zinc-400 dark:text-zinc-600 hover:text-red-500 transition-all"
      >
        <Trash2 size={14} />
      </button>
    </div>
  );
}
