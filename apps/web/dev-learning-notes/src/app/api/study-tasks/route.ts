import { NextResponse } from "next/server";
import { createServerClient, supabase } from "@/lib/supabase";
import { DEFAULT_STUDY_TASKS } from "@/lib/study-tasks";

// GET /api/study-tasks - public read, returns Supabase tasks or local defaults
export async function GET() {
  try {
    const { data, error } = await supabase
      .from("study_tasks")
      .select("id, title, phase, category, notes, status, sort_order, created_at, updated_at")
      .order("sort_order", { ascending: true });

    if (error) throw error;
    return NextResponse.json(data ?? []);
  } catch {
    const fallbackTasks = DEFAULT_STUDY_TASKS.map((task, index) => ({
      id: `local-${index + 1}`,
      ...task,
      created_at: "",
      updated_at: "",
    }));

    return NextResponse.json(fallbackTasks, {
      headers: {
        "x-study-tasks-source": "filesystem-fallback",
      },
    });
  }
}

// POST /api/study-tasks - admin only
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { title, phase, category, notes, status, sort_order } = body;

    if (!title || !phase || !category) {
      return NextResponse.json({ error: "title, phase, and category are required" }, { status: 400 });
    }

    const db = createServerClient();
    const { data, error } = await db
      .from("study_tasks")
      .insert({
        title,
        phase,
        category,
        notes: notes ?? "",
        status: status ?? "todo",
        sort_order: Number.isFinite(sort_order) ? sort_order : 999,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unexpected server error." },
      { status: 500 }
    );
  }
}
