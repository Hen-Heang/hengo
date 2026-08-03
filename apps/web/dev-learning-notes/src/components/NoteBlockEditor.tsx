"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Plus, Trash2, Check, X, Loader2, ChevronDown } from "lucide-react";
import { marked } from "marked";
import { cn } from "@/lib/cn";

// ─── Block types & languages ──────────────────────────────────────────────────

const BLOCK_TYPES = [
  { key: "paragraph",     label: "Text",          badge: "T",   hint: "Plain paragraph" },
  { key: "heading1",      label: "Heading 1",     badge: "H1",  hint: "# Large heading" },
  { key: "heading2",      label: "Heading 2",     badge: "H2",  hint: "## Medium heading" },
  { key: "heading3",      label: "Heading 3",     badge: "H3",  hint: "### Small heading" },
  { key: "code",          label: "Code block",    badge: "</>", hint: "```lang" },
  { key: "list",          label: "Bullet list",   badge: "•",   hint: "- item" },
  { key: "numbered",      label: "Numbered list", badge: "1.",  hint: "1. item" },
  { key: "quote",         label: "Quote",         badge: '"',   hint: "> blockquote" },
  { key: "hr",            label: "Divider",       badge: "—",   hint: "---" },
] as const;

type BlockTypeKey = (typeof BLOCK_TYPES)[number]["key"];

const CODE_LANGUAGES = [
  "java", "javascript", "typescript", "sql", "xml",
  "html", "css", "bash", "json", "python",
  "properties", "jsx", "tsx", "text",
];

// ─── Block type utilities ─────────────────────────────────────────────────────

function getBlockType(raw: string): BlockTypeKey {
  if (raw.startsWith("### "))          return "heading3";
  if (raw.startsWith("## "))           return "heading2";
  if (raw.startsWith("# "))            return "heading1";
  if (raw.startsWith("```"))           return "code";
  if (raw.startsWith("> "))            return "quote";
  if (/^(\s*-|\s*\*) /.test(raw))      return "list";
  if (/^\d+\. /.test(raw))             return "numbered";
  if (/^(-{3,}|={3,}|_{3,})$/.test(raw.trim())) return "hr";
  return "paragraph";
}

function getPlainContent(raw: string): string {
  if (raw.startsWith("### "))  return raw.slice(4);
  if (raw.startsWith("## "))   return raw.slice(3);
  if (raw.startsWith("# "))    return raw.slice(2);
  if (raw.startsWith("> "))    return raw.slice(2);
  if (raw.startsWith("```")) {
    const lines = raw.split("\n");
    return lines.slice(1, lines[lines.length - 1] === "```" ? -1 : undefined).join("\n");
  }
  if (/^(\s*-|\s*\*) /.test(raw)) return raw.replace(/^(\s*[-*]) /gm, "");
  if (/^\d+\. /.test(raw))         return raw.replace(/^\d+\. /gm, "");
  return raw;
}

function applyBlockType(raw: string, type: BlockTypeKey, lang = "java"): string {
  const c = getPlainContent(raw);
  switch (type) {
    case "heading1":  return `# ${c}`;
    case "heading2":  return `## ${c}`;
    case "heading3":  return `### ${c}`;
    case "paragraph": return c;
    case "code":      return `\`\`\`${lang}\n${c || ""}\n\`\`\``;
    case "list":      return c.split("\n").map((l) => `- ${l}`).join("\n");
    case "numbered":  return c.split("\n").map((l, i) => `${i + 1}. ${l}`).join("\n");
    case "quote":     return `> ${c}`;
    case "hr":        return "---";
  }
}

function getCodeLang(raw: string): string {
  return raw.match(/^```(\w*)/)?.[1] ?? "";
}

function setCodeLang(raw: string, lang: string): string {
  return raw.replace(/^```\w*/, `\`\`\`${lang}`);
}

// ─── Markdown renderer (client-side, no shiki) ───────────────────────────────

function renderHtml(raw: string): string {
  try {
    return marked.parse(raw, { async: false }) as string;
  } catch {
    return `<pre>${raw}</pre>`;
  }
}

