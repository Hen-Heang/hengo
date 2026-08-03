"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Plus, X, Check, Trash2,
  List, Briefcase, Home, ShoppingCart, Heart, Star, BookOpen, Tag,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { SmartLists } from "./SmartLists";
import type { TodoListWithCount, SmartListType, ActiveList } from "@/types/todos";

const LIST_COLORS = [
  '#6366f1', // Indigo
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#ec4899', // Pink
  '#3b82f6', // Blue
  '#8b5cf6', // Violet
  '#ef4444', // Red
  '#14b8a6', // Teal
] as const;

const LIST_ICONS = {
  list:      List,
  briefcase: Briefcase,
  home:      Home,
  cart:      ShoppingCart,
  heart:     Heart,
  star:      Star,
  book:      BookOpen,
  tag:       Tag,
} as const;

type IconKey = keyof typeof LIST_ICONS;

function ListIcon({ name, size = 14 }: { name: string; size?: number }) {
  const Icon = LIST_ICONS[name as IconKey] ?? List;
  return <Icon size={size} />;
}

function ProgressRing({ percent, color, size = 32 }: { percent: number; color: string; size?: number }) {
  const radius = (size / 2) - 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percent / 100) * circumference;

  return (
    <div className="relative flex items-center justify-center shrink-0" style={{ width: size, height: size }}>
      <svg className="rotate-[-90deg]" width={size} height={size}>
        <circle
          className="text-zinc-200 dark:text-zinc-800"
          strokeWidth="2"
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
        <motion.circle
          strokeWidth="2"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1, ease: "easeOut" }}
          strokeLinecap="round"
          stroke={color}
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
      </svg>
    </div>
  );
}

interface Props {
  lists: TodoListWithCount[];
  smartCounts: Record<SmartListType, number>;
  activeList: ActiveList;
  onSelectSmart: (id: SmartListType) => void;
  onSelectList: (id: string) => void;
  onAddList: (name: string, color: string, icon: string) => void;
  onDeleteList: (id: string) => void;
}

