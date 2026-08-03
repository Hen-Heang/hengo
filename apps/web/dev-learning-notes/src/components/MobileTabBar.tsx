"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "motion/react";
import { LayoutGrid, Map, ListTodo, Settings } from "lucide-react";
import { cn } from "@/lib/cn";

export function MobileTabBar() {
  const pathname = usePathname();

  const tabs = [
    {
      label: "Home",
      href: "/",
      icon: LayoutGrid,
      active: pathname === "/",
      activeColor: "text-emerald-500",
      activeBg: "bg-emerald-500/10",
    },
    {
      label: "Roadmap",
      href: "/roadmap",
      icon: Map,
      active: pathname === "/roadmap",
      activeColor: "text-amber-500",
      activeBg: "bg-amber-500/10",
    },
    {
      label: "Tasks",
      href: "/todos",
      icon: ListTodo,
      active: pathname === "/todos",
      activeColor: "text-indigo-500",
      activeBg: "bg-indigo-500/10",
    },
    {
      label: "Owner",
      href: "/admin",
      icon: Settings,
      active: pathname === "/admin",
      activeColor: "text-zinc-500 dark:text-zinc-300",
      activeBg: "bg-zinc-500/10",
    },
  ];

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50">
      {/* iOS Style Glassmorphism Background */}
      <div className="bg-white/80 dark:bg-zinc-950/85 backdrop-blur-2xl border-t border-zinc-200/50 dark:border-zinc-800/50 shadow-[0_-1px_10px_rgba(0,0,0,0.05)] pb-safe">
        <div className="max-w-screen-xl mx-auto flex items-center justify-around px-2 pt-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <Link 
                key={tab.href} 
                href={tab.href} 
                className="relative flex-1 group"
              >
                <div className="flex flex-col items-center justify-center py-1.5 gap-1 relative z-10 h-full">
                  <div className={cn(
                    "p-1.5 rounded-2xl transition-all duration-300 relative overflow-hidden",
                    tab.active ? "scale-105" : "group-active:scale-95"
                  )}>
                    {tab.active && (
                      <motion.div 
                        layoutId="tabGlow"
                        className={cn("absolute inset-0", tab.activeBg)}
                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                      />
                    )}
                    <motion.div
                      animate={tab.active ? { scale: [1, 1.2, 1] } : {}}
                      transition={{ duration: 0.3 }}
                      className="relative z-10"
                    >
                      <Icon 
                        size={24} 
                        strokeWidth={tab.active ? 2.5 : 2}
                        className={cn(
                          "transition-colors duration-300",
                          tab.active ? tab.activeColor : "text-zinc-400 dark:text-zinc-500"
                        )} 
                      />
                    </motion.div>
                  </div>
                  <span className={cn(
                    "text-[10px] font-bold tracking-tight transition-colors duration-300",
                    tab.active ? tab.activeColor : "text-zinc-400 dark:text-zinc-500"
                  )}>
                    {tab.label}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
