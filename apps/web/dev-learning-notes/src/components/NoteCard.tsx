"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { ArrowUpRight } from "lucide-react";
import { TechIcon, getTechColor } from "@/components/TechIcon";

interface NoteCardProps {
  slug: string;
  title: string;
  description: string;
  icon: string;
  index: number;
}

export function NoteCard({ slug, title, description, icon, index }: NoteCardProps) {
  const accentColor = getTechColor(icon || slug);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        type: "spring",
        stiffness: 260,
        damping: 20,
        delay: index * 0.05,
      }}
      whileHover={{ y: -6 }}
      className="h-full"
    >
      <Link href={`/notes/${slug}`} className="block h-full group">
        <div className="relative h-full border border-zinc-200/60 dark:border-zinc-800/60 rounded-[2rem] p-7 sm:p-8 bg-zinc-50/40 dark:bg-zinc-900/40 backdrop-blur-xl hover:bg-zinc-100/50 dark:hover:bg-zinc-800/50 hover:border-emerald-500/30 transition-all duration-500 overflow-hidden flex flex-col shadow-lg dark:shadow-2xl">
          {/* Accent glow line at top */}
          <div
            className="absolute inset-x-0 top-0 h-px opacity-0 group-hover:opacity-100 transition-opacity duration-700"
            style={{ background: `linear-gradient(to right, transparent, ${accentColor}, transparent)` }}
          />

          {/* Background Glow */}
          <div
            className="absolute -right-4 -top-4 w-24 h-24 blur-[50px] rounded-full opacity-0 group-hover:opacity-20 transition-opacity duration-700"
            style={{ backgroundColor: accentColor }}
          />

          <div className="relative flex items-center gap-5 mb-6">
            <div className="w-14 h-14 rounded-2xl bg-zinc-100 dark:bg-zinc-950 border border-zinc-200/80 dark:border-zinc-800/80 flex items-center justify-center group-hover:scale-110 group-hover:border-emerald-500/40 transition-all duration-500 shadow-inner">
              <TechIcon name={icon} size={28} />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-lg sm:text-xl font-black text-zinc-800 dark:text-zinc-100 group-hover:text-zinc-950 dark:group-hover:text-white transition-colors leading-tight truncate tracking-tight">
                {title}
              </h2>
              <div className="flex items-center gap-2 mt-1.5">
                <span className="text-[11px] font-mono font-bold text-zinc-400 dark:text-zinc-600 uppercase tracking-widest">Module</span>
                <div className="w-1 h-1 rounded-full bg-zinc-300 dark:bg-zinc-800" />
                <span className="text-[11px] font-mono text-emerald-500/70 font-bold">/{slug}</span>
              </div>
            </div>
          </div>

          <p className="relative text-[15px] sm:text-base text-zinc-500 dark:text-zinc-400 leading-relaxed line-clamp-3 mb-8 flex-1 font-medium">
            {description}
          </p>

          <div className="relative mt-auto pt-6 border-t border-zinc-200/60 dark:border-zinc-800/60 flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-[10px] font-mono font-black text-zinc-400 dark:text-zinc-700 uppercase tracking-tighter group-hover:text-zinc-600 dark:group-hover:text-zinc-500 transition-colors">
                Deployment Ready
              </span>
              <span className="text-xs font-mono font-bold text-zinc-400 dark:text-zinc-500">
                v2026.03
              </span>
            </div>

            <div className="flex items-center gap-2 text-sm font-black text-zinc-500 dark:text-zinc-400 group-hover:text-emerald-500 dark:group-hover:text-emerald-400 transition-all duration-300">
              <span>EXPLORE</span>
              <div className="p-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 group-hover:border-emerald-500/40 group-hover:bg-emerald-500/10 transition-all">
                <ArrowUpRight size={16} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform duration-300" />
              </div>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
