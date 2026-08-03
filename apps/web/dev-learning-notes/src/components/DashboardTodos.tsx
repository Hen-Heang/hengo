"use client";

import { useTodos } from "@/app/todos/hooks/useTodos";
import { motion, AnimatePresence } from "motion/react";
import { 
  CheckCircle2, 
  Plus, 
  ChevronRight, 
  Calendar, 
  ArrowRight,
  Loader2,
  ListTodo,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { useState } from "react";
import Link from "next/link";

export function DashboardTodos({ userId }: { userId: string }) {
  const {
    loading,
    todos,
    smartCounts,
    addTodo,
    toggleTodo,
  } = useTodos(userId);

  const [inputValue, setInputValue] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  async function handleAdd() {
    if (!inputValue.trim()) return;
    await addTodo(inputValue.trim());
    setInputValue("");
    setIsAdding(false);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={24} className="text-indigo-500 animate-spin" />
      </div>
    );
  }

  // Filter for high priority or due today/scheduled
  const today = new Date().toISOString().split('T')[0];
  const PRIORITY_ORDER: Record<string, number> = { high: 0, medium: 1, low: 2, none: 3 };
  const focusTasks = [...todos]
    .sort((a, b) => {
      const pa = PRIORITY_ORDER[a.priority] ?? 3;
      const pb = PRIORITY_ORDER[b.priority] ?? 3;
      if (pa !== pb) return pa - pb;
      const aToday = a.due_date === today ? 0 : 1;
      const bToday = b.due_date === today ? 0 : 1;
      return aToday - bToday;
    })
    .slice(0, 5);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-start">
      {/* --- TASK FOCUS PANEL --- */}
      <div className="lg:col-span-8 bg-zinc-900/40 border border-zinc-800/60 rounded-[2rem] sm:rounded-[2.5rem] overflow-hidden backdrop-blur-xl order-1">
        <div className="p-5 sm:p-8 border-b border-zinc-800/60 flex items-center justify-between">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="p-2 sm:p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
              <ListTodo size={20} className="sm:w-6 sm:h-6" />
            </div>
            <div>
              <h2 className="text-lg sm:text-2xl font-black text-white tracking-tight">Active Focus</h2>
              <p className="text-[10px] sm:text-sm text-zinc-500 font-medium">Daily technical objectives.</p>
            </div>
          </div>

          <div className="flex items-center gap-3 sm:gap-4">
             <div className="hidden xs:block text-right">
                <p className="text-[9px] sm:text-[10px] font-black text-zinc-500 uppercase tracking-widest leading-none">Pending</p>
                <p className="text-lg sm:text-xl font-black text-white tabular-nums">{smartCounts.all}</p>
             </div>
             <Link href="/todos">
                <button className="p-2 rounded-xl bg-zinc-800 border border-zinc-700 text-zinc-400 hover:text-white transition-all">
                  <ArrowRight size={18} className="sm:w-5 sm:h-5" />
                </button>
             </Link>
          </div>
        </div>

        <div className="p-2 sm:p-4 space-y-1">
          <AnimatePresence mode="popLayout">
            {focusTasks.length === 0 ? (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="py-12 sm:py-20 text-center space-y-4"
              >
                <div className="inline-flex p-4 rounded-full bg-emerald-500/5 border border-emerald-500/10">
                  <CheckCircle2 size={28} className="sm:w-8 sm:h-8 text-emerald-500/40" />
                </div>
                <p className="text-[10px] sm:text-sm font-bold text-zinc-600 uppercase tracking-[0.2em]">All Systems Clear</p>
              </motion.div>
            ) : (
              focusTasks.map((todo) => (
                <motion.div
                  key={todo.id}
                  layout
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="group flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-2xl hover:bg-zinc-800/40 transition-all border border-transparent hover:border-zinc-800/60"
                >
                  <button 
                    onClick={() => toggleTodo(todo.id)}
                    className={cn(
                      "w-5 h-5 sm:w-6 sm:h-6 rounded-lg border-2 flex items-center justify-center transition-all",
                      todo.is_completed ? "bg-emerald-500 border-transparent shadow-[0_0_10px_rgba(16,185,129,0.4)]" : "border-zinc-700 group-hover:border-zinc-500"
                    )}
                  >
                    {todo.is_completed && <CheckCircle2 size={12} className="sm:w-3.5 sm:h-3.5 text-white" />}
                  </button>
                  
                  <div className="flex-1 min-w-0">
                    <p className={cn(
                      "text-sm sm:text-[15px] font-bold transition-all truncate",
                      todo.is_completed ? "text-zinc-600 line-through" : "text-zinc-200"
                    )}>
                      {todo.title}
                    </p>
                    {todo.due_date && (
                      <div className="flex items-center gap-1.5 mt-0.5 sm:mt-1 text-[9px] sm:text-[10px] font-black text-zinc-500 uppercase tracking-wider">
                        <Calendar size={10} />
                        {todo.due_date}
                      </div>
                    )}
                  </div>

                  <Link href="/todos" className="hidden xs:block opacity-0 group-hover:opacity-100 transition-opacity">
                    <ChevronRight size={18} className="text-zinc-600" />
                  </Link>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>

        {/* Quick Add at bottom */}
        <div className="p-4 sm:p-6 bg-zinc-900/20 border-t border-zinc-800/60">
          {!isAdding ? (
            <button 
              onClick={() => setIsAdding(true)}
              className="w-full flex items-center gap-3 p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-zinc-950/50 border border-zinc-800/50 text-zinc-500 hover:text-zinc-300 hover:border-zinc-700 transition-all text-[10px] sm:text-sm font-bold uppercase tracking-widest"
            >
              <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-lg bg-zinc-800 flex items-center justify-center">
                <Plus size={14} />
              </div>
              New Focus Objective
            </button>
          ) : (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2 sm:gap-3 p-1.5 sm:p-2 rounded-xl sm:rounded-2xl bg-zinc-950 border border-indigo-500/30"
            >
              <input 
                autoFocus
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                onBlur={() => !inputValue && setIsAdding(false)}
                placeholder="The mission?"
                className="flex-1 bg-transparent px-3 py-1.5 sm:px-4 sm:py-2 text-sm sm:text-base text-white outline-none font-bold placeholder:text-zinc-700"
              />
              <button 
                onClick={handleAdd}
                className="px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg sm:rounded-xl bg-indigo-500 text-white text-[10px] sm:text-xs font-black uppercase tracking-widest hover:bg-indigo-400 transition-colors"
              >
                Launch
              </button>
            </motion.div>
          )}
        </div>
      </div>

      {/* --- SMART STATS CARDS --- */}
      <div className="lg:col-span-4 flex flex-col gap-4 order-2">
        <div className="p-5 sm:p-6 rounded-[2rem] bg-zinc-900/40 border border-zinc-800/60 backdrop-blur-xl">
          <h3 className="text-[9px] sm:text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] mb-4 sm:mb-6">Efficiency Engine</h3>
          
          <div className="grid grid-cols-1 gap-3 sm:gap-4">
            <div className="flex items-center justify-between p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-zinc-950/50 border border-zinc-800/50">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-blue-500" />
                <span className="text-[11px] sm:text-xs font-bold text-zinc-400">Today</span>
              </div>
              <span className="text-lg sm:text-xl font-black text-white tabular-nums">{smartCounts.today}</span>
            </div>

            <div className="flex items-center justify-between p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-zinc-950/50 border border-zinc-800/50">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-amber-500" />
                <span className="text-[11px] sm:text-xs font-bold text-zinc-400">Scheduled</span>
              </div>
              <span className="text-lg sm:text-xl font-black text-white tabular-nums">{smartCounts.scheduled}</span>
            </div>

            <div className="flex items-center justify-between p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-zinc-950/50 border border-zinc-800/50">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="text-[11px] sm:text-xs font-bold text-zinc-400">Completed</span>
              </div>
              <span className="text-lg sm:text-xl font-black text-white tabular-nums">{smartCounts.completed}</span>
            </div>
          </div>
        </div>

        <Link href="/todos">
          <div className="group p-5 sm:p-6 rounded-[2rem] bg-indigo-500/5 border border-indigo-500/10 hover:border-indigo-500/30 transition-all cursor-pointer">
            <p className="text-[9px] sm:text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em] mb-2">Advanced Control</p>
            <div className="flex items-center justify-between">
              <h4 className="text-xs sm:text-sm font-bold text-white group-hover:text-indigo-300 transition-colors">Full Task Manager</h4>
              <ArrowRight size={14} className="sm:w-4 sm:h-4 text-indigo-500 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
}
