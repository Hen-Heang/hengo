"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "motion/react";
import {
  Settings,
  LayoutGrid,
  NotebookPen,
  PlusSquare,
  Plus,
  Loader2,
  Map,
  LogOut,
  CheckSquare,
} from "lucide-react";
import { useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { cn } from "@/lib/cn";
import { BrandLockup } from "@/components/BrandLockup";
import { ThemeToggle } from "@/components/ThemeToggle";
import { createNoteAction } from "@/app/actions/notes";
import type { NavItem } from "@/components/SortableNoteList";

// Load dnd-kit only on client — prevents Turbopack SSR chunk errors
const SortableNoteList = dynamic(
  () => import("@/components/SortableNoteList").then((m) => m.SortableNoteList),
  { ssr: false }
);

interface SidebarProps {
  notes: NavItem[];
}

function CreateNoteButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="p-1.5 rounded-md hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-500 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors disabled:opacity-50"
    >
      {pending ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />}
    </button>
  );
}

export function Sidebar({ notes }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleSignOut() {
    const { createClient } = await import("@/lib/supabase/client");
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <aside className="hidden lg:flex flex-col w-64 shrink-0 border-r border-zinc-200/60 dark:border-zinc-800/60 bg-white dark:bg-zinc-950 h-screen sticky top-0">
      <div className="px-5 py-5 border-b border-zinc-200/60 dark:border-zinc-800/60 flex items-center justify-between">
        <BrandLockup />
        <ThemeToggle />
      </div>

      <div className="flex-1 overflow-y-auto px-4 space-y-8 py-5">
        <div>
          <h3 className="px-3 mb-3 text-[10px] font-bold text-zinc-400 dark:text-zinc-600 uppercase tracking-[0.2em]">
            Overview
          </h3>
          <div className="space-y-1">
            <Link href="/">
              <div
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-all duration-200",
                  pathname === "/"
                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shadow-[0_0_20px_-10px_rgba(16,185,129,0.3)]"
                    : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-100/50 dark:hover:bg-zinc-900/50"
                )}
              >
                <LayoutGrid size={18} />
                <span className="font-medium">Dashboard</span>
              </div>
            </Link>
            <Link href="/roadmap">
              <div
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-all duration-200",
                  pathname === "/roadmap"
                    ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 shadow-[0_0_20px_-10px_rgba(245,158,11,0.3)]"
                    : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-100/50 dark:hover:bg-zinc-900/50"
                )}
              >
                <Map size={18} />
                <span className="font-medium">RoadMap</span>
              </div>
            </Link>
            <Link href="/todos">
              <div
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-all duration-200",
                  pathname === "/todos"
                    ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 shadow-[0_0_20px_-10px_rgba(59,130,246,0.3)]"
                    : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-100/50 dark:hover:bg-zinc-900/50"
                )}
              >
                <CheckSquare size={18} />
                <span className="font-medium">Reminders</span>
              </div>
            </Link>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between px-3 mb-3">
            <h3 className="text-[10px] font-bold text-zinc-400 dark:text-zinc-600 uppercase tracking-[0.2em]">
              Knowledge Base
            </h3>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono text-zinc-500 dark:text-zinc-700 bg-zinc-100/50 dark:bg-zinc-900/50 px-1.5 py-0.5 rounded border border-zinc-200/50 dark:border-zinc-800/50">
                {notes.length}
              </span>
              <form action={createNoteAction}>
                <input type="hidden" name="title" value={`New Note ${notes.length + 1}`} />
                <CreateNoteButton />
              </form>
            </div>
          </div>

          <SortableNoteList notes={notes} />
        </div>

        <div>
          <h3 className="px-3 mb-3 text-[10px] font-bold text-zinc-400 dark:text-zinc-600 uppercase tracking-[0.2em]">
            Workspace
          </h3>

          <Link href="/#workspace">
            <div className="rounded-2xl border border-emerald-500/20 bg-linear-to-br from-emerald-500/12 to-transparent px-4 py-4 text-zinc-700 dark:text-zinc-200 transition-all duration-200 hover:border-emerald-500/30 hover:bg-emerald-500/10">
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-2 text-emerald-600 dark:text-emerald-400">
                    <NotebookPen size={16} />
                  </div>
                  <span className="text-sm font-semibold">Quick Notes</span>
                </div>
                <PlusSquare size={16} className="text-emerald-500/80 dark:text-emerald-400/80" />
              </div>
              <p className="text-xs leading-5 text-zinc-500">
                Add, edit, pin, and delete personal notes without touching the markdown docs.
              </p>
            </div>
          </Link>
        </div>
      </div>

      <div className="px-3 py-4 border-t border-zinc-200/60 dark:border-zinc-800/60 space-y-1">
        <Link href="/admin">
          <motion.div
            whileHover={{ x: 3 }}
            transition={{ duration: 0.15 }}
            className="flex items-center gap-2.5 px-3 py-2 rounded-md text-sm text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-100/40 dark:hover:bg-zinc-800/40 transition-all duration-150"
          >
            <Settings size={15} className="shrink-0" />
            <span className="font-medium">Owner Panel</span>
          </motion.div>
        </Link>
        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-sm text-zinc-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-400/10 transition-all duration-150"
        >
          <LogOut size={15} className="shrink-0" />
          <span className="font-medium">Sign Out</span>
        </button>
        <div className="px-3 pt-2">
          <p className="text-[10px] font-mono text-zinc-400 dark:text-zinc-700 uppercase tracking-wider">{"// keep shipping"}</p>
          <p className="text-[10px] font-bold text-zinc-500/80 mt-1 uppercase tracking-tight">© 2026 Hen Heang Developer</p>
        </div>
      </div>
    </aside>
  );
}
