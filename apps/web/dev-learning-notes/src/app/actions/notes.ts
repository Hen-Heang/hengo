"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { saveNote, deleteNote, NoteMeta } from "@/lib/notes";

export async function createNoteAction(formData: FormData) {
  const title = formData.get("title") as string;
  const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

  if (!slug) return;

  const newNote: Partial<NoteMeta> = {
    title,
    description: "New learning note",
    icon: "common",
  };

  await saveNote(slug, "# " + title + "\n\nStart writing...", newNote);

  revalidatePath("/");
  revalidatePath("/notes/[slug]", "layout");
  redirect(`/notes/${slug}?edit=true`);
}

export async function updateNoteAction(slug: string, content: string, meta: Partial<NoteMeta>) {
  await saveNote(slug, content, meta);
  revalidatePath("/");
  revalidatePath(`/notes/${slug}`);
  return { success: true };
}

export async function deleteNoteAction(slug: string) {
  await deleteNote(slug);
  revalidatePath("/");
  revalidatePath("/notes/[slug]", "layout");
  redirect("/");
}
