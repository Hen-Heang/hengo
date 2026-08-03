"use client";

import { useState } from "react";
import { Save, X, Loader2 } from "lucide-react";

interface NoteEditorProps {
  initialContent: string;
  initialTitle: string;
  initialDescription: string;
  initialIcon: string;
  onSave: (content: string, meta: { title: string; description: string; icon: string }) => Promise<void>;
  onCancel: () => void;
}

export function NoteEditor({ 
  initialContent, 
  initialTitle, 
  initialDescription, 
  initialIcon, 
  onSave, 
  onCancel 
}: NoteEditorProps) {
  const [content, setContent] = useState(initialContent);
  const [title, setTitle] = useState(initialTitle);
  const [description, setDescription] = useState(initialDescription);
  const [icon, setIcon] = useState(initialIcon);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(content, { title, description, icon });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Editor Header */}
      <div className="flex flex-col sm:flex-row gap-4 p-6 rounded-2xl bg-zinc-900/50 border border-zinc-800/50 backdrop-blur-sm">
        <div className="flex-1 space-y-4">
          <div className="flex items-center gap-4">
            <input
              value={icon}
              onChange={(e) => setIcon(e.target.value)}
              placeholder="Icon key (e.g. java)"
              className="w-12 h-12 rounded-xl bg-zinc-950 border border-zinc-800 text-center text-xl focus:outline-none focus:border-emerald-500/50 transition-colors"
            />
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Note Title"
              className="flex-1 bg-transparent text-2xl sm:text-3xl font-bold text-white focus:outline-none placeholder:opacity-20"
            />
          </div>
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Short description..."
            className="w-full bg-transparent text-sm text-zinc-400 focus:outline-none placeholder:opacity-20"
          />
        </div>
        
        <div className="flex items-center gap-2 sm:self-start">
          <button
            onClick={onCancel}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm font-medium transition-colors"
          >
            <X size={16} />
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:bg-emerald-500/50 text-emerald-950 text-sm font-bold transition-all shadow-[0_0_20px_-5px_rgba(16,185,129,0.4)]"
          >
            {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            Save Changes
          </button>
        </div>
      </div>

      {/* Main Textarea */}
      <div className="relative group">
        <div className="absolute -inset-px bg-linear-to-b from-emerald-500/10 to-transparent rounded-2xl blur-sm opacity-0 group-focus-within:opacity-100 transition-opacity pointer-events-none" />
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Write your markdown here..."
          className="relative w-full min-h-[500px] p-8 rounded-2xl bg-zinc-900/30 border border-zinc-800/50 text-zinc-300 font-mono text-sm leading-relaxed focus:outline-none focus:border-emerald-500/30 transition-all resize-none"
        />
      </div>
    </div>
  );
}
