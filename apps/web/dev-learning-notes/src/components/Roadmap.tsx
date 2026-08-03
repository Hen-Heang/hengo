"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "motion/react";
import { CheckCircle2, Circle, Clock, ChevronRight } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { loadProgress, saveProgress } from "@/lib/supabase/progress";

interface RoadmapPhase {
  phase: string;
  week: string;
  label: string;
  detail: string;
  tags: string[];
}

const PHASES: RoadmapPhase[] = [
  {
    phase: "01",
    week: "Month 1",
    label: "Computer Science & Logic",
    detail: "Data Structures, Algorithms, Memory Management, and clean logic patterns.",
    tags: ["DS/Algo", "Logic", "Complexity"],
  },
  {
    phase: "02",
    week: "Month 2–3",
    label: "Advanced Backend Systems",
    detail: "Microservices, Distributed Databases, Caching (Redis), and Message Queues.",
    tags: ["Java/Go", "Spring", "PostgreSQL", "Kafka"],
  },
  {
    phase: "03",
    week: "Month 4–5",
    label: "Modern Frontend Mastery",
    detail: "Advanced React, Server Components, State Machines, and Design Systems.",
    tags: ["Next.js", "TypeScript", "Tailwind", "Shadcn"],
  },
  {
    phase: "04",
    week: "Month 6–7",
    label: "Cloud Architecture & DevOps",
    detail: "Docker, Kubernetes, AWS/Vercel deployment, and automated CI/CD pipelines.",
    tags: ["Docker", "K8s", "AWS", "CI/CD"],
  },
  {
    phase: "05",
    week: "Month 8+",
    label: "Product Engineering",
    detail: "System design, high-scale performance, security auditing, and lead engineer skills.",
    tags: ["System Design", "Security", "Leadership"],
  },
];

const STATUS_CONFIG = {
  done: {
    icon: CheckCircle2,
    iconColor: "text-emerald-400",
    labelColor: "text-zinc-300",
    badge: "bg-emerald-400/10 text-emerald-400 border-emerald-400/20",
    badgeText: "Completed",
    card: "border-zinc-800/60 bg-zinc-900/20",
  },
  active: {
    icon: Clock,
    iconColor: "text-amber-400",
    labelColor: "text-zinc-100",
    badge: "bg-amber-400/10 text-amber-400 border-amber-400/20",
    badgeText: "In Progress",
    card: "border-amber-400/20 bg-amber-400/[0.03]",
  },
  upcoming: {
    icon: Circle,
    iconColor: "text-zinc-600",
    labelColor: "text-zinc-500",
    badge: "bg-zinc-800/60 text-zinc-600 border-zinc-700/40",
    badgeText: "Upcoming",
    card: "border-zinc-800/40 bg-transparent",
  },
};

const TAG_COLOR: Record<string, string> = {
  "DS/Algo": "text-orange-400/80 bg-orange-400/8 border-orange-400/15",
  Logic: "text-sky-400/80 bg-sky-400/8 border-sky-400/15",
  Complexity: "text-sky-400/80 bg-sky-400/8 border-sky-400/15",
  "Java/Go": "text-emerald-400/80 bg-emerald-400/8 border-emerald-400/15",
  Spring: "text-emerald-400/80 bg-emerald-400/8 border-emerald-400/15",
  PostgreSQL: "text-sky-400/80 bg-sky-400/8 border-sky-400/15",
  Kafka: "text-orange-400/80 bg-orange-400/8 border-orange-400/15",
  "Next.js": "text-white/80 bg-white/8 border-white/15",
  TypeScript: "text-blue-400/80 bg-blue-400/8 border-blue-400/15",
  Tailwind: "text-sky-400/80 bg-sky-400/8 border-sky-400/15",
  Shadcn: "text-zinc-300/80 bg-zinc-700/20 border-zinc-600/20",
  Docker: "text-blue-400/80 bg-blue-400/8 border-blue-400/15",
  "K8s": "text-blue-400/80 bg-blue-400/8 border-blue-400/15",
  AWS: "text-amber-400/80 bg-amber-400/8 border-amber-400/15",
  "CI/CD": "text-violet-400/80 bg-violet-400/8 border-violet-400/15",
  "System Design": "text-violet-400/80 bg-violet-400/8 border-violet-400/15",
  Security: "text-red-400/80 bg-red-400/8 border-red-400/15",
  Leadership: "text-emerald-400/80 bg-emerald-400/8 border-emerald-400/15",
};

const LS_KEY = "roadmap-progress";
const TRACKER_KEY = "roadmap";
const DEFAULT_DONE = ["01", "02"];

function getPhaseStatus(
  phaseId: string,
  donePhases: Set<string>
): "done" | "active" | "upcoming" {
  if (donePhases.has(phaseId)) return "done";
  const firstUndone = PHASES.find((p) => !donePhases.has(p.phase));
  if (firstUndone?.phase === phaseId) return "active";
  return "upcoming";
}

