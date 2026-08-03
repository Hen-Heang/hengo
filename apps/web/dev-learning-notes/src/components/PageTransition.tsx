"use client";

import { motion } from "motion/react";

// Apple-style spring: fast, elastic, feels native
const SPRING = { type: "spring", stiffness: 380, damping: 30, mass: 0.8 } as const;

export function PageTransition({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12, scale: 0.995 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ ...SPRING, opacity: { duration: 0.2 } }}
    >
      {children}
    </motion.div>
  );
}
