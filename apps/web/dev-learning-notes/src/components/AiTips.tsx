"use client";

import { useEffect, useState } from "react";
import { Sparkles, Loader2, RefreshCw, ChevronDown, ChevronUp } from "lucide-react";

interface Tip {
  emoji: string;
  tip: string;
  detail: string;
}

interface AiTipsProps {
  noteTitle: string;
  noteContent: string;
}

const CACHE_KEY = (title: string) => `ai_tips_${title.toLowerCase().replace(/\s+/g, "_")}`;

export function AiTips({ noteTitle, noteContent }: AiTipsProps) {
  const cacheKey = CACHE_KEY(noteTitle);

  const [tips, setTips] = useState<Tip[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const [generated, setGenerated] = useState(false);

  useEffect(() => {
    const cached = sessionStorage.getItem(cacheKey);
    if (cached) {
      const parsed: Tip[] = JSON.parse(cached);
      if (parsed.length > 0) {
        setTips(parsed);
        setGenerated(true);
      }
    }
  }, [cacheKey]);

  const fetchTips = async (bustCache = false) => {
    if (!bustCache && tips.length > 0) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/ai/tips", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: noteTitle, content: noteContent }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to fetch tips");
      setTips(data.tips);
      setGenerated(true);
      setExpandedIndex(null);
      sessionStorage.setItem(cacheKey, JSON.stringify(data.tips));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-2xl bg-zinc-100/60 dark:bg-zinc-950/60 border border-zinc-200/60 dark:border-zinc-800/60 overflow-hidden w-full max-w-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 sm:px-5 py-3.5 sm:py-4 border-b border-zinc-200/40 dark:border-zinc-800/40">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="p-1.5 rounded-lg bg-violet-500/10 border border-violet-500/20 shrink-0">
            <Sparkles size={13} className="text-violet-500 dark:text-violet-400" />
          </div>
          <span className="text-[10px] sm:text-[11px] font-mono font-black uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-400 truncate">
            AI Tips
          </span>
        </div>
        {generated && !loading && (
          <button
            onClick={() => fetchTips(true)}
            className="p-1.5 sm:p-2 rounded-lg text-zinc-400 dark:text-zinc-600 hover:text-zinc-600 dark:hover:text-zinc-400 hover:bg-zinc-200/50 dark:hover:bg-zinc-800/50 transition-all shrink-0 ml-2"
            title="Regenerate tips"
          >
            <RefreshCw size={12} />
          </button>
        )}
      </div>

      <div className="p-3 sm:p-4">
        {/* Not yet generated */}
        {!generated && !loading && (
          <div className="text-center py-4 px-2">
            <p className="text-[11px] sm:text-xs text-zinc-500 mb-5 leading-relaxed max-w-xs mx-auto">
              Get practical tips and real-world advice for this topic from OpenAI.
            </p>
            <button
              onClick={() => void fetchTips()}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-violet-500/10 border border-violet-500/20 text-violet-500 dark:text-violet-400 hover:bg-violet-500/20 hover:border-violet-500/40 transition-all text-[11px] font-black uppercase tracking-wider active:scale-[0.98]"
            >
              <Sparkles size={13} />
              Generate Tips
            </button>
            {error && (
              <p className="mt-4 text-[10px] sm:text-xs text-red-500/80 dark:text-red-400/80 px-2 leading-relaxed">
                {error.includes("429") || error.includes("quota")
                  ? "Rate limit reached. Wait a minute and try again."
                  : error}
              </p>
            )}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex flex-col items-center py-8 gap-4">
            <Loader2 size={24} className="text-violet-400 animate-spin" />
            <p className="text-[10px] sm:text-[11px] text-zinc-400 dark:text-zinc-600 font-mono animate-pulse">Analyzing content...</p>
          </div>
        )}

        {/* Tips list */}
        {generated && !loading && tips.length > 0 && (
          <div className="space-y-2.5">
            {tips.map((tip, i) => (
              <div key={i} className="rounded-xl bg-zinc-200/20 dark:bg-zinc-900/20 border border-zinc-200/40 dark:border-zinc-800/40 overflow-hidden transition-colors hover:border-zinc-300/50 dark:hover:border-zinc-700/50">
                <button
                  onClick={() => setExpandedIndex(expandedIndex === i ? null : i)}
                  className="w-full flex items-start sm:items-center gap-3.5 px-4 py-3.5 text-left transition-all"
                >
                  <span className="text-base sm:text-lg shrink-0 mt-0.5 sm:mt-0 leading-none">{tip.emoji}</span>
                  <span className="text-[11px] sm:text-xs font-bold text-zinc-700 dark:text-zinc-300 flex-1 leading-[1.4] pr-1">{tip.tip}</span>
                  <div className="shrink-0 mt-1 sm:mt-0 p-1 rounded-md bg-zinc-200/30 dark:bg-zinc-800/30">
                    {expandedIndex === i
                      ? <ChevronUp size={11} className="text-zinc-400 dark:text-zinc-500" />
                      : <ChevronDown size={11} className="text-zinc-400 dark:text-zinc-500" />
                    }
                  </div>
                </button>
                {expandedIndex === i && (
                  <div className="px-4 pb-4 pt-1 animate-fade-in">
                    <div className="pl-[38px] sm:pl-[44px]">
                      <p className="text-[10.5px] sm:text-[11px] text-zinc-500 leading-relaxed font-medium">
                        {tip.detail}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