export function Roadmap() {
  const [donePhases, setDonePhases] = useState<Set<string>>(new Set());
  const [mounted, setMounted] = useState(false);
  const [supabase] = useState(() => createClient());
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load from localStorage then sync from Supabase
  useEffect(() => {
    const raw = localStorage.getItem(LS_KEY);
    const local: string[] = raw ? JSON.parse(raw) : DEFAULT_DONE;
    setDonePhases(new Set(local));

    loadProgress(supabase, TRACKER_KEY)
      .then((remote) => {
        if (remote.length > 0) {
          setDonePhases(new Set(remote));
          localStorage.setItem(LS_KEY, JSON.stringify(remote));
        } else if (!raw) {
          // First time: persist defaults
          localStorage.setItem(LS_KEY, JSON.stringify(DEFAULT_DONE));
        }
      })
      .catch(() => {})
      .finally(() => setMounted(true));
  }, [supabase]);

  // Save whenever donePhases changes
  useEffect(() => {
    if (!mounted) return;
    const arr = [...donePhases];
    localStorage.setItem(LS_KEY, JSON.stringify(arr));

    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      saveProgress(supabase, TRACKER_KEY, arr).catch(() => {});
    }, 800);
  }, [donePhases, mounted, supabase]);

  function togglePhase(phaseId: string) {
    setDonePhases((prev) => {
      const next = new Set(prev);
      if (next.has(phaseId)) {
        next.delete(phaseId);
      } else {
        next.add(phaseId);
      }
      return next;
    });
  }

  const doneCount = donePhases.size;
  const progressPct = Math.round((doneCount / PHASES.length) * 100);

  return (
    <section className="mt-14">
      {/* Section header */}
      <div className="flex items-center gap-3 mb-6">
        <span className="text-[10px] font-mono text-zinc-600 tracking-wider uppercase">{"// career path"}</span>
        <div className="flex-1 h-px bg-zinc-800" />
        <span className="text-[10px] font-mono text-zinc-600">{doneCount}/{PHASES.length} milestones</span>
      </div>

      {/* Progress bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-zinc-500">Full-Stack Mastery Progress</span>
          <span className="text-xs font-mono text-emerald-400">{progressPct}%</span>
        </div>
        <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-linear-to-r from-emerald-500 to-emerald-400 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progressPct}%` }}
            transition={{ duration: 1, ease: "easeOut", delay: 0.3 }}
          />
        </div>
      </div>

      {/* Timeline */}
      <div className="relative">
        <div className="absolute left-[19px] top-6 bottom-6 w-px bg-zinc-800 hidden sm:block" />

        <div className="space-y-3">
          {PHASES.map((phase, i) => {
            const status = getPhaseStatus(phase.phase, donePhases);
            const cfg = STATUS_CONFIG[status];
            const Icon = cfg.icon;

            return (
              <motion.div
                key={phase.phase}
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: i * 0.08, ease: "easeOut" }}
              >
                <div
                  onClick={() => togglePhase(phase.phase)}
                  className={`relative flex gap-4 p-4 rounded-xl border transition-all duration-200 cursor-pointer hover:opacity-80 ${cfg.card}`}
                >
                  {/* Icon */}
                  <div className="relative z-10 shrink-0 mt-0.5">
                    <Icon size={20} className={cfg.iconColor} />
                    {status === "active" && (
                      <motion.div
                        className="absolute inset-0 rounded-full bg-amber-400/20"
                        animate={{ scale: [1, 1.6, 1], opacity: [0.6, 0, 0.6] }}
                        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                      />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="text-[10px] font-mono text-zinc-600">Phase {phase.phase}</span>
                      <span className="text-[10px] font-mono text-zinc-700">·</span>
                      <span className="text-[10px] font-mono text-zinc-600">{phase.week}</span>
                      <span className={`ml-auto text-[10px] font-mono px-2 py-0.5 rounded-full border ${cfg.badge}`}>
                        {cfg.badgeText}
                      </span>
                    </div>

                    <p className={`text-sm font-semibold mb-1 ${cfg.labelColor}`}>{phase.label}</p>
                    <p className="text-xs text-zinc-600 leading-relaxed mb-2.5">{phase.detail}</p>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-1.5">
                      {phase.tags.map((tag) => (
                        <span
                          key={tag}
                          className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${TAG_COLOR[tag] ?? "text-zinc-500 bg-zinc-800/40 border-zinc-700/40"}`}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Arrow for active */}
                  {status === "active" && (
                    <div className="shrink-0 self-center">
                      <ChevronRight size={14} className="text-amber-400/60" />
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Footer note */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="mt-6 text-xs text-zinc-700 font-mono text-center"
      >
        {"// GOAL: SENIOR FULL-STACK ENGINEER 🌍"}
      </motion.p>
    </section>
  );
}
