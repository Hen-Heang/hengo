import fs from "fs";
import path from "path";
import matter from "gray-matter";
import type { SupabaseClient } from "@supabase/supabase-js";
import { supabase } from "./supabase";

export interface NoteMeta {
  id?: string;
  slug: string;
  title: string;
  description: string;
  icon: string;
  category?: string;
  tags?: string[];
}

const NOTES_DIR = path.join(process.cwd(), "notes");

const META: Record<string, { description: string; icon: string }> = {
  java: { description: "OOP, Collections, Streams, Lambda, Lombok", icon: "java" },
  springboot: { description: "IoC/DI, MVC, REST API, Transactions", icon: "springboot" },
  mybatis: { description: "Dynamic SQL, XML Mapper, Logging", icon: "mybatis" },
  sql: { description: "SELECT, JOIN, Aggregates, Pagination", icon: "sql" },
  "jsp-jstl": { description: "Templates, Tags, Formatting", icon: "jsp-jstl" },
  jquery: { description: "DOM, AJAX patterns, Form handling", icon: "jquery" },
  projects: { description: "Full-stack project references", icon: "projects" },
  roadmap: { description: "Step-by-step Korea adaptation study plan", icon: "roadmap" },
  "egov-sample": { description: "eGovFramework 기반 화면 개발 전체 흐름 가이드", icon: "egov-sample" },
};

function formatTitle(slug: string): string {
  const map: Record<string, string> = {
    java: "Java Core",
    springboot: "Spring Boot",
    mybatis: "MyBatis",
    sql: "SQL Fundamentals",
    "jsp-jstl": "JSP & JSTL",
    jquery: "jQuery & AJAX",
    projects: "Projects",
    roadmap: "Korea Adaptation Roadmap",
    "egov-sample": "화면 개발 샘플 가이드",
  };
  return map[slug] ?? slug.charAt(0).toUpperCase() + slug.slice(1);
}

function normalizeTags(tags: unknown): string[] {
  return Array.isArray(tags) ? tags.filter((tag): tag is string => typeof tag === "string") : [];
}

function iconFromRow(row: { slug?: string | null; tags?: string[] | null; category?: string | null }) {
  if (row.tags?.[0]) return row.tags[0];
  if (row.slug && META[row.slug]) return META[row.slug].icon;
  return row.category ?? "common";
}

function readFileNote(
  slug: string
): { content: string; title: string; icon: string; description: string } {
  const filePath = path.join(NOTES_DIR, slug, "README.md");
  const raw = fs.readFileSync(filePath, "utf-8");
  const { content, data } = matter(raw);
  const meta = META[slug] ?? { description: "", icon: "common" };

  return {
    content,
    title: (data.title as string) ?? formatTitle(slug),
    description: (data.description as string) ?? meta.description,
    icon: (data.icon as string) ?? meta.icon,
  };
}

export function getAllNotesSync(): NoteMeta[] {
  try {
    if (!fs.existsSync(NOTES_DIR)) return [];
  } catch {
    return [];
  }
  const dirs = fs.readdirSync(NOTES_DIR).filter((dirName) => {
    const full = path.join(NOTES_DIR, dirName);
    return fs.statSync(full).isDirectory() && fs.existsSync(path.join(full, "README.md"));
  });

  return dirs.map((slug) => {
    const filePath = path.join(NOTES_DIR, slug, "README.md");
    const raw = fs.readFileSync(filePath, "utf-8");
    const { data } = matter(raw);
    const meta = META[slug] ?? { description: "", icon: "common" };

    return {
      slug,
      title: (data.title as string) ?? formatTitle(slug),
      description: (data.description as string) ?? meta.description,
      icon: meta.icon,
      category: (data.category as string) ?? slug,
      tags: normalizeTags(data.tags),
    };
  });
}

// Pass the authenticated Supabase server client so RLS returns the user's notes.
// Falls back to filesystem-only if no client is provided or DB is unreachable.
export async function getAllNotes(client?: SupabaseClient): Promise<NoteMeta[]> {
  const fileNotes = getAllNotesSync();
  const db = client ?? supabase;

  try {
    const { data, error } = await db
      .from("notes")
      .select("id, slug, title, description, category, tags")
      .order("created_at", { ascending: true });

    if (error) throw new Error(error.message);
    if (!data || data.length === 0) return fileNotes;

    const merged = new Map<string, NoteMeta>();

    for (const row of data) {
      merged.set(row.slug, {
        id: row.id,
        slug: row.slug,
        title: row.title,
        description: row.description ?? "",
        icon: iconFromRow(row),
        category: row.category ?? undefined,
        tags: row.tags ?? [],
      });
    }

    for (const note of fileNotes) {
      if (!merged.has(note.slug)) {
        merged.set(note.slug, note);
      }
    }

    return Array.from(merged.values());
  } catch {
    return fileNotes;
  }
}

// Pass the authenticated Supabase server client so RLS allows reading the note.
export async function getNoteContent(
  slug: string,
  client?: SupabaseClient
): Promise<{ content: string; title: string; icon: string; description: string }> {
  const db = client ?? supabase;

  let fileNote: { content: string; title: string; icon: string; description: string } | null = null;
  try {
    fileNote = readFileNote(slug);
  } catch {
    fileNote = null;
  }

  try {
    const { data, error } = await db
      .from("notes")
      .select("title, description, category, tags, content")
      .eq("slug", slug)
      .single();

    if (error) throw new Error(error.message);
    if (!data) throw new Error(`Note not found: ${slug}`);

    const dbContent = data.content?.trim() ?? "";

    return {
      content: dbContent.length > 0 ? data.content : (fileNote?.content ?? ""),
      title: data.title || fileNote?.title || formatTitle(slug),
      description: data.description ?? fileNote?.description ?? "",
      icon: iconFromRow({ slug, tags: data.tags ?? [], category: data.category }) || fileNote?.icon || "common",
    };
  } catch {
    if (fileNote) return fileNote;
    throw new Error(`Note not found: ${slug}`);
  }
}

export async function saveNote(
  slug: string,
  content: string,
  meta: Partial<NoteMeta>,
  client?: SupabaseClient
): Promise<void> {
  const db = client ?? supabase;
  const existingTags = meta.tags ?? [];
  const nextTags = meta.icon
    ? [meta.icon, ...existingTags.filter((tag) => tag !== meta.icon)]
    : existingTags;

  const payload: Record<string, unknown> = {
    slug,
    content,
    title: meta.title,
    description: meta.description,
    category: meta.category,
    tags: nextTags.length > 0 ? nextTags : undefined,
  };

  const { error } = await db
    .from("notes")
    .upsert(payload, { onConflict: "slug" });

  if (error) throw new Error(error.message);
}

export async function deleteNote(slug: string, client?: SupabaseClient): Promise<void> {
  const db = client ?? supabase;
  const { error } = await db.from("notes").delete().eq("slug", slug);
  if (error) throw new Error(error.message);
}
