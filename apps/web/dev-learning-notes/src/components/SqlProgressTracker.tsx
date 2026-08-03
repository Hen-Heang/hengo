"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  CheckCircle2,
  ChevronDown,
  Sparkles,
  Database,
  FileCode,
  GitMerge,
  BarChart2,
  Layers,
  Activity,
  TableProperties,
  Zap,
  ShieldCheck,
  Network,
  Circle,
  Trophy,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { createClient } from "@/lib/supabase/client";
import { loadProgress, saveProgress } from "@/lib/supabase/progress";

interface TopicItem {
  id: string;
  label: string;
}

interface TrackerSection {
  id: string;
  title: string;
  category: "Basics" | "Intermediate" | "Advanced" | "Design" | "Performance" | "Ecosystem";
  topics: TopicItem[];
}

const SECTIONS: TrackerSection[] = [
  {
    id: "basics",
    title: "SQL Fundamentals",
    category: "Basics",
    topics: [
      { id: "sql-select-syntax",    label: "SELECT syntax & structure" },
      { id: "sql-data-types",       label: "Data types (VARCHAR, INT, DATE)" },
      { id: "sql-where-operators",  label: "WHERE — AND/OR/IN/BETWEEN/LIKE" },
      { id: "sql-null-handling",    label: "NULL — IS NULL, COALESCE, NVL" },
      { id: "sql-order-limit",      label: "ORDER BY, LIMIT/OFFSET, FETCH FIRST" },
    ],
  },
  {
    id: "dml",
    title: "DML — CRUD Operations",
    category: "Basics",
    topics: [
      { id: "dml-insert", label: "INSERT INTO & bulk insert" },
      { id: "dml-update", label: "UPDATE ... SET ... WHERE" },
      { id: "dml-delete", label: "DELETE vs TRUNCATE" },
      { id: "dml-merge",  label: "MERGE (upsert pattern)" },
    ],
  },
  {
    id: "joins",
    title: "Joins & Set Operations",
    category: "Intermediate",
    topics: [
      { id: "join-inner", label: "INNER JOIN — matching rows only" },
      { id: "join-left",  label: "LEFT JOIN — keep all left rows" },
      { id: "join-self",  label: "Self JOIN for hierarchical data" },
      { id: "join-union", label: "UNION vs UNION ALL" },
    ],
  },
  {
    id: "aggregation",
    title: "Aggregations & GROUP BY",
    category: "Intermediate",
    topics: [
      { id: "agg-functions", label: "COUNT / SUM / AVG / MIN / MAX" },
      { id: "agg-group-by",  label: "GROUP BY basics" },
      { id: "agg-having",    label: "HAVING vs WHERE" },
      { id: "agg-distinct",  label: "COUNT(DISTINCT) & ROLLUP" },
    ],
  },
  {
    id: "subqueries",
    title: "Subqueries & CTEs",
    category: "Intermediate",
    topics: [
      { id: "sub-scalar",    label: "Scalar subquery in SELECT" },
      { id: "sub-table",     label: "Table subquery in FROM" },
      { id: "sub-exists",    label: "EXISTS vs IN (performance)" },
      { id: "sub-cte",       label: "WITH clause (CTE)" },
      { id: "sub-recursive", label: "Recursive CTE for tree data" },
    ],
  },
  {
    id: "window",
    title: "Window Functions",
    category: "Advanced",
    topics: [
      { id: "win-row-number",  label: "ROW_NUMBER() OVER (PARTITION BY)" },
      { id: "win-rank",        label: "RANK() vs DENSE_RANK()" },
      { id: "win-lag-lead",    label: "LAG / LEAD for row comparison" },
      { id: "win-sum-running", label: "Running totals — SUM() OVER" },
    ],
  },
  {
    id: "design",
    title: "Database Design",
    category: "Design",
    topics: [
      { id: "design-pk-fk",        label: "Primary Key & Foreign Key" },
      { id: "design-normalization", label: "1NF / 2NF / 3NF" },
      { id: "design-relationships", label: "1:N and N:M (junction table)" },
      { id: "design-constraints",   label: "NOT NULL / UNIQUE / CHECK" },
    ],
  },
  {
    id: "indexing",
    title: "Indexing & Query Optimization",
    category: "Performance",
    topics: [
      { id: "idx-btree",     label: "B-Tree index basics" },
      { id: "idx-composite", label: "Composite index & column order" },
      { id: "idx-explain",   label: "EXPLAIN / EXPLAIN PLAN" },
      { id: "idx-covering",  label: "Covering indexes" },
    ],
  },
  {
    id: "transactions",
    title: "Transactions & Concurrency",
    category: "Advanced",
    topics: [
      { id: "tx-acid",      label: "ACID properties" },
      { id: "tx-isolation", label: "Isolation levels & dirty read" },
      { id: "tx-deadlock",  label: "Deadlock prevention" },
      { id: "tx-savepoint", label: "SAVEPOINT & ROLLBACK TO" },
    ],
  },
  {
    id: "mybatis",
    title: "MyBatis SQL Patterns",
    category: "Ecosystem",
    topics: [
      { id: "mb-dynamic-if",  label: "<if> dynamic WHERE" },
      { id: "mb-foreach",     label: "<foreach> for IN lists" },
      { id: "mb-pagination",  label: "Pagination (MySQL vs Oracle)" },
      { id: "mb-resultmap",   label: "ResultMap for JOIN results" },
    ],
  },
];