// ─── Dropdown hook (close on outside click) ───────────────────────────────────

function useDropdown() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return { open, setOpen, ref };
}

// ─── Block type selector ──────────────────────────────────────────────────────

function BlockTypeSelector({
  currentType,
  onSelect,
}: {
  currentType: BlockTypeKey;
  onSelect: (type: BlockTypeKey) => void;
}) {
  const { open, setOpen, ref } = useDropdown();
  const current = BLOCK_TYPES.find((t) => t.key === currentType)!;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[10px] font-mono font-bold transition-all border",
          "text-zinc-500 border-zinc-800 bg-zinc-900/60 hover:text-zinc-200 hover:border-zinc-600",
          open && "text-emerald-400 border-emerald-500/40 bg-emerald-500/10"
        )}
        title="Change block type"
      >
        <span>{current.badge}</span>
        <ChevronDown size={8} className={cn("transition-transform", open && "rotate-180")} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.96 }}
            transition={{ duration: 0.1 }}
            className="absolute left-0 top-full mt-1 z-50 w-44 rounded-2xl border border-zinc-800 bg-zinc-950 shadow-2xl py-1 overflow-hidden"
          >
            {BLOCK_TYPES.map((t) => (
              <button
                key={t.key}
                onClick={() => { onSelect(t.key); setOpen(false); }}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2 text-left transition-colors text-xs hover:bg-zinc-900",
                  t.key === currentType
                    ? "text-emerald-400 bg-emerald-500/10"
                    : "text-zinc-400"
                )}
              >
                <span className="w-6 font-mono font-bold text-[10px] text-zinc-500 text-center shrink-0">
                  {t.badge}
                </span>
                <span className="font-medium">{t.label}</span>
                <span className="ml-auto text-[9px] text-zinc-700 font-mono">{t.hint}</span>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Code language selector ───────────────────────────────────────────────────

function CodeLangSelector({
  lang,
  onSelect,
}: {
  lang: string;
  onSelect: (lang: string) => void;
}) {
  const { open, setOpen, ref } = useDropdown();

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-mono font-bold transition-all border",
          "text-zinc-400 border-zinc-700/60 bg-zinc-900 hover:text-zinc-200 hover:border-zinc-600",
          open && "text-emerald-400 border-emerald-500/40"
        )}
      >
        {lang || "text"}
        <ChevronDown size={9} className={cn("transition-transform", open && "rotate-180")} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.96 }}
            transition={{ duration: 0.1 }}
            className="absolute left-0 top-full mt-1 z-50 w-36 rounded-2xl border border-zinc-800 bg-zinc-950 shadow-2xl py-1 overflow-hidden"
          >
            {CODE_LANGUAGES.map((l) => (
              <button
                key={l}
                onClick={() => { onSelect(l); setOpen(false); }}
                className={cn(
                  "w-full px-3 py-1.5 text-left text-xs font-mono transition-colors hover:bg-zinc-900",
                  l === lang ? "text-emerald-400 bg-emerald-500/10" : "text-zinc-400"
                )}
              >
                {l}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Auto-resize textarea ─────────────────────────────────────────────────────

function AutoTextarea({
  value,
  onChange,
  onSave,
  onCancel,
}: {
  value: string;
  onChange: (v: string) => void;
  onSave: () => void;
  onCancel: () => void;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = el.scrollHeight + "px";
    el.focus();
    el.setSelectionRange(el.value.length, el.value.length);
  }, []);

  function handleInput(e: React.ChangeEvent<HTMLTextAreaElement>) {
    onChange(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = e.target.scrollHeight + "px";
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Escape") { e.preventDefault(); onCancel(); }
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") { e.preventDefault(); onSave(); }
  }

  return (
    <textarea
      ref={ref}
      value={value}
      onChange={handleInput}
      onKeyDown={handleKeyDown}
      spellCheck={false}
      className="w-full bg-zinc-950/70 text-zinc-200 font-mono text-sm leading-relaxed px-4 py-3 rounded-xl border border-emerald-500/40 focus:outline-none focus:border-emerald-500/70 resize-none min-h-11 transition-colors"
    />
  );
}

// ─── Single block ─────────────────────────────────────────────────────────────

interface Block { id: string; raw: string; }

interface BlockItemProps {
  block: Block;
  isEditing: boolean;
  onStartEdit: () => void;
  onSave: (raw: string) => void;
  onCancel: () => void;
  onDelete: () => void;
  onAddAfter: () => void;
  onTypeChange: (newRaw: string) => void;
}

function BlockItem({
  block, isEditing, onStartEdit, onSave, onCancel,
  onDelete, onAddAfter, onTypeChange,
}: BlockItemProps) {
  const [draft, setDraft] = useState(block.raw);

  const blockType = getBlockType(block.raw);
  const isCode = blockType === "code";
  const codeLang = isCode ? getCodeLang(block.raw) : "";
  const html = renderHtml(block.raw);

  function handleTypeChange(newType: BlockTypeKey) {
    const lang = isCode ? codeLang : "java";
    onTypeChange(applyBlockType(block.raw, newType, lang));
  }

  function handleLangChange(lang: string) {
    onTypeChange(setCodeLang(block.raw, lang));
  }

  if (isEditing) {
    return (
      <motion.div initial={{ opacity: 0.8 }} animate={{ opacity: 1 }} className="relative space-y-2">
        {/* Edit toolbar */}
        <div className="flex items-center gap-2 px-1">
          <BlockTypeSelector
            currentType={blockType}
            onSelect={(type) => {
              const converted = applyBlockType(draft, type, codeLang || "java");
              setDraft(converted);
            }}
          />
          {(isCode || draft.startsWith("```")) && (
            <CodeLangSelector
              lang={getCodeLang(draft) || codeLang}
              onSelect={(lang) => setDraft(setCodeLang(draft, lang))}
            />
          )}
          <span className="ml-auto text-[10px] text-zinc-700 font-mono hidden sm:block">
            ⌘↵ save · Esc cancel
          </span>
        </div>

        <AutoTextarea
          value={draft}
          onChange={setDraft}
          onSave={() => onSave(draft)}
          onCancel={() => { setDraft(block.raw); onCancel(); }}
        />

        <div className="flex items-center gap-2 px-1">
          <button
            onClick={() => onSave(draft)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-emerald-950 text-xs font-bold transition-colors"
          >
            <Check size={12} /> Save
          </button>
          <button
            onClick={() => { setDraft(block.raw); onCancel(); }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 text-xs transition-colors"
          >
            <X size={12} /> Cancel
          </button>
          <button
            onClick={onDelete}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-red-500/10 text-zinc-600 hover:text-red-400 text-xs transition-colors ml-auto"
          >
            <Trash2 size={12} /> Delete block
          </button>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="group/block relative">
      <div className="flex items-start gap-2">
        {/* Block type badge — visible on hover */}
        <div className="shrink-0 pt-1.5 opacity-0 group-hover/block:opacity-100 transition-opacity">
          <BlockTypeSelector
            currentType={blockType}
            onSelect={handleTypeChange}
          />
        </div>

        {/* Block content */}
        <div className="flex-1 min-w-0">
          {/* Code block header with language selector */}
          {isCode && (
            <div className="flex items-center justify-between px-4 py-1.5 rounded-t-xl bg-zinc-900 border border-zinc-800 border-b-0">
              <span className="text-[10px] font-mono text-zinc-600 uppercase tracking-wider">code</span>
              <div className="opacity-0 group-hover/block:opacity-100 transition-opacity">
                <CodeLangSelector lang={codeLang} onSelect={handleLangChange} />
              </div>
            </div>
          )}

          <div
            onClick={onStartEdit}
            className={cn(
              "relative cursor-text rounded-xl px-3 py-1.5 mx-0 transition-all duration-150",
              "hover:bg-zinc-900/50 hover:ring-1 hover:ring-zinc-700/50",
              isCode && "rounded-t-none",
              blockType === "heading1" && "hover:ring-emerald-500/20",
              blockType === "heading2" && "hover:ring-emerald-500/15",
            )}
          >
            <div
              className="prose prose-zinc dark:prose-invert max-w-none prose-headings:mt-1 prose-headings:mb-1 prose-p:my-1 prose-pre:my-1 prose-li:my-0.5 prose-pre:rounded-none"
              dangerouslySetInnerHTML={{ __html: html }}
            />
            <span className="absolute right-3 top-2 opacity-0 group-hover/block:opacity-100 transition-opacity text-[10px] text-zinc-600 font-mono bg-zinc-900/80 px-1.5 py-0.5 rounded border border-zinc-800">
              click to edit
            </span>
          </div>
        </div>
      </div>

      {/* Between-block insert / delete row */}
      <div className="flex items-center gap-1 opacity-0 group-hover/block:opacity-100 transition-opacity h-5 -my-0.5 pl-8 z-10 relative">
        <div className="flex-1 h-px bg-zinc-800/60" />
        <button
          onClick={onAddAfter}
          className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] text-zinc-600 hover:text-zinc-300 hover:bg-zinc-800 border border-transparent hover:border-zinc-700/50 transition-all"
        >
          <Plus size={10} /> block
        </button>
        <button
          onClick={onDelete}
          className="p-0.5 rounded text-zinc-700 hover:text-red-400 hover:bg-red-500/10 transition-colors"
        >
          <Trash2 size={10} />
        </button>
        <div className="flex-1 h-px bg-zinc-800/60" />
      </div>
    </div>
  );
}

// ─── Markdown block parser ─────────────────────────────────────────────────────

function parseBlocks(markdown: string): Block[] {
  const blocks: Block[] = [];
  const lines = markdown.split("\n");
  let current: string[] = [];
  let inCode = false;

  const flush = () => {
    const raw = current.join("\n").trim();
    if (raw) blocks.push({ id: crypto.randomUUID(), raw });
    current = [];
  };

  for (const line of lines) {
    if (line.startsWith("```")) {
      if (inCode) { current.push(line); inCode = false; flush(); }
      else { flush(); current.push(line); inCode = true; }
    } else if (inCode) {
      current.push(line);
    } else if (line.trim() === "") {
      flush();
    } else {
      current.push(line);
    }
  }
  flush();
  return blocks;
}

function joinBlocks(blocks: Block[]): string {
  return blocks.map((b) => b.raw).join("\n\n");
}

// ─── Main component ───────────────────────────────────────────────────────────

interface NoteBlockEditorProps {
  initialContent: string;
  initialTitle: string;
  initialDescription: string;
  initialIcon: string;
  onSave: (content: string, meta: { title: string; description: string; icon: string }) => Promise<void>;
  onDone: () => void;
}

export function NoteBlockEditor({
  initialContent, initialTitle, initialDescription, initialIcon, onSave, onDone,
}: NoteBlockEditorProps) {
  const [blocks, setBlocks] = useState<Block[]>(() => parseBlocks(initialContent));
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState(initialTitle);
  const [description, setDescription] = useState(initialDescription);
  const [icon, setIcon] = useState(initialIcon);
  const [isSaving, setIsSaving] = useState(false);

  const persist = useCallback(
    async (updatedBlocks: Block[]) => {
      setIsSaving(true);
      try {
        await onSave(joinBlocks(updatedBlocks), { title, description, icon });
      } finally {
        setIsSaving(false);
      }
    },
    [onSave, title, description, icon]
  );

  function saveBlock(id: string, raw: string) {
    const trimmed = raw.trim();
    if (!trimmed) { deleteBlock(id); return; }
    const updated = blocks.map((b) => (b.id === id ? { ...b, raw: trimmed } : b));
    setBlocks(updated);
    setEditingId(null);
    persist(updated);
  }

  function deleteBlock(id: string) {
    const updated = blocks.filter((b) => b.id !== id);
    setBlocks(updated);
    setEditingId(null);
    persist(updated);
  }

  function applyTypeChange(id: string, newRaw: string) {
    const updated = blocks.map((b) => (b.id === id ? { ...b, raw: newRaw } : b));
    setBlocks(updated);
    persist(updated);
  }

  function addBlockAfter(id: string) {
    const idx = blocks.findIndex((b) => b.id === id);
    const newBlock: Block = { id: crypto.randomUUID(), raw: "" };
    setBlocks([...blocks.slice(0, idx + 1), newBlock, ...blocks.slice(idx + 1)]);
    setEditingId(newBlock.id);
  }

  function addBlockAtEnd() {
    const newBlock: Block = { id: crypto.randomUUID(), raw: "" };
    setBlocks((prev) => [...prev, newBlock]);
    setEditingId(newBlock.id);
  }

  async function handleDone() {
    setIsSaving(true);
    try {
      await onSave(joinBlocks(blocks), { title, description, icon });
      onDone();
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div>
      {/* ── Toolbar ── */}
      <div className="flex items-center justify-between mb-8 pb-4 border-b border-zinc-800/60">
        <p className="text-xs text-zinc-600 font-mono hidden sm:block">
          Click block to edit · type badge to change type · ⌘↵ save · Esc cancel
        </p>
        <div className="flex items-center gap-3 ml-auto">
          <AnimatePresence>
            {isSaving && (
              <motion.span
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="flex items-center gap-1.5 text-xs text-zinc-500"
              >
                <Loader2 size={12} className="animate-spin" /> Saving…
              </motion.span>
            )}
          </AnimatePresence>
          <button
            onClick={handleDone}
            disabled={isSaving}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-60 text-emerald-950 text-sm font-bold transition-colors shadow-[0_0_20px_-5px_rgba(16,185,129,0.4)]"
          >
            {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
            Done
          </button>
        </div>
      </div>

      {/* ── Meta fields ── */}
      <div className="flex items-start gap-4 mb-10">
        <input
          value={icon}
          onChange={(e) => setIcon(e.target.value)}
          placeholder="icon"
          title="Icon key (e.g. java)"
          className="w-14 h-14 rounded-2xl bg-zinc-900 border border-zinc-800 text-center text-sm focus:outline-none focus:border-emerald-500/50 transition-colors shrink-0 font-mono text-zinc-400"
        />
        <div className="flex-1 min-w-0">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Note title"
            className="w-full bg-transparent text-3xl sm:text-4xl font-extrabold text-white focus:outline-none placeholder:text-zinc-700 mb-2 leading-tight"
          />
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Short description"
            className="w-full bg-transparent text-sm text-zinc-400 focus:outline-none placeholder:text-zinc-700"
          />
        </div>
      </div>

      <div className="h-px w-full bg-linear-to-r from-zinc-800 via-zinc-800 to-transparent mb-8" />

      {/* ── Blocks ── */}
      <div className="space-y-0.5">
        <AnimatePresence initial={false}>
          {blocks.map((block) => (
            <motion.div
              key={block.id}
              layout
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.15 }}
            >
              <BlockItem
                key={editingId === block.id ? `${block.id}:editing` : `${block.id}:view`}
                block={block}
                isEditing={editingId === block.id}
                onStartEdit={() => setEditingId(block.id)}
                onSave={(raw) => saveBlock(block.id, raw)}
                onCancel={() => setEditingId(null)}
                onDelete={() => deleteBlock(block.id)}
                onAddAfter={() => addBlockAfter(block.id)}
                onTypeChange={(newRaw) => applyTypeChange(block.id, newRaw)}
              />
            </motion.div>
          ))}
        </AnimatePresence>

        <button
          onClick={addBlockAtEnd}
          className="flex items-center gap-2 w-full px-3 py-2.5 mt-2 text-xs text-zinc-700 hover:text-zinc-400 hover:bg-zinc-900/40 rounded-xl transition-all border border-dashed border-transparent hover:border-zinc-800/60 group/add"
        >
          <Plus size={14} className="group-hover/add:text-emerald-500 transition-colors" />
          Add a block
        </button>
      </div>
    </div>
  );
}
