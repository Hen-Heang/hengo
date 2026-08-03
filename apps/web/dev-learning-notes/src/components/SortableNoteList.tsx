"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "motion/react";
import { ChevronRight, GripVertical } from "lucide-react";
import { useMemo, useState, useSyncExternalStore } from "react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { cn } from "@/lib/cn";
import { TechIcon, getTechColor } from "@/components/TechIcon";
import { getEmptyNoteOrder, getStoredNoteOrder, orderNotes, saveStoredNoteOrder, subscribeToNoteOrder } from "@/lib/note-order";

export interface NavItem {
  slug: string;
  title: string;
  icon: string;
}

function SortableNoteItem({
  note,
  active,
  isDragging,
}: {
  note: NavItem;
  active: boolean;
  isDragging: boolean;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSelfDragging,
  } = useSortable({ id: note.slug });

  const color = getTechColor(note.icon || note.slug);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isSelfDragging ? 0.35 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="group relative">
      <div
        {...attributes}
        {...listeners}
        className="absolute left-0 top-1/2 -translate-y-1/2 z-10 flex items-center justify-center w-5 h-8 cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <GripVertical size={12} className="text-zinc-400 dark:text-zinc-600 hover:text-zinc-600 dark:hover:text-zinc-400" />
      </div>

      <Link href={`/notes/${note.slug}`} tabIndex={isDragging ? -1 : 0}>
        <motion.div
          whileHover={{ x: 3 }}
          transition={{ duration: 0.15 }}
          className={cn(
            "relative flex items-center gap-3 pl-5 pr-3 py-2.5 rounded-xl text-sm transition-all duration-200 border border-transparent",
            active
              ? "bg-zinc-100/80 dark:bg-zinc-900/80 text-zinc-800 dark:text-zinc-100 border-zinc-200 dark:border-zinc-800 shadow-sm"
              : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-100/50 dark:hover:bg-zinc-900/30"
          )}
        >
          <TechIcon
            name={note.icon}
            className={cn(
              "transition-transform duration-300 shrink-0",
              active
                ? "scale-110"
                : "group-hover:scale-110 opacity-70 group-hover:opacity-100"
            )}
            size={16}
          />
          <span className="truncate font-medium">{note.title}</span>

          {active ? (
            <motion.div
              layoutId="sidebar-active"
              className="ml-auto w-1.5 h-1.5 rounded-full shrink-0"
              style={{ backgroundColor: color }}
            />
          ) : (
            <ChevronRight
              size={14}
              className="ml-auto opacity-0 -translate-x-2 group-hover:opacity-40 group-hover:translate-x-0 transition-all duration-300 shrink-0"
            />
          )}
        </motion.div>
      </Link>
    </div>
  );
}

function DragOverlayItem({ note }: { note: NavItem }) {
  const color = getTechColor(note.icon || note.slug);
  return (
    <div className="flex items-center gap-3 pl-5 pr-3 py-2.5 rounded-xl text-sm bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 shadow-2xl text-zinc-800 dark:text-zinc-200 cursor-grabbing rotate-1 scale-105">
      <TechIcon name={note.icon} size={16} className="shrink-0 opacity-80" />
      <span className="truncate font-medium">{note.title}</span>
      <div className="ml-auto w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
    </div>
  );
}

export function SortableNoteList({ notes }: { notes: NavItem[] }) {
  const pathname = usePathname();
  const savedOrder = useSyncExternalStore(subscribeToNoteOrder, getStoredNoteOrder, getEmptyNoteOrder);
  const orderedNotes = useMemo(() => orderNotes(notes, savedOrder), [notes, savedOrder]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
    setIsDragging(true);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    setIsDragging(false);

    if (over && active.id !== over.id) {
      const oldIndex = orderedNotes.findIndex((note) => note.slug === active.id);
      const newIndex = orderedNotes.findIndex((note) => note.slug === over.id);
      const next = arrayMove(orderedNotes, oldIndex, newIndex);
      saveStoredNoteOrder(next.map((note) => note.slug));
    }
  };

  const activeNote = activeId ? orderedNotes.find((n) => n.slug === activeId) : null;

  // Show plain list until hydrated
  if (orderedNotes.length === 0) {
    return (
      <nav className="space-y-1">
        {notes.map((note) => {
          const active = pathname === `/notes/${note.slug}`;
          const color = getTechColor(note.icon || note.slug);
          return (
            <Link key={note.slug} href={`/notes/${note.slug}`}>
              <div
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-200 border border-transparent",
                  active
                    ? "bg-zinc-100/80 dark:bg-zinc-900/80 text-zinc-800 dark:text-zinc-100 border-zinc-200 dark:border-zinc-800 shadow-sm"
                    : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-100/50 dark:hover:bg-zinc-900/30"
                )}
              >
                <TechIcon name={note.icon} size={16} className="shrink-0" />
                <span className="truncate font-medium">{note.title}</span>
                {active && (
                  <div className="ml-auto w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
                )}
              </div>
            </Link>
          );
        })}
      </nav>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={orderedNotes.map((n) => n.slug)}
        strategy={verticalListSortingStrategy}
      >
        <nav className="space-y-1">
          {orderedNotes.map((note) => (
            <SortableNoteItem
              key={note.slug}
              note={note}
              active={pathname === `/notes/${note.slug}`}
              isDragging={isDragging}
            />
          ))}
        </nav>
      </SortableContext>

      <DragOverlay dropAnimation={{ duration: 180, easing: "ease" }}>
        {activeNote ? <DragOverlayItem note={activeNote} /> : null}
      </DragOverlay>
    </DndContext>
  );
}
