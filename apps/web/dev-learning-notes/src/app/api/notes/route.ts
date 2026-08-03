import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getAllNotesSync } from "@/lib/notes";

// GET /api/notes — returns the current user's notes (RLS enforced)
export async function GET() {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("notes")
      .select("id, slug, title, description, category, tags, created_at, updated_at")
      .order("created_at", { ascending: true });

    if (error) throw error;
    return NextResponse.json(data);
  } catch {
    const fallbackNotes = getAllNotesSync().map((note) => ({
      id: note.slug,
      slug: note.slug,
      title: note.title,
      description: note.description,
      category: note.category ?? "",
      tags: note.tags ?? [],
      created_at: "",
      updated_at: "",
    }));

    return NextResponse.json(fallbackNotes, {
      headers: { "x-notes-source": "filesystem-fallback" },
    });
  }
}

// POST /api/notes — creates a note owned by the current user
export async function POST(req: Request) {
  try {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { slug, title, description, category, content, tags } = body;

    if (!slug || !title || !content) {
      return NextResponse.json(
        { error: "slug, title, and content are required" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("notes")
      .insert({
        slug,
        title,
        description,
        category,
        content,
        tags: tags ?? [],
        user_id: user.id,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    revalidatePath("/");
    revalidatePath(`/notes/${slug}`);

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    const message =
      error instanceof Error && error.message.includes("fetch failed")
        ? "Supabase connection failed."
        : error instanceof Error
          ? error.message
          : "Unexpected server error.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