export function TodoSidebar({
  lists, smartCounts, activeList,
  onSelectSmart, onSelectList, onAddList, onDeleteList,
}: Props) {
  const [showAddList, setShowAddList] = useState(false);
  const [newName, setNewName]   = useState('');
  const [newColor, setNewColor] = useState<string>(LIST_COLORS[0]);
  const [newIcon, setNewIcon]   = useState<IconKey>('list');

  function handleAdd() {
    if (!newName.trim()) return;
    onAddList(newName.trim(), newColor, newIcon);
    setNewName('');
    setNewColor(LIST_COLORS[0]);
    setNewIcon('list');
    setShowAddList(false);
  }

  return (
    <aside className="w-full md:w-64 shrink-0 flex flex-col h-full bg-zinc-50/90 dark:bg-zinc-950/80 border-r border-zinc-200/60 dark:border-zinc-800/60 backdrop-blur-2xl overflow-hidden shadow-[4px_0_24px_rgba(0,0,0,0.2)]">
      <div className="md:hidden pt-safe" />
      {/* Smart Lists */}
      <div className="pt-2 shrink-0">
        <SmartLists
          counts={smartCounts}
          activeList={activeList}
          onSelect={onSelectSmart}
        />
      </div>

      {/* My Lists */}
      <div className="flex-1 overflow-y-auto px-4 pb-3 min-h-0 mt-2">
        <p className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-[0.2em] mb-3 mt-1">
          Workspaces
        </p>

        <div className="space-y-1">
          <AnimatePresence initial={false}>
            {lists.map(list => {
              const active = activeList.type === 'list' && activeList.id === list.id;
              const total = list.todo_count + list.completed_count;
              const percent = total > 0 ? (list.completed_count / total) * 100 : 0;

              return (
                <motion.div
                  key={list.id}
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.15 }}
                  className="group overflow-hidden"
                >
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => onSelectList(list.id)}
                    onKeyDown={(e) => e.key === 'Enter' && onSelectList(list.id)}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-300 text-sm cursor-pointer",
                      active
                        ? "bg-white dark:bg-zinc-800/60 shadow-md font-bold text-zinc-900 dark:text-white border border-zinc-200 dark:border-zinc-700/50"
                        : "font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-900/50 border border-transparent"
                    )}
                  >
                    <div className="relative">
                      <ProgressRing percent={percent} color={list.color} size={32} />
                      <div
                        className="absolute inset-0 m-auto w-6 h-6 rounded-md flex items-center justify-center text-white shadow-inner"
                        style={{ backgroundColor: list.color }}
                      >
                        <ListIcon name={list.icon} size={12} />
                      </div>
                    </div>
                    <span className="flex-1 text-left truncate">{list.name}</span>
                    {list.todo_count > 0 && (
                      <span className="text-[11px] font-mono text-zinc-500 tabular-nums bg-zinc-100 dark:bg-zinc-900/50 px-1.5 py-0.5 rounded-md border border-zinc-200 dark:border-zinc-800">
                        {list.todo_count}
                      </span>
                    )}
                    <button
                      onClick={(e) => { e.stopPropagation(); onDeleteList(list.id); }}
                      className="opacity-0 group-hover:opacity-100 p-1 rounded-md text-zinc-500 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {/* Add List Form */}
        <AnimatePresence>
          {showAddList && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="mt-3 overflow-hidden"
            >
              <div className="bg-white dark:bg-zinc-900/80 backdrop-blur-md rounded-2xl p-4 shadow-xl space-y-4 border border-zinc-200 dark:border-zinc-800/80">
                <input
                  autoFocus
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') handleAdd();
                    if (e.key === 'Escape') setShowAddList(false);
                  }}
                  placeholder="Workspace name"
                  className="w-full bg-zinc-50 dark:bg-zinc-950 rounded-xl px-4 py-2.5 text-sm font-medium text-zinc-900 dark:text-white placeholder:text-zinc-500 outline-none focus:ring-1 ring-indigo-500/50 border border-zinc-200 dark:border-zinc-800"
                />

                {/* Color picker */}
                <div className="flex flex-wrap gap-2">
                  {LIST_COLORS.map(c => (
                    <button
                      key={c}
                      onClick={() => setNewColor(c)}
                      className={cn(
                        "w-6 h-6 rounded-full flex items-center justify-center transition-all hover:scale-110 shadow-inner",
                        newColor === c && "ring-2 ring-offset-2 ring-offset-white dark:ring-offset-zinc-900"
                      )}
                      style={{ backgroundColor: c, '--tw-ring-color': c } as React.CSSProperties}
                    >
                      {newColor === c && <Check size={11} color="white" strokeWidth={3} />}
                    </button>
                  ))}
                </div>

                {/* Icon picker */}
                <div className="flex flex-wrap gap-2">
                  {(Object.keys(LIST_ICONS) as IconKey[]).map(key => {
                    const Icon = LIST_ICONS[key];
                    const selected = newIcon === key;
                    return (
                      <button
                        key={key}
                        onClick={() => setNewIcon(key)}
                        className={cn(
                          "w-8 h-8 rounded-xl flex items-center justify-center transition-colors",
                          selected ? "text-white shadow-md" : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-200"
                        )}
                        style={selected ? { backgroundColor: newColor } : undefined}
                      >
                        <Icon size={14} />
                      </button>
                    );
                  })}
                </div>

                <div className="flex gap-2 pt-1">
                  <button
                    onClick={() => { setShowAddList(false); setNewName(''); }}
                    className="flex-1 py-2 text-xs font-bold text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800/50 rounded-xl hover:bg-zinc-200 dark:hover:bg-zinc-800 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAdd}
                    disabled={!newName.trim()}
                    className="flex-1 py-2 text-xs font-bold text-white bg-indigo-500 rounded-xl hover:bg-indigo-400 disabled:opacity-40 disabled:hover:bg-indigo-500 transition-colors shadow-lg shadow-indigo-500/20"
                  >
                    Create
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer */}
      <div className="px-4 pb-4 pt-3 border-t border-zinc-200/60 dark:border-zinc-800/60 shrink-0">
        <button
          onClick={() => setShowAddList(v => !v)}
          className={cn(
            "w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-sm font-bold transition-all duration-300",
            showAddList
              ? "bg-zinc-100 dark:bg-zinc-800/50 text-zinc-600 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700/50"
              : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white bg-zinc-50 dark:bg-zinc-900/50 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 hover:border-indigo-200 dark:hover:border-indigo-500/30 border border-zinc-200 dark:border-zinc-800/50"
          )}
        >
          <div
            className={cn(
              "w-5 h-5 rounded-md flex items-center justify-center transition-colors",
              showAddList ? "bg-zinc-300 dark:bg-zinc-700 text-zinc-600 dark:text-white" : "bg-zinc-200 dark:bg-zinc-800 text-indigo-500 dark:text-indigo-400"
            )}
          >
            {showAddList
              ? <X size={12} strokeWidth={2.5} />
              : <Plus size={12} strokeWidth={2.5} />
            }
          </div>
          {showAddList ? 'Cancel' : 'New Workspace'}
        </button>
      </div>
    </aside>
  );
}
