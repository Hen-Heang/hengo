"use client";

import { useEffect, useRef } from "react";
import type { Todo } from "@/types/todos";

// Tracks which todo IDs have already fired this session
// (prevents duplicate alerts when the interval ticks again)
const fired = new Set<string>();

export function useNotifications(todos: Todo[]) {
  const todosRef = useRef(todos);
  todosRef.current = todos;

  useEffect(() => {
    // Request permission once when the hook mounts
    if (typeof Notification !== "undefined" && Notification.permission === "default") {
      Notification.requestPermission();
    }

    function check() {
      if (typeof Notification === "undefined") return;
      if (Notification.permission !== "granted") return;

      const now = Date.now();

      for (const todo of todosRef.current) {
        if (!todo.notify)        continue; // notification not enabled
        if (todo.is_completed)   continue; // already done
        if (!todo.due_date)      continue; // no date set
        if (fired.has(todo.id))  continue; // already fired this session

        // Build the due datetime — fall back to start-of-day if no time set
        const dueAt = new Date(
          todo.due_time
            ? `${todo.due_date}T${todo.due_time}:00`
            : `${todo.due_date}T00:00:00`
        ).getTime();

        // Fire if due time is within the last 60 seconds (catches the current tick)
        const diff = now - dueAt;
        if (diff >= 0 && diff < 60_000) {
          fired.add(todo.id);

          const n = new Notification(todo.title, {
            body: todo.notes
              ? todo.notes.slice(0, 100)
              : todo.due_time
                ? `Due at ${todo.due_time}`
                : "Task is due today",
            icon: "/favicon.ico",
            tag:  todo.id,   // prevents duplicate OS-level notifications
          });

          // Clicking the notification focuses the app window
          n.onclick = () => { window.focus(); n.close(); };
        }
      }
    }

    // Check immediately on mount (in case user opens app after due time)
    check();

    const timer = setInterval(check, 60_000);
    return () => clearInterval(timer);
  }, []); // runs once — reads todos via ref so no stale closure
}
