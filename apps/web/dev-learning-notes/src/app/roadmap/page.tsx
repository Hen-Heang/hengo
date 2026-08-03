"use client";

import { useState } from "react";
import { Roadmap } from "@/components/Roadmap";
import { JavaRoadmap } from "@/components/JavaRoadmap";
import { SpringRoadmap } from "@/components/SpringRoadmap";
import { SqlRoadmap } from "@/components/SqlRoadmap";
import { FrontendRoadmap } from "@/components/FrontendRoadmap";
import { Map, Coffee, GraduationCap, Zap, Database, Monitor } from "lucide-react";
import { cn } from "@/lib/cn";

export default function RoadmapPage() {
  const [activeTab, setActiveTab] = useState<"career" | "java" | "spring" | "sql" | "frontend">("career");

  return (
    <div className="px-4 sm:px-10 py-8 sm:py-16 max-w-4xl mx-auto pb-safe">
      <div className="mb-8 sm:mb-12">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-[9px] sm:text-[10px] font-bold uppercase tracking-widest mb-4 sm:mb-6">
          <Map size={12} />
          <span>Interactive Roadmaps</span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-black text-zinc-900 dark:text-white mb-4 sm:mb-6 tracking-tight leading-tight">
          Learning <span className="text-amber-500 dark:text-amber-400">Paths.</span>
        </h1>

        <p className="text-zinc-500 dark:text-zinc-400 text-sm sm:text-lg leading-relaxed max-w-2xl font-medium">
          Detailed steps, topics, and milestones to master the engineering stack.
        </p>
      </div>

      {/* Roadmap Switcher */}
      <div className="flex flex-wrap gap-1.5 sm:gap-2 p-1 sm:p-1.5 bg-zinc-100/50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl sm:rounded-2xl mb-8 sm:mb-12 w-fit">
        <button
          onClick={() => setActiveTab("career")}
          className={cn(
            "flex items-center gap-1.5 sm:gap-2 px-3 py-1.5 sm:px-6 sm:py-2.5 rounded-lg sm:rounded-xl text-[10px] sm:text-sm font-bold transition-all duration-300",
            activeTab === "career"
              ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-md border border-zinc-200 dark:border-zinc-700"
              : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
          )}
        >
          <GraduationCap size={14} className="sm:w-4 sm:h-4" />
          Career
        </button>
        <button
          onClick={() => setActiveTab("java")}
          className={cn(
            "flex items-center gap-1.5 sm:gap-2 px-3 py-1.5 sm:px-6 sm:py-2.5 rounded-lg sm:rounded-xl text-[10px] sm:text-sm font-bold transition-all duration-300",
            activeTab === "java"
              ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-md border border-zinc-200 dark:border-zinc-700"
              : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
          )}
        >
          <Coffee size={14} className="sm:w-4 sm:h-4" />
          Java
        </button>
        <button
          onClick={() => setActiveTab("spring")}
          className={cn(
            "flex items-center gap-1.5 sm:gap-2 px-3 py-1.5 sm:px-6 sm:py-2.5 rounded-lg sm:rounded-xl text-[10px] sm:text-sm font-bold transition-all duration-300",
            activeTab === "spring"
              ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-md border border-zinc-200 dark:border-zinc-700"
              : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
          )}
        >
          <Zap size={14} className="sm:w-4 sm:h-4" />
          Spring
        </button>
        <button
          onClick={() => setActiveTab("sql")}
          className={cn(
            "flex items-center gap-1.5 sm:gap-2 px-3 py-1.5 sm:px-6 sm:py-2.5 rounded-lg sm:rounded-xl text-[10px] sm:text-sm font-bold transition-all duration-300",
            activeTab === "sql"
              ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-md border border-zinc-200 dark:border-zinc-700"
              : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
          )}
        >
          <Database size={14} className="sm:w-4 sm:h-4" />
          SQL
        </button>
        <button
          onClick={() => setActiveTab("frontend")}
          className={cn(
            "flex items-center gap-1.5 sm:gap-2 px-3 py-1.5 sm:px-6 sm:py-2.5 rounded-lg sm:rounded-xl text-[10px] sm:text-sm font-bold transition-all duration-300",
            activeTab === "frontend"
              ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-md border border-zinc-200 dark:border-zinc-700"
              : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
          )}
        >
          <Monitor size={14} className="sm:w-4 sm:h-4" />
          Frontend
        </button>
      </div>

      <div className="min-h-[600px]">
        {activeTab === "career" && <Roadmap />}
        {activeTab === "java" && <JavaRoadmap />}
        {activeTab === "spring" && <SpringRoadmap />}
        {activeTab === "sql" && <SqlRoadmap />}
        {activeTab === "frontend" && <FrontendRoadmap />}
      </div>
    </div>
  );
}
