"use client";

import { useEffect, useState } from "react";
import { motion, useSpring, useTransform } from "motion/react";

export function ReadingProgress() {
  const [started, setStarted] = useState(false);
  const spring = useSpring(0, { stiffness: 200, damping: 30 });
  const scaleX = useTransform(spring, [0, 100], [0, 1]);

  useEffect(() => {
    const update = () => {
      const el = document.documentElement;
      const total = el.scrollHeight - el.clientHeight;
      const pct = total > 0 ? (el.scrollTop / total) * 100 : 0;
      if (pct > 0) setStarted(true);
      spring.set(pct);
    };
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, [spring]);

  if (!started) return null;

  return (
    <motion.div
      className="fixed top-0 left-0 right-0 h-[2px] bg-emerald-400 z-50 origin-left"
      style={{ scaleX }}
    />
  );
}
