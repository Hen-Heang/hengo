"use client";

import React, { useState } from "react";
import { motion } from "motion/react";
import { 
  CheckCircle2, 
  Lock, 
  BookOpen, 
  Code2, 
  Braces, 
  Atom, 
  Wind, 
  Globe, 
  Package
} from "lucide-react";
import { cn } from "@/lib/cn";

interface RoadmapNode {
  id: string;
  title: string;
  description: string;
  whyLearn: string;
  realProjectUse: string;
  icon: React.ElementType;
  status: "done" | "active" | "todo";
  category: "Legacy" | "Foundation" | "Framework" | "Styling" | "State" | "Modern";
  subtopics: string[];
}

const FRONTEND_STEPS: RoadmapNode[] = [
  {
    id: "legacy",
    title: "JavaScript (jQuery & AJAX)",
    description: "DOM manipulation and asynchronous requests.",
    whyLearn: "Many Korean enterprise (SI) and eGovFrame projects still rely on jQuery. You must be able to maintain and upgrade these legacy systems.",
    realProjectUse: "Handling click events, modal popups, and dynamic form validation in JSP/JSTL environments using $.ajax().",
    icon: Code2,
    status: "done",
    category: "Legacy",
    subtopics: ["jQuery Selectors", "DOM Manipulation", "AJAX with $.ajax()", "JSON Parsing"],
  },
  {
    id: "typescript",
    title: "TypeScript & ES6+",
    description: "Modern JS and Type-safe development.",
    whyLearn: "TypeScript catches 40% of bugs before you even run the code. It is the industry standard for scalable frontend applications.",
    realProjectUse: "Defining Interfaces for API responses from your Spring Boot backend to ensure data consistency across the stack.",
    icon: Braces,
    status: "done",
    category: "Foundation",
    subtopics: ["ES6 (Arrow fns, Destructuring)", "Interfaces & Types", "Generics", "Module Systems"],
  },
  {
    id: "react",
    title: "React Core",
    description: "Component-based UI development.",
    whyLearn: "React allows you to build complex UIs as small, reusable building blocks. Its 'one-way data flow' makes debugging much easier than jQuery.",
    realProjectUse: "Building interactive dashboards and complex forms where UI state needs to sync instantly with user input.",
    icon: Atom,
    status: "active",
    category: "Framework",
    subtopics: ["Hooks (useState, useEffect)", "Props & State", "Context API", "Virtual DOM"],
  },
  {
    id: "styling",
    title: "Styling (Tailwind & Shadcn)",
    description: "Utility-first CSS and pre-built components.",
    whyLearn: "Tailwind CSS speeds up UI development by 3x. Shadcn UI (Radix) provides accessible, beautiful components without writing 1000s of lines of CSS.",
    realProjectUse: "Rapidly building the 'Look & Feel' of your app. Using Lucide Icons for consistent, lightweight iconography.",
    icon: Wind,
    status: "todo",
    category: "Styling",
    subtopics: ["Tailwind Utility Classes", "Responsive Design", "Shadcn UI / Radix", "Lucide Icons"],
  },
  {
    id: "fetching",
    title: "State & Data (TanStack Query)",
    description: "Server state management and caching.",
    whyLearn: "Managing data from an API (loading, error, caching) is hard. TanStack Query automates this, so you never have to manually handle 'isLoading'.",
    realProjectUse: "Connecting your React frontend to Spring Boot. It handles auto-refetching and caching for a 'snappy' user experience.",
    icon: Package,
    status: "todo",
    category: "State",
    subtopics: ["useQuery & useMutation", "Caching & Stale Time", "Infinite Scrolling", "Optimistic Updates"],
  },
  {
    id: "nextjs",
    title: "Next.js (App Router)",
    description: "The Fullstack Frontend Framework.",
    whyLearn: "Next.js provides Server Side Rendering (SSR) for SEO and performance. It is currently the most popular way to build production React apps.",
    realProjectUse: "Building the core of this Learning Notes app! Using Server Actions and the App Router for fast, optimized navigation.",
    icon: Globe,
    status: "todo",
    category: "Modern",
    subtopics: ["Server Components", "Server Actions", "File-based Routing", "Middleware & Auth"],
  },
];

