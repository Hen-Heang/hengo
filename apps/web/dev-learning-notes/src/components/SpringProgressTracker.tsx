"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  CheckCircle2, 
  ChevronDown, 
  Sparkles, 
  Zap, 
  Database, 
  ShieldCheck, 
  Network, 
  Box,
  Circle,
  Trophy,
  Target,
  Activity
} from "lucide-react";
import { cn } from "@/lib/cn";
import { createClient } from "@/lib/supabase/client";
import { loadProgress, saveProgress } from "@/lib/supabase/progress";

interface TopicItem {
  id: string;
  label: string;
  level?: "Basic" | "Intermediate" | "Advanced";
}

interface TrackerSection {
  id: string;
  title: string;
  category: "Core" | "Web" | "Data" | "Security" | "Advanced";
  topics: TopicItem[];
}

const SECTIONS: TrackerSection[] = [
  {
    id: "core",
    title: "Spring Core & IoC",
    category: "Core",
    topics: [
      { id: "core-bean-scopes",       label: "Bean Scopes" },
      { id: "core-component-scan",    label: "Component Scanning" },
      { id: "core-di-types",          label: "DI Types (Constructor vs Setter)" },
      { id: "core-config-bean",       label: "@Configuration & @Bean" },
    ],
  },
  {
    id: "mvc",
    title: "Spring MVC & REST API",
    category: "Web",
    topics: [
      { id: "mvc-request-mapping",    label: "Request Mapping" },
      { id: "mvc-rest-controller",    label: "@RestController" },
      { id: "mvc-service-repo",       label: "@Service / @Repository" },
      { id: "mvc-dto-pattern",        label: "DTO Pattern" },
    ],
  },
  {
    id: "thymeleaf",
    title: "Thymeleaf — Basic to Advanced",
    category: "Web",
    topics: [
      { id: "th-variable-expr",     label: "Variable Expressions  ${...}",        level: "Basic" },
      { id: "th-text",              label: "th:text — Render data safely",         level: "Basic" },
      { id: "th-each",              label: "th:each — Loop over lists",            level: "Basic" },
      { id: "th-if-unless",         label: "th:if & th:unless — Conditionals",     level: "Basic" },
      { id: "th-object-field",      label: "th:object & th:field — Form binding",  level: "Intermediate" },
      { id: "th-fragment",          label: "th:fragment — Define reusable blocks", level: "Intermediate" },
      { id: "th-layout-dialect",    label: "Layout Dialect — Base template",       level: "Intermediate" },
      { id: "th-inline-expr",       label: "Inline Expressions  [[${...}]]",       level: "Intermediate" },
      { id: "th-sec-authorize",     label: "sec:authorize — Security Dialect",     level: "Advanced" },
      { id: "th-email-templates",   label: "HTML Email templates",                 level: "Advanced" },
      { id: "th-pagination",        label: "Pagination logic",                     level: "Advanced" },
      { id: "th-custom-dialect",    label: "Custom Dialect & Processors",          level: "Advanced" },
    ],
  },
  {
    id: "jpa",
    title: "Spring Data JPA (Hibernate)",
    category: "Data",
    topics: [
      { id: "jpa-entity-mapping",   label: "Entity Mapping" },
      { id: "jpa-jpql",             label: "JPQL & Criteria API" },
      { id: "jpa-querydsl",         label: "QueryDSL (Dynamic Queries)" },
      { id: "jpa-n1-problem",       label: "N+1 Problem Solving" },
    ],
  },
  {
    id: "mybatis",
    title: "MyBatis (SQL Mapper)",
    category: "Data",
    topics: [
      { id: "mb-xml-mapper",        label: "XML Mapper files" },
      { id: "mb-dynamic-sql",       label: "Dynamic SQL (<if>, <foreach>)" },
      { id: "mb-resultmaps",        label: "ResultMaps" },
      { id: "mb-config-vs-ann",     label: "Configuration vs Annotations" },
    ],
  },
  {
    id: "security",
    title: "Spring Security & OAuth2",
    category: "Security",
    topics: [
      { id: "sec-filter-chain",     label: "Filter Chain" },
      { id: "sec-auth-manager",     label: "AuthenticationManager" },
      { id: "sec-jwt",              label: "JWT Token Handling" },
      { id: "sec-cors-csrf",        label: "CORS & CSRF" },
    ],
  },
  {
    id: "cloud",
    title: "Spring Cloud & Advanced",
    category: "Advanced",
    topics: [
      { id: "cloud-feign",          label: "Feign Client" },
      { id: "cloud-gateway",        label: "API Gateway" },
      { id: "cloud-kafka",          label: "Kafka / RabbitMQ" },
      { id: "cloud-actuator",       label: "Actuator Monitoring" },
    ],
  },
];

