"use client";

import { useState } from "react";
import { Bot, Loader2, MessageSquareText, SendHorizonal } from "lucide-react";

interface AskNotePanelProps {
  noteTitle: string;
  noteContent: string;
}

interface AskNoteSection {
  title: string;
  body: string;
}

interface AskNoteResult {
  summary: string;
  sections: AskNoteSection[];
  takeaways: string[];
}

const STARTER_QUESTIONS = [
  "Explain this note in simpler English.",
  "What should I memorize from this note?",
  "What beginner mistakes happen here?",
  "Give me 3 practice tasks from this note.",
];

export function AskNotePanel({ noteTitle, noteContent }: AskNotePanelProps) {
  const [question, setQuestion] = useState("");
  const [result, setResult] = useState<AskNoteResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(nextQuestion: string) {
    const trimmed = nextQuestion.trim();
    if (!trimmed) return;

    setQuestion(trimmed);
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/ai/ask-note", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: noteTitle,
          content: noteContent,
          question: trimmed,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to ask this note");
      }
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="rounded-[2rem] bg-zinc-100/60 dark:bg-zinc-950/60 border border-zinc-200/60 dark:border-zinc-800/60 overflow-hidden w-full max-w-full">
      <div className="flex items-start gap-3.5 px-4 sm:px-5 py-4 border-b border-zinc-200/40 dark:border-zinc-800/40">
        <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20 shrink-0">
          <Bot size={15} className="text-cyan-500 dark:text-cyan-300" />
        </div>
        <div className="min-w-0">
          <div className="text-[10px] sm:text-[11px] font-mono font-black uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-400">
            Ask This Note
          </div>
          <p className="text-[11px] text-zinc-500 leading-relaxed truncate sm:whitespace-normal">
            Question-first study help from your note content.
          </p>
        </div>
      </div>

      <div className="p-4 sm:p-5 space-y-5">
        <div className="flex flex-wrap gap-2">
          {STARTER_QUESTIONS.map((starter) => (
            <button
              key={starter}
              onClick={() => void submit(starter)}
              disabled={loading}
              className="px-3 py-2 rounded-xl bg-zinc-200/50 dark:bg-zinc-900/50 border border-zinc-300 dark:border-zinc-800 text-[10px] sm:text-[11px] font-bold text-zinc-500 hover:text-cyan-600 dark:hover:text-cyan-300 hover:border-cyan-500/30 transition-all disabled:opacity-50 active:scale-95 text-left leading-tight"
            >
              {starter}
            </button>
          ))}
        </div>

        <div className="space-y-3.5">
          <label className="block text-[10px] sm:text-[11px] font-mono font-bold uppercase tracking-[0.18em] text-zinc-500/80">
            Your question
          </label>
          <textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Ask about this note..."
            rows={3}
            className="w-full rounded-2xl border border-zinc-300 dark:border-zinc-800 bg-white/80 dark:bg-zinc-950/80 px-4 py-3.5 text-sm text-zinc-700 dark:text-zinc-200 placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:outline-none focus:border-cyan-500/40 resize-none transition-all"
          />
          <button
            onClick={() => void submit(question)}
            disabled={loading || !question.trim()}
            className="w-full flex items-center justify-center gap-2.5 px-4 py-3.5 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-600 dark:text-cyan-400 hover:bg-cyan-500/20 hover:border-cyan-500/40 disabled:opacity-50 transition-all text-[11px] font-black uppercase tracking-[0.18em] active:scale-[0.98]"
          >
            {loading ? <Loader2 size={15} className="animate-spin" /> : <SendHorizonal size={15} />}
            Ask
          </button>
        </div>

        {error && (
          <p className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3.5 text-[11px] text-red-600 dark:text-red-300/80 leading-relaxed">
            {error}
          </p>
        )}

        {result && !loading && (
          <div className="space-y-5 rounded-[1.5rem] border border-zinc-200 dark:border-zinc-800 bg-zinc-100/40 dark:bg-zinc-900/40 p-5 animate-fade-in shadow-md dark:shadow-2xl shadow-cyan-500/5">
            <div className="flex items-center gap-2.5 text-[10px] sm:text-[11px] font-mono font-black uppercase tracking-[0.18em] text-cyan-600 dark:text-cyan-400">
              <MessageSquareText size={14} />
              Answer
            </div>

            <div className="rounded-2xl border border-cyan-500/10 bg-cyan-500/5 px-4 py-4">
              <div className="text-[10px] sm:text-[11px] font-mono font-black uppercase tracking-[0.18em] text-cyan-600 dark:text-cyan-300 mb-2">
                Summary
              </div>
              <p className="text-sm leading-7 text-zinc-700 dark:text-zinc-200">{result.summary}</p>
            </div>

            <div className="space-y-3">
              {result.sections.map((section) => (
                <div
                  key={`${section.title}-${section.body}`}
                  className="rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-zinc-100/60 dark:bg-zinc-950/60 px-4 py-4"
                >
                  <div className="text-[11px] font-mono font-black uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-400 mb-2">
                    {section.title}
                  </div>
                  <p className="text-sm leading-7 text-zinc-600 dark:text-zinc-300">{section.body}</p>
                </div>
              ))}
            </div>

            <div className="space-y-3">
              <div className="text-[10px] sm:text-[11px] font-mono font-black uppercase tracking-[0.18em] text-zinc-500/80">
                Key takeaways
              </div>
              <ul className="space-y-2.5">
                {result.takeaways.map((item) => (
                  <li
                    key={item}
                    className="rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 bg-zinc-100/70 dark:bg-zinc-950/70 px-4 py-3 text-[11px] leading-relaxed text-zinc-600 dark:text-zinc-400"
                  >
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
