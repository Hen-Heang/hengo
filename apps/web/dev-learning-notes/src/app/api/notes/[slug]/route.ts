import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

// GET /api/notes/:slug — RLS ensures only the owner can read
export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("notes")
    .select("*")
    .eq("slug", slug)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 404 });
  return NextResponse.json(data);
}

// PUT /api/notes/:slug — RLS ensures only the owner can update
export async function PUT(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;
    const supabase = await createClient();
    const body = await req.json();
    const { title, description, category, content, tags } = body;

    const { data, error } = await supabase
      .from("notes")
      .update({ title, description, category, content, tags })
      .eq("slug", slug)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    revalidatePath("/");
    revalidatePath(`/notes/${slug}`);

    return NextResponse.json(data);
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

// DELETE /api/notes/:slug — RLS ensures only the owner can delete
export async function DELETE(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;
    const supabase = await createClient();

    const { error } = await supabase.from("notes").delete().eq("slug", slug);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    revalidatePath("/");

    return NextResponse.json({ message: "Deleted successfully" });
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
