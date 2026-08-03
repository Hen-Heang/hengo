"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Menu, List } from "lucide-react";
import { useTodos } from "./hooks/useTodos";
import { useNotifications } from "./hooks/useNotifications";
import { TodoSidebar } from "./components/TodoSidebar";
import { TodoList } from "./components/TodoList";
import { TodoDetail } from "./components/TodoDetail";
import { SmartLists } from "./components/SmartLists";
import type { SmartListType } from "@/types/todos";

const SMART_LABELS: Record<SmartListType, string> = {
  today:     'Today',
  scheduled: 'Scheduled',
  all:       'All',
  completed: 'Completed',
};

interface Props {
  userId: string;
}

export function TodosClient({ userId }: Props) {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [showDashboardOnMobile, setShowDashboardOnMobile] = useState(true);

  const {
    loading,
    error, clearError,
    lists, todos, smartCounts,
    activeList, setActiveList, activeListColor,
    selectedTodo, setSelectedTodo,
    addTodo, toggleTodo, saveTodo, removeTodo, clearCompleted, reorderActiveTodos,
    addList, removeList,
    searchQuery, setSearchQuery,
  } = useTodos(userId);

  // Fire browser notifications for todos with notify=true when due
  useNotifications(todos);

  const activeListName =
    activeList.type === 'smart'
      ? SMART_LABELS[activeList.id as SmartListType]
      : (lists.find(l => l.id === activeList.id)?.name ?? 'List');

  const isDashboard = showDashboardOnMobile && !searchQuery;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full py-32">
        <div className="w-5 h-5 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex h-full overflow-hidden relative">
      {/* Error banner */}
      {error && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-4 py-2.5 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 rounded-xl shadow-lg text-sm text-red-600 dark:text-red-400 max-w-sm">
          <span className="flex-1">{error}</span>
          <button onClick={clearError} className="font-bold hover:text-red-800 dark:hover:text-red-200">✕</button>
        </div>
      )}

      {/* Mobile backdrop */}
      <AnimatePresence>
        {mobileSidebarOpen && (
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 bg-black/30 dark:bg-black/50 z-30 md:hidden"
            onClick={() => setMobileSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Mobile sidebar */}
      <AnimatePresence>
        {mobileSidebarOpen && (
          <motion.div
            key="mobile-sidebar"
            initial={{ x: -256 }}
            animate={{ x: 0 }}
            exit={{ x: -256 }}
            transition={{ type: 'spring', damping: 26, stiffness: 320 }}
            className="fixed left-0 top-0 h-full z-40 md:hidden shadow-2xl"
          >
            <TodoSidebar
              lists={lists}
              smartCounts={smartCounts}
              activeList={activeList}
              onSelectSmart={(id) => {
                setActiveList({ type: 'smart', id });
                setShowDashboardOnMobile(false);
                setMobileSidebarOpen(false);
              }}
              onSelectList={(id) => {
                setActiveList({ type: 'list', id });
                setShowDashboardOnMobile(false);
                setMobileSidebarOpen(false);
              }}
              onAddList={addList}
              onDeleteList={removeList}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Desktop sidebar */}
      <div className="hidden md:flex h-full shrink-0 border-r border-zinc-200 dark:border-zinc-800">
        <TodoSidebar
          lists={lists}
          smartCounts={smartCounts}
          activeList={activeList}
          onSelectSmart={(id) => { setActiveList({ type: 'smart', id }); setShowDashboardOnMobile(false); }}
          onSelectList={(id) => { setActiveList({ type: 'list', id }); setShowDashboardOnMobile(false); }}
          onAddList={addList}
          onDeleteList={removeList}
        />
      </div>

      {/* Main content */}
      <div className="flex-1 min-w-0 flex flex-col h-full overflow-hidden bg-white dark:bg-zinc-950 pb-safe sm:pb-0">

        {/* Mobile top bar */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-zinc-100 dark:border-zinc-800/60 md:hidden shrink-0 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl sticky top-0 z-20">
          {!isDashboard && (
            <button
              onClick={() => setShowDashboardOnMobile(true)}
              className="text-indigo-500 font-bold text-sm flex items-center gap-1"
            >
              <span className="text-lg">‹</span> Back
            </button>
          )}
          <div className="flex-1 flex flex-col min-w-0">
            <span
              className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-0.5"
            >
              Reminders
            </span>
            <span
              className="text-base font-black truncate leading-none"
              style={{ color: isDashboard ? undefined : activeListColor }}
            >
              {isDashboard ? 'Dashboard' : activeListName}
            </span>
          </div>
          <button
            onClick={() => setMobileSidebarOpen(true)}
            className="p-2 -mr-1.5 rounded-2xl text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all active:scale-90 border border-zinc-200/50 dark:border-zinc-800/50 shadow-sm"
          >
            <Menu size={20} />
          </button>
        </div>

        {/* Dashboard or List */}
        <div className="flex-1 min-h-0 overflow-y-auto">
          {isDashboard ? (
            <div className="md:hidden animate-fade-in">
              <div className="px-5 pt-8 pb-2">
                <h1 className="text-3xl font-black text-zinc-900 dark:text-white tracking-tight">Intelligence</h1>
              </div>
              <SmartLists
                counts={smartCounts}
                activeList={activeList}
                onSelect={(id) => {
                  setActiveList({ type: 'smart', id });
                  setShowDashboardOnMobile(false);
                }}
              />
              <div className="px-5 pt-6 pb-3">
                <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-zinc-400">Workspaces</h2>
              </div>
              <div className="px-2 pb-10">
                {lists.map(list => (
                  <button
                    key={list.id}
                    onClick={() => {
                      setActiveList({ type: 'list', id: list.id });
                      setShowDashboardOnMobile(false);
                    }}
                    className="w-full flex items-center gap-4 px-4 py-4 rounded-2xl hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors group"
                  >
                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-white shadow-lg" style={{ backgroundColor: list.color }}>
                      <List name={list.icon} size={20} />
                    </div>
                    <div className="flex-1 text-left min-w-0">
                      <p className="text-[15px] font-black text-zinc-800 dark:text-zinc-100 truncate">{list.name}</p>
                      <p className="text-xs font-bold text-zinc-500">{list.todo_count} tasks</p>
                    </div>
                    <span className="text-zinc-300 dark:text-zinc-700 font-bold text-xl group-active:translate-x-1 transition-transform">›</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <TodoList
              todos={todos}
              activeList={activeList}
              activeListColor={activeListColor}
              activeListName={activeListName}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              onToggle={toggleTodo}
              onSelect={setSelectedTodo}
              onDelete={removeTodo}
              onAdd={addTodo}
              onReorder={reorderActiveTodos}
              onClearCompleted={clearCompleted}
            />
          )}
        </div>
      </div>

      {/* Detail panel */}
      <TodoDetail
        todo={selectedTodo}
        lists={lists}
        onClose={() => setSelectedTodo(null)}
        onSave={saveTodo}
        onDelete={removeTodo}
      />
    </div>
  );
}

