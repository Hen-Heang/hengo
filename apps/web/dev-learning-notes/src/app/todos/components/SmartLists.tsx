"use client";

import { motion } from "motion/react";
import { CalendarDays, Clock, ListTodo, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/cn";
import type { SmartListType, ActiveList } from "@/types/todos";

const SMART = [
  {
    id: 'today'     as SmartListType,
    label: 'Today',
    Icon: CalendarDays,
    color: '#007AFF', // iOS Blue
    bg: 'bg-blue-500',
  },
  {
    id: 'scheduled' as SmartListType,
    label: 'Scheduled',
    Icon: Clock,
    color: '#FF9500', // iOS Orange
    bg: 'bg-orange-500',
  },
  {
    id: 'all'       as SmartListType,
    label: 'All',
    Icon: ListTodo,
    color: '#8E8E93', // iOS Gray
    bg: 'bg-zinc-500',
  },
  {
    id: 'completed' as SmartListType,
    label: 'Completed',
    Icon: CheckCircle2,
    color: '#34C759', // iOS Green
    bg: 'bg-emerald-500',
  },
] as const;

interface Props {
  counts: Record<SmartListType, number>;
  activeList: ActiveList;
  onSelect: (id: SmartListType) => void;
}

export function SmartLists({ counts, activeList, onSelect }: Props) {
  return (
    <div className="grid grid-cols-2 gap-3 p-4">
      {SMART.map(({ id, label, Icon, color, bg }) => {
        const active = activeList.type === 'smart' && activeList.id === id;
        return (
          <motion.button
            key={id}
            onClick={() => onSelect(id)}
            whileTap={{ scale: 0.96 }}
            className={cn(
              "relative flex flex-col justify-between p-3 rounded-2xl text-left transition-all duration-200",
              "bg-white dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800 shadow-sm",
              active && "ring-2 ring-indigo-500/50 dark:ring-indigo-400/40 border-transparent bg-zinc-50 dark:bg-zinc-800"
            )}
          >
            <div className="flex items-start justify-between w-full">
              <div className={cn(
                "w-9 h-9 rounded-full flex items-center justify-center text-white shadow-sm",
                bg
              )}>
                <Icon size={20} strokeWidth={2.5} />
              </div>
              <span className="text-2xl font-bold text-zinc-900 dark:text-white tabular-nums">
                {counts[id]}
              </span>
            </div>
            
            <div className="mt-4">
              <p className="text-[13px] font-bold text-zinc-500 dark:text-zinc-400">
                {label}
              </p>
            </div>
          </motion.button>
        );
      })}
    </div>
  );
}
