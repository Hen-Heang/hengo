"use client";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { Menu, NotebookPen, Settings, X, LayoutGrid, Map, LogOut, CheckSquare } from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/cn";
import { TechIcon } from "@/components/TechIcon";
import { BrandLockup } from "@/components/BrandLockup";
import { getEmptyNoteOrder, getStoredNoteOrder, orderNotes, subscribeToNoteOrder } from "@/lib/note-order";

interface NavItem {
  slug: string;
  title: string;
  icon: string;
}

export function MobileSidebar({ notes }: { notes: NavItem[] }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  async function handleSignOut() {
    const { createClient } = await import("@/lib/supabase/client");
    const supabase = createClient();
    await supabase.auth.signOut();
    setOpen(false);
    router.push("/login");
    router.refresh();
  }
  const savedOrder = useSyncExternalStore(subscribeToNoteOrder, getStoredNoteOrder, getEmptyNoteOrder);
  const orderedNotes = useMemo(() => orderNotes(notes, savedOrder), [notes, savedOrder]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const drawer = (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-md z-100"
            onClick={() => setOpen(false)}
          />

          <motion.aside
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", damping: 32, stiffness: 300 }}
            className="fixed left-0 top-0 bottom-0 w-[85%] max-w-[400px] bg-white/95 dark:bg-zinc-950/95 border-r border-zinc-200/50 dark:border-zinc-800/50 z-101 flex flex-col shadow-2xl"
          >
            <div className="pt-safe" />

            {/* Header */}
            <div className="px-6 py-6 border-b border-zinc-200/40 dark:border-zinc-800/40 flex items-center justify-between gap-4">
              <BrandLockup compact className="min-w-0 flex-1" />
              <button
                onClick={() => setOpen(false)}
                aria-label="Close menu"
                className="p-2.5 text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 bg-zinc-100/50 dark:bg-zinc-900/50 rounded-2xl border border-zinc-200/50 dark:border-zinc-800/50 transition-all active:scale-95"
              >
                <X size={20} />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto">
              {/* Overview Section */}
              <div className="px-7 pt-8 pb-3 flex items-center gap-2">
                <LayoutGrid size={14} className="text-emerald-500" />
                <span className="text-[11px] font-mono font-black text-zinc-400 dark:text-zinc-600 tracking-[0.2em] uppercase">Overview</span>
              </div>

              <div className="px-4 space-y-2">
                <Link href="/" onClick={() => setOpen(false)}>
                  <div
                    className={cn(
                      "flex items-center gap-4 px-4 py-4 rounded-2xl text-[15px] transition-all duration-300",
                      pathname === "/"
                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold border border-emerald-500/20 shadow-lg shadow-emerald-500/5"
                        : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-100/50 dark:hover:bg-zinc-900/50"
                    )}
                  >
                    <LayoutGrid size={20} />
                    <span>Dashboard</span>
                  </div>
                </Link>
              </div>

              {/* Modules Library Section */}
              <div className="px-7 pt-8 pb-3 flex items-center gap-2">
                <LayoutGrid size={14} className="text-emerald-500" />
                <span className="text-[11px] font-mono font-black text-zinc-400 dark:text-zinc-600 tracking-[0.2em] uppercase">Modules Library</span>
              </div>

              <div className="px-4 mb-2 space-y-2">
                <Link href="/roadmap" onClick={() => setOpen(false)}>
                  <div
                    className={cn(
                      "flex items-center gap-4 px-4 py-4 rounded-2xl text-[15px] transition-all duration-300",
                      pathname === "/roadmap"
                        ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold border border-amber-500/20 shadow-lg shadow-amber-500/5"
                        : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-100/50 dark:hover:bg-zinc-900/50"
                    )}
                  >
                    <div className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center border transition-all duration-300",
                      pathname === "/roadmap" ? "bg-amber-500/20 border-amber-500/30 text-amber-500 dark:text-amber-300" : "bg-zinc-100 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-zinc-500"
                    )}>
                      <Map size={20} />
                    </div>
                    <span className="font-bold">Mastery Roadmap</span>
                  </div>
                </Link>
                <Link href="/todos" onClick={() => setOpen(false)}>
                  <div
                    className={cn(
                      "flex items-center gap-4 px-4 py-4 rounded-2xl text-[15px] transition-all duration-300",
                      pathname === "/todos"
                        ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold border border-blue-500/20 shadow-lg shadow-blue-500/5"
                        : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-100/50 dark:hover:bg-zinc-900/50"
                    )}
                  >
                    <div className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center border transition-all duration-300",
                      pathname === "/todos" ? "bg-blue-500/20 border-blue-500/30 text-blue-500 dark:text-blue-300" : "bg-zinc-100 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-zinc-500"
                    )}>
                      <CheckSquare size={20} />
                    </div>
                    <span className="font-bold">Reminders</span>
                  </div>
                </Link>
              </div>

              <nav className="px-4 py-2 space-y-2">
                {orderedNotes.map((note) => {
                  const active = pathname === `/notes/${note.slug}`;
                  return (
                    <Link key={note.slug} href={`/notes/${note.slug}`} onClick={() => setOpen(false)}>
                      <div
                        className={cn(
                          "flex items-center gap-4 px-4 py-4 rounded-2xl text-[15px] transition-all duration-300 active:scale-[0.98]",
                          active
                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold border border-emerald-500/20 shadow-lg shadow-emerald-500/5"
                            : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-100/50 dark:hover:bg-zinc-900/50"
                        )}
                      >
                        <div className={cn(
                          "w-10 h-10 rounded-xl flex items-center justify-center border transition-all duration-300",
                          active ? "bg-emerald-500/20 border-emerald-500/30 text-emerald-500 dark:text-emerald-300" : "bg-zinc-100 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-zinc-500"
                        )}>
                          <TechIcon name={note.icon} size={20} />
                        </div>
                        <span className="truncate">{note.title}</span>
                        {active && (
                          <motion.div
                            layoutId="activeIndicator"
                            className="ml-auto w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]"
                          />
                        )}
                      </div>
                    </Link>
                  );
                })}
              </nav>

              {/* Quick Notes Area */}
              <div className="px-4 pb-6 mt-4">
                <Link href="/#workspace" onClick={() => setOpen(false)}>
                  <div className="rounded-3xl border border-emerald-500/20 bg-emerald-500/5 px-6 py-6 text-zinc-700 dark:text-zinc-200 relative overflow-hidden group active:scale-[0.98] transition-transform">
                    <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-500/10 blur-2xl rounded-full -mr-8 -mt-8" />
                    <div className="mb-3 flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                        <NotebookPen size={18} />
                      </div>
                      <span className="text-[15px] font-black tracking-tight">Quick Notes</span>
                    </div>
                    <p className="text-sm leading-relaxed text-zinc-500 font-medium">
                      Personalized workspace for your daily tech stack updates.
                    </p>
                  </div>
                </Link>
              </div>

              {/* Footer (Inside Scroll Area) */}
              <div className="px-4 py-6 border-t border-zinc-200/40 dark:border-zinc-800/40 space-y-2">
                <Link
                  href="/admin"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 px-5 py-4 rounded-2xl text-[15px] text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-all active:scale-[0.98]"
                >
                  <div className="p-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                    <Settings size={18} className="shrink-0" />
                  </div>
                  <span className="font-bold">System Settings</span>
                </Link>
                <button
                  onClick={handleSignOut}
                  className="w-full flex items-center gap-3 px-5 py-4 rounded-2xl text-[15px] text-zinc-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-400/10 transition-all active:scale-[0.98]"
                >
                  <div className="p-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                    <LogOut size={18} className="shrink-0" />
                  </div>
                  <span className="font-bold">Sign Out</span>
                </button>
                <div className="px-5 flex flex-col gap-1">
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] font-mono font-bold text-zinc-700 tracking-widest uppercase">{"// keep shipping"}</p>
                    <span className="text-[10px] font-mono text-zinc-800">v2.4.0</span>
                  </div>
                  <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-tight">© 2026 Hen Heang Developer</p>
                </div>
              </div>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );

  return (
    <div className="lg:hidden">
      <button
        onClick={() => setOpen(true)}
        aria-label="Open menu"
        className="p-2.5 rounded-2xl text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-100 hover:bg-zinc-100/60 dark:hover:bg-zinc-800/60 transition-all border border-transparent active:border-zinc-200 dark:active:border-zinc-700 active:scale-90"
      >
        <Menu size={24} />
      </button>

      {typeof document !== "undefined" && createPortal(drawer, document.body)}
    </div>
  );
}