const CATEGORY_STYLE: Record<string, { badge: string; bar: string; icon: React.ElementType; glow: string }> = {
  Basics: {
    badge: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    bar:   "from-emerald-600 to-teal-400",
    icon:  Database,
    glow:  "shadow-[0_0_15px_rgba(16,185,129,0.3)]",
  },
  Intermediate: {
    badge: "bg-sky-500/10 text-sky-400 border-sky-500/20",
    bar:   "from-sky-600 to-blue-400",
    icon:  GitMerge,
    glow:  "shadow-[0_0_15px_rgba(14,165,233,0.3)]",
  },
  Advanced: {
    badge: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    bar:   "from-amber-600 to-orange-400",
    icon:  Activity,
    glow:  "shadow-[0_0_15px_rgba(245,158,11,0.3)]",
  },
  Design: {
    badge: "bg-violet-500/10 text-violet-400 border-violet-500/20",
    bar:   "from-violet-600 to-purple-400",
    icon:  TableProperties,
    glow:  "shadow-[0_0_15px_rgba(139,92,246,0.3)]",
  },
  Performance: {
    badge: "bg-rose-500/10 text-rose-400 border-rose-500/20",
    bar:   "from-rose-600 to-red-400",
    icon:  Zap,
    glow:  "shadow-[0_0_15px_rgba(244,63,94,0.3)]",
  },
  Ecosystem: {
    badge: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
    bar:   "from-indigo-600 to-blue-500",
    icon:  Network,
    glow:  "shadow-[0_0_15px_rgba(99,102,241,0.3)]",
  },
};

// Icon map for section header icons
const SECTION_ICON: Record<string, React.ElementType> = {
  basics:       Database,
  dml:          FileCode,
  joins:        GitMerge,
  aggregation:  BarChart2,
  subqueries:   Layers,
  window:       Activity,
  design:       TableProperties,
  indexing:     Zap,
  transactions: ShieldCheck,
  mybatis:      Network,
};

const LS_KEY      = "sql-progress-v1";
const TRACKER_KEY = "sql";