export function FrontendRoadmap() {
  const [activeNode, setActiveNode] = useState<string | null>("react");

  return (
    <div className="relative py-12 px-4">
      <div className="absolute left-1/2 top-0 bottom-0 w-1 bg-zinc-900 -translate-x-1/2 hidden md:block" />

      <div className="space-y-16 relative">
        {FRONTEND_STEPS.map((node, index) => {
          const isLeft = index % 2 === 0;
          const Icon = node.icon;
          const isActive = activeNode === node.id;

          return (
            <div key={node.id} className="relative">
              <div className={cn(
                "hidden md:block absolute top-1/2 w-1/2 h-px bg-zinc-800 -z-10",
                isLeft ? "left-0" : "right-0"
              )} />

              <div className={cn(
                "flex flex-col md:flex-row items-center gap-8",
                isLeft ? "md:flex-row" : "md:flex-row-reverse"
              )}>
                <motion.div
                  initial={{ opacity: 0, x: isLeft ? -20 : 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  onClick={() => setActiveNode(node.id)}
                  className={cn(
                    "w-full md:w-[45%] p-6 rounded-3xl border transition-all duration-500 cursor-pointer group relative overflow-hidden",
                    isActive 
                      ? "bg-zinc-900 border-indigo-500/50 shadow-[0_0_40px_-10px_rgba(99,102,241,0.2)]" 
                      : "bg-zinc-950 border-zinc-800 hover:border-zinc-700"
                  )}
                >
                  <div className="flex items-center justify-between mb-4">
                    <span className={cn(
                      "text-[10px] font-bold px-2 py-0.5 rounded-full border tracking-tighter uppercase",
                      node.status === "done" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
                      node.status === "active" ? "bg-amber-500/10 text-amber-400 border-amber-500/20 animate-pulse" :
                      "bg-zinc-800/50 text-zinc-500 border-zinc-700/50"
                    )}>
                      {node.status === "done" ? "Expert" : node.status === "active" ? "Improving" : "Locked"}
                    </span>
                    <span className="text-[10px] font-mono text-zinc-600">{node.category}</span>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className={cn(
                      "p-3 rounded-2xl border transition-colors duration-500",
                      node.status === "done" ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" :
                      node.status === "active" ? "bg-amber-500/10 border-amber-500/20 text-amber-400" :
                      "bg-zinc-900 border-zinc-800 text-zinc-600"
                    )}>
                      <Icon size={24} />
                    </div>
                    <div>
                      <h3 className="text-lg font-black text-white group-hover:text-indigo-400 transition-colors">{node.title}</h3>
                      <p className="text-sm text-zinc-500 mt-1 leading-relaxed">{node.description}</p>
                    </div>
                  </div>

                  <motion.div 
                    initial={false}
                    animate={{ height: isActive ? "auto" : 0, opacity: isActive ? 1 : 0 }}
                    className="overflow-hidden mt-4"
                  >
                    <div className="pt-4 border-t border-zinc-800 space-y-4">
                      <div className="space-y-2">
                        <h4 className="text-[10px] font-bold text-indigo-500 uppercase tracking-wider">The Strategic Why</h4>
                        <p className="text-xs text-zinc-400 leading-relaxed font-medium">{node.whyLearn}</p>
                      </div>

                      <div className="space-y-2">
                        <h4 className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider">Real Project Impact</h4>
                        <p className="text-xs text-zinc-400 leading-relaxed font-medium italic">&quot;{node.realProjectUse}&quot;</p>
                      </div>

                      <div className="grid grid-cols-2 gap-2 pt-2">
                        {node.subtopics.map(topic => (
                          <div key={topic} className="flex items-center gap-2 text-[10px] text-zinc-500 font-mono">
                            <div className="w-1 h-1 rounded-full bg-indigo-500/50" />
                            {topic}
                          </div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                </motion.div>

                <div className="relative z-10">
                  <div className={cn(
                    "w-12 h-12 rounded-full border-4 flex items-center justify-center transition-all duration-700",
                    node.status === "done" ? "bg-emerald-500 border-zinc-950 shadow-[0_0_20px_rgba(16,185,129,0.4)]" :
                    node.status === "active" ? "bg-amber-500 border-zinc-950 shadow-[0_0_20px_rgba(245,158,11,0.4)]" :
                    "bg-zinc-900 border-zinc-950"
                  )}>
                    {node.status === "done" ? <CheckCircle2 size={20} className="text-white" /> :
                     node.status === "active" ? <BookOpen size={20} className="text-white" /> :
                     <Lock size={18} className="text-zinc-600" />}
                  </div>
                  
                  <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[10px] font-mono font-bold text-zinc-700 whitespace-nowrap">
                    FRONTEND {index + 1}
                  </div>
                </div>

                <div className="hidden md:block md:w-[45%]" />
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-20 flex flex-col items-center">
        <div className="w-px h-16 bg-gradient-to-b from-zinc-800 to-transparent" />
        <p className="text-[10px] font-mono text-zinc-700 mt-4 uppercase tracking-[0.3em]">Crafting the Interface</p>
      </div>
    </div>
  );
}
