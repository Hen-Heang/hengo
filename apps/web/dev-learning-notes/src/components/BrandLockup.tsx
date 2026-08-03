"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { cn } from "@/lib/cn";
import { Sparkles } from "lucide-react";

interface BrandLockupProps {
  compact?: boolean;
  className?: string;
}

export function BrandLockup({ compact = false, className }: BrandLockupProps) {
  return (
    <Link href="/" className={cn("group block relative", className)}>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          "relative overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950/50 backdrop-blur-xl transition-all duration-500 group-hover:border-emerald-500/30 group-hover:bg-zinc-900/40",
          compact ? "px-4 py-3" : "px-5 py-4"
        )}
      >
        {/* Animated Background Gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
        
        <div className="flex items-center gap-3.5 relative z-10">
          {/* Logo Icon with Blinking Cursor */}
          <div className="relative">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-emerald-500/20 bg-zinc-900 shadow-inner transition-all duration-500 group-hover:scale-105 group-hover:border-emerald-500/40 group-hover:shadow-[0_0_20px_rgba(16,185,129,0.2)]">
              <div className="flex items-center gap-0.5">
                <span className="text-[13px] font-mono font-black text-emerald-400 tracking-tighter">DEV</span>
                <motion.div
                  animate={{ opacity: [1, 0, 1] }}
                  transition={{ duration: 0.8, repeat: Infinity, ease: "easeInOut" }}
                  className="w-1.5 h-3.5 bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]"
                />
              </div>
            </div>
            
            {/* Subtle floating element */}
            <motion.div 
              animate={{ y: [0, -4, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -top-1 -right-1"
            >
              <Sparkles size={10} className="text-emerald-500/40" />
            </motion.div>
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <div className="flex items-baseline">
                <span className="text-[18px] font-black tracking-tight text-white transition-all duration-300 group-hover:text-emerald-500">
                  NOTES
                </span>
                <span className="text-[18px] font-light tracking-tighter text-zinc-600">.</span>
              </div>
              
              {!compact && (
                <div className="px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">
                  <span className="text-[9px] font-black font-mono text-emerald-500 tracking-widest leading-none">2026</span>
                </div>
              )}
            </div>
            
            <div className="flex items-center gap-2 mt-0.5">
              <div className="h-px w-3 bg-zinc-800 group-hover:w-5 group-hover:bg-emerald-500/50 transition-all duration-500" />
              <p className="truncate font-mono text-[9px] font-bold uppercase tracking-[0.25em] text-zinc-500 group-hover:text-zinc-400 transition-colors">
                Enterprise Stack
              </p>
            </div>
          </div>
        </div>
      </motion.div>
      
      {/* Outer glow effect on hover */}
      <div className="absolute inset-0 -z-10 bg-emerald-500/10 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
    </Link>
  );
}
