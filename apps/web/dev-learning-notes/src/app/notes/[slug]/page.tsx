import { getNoteContent } from "@/lib/notes";
import { createClient } from "@/lib/supabase/server";
import { renderMarkdown } from "@/lib/highlight";
import { notFound, redirect } from "next/navigation";
import { NoteView } from "@/components/NoteView";

export const dynamic = "force-dynamic";

const NOTE_ALIASES: Record<string, string> = {
  html: "jsp-jstl",
};

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const resolvedSlug = NOTE_ALIASES[slug] ?? slug;

  try {
    const supabase = await createClient();
    const { title } = await getNoteContent(resolvedSlug, supabase);
    return { title: `${title} — Dev Notes` };
  } catch {
    return { title: "Not Found" };
  }
}

export default async function NotePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const resolvedSlug = NOTE_ALIASES[slug] ?? slug;

  if (resolvedSlug !== slug) {
    redirect(`/notes/${resolvedSlug}`);
  }

  let note;
  try {
    const supabase = await createClient();
    note = await getNoteContent(resolvedSlug, supabase);
  } catch {
    notFound();
  }

  const html = await renderMarkdown(note.content);

  return <NoteView slug={resolvedSlug} note={note} html={html} />;
}