const CATEGORY_STYLE: Record<string, { badge: string; bar: string; icon: React.ElementType; glow: string }> = {
  Core: { 
    badge: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20", 
    bar: "from-emerald-600 to-teal-400",
    icon: Box,
    glow: "shadow-[0_0_15px_rgba(16,185,129,0.3)]"
  },
  Web: { 
    badge: "bg-sky-500/10 text-sky-400 border-sky-500/20", 
    bar: "from-sky-600 to-blue-400",
    icon: Zap,
    glow: "shadow-[0_0_15px_rgba(14,165,233,0.3)]"
  },
  Data: { 
    badge: "bg-violet-500/10 text-violet-400 border-violet-500/20", 
    bar: "from-violet-600 to-purple-400",
    icon: Database,
    glow: "shadow-[0_0_15px_rgba(139,92,246,0.3)]"
  },
  Security: { 
    badge: "bg-rose-500/10 text-rose-400 border-rose-500/20", 
    bar: "from-rose-600 to-red-400",
    icon: ShieldCheck,
    glow: "shadow-[0_0_15px_rgba(244,63,94,0.3)]"
  },
  Advanced: { 
    badge: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20", 
    bar: "from-indigo-600 to-blue-500",
    icon: Network,
    glow: "shadow-[0_0_15px_rgba(99,102,241,0.3)]"
  },
};

const LEVEL_STYLE: Record<string, string> = {
  Basic: "text-emerald-500/80",
  Intermediate: "text-sky-500/80",
  Advanced: "text-amber-500/80",
};

const LS_KEY = "spring-progress-v1";
const TRACKER_KEY = "spring";

