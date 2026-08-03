import { getAllNotes } from "@/lib/notes";
import { NoteSearch } from "@/components/NoteSearch";
import { QuickNotesWorkspace } from "@/components/QuickNotesWorkspace";
import { DashboardTodos } from "@/components/DashboardTodos";
import { TechNewsFeed } from "@/components/TechNewsFeed";
import { Sparkles, Terminal, ArrowUpRight, Layout, CheckCircle, Clock, BookOpen } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/cn";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function Home() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const [notes] = await Promise.all([getAllNotes()]);
  
  // We'll let the client component handle its own counts for real-time responsiveness
  const userId = user?.id ?? "";

  return (
    <div className="px-4 sm:px-10 py-8 sm:py-16 max-w-6xl mx-auto pb-safe">
      {/* --- HERO SECTION --- */}
      <div className="relative mb-16 sm:mb-20">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[10px] sm:text-[11px] font-bold uppercase tracking-widest mb-6 sm:mb-8 animate-fade-in">
          <Sparkles size={12} className="text-indigo-300" />
          <span>Global Tech Stack 2026</span>
        </div>

        <h1 className="text-4xl sm:text-6xl lg:text-8xl font-black text-white mb-6 sm:mb-8 tracking-tight leading-[1.1] sm:leading-[0.95] text-balance">
          The Modern <br className="hidden sm:block" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-emerald-300 to-teal-500">
            Developer&apos;s Hub.
          </span>
        </h1>

        <p className="text-zinc-400 text-sm sm:text-xl leading-relaxed max-w-3xl mb-10 sm:mb-12 font-medium">
          A curated command center for mastering <span className="text-white">full-stack architecture</span>, 
          <span className="text-indigo-400/90 italic font-bold"> clean code patterns</span>, and 
          <span className="text-emerald-400/90 font-bold"> high-scale infrastructure</span>.
        </p>

        {/* --- QUICK STATS BAR --- */}
        <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-3 sm:gap-6">
          <div className="flex items-center gap-3 px-4 py-3 sm:px-6 sm:py-4 rounded-2xl bg-zinc-900/40 border border-zinc-800/40 backdrop-blur-md">
            <div className="p-1.5 sm:p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
              <Layout size={18} className="sm:w-5 sm:h-5" />
            </div>
            <div>
              <p className="text-[9px] sm:text-xs font-mono text-zinc-500 font-bold uppercase tracking-tighter sm:tracking-normal">Modules</p>
              <p className="text-lg sm:text-xl font-black text-white tracking-tighter">{notes.length}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 px-4 py-3 sm:px-6 sm:py-4 rounded-2xl bg-zinc-900/40 border border-zinc-800/40 backdrop-blur-md">
            <div className="p-1.5 sm:p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
              <CheckCircle size={18} className="sm:w-5 sm:h-5" />
            </div>
            <div>
              <p className="text-[9px] sm:text-xs font-mono text-zinc-500 font-bold uppercase tracking-tighter sm:tracking-normal">Status</p>
              <p className="text-lg sm:text-xl font-black text-emerald-400 tracking-tighter uppercase text-[12px] sm:text-[14px]">Online</p>
            </div>
          </div>
        </div>
      </div>

      {/* --- LIVE INTEL STREAM --- */}
      <div className="mt-20">
        <div className="flex items-center gap-3 mb-8">
           <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.8)]" />
           <h2 className="text-xs font-black text-zinc-500 uppercase tracking-[0.3em]">Live Technology Intel</h2>
           <div className="flex-1 h-px bg-zinc-900" />
        </div>
        <TechNewsFeed />
      </div>

      {/* --- PRIMARY TASK WORKSPACE --- */}
      <div className="mt-28">
        <div className="flex items-center gap-3 mb-10">
           <h2 className="text-xs font-black text-zinc-500 uppercase tracking-[0.3em]">Mission Objectives</h2>
           <div className="flex-1 h-px bg-zinc-900" />
        </div>
        <DashboardTodos userId={userId} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 sm:gap-16 mt-28">
        <div className="lg:col-span-8">
          <div className="flex items-end justify-between mb-10 border-b border-zinc-800/60 pb-8">
            <div>
              <h2 className="text-3xl font-black text-white flex items-center gap-4">
                <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20">
                  <Terminal size={28} className="text-indigo-400" />
                </div>
                Knowledge Library
              </h2>
              <p className="text-base text-zinc-500 mt-3 font-medium">Systematic deep-dives into modern technology.</p>
            </div>
          </div>

          <NoteSearch notes={notes} />
        </div>

        <div className="lg:col-span-4 space-y-12">
          {/* --- SIDEBAR ROADMAP --- */}
          <div className="p-8 rounded-[2rem] bg-zinc-900/30 border border-zinc-800/50 relative overflow-hidden">
            <h3 className="text-xs font-black text-zinc-500 mb-10 uppercase tracking-[0.2em] flex items-center gap-3">
              <BookOpen size={14} className="text-indigo-500" />
              Mastery Path
            </h3>

            <div className="space-y-6 relative before:absolute before:left-3 before:top-2 before:bottom-2 before:w-px before:bg-zinc-800/60">
              {[
                { label: "Core Foundations", status: "done", desc: "CS, Data Structures & Logic" },
                { label: "Backend Scalability", status: "active", desc: "Java, Spring & Distributed DB" },
                { label: "Frontend Excellence", status: "todo", desc: "React, Next.js & UX Design" },
                { label: "Systems Architecture", status: "todo", desc: "Cloud, CI/CD & Security" },
              ].map((step, idx) => (
                <div key={idx} className="relative pl-10 group">
                  <div className={cn(
                    "absolute left-0 top-1.5 w-6 h-6 rounded-full border-2 z-10 flex items-center justify-center transition-all duration-500 bg-zinc-950",
                    step.status === 'done' ? "border-emerald-500 text-emerald-500" :
                    step.status === 'active' ? "border-indigo-500 text-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.3)] animate-pulse" :
                    "border-zinc-800 text-zinc-700"
                  )}>
                    <div className={cn("w-1.5 h-1.5 rounded-full", 
                      step.status === 'done' ? "bg-emerald-500" : 
                      step.status === 'active' ? "bg-indigo-500" : 
                      "bg-zinc-800"
                    )} />
                  </div>
                  
                  <div>
                    <h4 className={cn("text-sm font-bold tracking-tight", 
                      step.status === 'todo' ? "text-zinc-600" : "text-zinc-200"
                    )}>{step.label}</h4>
                    <p className="text-[11px] text-zinc-500 mt-0.5 font-medium">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <Link href="/roadmap" className="mt-10 flex items-center justify-between group/link pt-6 border-t border-zinc-800/50">
              <span className="text-[10px] font-black text-zinc-500 group-hover/link:text-indigo-400 transition-colors tracking-widest uppercase">Explore Full Map</span>
              <ArrowUpRight size={14} className="text-zinc-700 group-hover/link:text-indigo-400 transition-all group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* --- WORKSPACE SECTIONS --- */}
      <div className="mt-28">
        <QuickNotesWorkspace />
      </div>

    </div>
  );
}
