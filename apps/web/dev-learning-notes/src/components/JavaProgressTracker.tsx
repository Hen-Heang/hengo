"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  CheckCircle2, 
  ChevronDown, 
  Coffee, 
  Target, 
  Zap, 
  Activity, 
  Layout,
  Circle,
  Trophy
} from "lucide-react";
import { cn } from "@/lib/cn";
import { createClient } from "@/lib/supabase/client";
import { loadProgress, saveProgress } from "@/lib/supabase/progress";

interface TrackerSection {
  id: string;
  title: string;
  category: "Basics" | "Intermediate" | "Advanced" | "Ecosystem";
  topics: string[];
}

const SECTIONS: TrackerSection[] = [
  {
    id: "basics",
    title: "Java Basics & JVM",
    category: "Basics",
    topics: ["JVM vs JRE vs JDK", "Memory Management", "Conditionals & Loops", "Access Modifiers"],
  },
  {
    id: "oop",
    title: "Object Oriented Programming (OOP)",
    category: "Basics",
    topics: ["Interface-Driven Design", "Inheritance vs Composition", "Encapsulation", "Polymorphism"],
  },
  {
    id: "collections",
    title: "Collections Framework",
    category: "Intermediate",
    topics: ["ArrayList vs LinkedList", "HashMap Internals", "Set for Uniqueness", "Streams Integration"],
  },
  {
    id: "fp",
    title: "Functional Programming (Java 8+)",
    category: "Intermediate",
    topics: ["Lambda Expressions", "Stream API (map/filter)", "Optional (Null Safety)", "Method References"],
  },
  {
    id: "concurrency",
    title: "Concurrency & Virtual Threads",
    category: "Advanced",
    topics: ["Thread Safety", "Executors & Callables", "Virtual Threads", "CompletableFuture"],
  },
  {
    id: "spring",
    title: "The Spring Framework Core",
    category: "Ecosystem",
    topics: ["Inversion of Control (IoC)", "Aspect-Oriented (AOP)", "Proxy Pattern", "Bean Lifecycle"],
  },
];

const CATEGORY_STYLE: Record<string, { badge: string; bar: string; icon: React.ElementType; glow: string }> = {
  Basics: { 
    badge: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20", 
    bar: "from-emerald-600 to-teal-400",
    icon: Zap,
    glow: "shadow-[0_0_15px_rgba(16,185,129,0.3)]"
  },
  Intermediate: { 
    badge: "bg-sky-500/10 text-sky-400 border-sky-500/20", 
    bar: "from-sky-600 to-blue-400",
    icon: Activity,
    glow: "shadow-[0_0_15px_rgba(14,165,233,0.3)]"
  },
  Advanced: { 
    badge: "bg-amber-500/10 text-amber-400 border-amber-500/20", 
    bar: "from-amber-600 to-orange-400",
    icon: Target,
    glow: "shadow-[0_0_15px_rgba(245,158,11,0.3)]"
  },
  Ecosystem: { 
    badge: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20", 
    bar: "from-indigo-600 to-purple-400",
    icon: Layout,
    glow: "shadow-[0_0_15px_rgba(99,102,241,0.3)]"
  },
};

const LS_KEY = "java-roadmap-progress";
const TRACKER_KEY = "java";

function topicKey(sectionId: string, topic: string) {
  return `${sectionId}:${topic}`;
}

