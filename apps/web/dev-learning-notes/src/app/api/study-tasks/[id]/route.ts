import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";

// PATCH /api/study-tasks/:id - admin only
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const updates: Record<string, unknown> = {};

    for (const key of ["title", "phase", "category", "notes", "status", "sort_order"]) {
      if (key in body) {
        updates[key] = body[key];
      }
    }

    const db = createServerClient();
    const { data, error } = await db
      .from("study_tasks")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unexpected server error." },
      { status: 500 }
    );
  }
}

// DELETE /api/study-tasks/:id - admin only
export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const db = createServerClient();
    const { error } = await db.from("study_tasks").delete().eq("id", id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unexpected server error." },
      { status: 500 }
    );
  }
}