export function SqlProgressTracker() {
  const [checked, setChecked]           = useState<Set<string>>(new Set());
  const [openSections, setOpenSections] = useState<Set<string>>(new Set(["basics"]));
  const [mounted, setMounted]           = useState(false);
  const [supabase]                      = useState(() => createClient());
  const saveTimer                       = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load: localStorage first, then Supabase async (remote wins)
  useEffect(() => {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) {
      try { setChecked(new Set(JSON.parse(raw))); } catch { /* ignore */ }
    }

    loadProgress(supabase, TRACKER_KEY)
      .then(remote => {
        if (remote.length > 0) {
          setChecked(new Set(remote));
          localStorage.setItem(LS_KEY, JSON.stringify(remote));
        }
      })
      .catch(() => {})
      .finally(() => setMounted(true));
  }, [supabase]);

  // Save: localStorage immediately + debounced Supabase (800ms)
  useEffect(() => {
    if (!mounted) return;
    const arr = [...checked];
    localStorage.setItem(LS_KEY, JSON.stringify(arr));

    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      saveProgress(supabase, TRACKER_KEY, arr).catch(() => {});
    }, 800);
  }, [checked, mounted, supabase]);

  const totalTopics   = SECTIONS.reduce((n, s) => n + s.topics.length, 0);
  const totalChecked  = checked.size;
  const overallPct    = totalTopics === 0 ? 0 : Math.round((totalChecked / totalTopics) * 100);

  const nextMilestone = (() => {
    for (const section of SECTIONS) {
      for (const topic of section.topics) {
        if (!checked.has(topic.id)) return { section: section.title, label: topic.label };
      }
    }
    return null;
  })();

  const categoryStats = SECTIONS.reduce<Record<string, { total: number; done: number }>>((acc, s) => {
    if (!acc[s.category]) acc[s.category] = { total: 0, done: 0 };
    acc[s.category].total += s.topics.length;
    acc[s.category].done  += s.topics.filter(t => checked.has(t.id)).length;
    return acc;
  }, {});

  function toggleTopic(id: string) {
    setChecked(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function toggleSection(id: string) {
    setOpenSections(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function checkAll(section: TrackerSection) {
    setChecked(prev => {
      const next = new Set(prev);
      section.topics.forEach(t => next.add(t.id));
      return next;
    });
  }

  function uncheckAll(section: TrackerSection) {
    setChecked(prev => {
      const next = new Set(prev);
      section.topics.forEach(t => next.delete(t.id));
      return next;
    });
  }

  if (!mounted) return null;

  return (
    <div className="space-y-8 pb-20">
      {/* MASTER PROGRESS CARD */}
      <div className="p-8 rounded-[2.5rem] bg-zinc-900/40 border border-zinc-800/60 backdrop-blur-2xl relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-96 h-96 bg-sky-500/10 blur-[100px] rounded-full -mr-32 -mt-32 transition-colors duration-1000 group-hover:bg-sky-500/20" />

        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-10 relative z-10">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-sky-500/10 border border-sky-500/20">
                <Sparkles size={24} className="text-sky-400" />
              </div>
              <div>
                <h2 className="text-2xl font-black text-white tracking-tight">SQL Mastery Tracker</h2>
                <p className="text-sm text-zinc-500 font-medium">
                  Data Rank:{" "}
                  <span className="text-sky-400 uppercase tracking-widest font-black text-xs ml-2">
                    Level {Math.floor(overallPct / 10) + 1} Query Engineer
                  </span>
                </p>
              </div>
            </div>

            {nextMilestone && (
              <div className="inline-flex items-center gap-3 px-4 py-2 rounded-2xl bg-zinc-950/50 border border-zinc-800/50 backdrop-blur-md">
                <div className="w-2 h-2 rounded-full bg-sky-500 animate-pulse" />
                <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Next up:</span>
                <span className="text-xs font-bold text-zinc-200">{nextMilestone.label}</span>
              </div>
            )}
          </div>

          <div className="flex flex-col items-center lg:items-end gap-2">
            <div className="relative">
              <span className={cn(
                "text-7xl font-black tabular-nums tracking-tighter leading-none drop-shadow-2xl",
                overallPct === 100 ? "text-sky-400" : "text-white"
              )}>
                {overallPct}
              </span>
              <span className="text-2xl font-black text-zinc-600 absolute -right-6 bottom-2">%</span>
            </div>
            <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em]">Overall Progress</p>
          </div>
        </div>

        {/* Main progress bar */}
        <div className="mt-10 h-4 rounded-full bg-zinc-950/80 overflow-hidden border border-zinc-800/50 p-1 relative">
          <motion.div
            className="h-full rounded-full bg-linear-to-r from-sky-500 via-blue-500 to-indigo-500 shadow-[0_0_20px_rgba(14,165,233,0.4)] relative"
            initial={{ width: 0 }}
            animate={{ width: `${overallPct}%` }}
            transition={{ duration: 1, ease: "circOut" }}
          >
            <div className="absolute top-0 right-0 w-8 h-full bg-white/20 skew-x-12 blur-sm" />
          </motion.div>
        </div>

        {/* Per-category breakdown */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6 mt-10 pt-10 border-t border-zinc-800/50">
          {Object.entries(categoryStats).map(([cat, { total, done }]) => {
            const pct   = Math.round((done / total) * 100);
            const style = CATEGORY_STYLE[cat];
            const CatIcon = style.icon;
            return (
              <div key={cat} className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CatIcon size={14} className={cn("transition-colors", pct > 0 ? "text-zinc-200" : "text-zinc-600")} />
                    <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">{cat}</span>
                  </div>
                  <span className="text-[10px] font-mono font-bold text-zinc-400">{pct}%</span>
                </div>
                <div className="h-1.5 rounded-full bg-zinc-950 overflow-hidden border border-zinc-800/30">
                  <motion.div
                    className={cn("h-full rounded-full bg-linear-to-r transition-all duration-1000", style.bar, style.glow)}
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* SECTION CHECKLISTS */}
      <div className="space-y-4">
        {SECTIONS.map((section, idx) => {
          const sectionDone = section.topics.filter(t => checked.has(t.id)).length;
          const sectionPct  = Math.round((sectionDone / section.topics.length) * 100);
          const isOpen      = openSections.has(section.id);
          const allDone     = sectionDone === section.topics.length;
          const style       = CATEGORY_STYLE[section.category];
          const SectionIcon = SECTION_ICON[section.id] ?? Database;

          return (
            <motion.div
              key={section.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.04 }}
              className={cn(
                "rounded-[2rem] border transition-all duration-500 overflow-hidden",
                isOpen
                  ? "bg-zinc-900/60 border-zinc-700/50 shadow-xl"
                  : "bg-zinc-950/40 border-zinc-800/60 hover:border-zinc-700/50 hover:bg-zinc-900/20"
              )}
            >
              <button
                onClick={() => toggleSection(section.id)}
                className="w-full flex items-center gap-6 p-6 text-left group"
              >
                <div className={cn(
                  "w-12 h-12 rounded-2xl flex items-center justify-center border transition-all duration-500",
                  allDone
                    ? "bg-sky-500/10 border-sky-500/30 text-sky-400"
                    : "bg-zinc-900 border-zinc-800 text-zinc-600 group-hover:border-zinc-600"
                )}>
                  {allDone ? <CheckCircle2 size={24} /> : <SectionIcon size={20} className="opacity-60" />}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className={cn(
                      "text-lg font-bold transition-colors",
                      isOpen ? "text-white" : "text-zinc-400 group-hover:text-zinc-200"
                    )}>
                      {section.title}
                    </h3>
                    <span className={cn("text-[9px] font-black px-2 py-0.5 rounded-full border uppercase tracking-widest shrink-0", style.badge)}>
                      {section.category}
                    </span>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="flex-1 h-1 rounded-full bg-zinc-950 overflow-hidden border border-zinc-800/30">
                      <motion.div
                        className={cn("h-full rounded-full bg-linear-to-r", style.bar)}
                        animate={{ width: `${sectionPct}%` }}
                      />
                    </div>
                    <span className="text-[10px] font-mono font-black text-zinc-500 tabular-nums">
                      {sectionDone}/{section.topics.length} TOPICS
                    </span>
                  </div>
                </div>

                <div className={cn(
                  "p-2 rounded-xl bg-zinc-900 border border-zinc-800 transition-transform duration-500",
                  isOpen && "rotate-180 bg-zinc-800"
                )}>
                  <ChevronDown size={18} className="text-zinc-500" />
                </div>
              </button>

              <AnimatePresence>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.35, ease: [0.23, 1, 0.32, 1] }}
                  >
                    <div className="px-6 pb-8">
                      <div className="h-px bg-zinc-800/50 mb-4" />

                      {/* Check all / Uncheck all */}
                      <div className="flex gap-3 mb-5">
                        <button
                          onClick={() => checkAll(section)}
                          className="text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/20 hover:bg-sky-500/20 transition-colors"
                        >
                          Check all
                        </button>
                        <button
                          onClick={() => uncheckAll(section)}
                          className="text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg bg-zinc-800/50 text-zinc-500 border border-zinc-700/50 hover:bg-zinc-800 transition-colors"
                        >
                          Uncheck all
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {section.topics.map(t => (
                          <TopicCheckbox
                            key={t.id}
                            label={t.label}
                            checked={checked.has(t.id)}
                            onToggle={() => toggleTopic(t.id)}
                          />
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>

      {/* 100% Celebration */}
      {overallPct === 100 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-10 rounded-[3rem] bg-linear-to-br from-sky-500/20 via-zinc-900 to-zinc-950 border border-sky-500/30 text-center relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(14,165,233,0.1),transparent_70%)]" />
          <Trophy size={48} className="text-sky-400 mx-auto mb-4 drop-shadow-[0_0_20px_rgba(14,165,233,0.5)]" />
          <h2 className="text-3xl font-black text-white mb-2">SQL Expert!</h2>
          <p className="text-zinc-400 font-medium">All SQL topics mastered. Your queries are optimized, your schemas are clean.</p>
        </motion.div>
      )}
    </div>
  );
}

function TopicCheckbox({
  label, checked, onToggle,
}: {
  label: string;
  checked: boolean;
  onToggle: () => void;
}) {
  return (
    <motion.button
      onClick={onToggle}
      whileTap={{ scale: 0.97 }}
      className={cn(
        "flex items-center gap-4 p-4 rounded-2xl border transition-all duration-300 text-left relative overflow-hidden group/item",
        checked
          ? "bg-sky-500/5 border-sky-500/20"
          : "bg-zinc-950/50 border-zinc-800/50 hover:border-zinc-700 hover:bg-zinc-900/50"
      )}
    >
      {checked && (
        <div className="absolute inset-0 bg-linear-to-r from-sky-500/5 to-transparent pointer-events-none" />
      )}
      <div className={cn(
        "w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all duration-500 shrink-0",
        checked
          ? "bg-sky-500 border-transparent shadow-[0_0_15px_rgba(14,165,233,0.4)]"
          : "border-zinc-800 group-hover/item:border-zinc-600"
      )}>
        {checked && (
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
            <CheckCircle2 size={14} className="text-white" />
          </motion.div>
        )}
        {!checked && <Circle size={10} className="text-zinc-700 opacity-0 group-hover/item:opacity-100 transition-opacity" />}
      </div>
      <span className={cn(
        "text-[11px] font-bold transition-colors uppercase tracking-tight",
        checked ? "text-zinc-400 line-through" : "text-zinc-300"
      )}>
        {label}
      </span>
    </motion.button>
  );
}