export function JavaProgressTracker() {
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [openSections, setOpenSections] = useState<Set<string>>(new Set(["basics"]));
  const [mounted, setMounted] = useState(false);
  const [supabase] = useState(() => createClient());
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) {
      try {
        setChecked(new Set(JSON.parse(raw)));
      } catch (e) { console.error(e); }
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

  useEffect(() => {
    if (!mounted) return;
    const arr = [...checked];
    localStorage.setItem(LS_KEY, JSON.stringify(arr));

    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      saveProgress(supabase, TRACKER_KEY, arr).catch(() => {});
    }, 800);
  }, [checked, mounted, supabase]);

  const totalTopics = SECTIONS.reduce((n, s) => n + s.topics.length, 0);
  const totalChecked = checked.size;
  const overallPct = totalTopics === 0 ? 0 : Math.round((totalChecked / totalTopics) * 100);

  const nextMilestone = (() => {
    for (const section of SECTIONS) {
      for (const topic of section.topics) {
        if (!checked.has(topicKey(section.id, topic))) {
          return { section: section.title, topic };
        }
      }
    }
    return null;
  })();

  const categoryStats = SECTIONS.reduce<Record<string, { total: number; done: number }>>((acc, s) => {
    if (!acc[s.category]) acc[s.category] = { total: 0, done: 0 };
    acc[s.category].total += s.topics.length;
    acc[s.category].done += s.topics.filter(t => checked.has(topicKey(s.id, t))).length;
    return acc;
  }, {});

  function toggle(sectionId: string, topic: string) {
    const key = topicKey(sectionId, topic);
    setChecked(prev => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
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

  if (!mounted) return null;

  return (
    <div className="space-y-6 sm:space-y-8 pb-20">
      {/* --- MASTER DIAGNOSTIC CARD --- */}
      <div className="p-5 sm:p-8 rounded-[2rem] sm:rounded-[2.5rem] bg-zinc-900/40 border border-zinc-800/60 backdrop-blur-2xl relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-64 h-64 sm:w-96 sm:h-96 bg-indigo-500/10 blur-[80px] sm:blur-[100px] rounded-full -mr-20 -mt-20 sm:-mr-32 sm:-mt-32 transition-colors duration-1000 group-hover:bg-indigo-500/20" />
        
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 sm:gap-10 relative z-10">
          <div className="space-y-3 sm:space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20">
                <Coffee size={20} className="sm:w-6 sm:h-6 text-amber-400" />
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight leading-tight">Java System Diagnostic</h2>
                <p className="text-[11px] sm:text-sm text-zinc-500 font-medium uppercase tracking-wider">Rank: <span className="text-indigo-400">Level {Math.floor(overallPct / 10) + 1}</span></p>
              </div>
            </div>

            {nextMilestone && (
              <div className="inline-flex items-center gap-2 sm:gap-3 px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl sm:rounded-2xl bg-zinc-950/50 border border-zinc-800/50 backdrop-blur-md">
                <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-indigo-500 animate-pulse" />
                <span className="text-[8px] sm:text-[10px] font-black text-zinc-500 uppercase tracking-widest">Next Up:</span>
                <span className="text-[10px] sm:text-xs font-bold text-zinc-200 truncate max-w-[120px] sm:max-w-none">{nextMilestone.topic}</span>
              </div>
            )}
          </div>

          <div className="flex flex-row lg:flex-col items-center lg:items-end justify-between lg:justify-end gap-2 border-t lg:border-t-0 border-zinc-800/50 pt-4 lg:pt-0">
            <div className="relative">
              <span className={cn(
                "text-4xl sm:text-7xl font-black tabular-nums tracking-tighter leading-none drop-shadow-2xl",
                overallPct === 100 ? "text-emerald-400" : "text-white"
              )}>
                {overallPct}
              </span>
              <span className="text-sm sm:text-2xl font-black text-zinc-600 ml-1 sm:absolute sm:-right-6 sm:bottom-2">%</span>
            </div>
            <p className="text-[8px] sm:text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] sm:tracking-[0.3em]">Mastery Integrity</p>
          </div>
        </div>

        {/* Main Scanner Bar */}
        <div className="mt-6 sm:mt-10 h-3 sm:h-4 rounded-full bg-zinc-950/80 overflow-hidden border border-zinc-800/50 p-0.5 sm:p-1 relative">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-amber-500 via-emerald-500 to-indigo-500 shadow-[0_0_20px_rgba(99,102,241,0.4)] relative"
            initial={{ width: 0 }}
            animate={{ width: `${overallPct}%` }}
            transition={{ duration: 1, ease: "circOut" }}
          >
            <div className="absolute top-0 right-0 w-8 h-full bg-white/20 skew-x-12 blur-sm" />
          </motion.div>
        </div>

        {/* Category breakdown */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 mt-8 sm:mt-10 pt-8 sm:pt-10 border-t border-zinc-800/50">
          {Object.entries(categoryStats).map(([cat, { total, done }]) => {
            const pct = Math.round((done / total) * 100);
            const style = CATEGORY_STYLE[cat];
            const CatIcon = style.icon;
            return (
              <div key={cat} className="space-y-2 sm:space-y-3 group/cat">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <CatIcon size={12} className={cn("sm:w-3.5 sm:h-3.5 transition-colors", pct > 0 ? "text-zinc-200" : "text-zinc-600")} />
                    <span className="text-[8px] sm:text-[10px] font-black text-zinc-500 uppercase tracking-widest">{cat}</span>
                  </div>
                  <span className="text-[8px] sm:text-[10px] font-mono font-bold text-zinc-400">{pct}%</span>
                </div>
                <div className="h-1 rounded-full bg-zinc-950 overflow-hidden border border-zinc-800/30">
                  <motion.div
                    className={cn("h-full rounded-full bg-gradient-to-r transition-all duration-1000", style.bar, style.glow)}
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* --- SECTION CHECKLISTS --- */}
      <div className="space-y-3 sm:space-y-4">
        {SECTIONS.map((section, idx) => {
          const sectionDone = section.topics.filter(t => checked.has(topicKey(section.id, t))).length;
          const sectionPct = Math.round((sectionDone / section.topics.length) * 100);
          const isOpen = openSections.has(section.id);
          const allDone = sectionDone === section.topics.length;
          const style = CATEGORY_STYLE[section.category];

          return (
            <motion.div
              key={section.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className={cn(
                "rounded-[1.5rem] sm:rounded-[2.5rem] border transition-all duration-500 overflow-hidden",
                isOpen 
                  ? "bg-zinc-900/60 border-zinc-700/50 shadow-xl" 
                  : "bg-zinc-950/40 border-zinc-800/60 hover:border-zinc-700/50 hover:bg-zinc-900/20"
              )}
            >
              <button
                onClick={() => toggleSection(section.id)}
                className="w-full flex items-center gap-4 sm:gap-6 p-4 sm:p-6 text-left group"
              >
                <div className={cn(
                  "w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl flex items-center justify-center border transition-all duration-500",
                  allDone ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" : "bg-zinc-900 border-zinc-800 text-zinc-600 group-hover:border-zinc-600"
                )}>
                  {allDone ? <CheckCircle2 size={20} className="sm:w-6 sm:h-6" /> : <Circle size={18} className="sm:w-5 sm:h-5 opacity-50" />}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 sm:gap-3 mb-1 sm:mb-2">
                    <h3 className={cn("text-sm sm:text-lg font-bold transition-colors truncate", isOpen ? "text-white" : "text-zinc-400 group-hover:text-zinc-200")}>
                      {section.title}
                    </h3>
                    <span className={cn("text-[8px] sm:text-[9px] font-black px-1.5 py-0.5 rounded-full border uppercase tracking-widest shrink-0", style.badge)}>
                      {section.category}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-3 sm:gap-4">
                    <div className="flex-1 h-1 rounded-full bg-zinc-950 overflow-hidden border border-zinc-800/30">
                      <motion.div
                        className={cn("h-full rounded-full bg-gradient-to-r", style.bar)}
                        animate={{ width: `${sectionPct}%` }}
                      />
                    </div>
                    <span className="text-[8px] sm:text-[10px] font-mono font-black text-zinc-500 tabular-nums">
                      {sectionDone}/{section.topics.length} DONE
                    </span>
                  </div>
                </div>

                <div className={cn(
                  "p-1.5 sm:p-2 rounded-lg sm:rounded-xl bg-zinc-900 border border-zinc-800 transition-transform duration-500",
                  isOpen && "rotate-180 bg-zinc-800"
                )}>
                  <ChevronDown size={14} className="sm:w-4.5 sm:h-4.5 text-zinc-500" />
                </div>
              </button>

              <AnimatePresence>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
                  >
                    <div className="px-4 sm:px-6 pb-6 sm:pb-8">
                      <div className="h-px bg-zinc-800/50 mb-4 sm:mb-6" />
                      <div className="grid grid-cols-1 sm:md:grid-cols-2 gap-2 sm:gap-3">
                        {section.topics.map(topic => {
                          const isDone = checked.has(topicKey(section.id, topic));
                          return (
                            <button
                              key={topic}
                              onClick={(e) => { e.stopPropagation(); toggle(section.id, topic); }}
                              className={cn(
                                "flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl sm:rounded-2xl border transition-all duration-300 text-left relative overflow-hidden group/item",
                                isDone
                                  ? "bg-emerald-500/5 border-emerald-500/20"
                                  : "bg-zinc-950/50 border-zinc-800/50 hover:border-zinc-700 hover:bg-zinc-900/50"
                              )}
                            >
                              {isDone && (
                                <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 to-transparent pointer-events-none" />
                              )}
                              <div className={cn(
                                "w-5 h-5 sm:w-6 sm:h-6 rounded-lg border-2 flex items-center justify-center transition-all duration-500",
                                isDone ? "bg-emerald-500 border-transparent shadow-[0_0_10px_rgba(16,185,129,0.4)]" : "border-zinc-800 group-hover/item:border-zinc-600"
                              )}>
                                {isDone && <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}><CheckCircle2 size={12} className="sm:w-3.5 sm:h-3.5 text-white" /></motion.div>}
                              </div>
                              <span className={cn(
                                "text-[11px] sm:text-xs font-bold transition-colors",
                                isDone ? "text-zinc-400 line-through" : "text-zinc-300"
                              )}>
                                {topic}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>

      {/* Mastery Celebration */}
      {overallPct === 100 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-8 sm:p-10 rounded-[2rem] sm:rounded-[3rem] bg-gradient-to-br from-amber-500/20 via-zinc-900 to-zinc-950 border border-amber-500/30 text-center relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(245,158,11,0.1),transparent_70%)]" />
          <Trophy size={40} className="sm:w-12 sm:h-12 text-amber-400 mx-auto mb-4 drop-shadow-[0_0_20px_rgba(245,158,11,0.5)]" />
          <h2 className="text-2xl sm:text-3xl font-black text-white mb-2">Java Mastery Confirmed</h2>
          <p className="text-xs sm:text-sm text-zinc-400 font-medium">System fully optimized. All core Java milestones cleared.</p>
        </motion.div>
      )}
    </div>
  );
}
