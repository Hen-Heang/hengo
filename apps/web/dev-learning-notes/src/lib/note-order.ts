"use client";

const ORDER_KEY = "sidebar_note_order";
const ORDER_EVENT = "sidebar-note-order-change";
const EMPTY_ORDER: string[] = [];

// Cache the last raw string + parsed result so getStoredNoteOrder returns
// a stable reference when nothing has changed — required by useSyncExternalStore.
let _lastRaw: string | null = undefined as unknown as string | null;
let _lastParsed: string[] = EMPTY_ORDER;

function readStoredOrder(): string[] {
  if (typeof window === "undefined") return EMPTY_ORDER;

  try {
    const raw = window.localStorage.getItem(ORDER_KEY);
    if (raw === _lastRaw) return _lastParsed; // same string → same reference
    _lastRaw = raw;
    _lastParsed = raw ? (JSON.parse(raw) as string[]) : EMPTY_ORDER;
    return _lastParsed;
  } catch {
    return EMPTY_ORDER;
  }
}

export function getStoredNoteOrder() {
  return readStoredOrder();
}

export function getEmptyNoteOrder() {
  return EMPTY_ORDER;
}

export function saveStoredNoteOrder(slugs: string[]) {
  if (typeof window === "undefined") return;

  const raw = JSON.stringify(slugs);
  window.localStorage.setItem(ORDER_KEY, raw);
  // Bust the cache so the next getStoredNoteOrder call re-parses
  _lastRaw = undefined as unknown as string | null;
  window.dispatchEvent(new Event(ORDER_EVENT));
}

export function subscribeToNoteOrder(onChange: () => void) {
  if (typeof window === "undefined") {
    return () => {};
  }

  const handleStorage = (event: StorageEvent) => {
    if (!event.key || event.key === ORDER_KEY) {
      onChange();
    }
  };

  window.addEventListener("storage", handleStorage);
  window.addEventListener(ORDER_EVENT, onChange);

  return () => {
    window.removeEventListener("storage", handleStorage);
    window.removeEventListener(ORDER_EVENT, onChange);
  };
}

export function orderNotes<T extends { slug: string }>(notes: T[], savedSlugs: string[]) {
  if (savedSlugs.length === 0) {
    return notes;
  }

  const slugMap = new Map(notes.map((note) => [note.slug, note]));
  const ordered = savedSlugs
    .filter((slug) => slugMap.has(slug))
    .map((slug) => slugMap.get(slug)!);
  const newNotes = notes.filter((note) => !savedSlugs.includes(note.slug));

  return [...ordered, ...newNotes];
}

export { ORDER_KEY };