export function SpringProgressTracker() {
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [openSections, setOpenSections] = useState<Set<string>>(new Set(["core"]));
  const [mounted, setMounted] = useState(false);
  const [supabase] = useState(() => createClient());
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) {
      try {
        // eslint-disable-next-line react-hooks/set-state-in-effect
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
        if (!checked.has(topic.id)) {
          return { section: section.title, label: topic.label };
        }
      }
    }
    return null;
  })();

  const categoryStats = SECTIONS.reduce<Record<string, { total: number; done: number }>>((acc, s) => {
    if (!acc[s.category]) acc[s.category] = { total: 0, done: 0 };
    acc[s.category].total += s.topics.length;
    acc[s.category].done += s.topics.filter(t => checked.has(t.id)).length;
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

  if (!mounted) return null;

  return (
    <div className="space-y-8 pb-20">
      {/* --- MASTER DIAGNOSTIC CARD --- */}
      <div className="p-8 rounded-[2.5rem] bg-zinc-900/40 border border-zinc-800/60 backdrop-blur-2xl relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 blur-[100px] rounded-full -mr-32 -mt-32 transition-colors duration-1000 group-hover:bg-emerald-500/20" />
        
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-10 relative z-10">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                <Sparkles size={24} className="text-emerald-400" />
              </div>
              <div>
                <h2 className="text-2xl font-black text-white tracking-tight">Spring System Diagnostic</h2>
                <p className="text-sm text-zinc-500 font-medium">Backend Rank: <span className="text-emerald-400 uppercase tracking-widest font-black text-xs ml-2">Level {Math.floor(overallPct / 10) + 1} Architect</span></p>
              </div>
            </div>

            {nextMilestone && (
              <div className="inline-flex items-center gap-3 px-4 py-2 rounded-2xl bg-zinc-950/50 border border-zinc-800/50 backdrop-blur-md">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Focusing on:</span>
                <span className="text-xs font-bold text-zinc-200">{nextMilestone.label}</span>
              </div>
            )}
          </div>

          <div className="flex flex-col items-center lg:items-end gap-2">
            <div className="relative">
              <span className={cn(
                "text-7xl font-black tabular-nums tracking-tighter leading-none drop-shadow-2xl",
                overallPct === 100 ? "text-emerald-400" : "text-white"
              )}>
                {overallPct}
              </span>
              <span className="text-2xl font-black text-zinc-600 absolute -right-6 bottom-2">%</span>
            </div>
            <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em]">Runtime Integrity</p>
          </div>
        </div>

        {/* Main Scanner Bar */}
        <div className="mt-10 h-4 rounded-full bg-zinc-950/80 overflow-hidden border border-zinc-800/50 p-1 relative">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-sky-500 to-indigo-500 shadow-[0_0_20px_rgba(16,185,129,0.4)] relative"
            initial={{ width: 0 }}
            animate={{ width: `${overallPct}%` }}
            transition={{ duration: 1, ease: "circOut" }}
          >
            <div className="absolute top-0 right-0 w-8 h-full bg-white/20 skew-x-12 blur-sm" />
          </motion.div>
        </div>

        {/* Category breakdown */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-6 mt-10 pt-10 border-t border-zinc-800/50">
          {Object.entries(categoryStats).map(([cat, { total, done }]) => {
            const pct = Math.round((done / total) * 100);
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
      <div className="space-y-4">
        {SECTIONS.map((section, idx) => {
          const sectionDone = section.topics.filter(t => checked.has(t.id)).length;
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
                  allDone ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" : "bg-zinc-900 border-zinc-800 text-zinc-600 group-hover:border-zinc-600"
                )}>
                  {allDone ? <CheckCircle2 size={24} /> : <Circle size={20} className="opacity-50" />}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className={cn("text-lg font-bold transition-colors", isOpen ? "text-white" : "text-zinc-400 group-hover:text-zinc-200")}>
                      {section.title}
                    </h3>
                    <span className={cn("text-[9px] font-black px-2 py-0.5 rounded-full border uppercase tracking-widest shrink-0", style.badge)}>
                      {section.category}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="flex-1 h-1 rounded-full bg-zinc-950 overflow-hidden border border-zinc-800/30">
                      <motion.div
                        className={cn("h-full rounded-full bg-gradient-to-r", style.bar)}
                        animate={{ width: `${sectionPct}%` }}
                      />
                    </div>
                    <span className="text-[10px] font-mono font-black text-zinc-500 tabular-nums">
                      {sectionDone}/{section.topics.length} MILSTONES
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
                    transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
                  >
                    <div className="px-6 pb-8">
                      <div className="h-px bg-zinc-800/50 mb-6" />
                      
                      {/* Leveled groups (Thymeleaf) or flat grid */}
                      {section.topics.some(t => t.level) ? (
                        <div className="space-y-6">
                          {(["Basic", "Intermediate", "Advanced"] as const).map(lvl => {
                            const lvlTopics = section.topics.filter(t => t.level === lvl);
                            if (lvlTopics.length === 0) return null;
                            return (
                              <div key={lvl} className="space-y-3">
                                <div className="flex items-center gap-3">
                                  <span className={cn("text-[10px] font-black uppercase tracking-[0.2em]", LEVEL_STYLE[lvl])}>
                                    {lvl} Stack
                                  </span>
                                  <div className="flex-1 h-px bg-zinc-800/40" />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                  {lvlTopics.map(t => (
                                    <TopicCheckbox
                                      key={t.id}
                                      label={t.label}
                                      checked={checked.has(t.id)}
                                      onToggle={() => toggleTopic(t.id)}
                                    />
                                  ))}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
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
                      )}
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
          className="p-10 rounded-[3rem] bg-gradient-to-br from-emerald-500/20 via-zinc-900 to-zinc-950 border border-emerald-500/30 text-center relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.1),transparent_70%)]" />
          <Trophy size={48} className="text-emerald-400 mx-auto mb-4 drop-shadow-[0_0_20px_rgba(16,185,129,0.5)]" />
          <h2 className="text-3xl font-black text-white mb-2">Spring Architect Mastered</h2>
          <p className="text-zinc-400 font-medium">All backend infrastructure nodes are fully operational.</p>
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
          ? "bg-emerald-500/5 border-emerald-500/20"
          : "bg-zinc-950/50 border-zinc-800/50 hover:border-zinc-700 hover:bg-zinc-900/50"
      )}
    >
      {checked && (
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 to-transparent pointer-events-none" />
      )}
      <div className={cn(
        "w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all duration-500",
        checked ? "bg-emerald-500 border-transparent shadow-[0_0_15px_rgba(16,185,129,0.4)]" : "border-zinc-800 group-hover/item:border-zinc-600"
      )}>
        {checked && <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}><CheckCircle2 size={14} className="text-white" /></motion.div>}
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
