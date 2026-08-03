"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/cn";
import { ExternalLink, RefreshCw, Flame, Code2, BookOpen, Newspaper, Clock, TrendingUp, Sparkles, Binary, Microscope, Globe } from "lucide-react";
import type { NewsItem, NewsTopic } from "@/lib/news-types";

export function TechNewsFeed() {
  const [items, setItems] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(false);
  const [filter, setFilter] = useState<"all" | NewsTopic>("all");

  const load = async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true);
    else setLoading(true);
    setError(false);
    try {
      const res = await fetch("/api/news");
      if (!res.ok) throw new Error();
      const data = await res.json();
      setItems(data.items ?? []);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { load(); }, []);

  const filtered = filter === "all" ? items : items.filter((i) => i.topics.includes(filter));

  const timeAgo = (iso?: string) => {
    if (!iso) return null;
    const date = new Date(iso);
    if (isNaN(date.getTime())) return "recent";
    const diff = Date.now() - date.getTime();
    const h = Math.floor(diff / 3600000);
    if (h < 1) return "just now";
    if (h < 24) return `${h}h ago`;
    return `${Math.floor(h / 24)}d ago`;
  };

  const getTopicIcon = (topic: NewsTopic) => {
    switch (topic) {
      case "ai": return <Sparkles size={12} className="text-orange-400" />;
      case "dev": return <Binary size={12} className="text-emerald-400" />;
      case "research": return <Microscope size={12} className="text-blue-400" />;
      case "general": return <Globe size={12} className="text-zinc-400" />;
    }
  };

  const getTopicStyles = (topic: NewsTopic) => {
    switch (topic) {
      case "ai": return "bg-orange-500/10 text-orange-500 dark:text-orange-400 border-orange-500/20";
      case "dev": return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20";
      case "research": return "bg-blue-500/10 text-blue-500 dark:text-blue-400 border-blue-500/20";
      case "general": return "bg-zinc-500/10 text-zinc-500 dark:text-zinc-400 border-zinc-500/20";
    }
  };

  const getSourceIcon = (source: NewsItem["source"]) => {
    switch (source) {
      case "devto": return <Code2 size={13} className="text-violet-500 dark:text-violet-400" />;
      case "hackernews": return <Flame size={13} className="text-orange-500 dark:text-orange-400" />;
      case "arxiv": return <BookOpen size={13} className="text-blue-500 dark:text-blue-400" />;
      case "thenewsapi": return <Newspaper size={13} className="text-emerald-500 dark:text-emerald-400" />;
      default: return <TrendingUp size={13} className="text-zinc-400" />;
    }
  };

  return (
    <section className="relative">
      {/* Background Glow */}
      <div className="absolute -top-24 -right-24 w-64 h-64 bg-emerald-500/5 blur-[100px] pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-orange-500/5 blur-[100px] pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 gap-6 border-b border-zinc-200/60 dark:border-zinc-800/60 pb-8">
        <div>
          <div className="flex items-center gap-3 mb-4">
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[10px] font-black uppercase tracking-tighter animate-pulse-subtle">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
              Live Intelligence
            </span>
            <span className="px-2.5 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-500 dark:text-orange-400 text-[10px] font-black uppercase tracking-tighter">
              Priority Feed
            </span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-zinc-900 dark:text-white flex items-center gap-4 tracking-tight">
            <div className="p-2.5 rounded-2xl bg-orange-500/10 border border-orange-500/20 shadow-[0_0_15px_rgba(249,115,22,0.1)]">
              <TrendingUp size={28} className="text-orange-500 dark:text-orange-400" />
            </div>
            Daily Intelligence
          </h2>
          <p className="text-base text-zinc-500 mt-4 font-medium max-w-xl leading-relaxed">
            Real-time signals from global research papers and developer communities.
          </p>
        </div>
        <button
          onClick={() => load(true)}
          disabled={refreshing}
          className="group flex items-center gap-2.5 px-5 py-2.5 rounded-2xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:border-zinc-400 dark:hover:border-zinc-600 transition-all text-sm font-bold disabled:opacity-50 shadow-md dark:shadow-xl active:scale-95"
        >
          <RefreshCw size={14} className={`${refreshing ? "animate-spin" : "group-hover:rotate-180 transition-transform duration-500"}`} />
          {refreshing ? "Syncing..." : "Refresh Feed"}
        </button>
      </div>

      {/* Filter tabs */}
      <div className="flex flex-wrap gap-2 mb-8 p-1 bg-zinc-100/50 dark:bg-zinc-950/50 border border-zinc-200/50 dark:border-zinc-800/50 rounded-2xl w-fit">
        {(["all", "ai", "dev", "research", "general"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all uppercase tracking-wider ${
              filter === f
                ? "bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-lg border border-zinc-300 dark:border-zinc-700"
                : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 hover:bg-zinc-200/50 dark:hover:bg-zinc-900/50"
            }`}
          >
            {f === "all" ? "Live All" : f}
          </button>
        ))}
      </div>

      {/* States */}
      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-40 rounded-3xl bg-zinc-100/40 dark:bg-zinc-900/40 border border-zinc-200/40 dark:border-zinc-800/40 animate-pulse relative overflow-hidden">
               <div className="absolute inset-0 bg-gradient-to-r from-transparent via-zinc-200/10 dark:via-zinc-800/10 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
            </div>
          ))}
        </div>
      )}

      {error && !loading && (
        <div className="text-center py-20 bg-zinc-100/20 dark:bg-zinc-900/20 border border-dashed border-zinc-300 dark:border-zinc-800 rounded-3xl">
          <p className="text-zinc-500 text-sm mb-4">Transmission interrupted. Signals lost in space.</p>
          <button
            onClick={() => load()}
            className="px-6 py-2.5 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-500 dark:text-orange-400 text-xs font-black hover:bg-orange-500/20 transition-all"
          >
            Reconnect Terminal
          </button>
        </div>
      )}

      {!loading && !error && filtered.length === 0 && (
        <div className="text-center py-20 text-zinc-400 dark:text-zinc-600 text-sm bg-zinc-100/20 dark:bg-zinc-900/20 border border-dashed border-zinc-300 dark:border-zinc-800 rounded-3xl font-medium">
          No signals detected for this frequency.
        </div>
      )}

      {/* News list */}
      {!loading && !error && filtered.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((item) => (
            <a
              key={item.id}
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex flex-col justify-between rounded-3xl bg-zinc-100/30 dark:bg-zinc-900/30 border border-zinc-200/50 dark:border-zinc-800/50 hover:bg-zinc-100/60 dark:hover:bg-zinc-900/60 hover:border-zinc-300/60 dark:hover:border-zinc-700/60 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl dark:hover:shadow-2xl hover:shadow-orange-500/5 overflow-hidden"
            >
              <div>
                <div className="relative h-44 w-full overflow-hidden border-b border-zinc-200/30 dark:border-zinc-800/30 bg-zinc-950">
                  {item.imageUrl ? (
                    <img 
                      src={item.imageUrl} 
                      alt={item.title}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                      loading="lazy"
                    />
                  ) : (
                    <div className={cn(
                      "w-full h-full flex items-center justify-center bg-gradient-to-br opacity-40 group-hover:opacity-60 transition-opacity duration-500",
                      item.source === 'arxiv' ? "from-blue-600/20 to-indigo-900/20" : 
                      item.source === 'hackernews' ? "from-orange-600/20 to-red-900/20" : 
                      "from-zinc-700/20 to-black"
                    )}>
                      {item.source === 'arxiv' ? <Microscope size={48} className="text-blue-500/30" /> : 
                       item.source === 'hackernews' ? <Flame size={48} className="text-orange-500/30" /> : 
                       <Binary size={48} className="text-zinc-500/30" />}
                    </div>
                  )}
                  <div className="absolute inset-0 bg-linear-to-t from-zinc-950/80 via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity duration-300" />
                  
                  {/* Source Badge on Image */}
                  <div className="absolute top-4 left-4">
                    <div className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-black/60 backdrop-blur-md border border-white/10 text-[9px] font-black text-white uppercase tracking-widest shadow-xl">
                      {getSourceIcon(item.source)}
                      {item.source === 'hackernews' ? 'HN' : item.source === 'thenewsapi' ? 'WORLD' : item.source}
                    </div>
                  </div>
                </div>
                
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex flex-wrap gap-2">
                      {item.topics.map(topic => (
                        <div key={topic} className={`flex items-center gap-1.5 px-2 py-0.5 rounded-lg border text-[9px] font-black uppercase tracking-widest ${getTopicStyles(topic)}`}>
                          {getTopicIcon(topic)}
                          {topic}
                        </div>
                      ))}
                    </div>
                    <ExternalLink size={14} className="text-zinc-400 dark:text-zinc-700 group-hover:text-emerald-500 dark:group-hover:text-emerald-400 transition-colors shrink-0" />
                  </div>

                  <h3 className="text-base font-bold text-zinc-700 dark:text-zinc-200 group-hover:text-zinc-900 dark:group-hover:text-white leading-relaxed line-clamp-2 transition-colors">
                    {item.title}
                  </h3>
                </div>
              </div>

              <div className="px-6 pb-6">
                <div className="flex flex-wrap items-center justify-between pt-4 border-t border-zinc-200/30 dark:border-zinc-800/30 gap-4">
                  <div className="flex items-center gap-4">
                    {item.points !== undefined && (
                      <div className="flex items-center gap-1.5 text-[10px] font-black text-orange-500">
                        <TrendingUp size={10} />
                        {item.points}
                      </div>
                    )}
                    <div className="flex items-center gap-1 text-[10px] text-zinc-400 dark:text-zinc-600 font-bold uppercase tracking-tighter">
                      <Clock size={10} />
                      {item.publishedAt ? timeAgo(item.publishedAt) : (item.readingTime ? `${item.readingTime}m` : 'now')}
                    </div>
                  </div>
                  
                  <div className="text-[9px] font-black text-zinc-500 uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    Read Report →
                  </div>
                </div>
              </div>
            </a>
          ))}
        </div>
      )}
    </section>
  );
}
