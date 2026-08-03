"use server";

import { revalidatePath } from "next/cache";
import { supabaseAdmin } from "@/lib/supabase";

export type TaskStatus = "todo" | "doing" | "done";

export interface StudyTask {
  id: string;
  title: string;
  phase: string;
  category: string;
  notes: string;
  status: TaskStatus;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export async function getTasksAction(): Promise<StudyTask[]> {
  try {
    const { data, error } = await supabaseAdmin
      .from("study_tasks")
      .select("*")
      .order("sort_order")
      .order("created_at");

    if (error) throw new Error(error.message);
    return (data ?? []) as StudyTask[];
  } catch {
    return [];
  }
}

export async function createTaskAction(input: {
  title: string;
  phase: string;
  category: string;
  notes: string;
  status: TaskStatus;
  sort_order?: number;
}) {
  const { error } = await supabaseAdmin.from("study_tasks").insert({
    title: input.title,
    phase: input.phase,
    category: input.category,
    notes: input.notes,
    status: input.status,
    sort_order: input.sort_order ?? 999,
  });

  if (error) throw new Error(error.message);
  revalidatePath("/");
}

export async function updateTaskAction(
  id: string,
  patch: Partial<Pick<StudyTask, "title" | "phase" | "category" | "notes" | "status" | "sort_order">>
) {
  const { error } = await supabaseAdmin
    .from("study_tasks")
    .update(patch)
    .eq("id", id);

  if (error) throw new Error(error.message);
  revalidatePath("/");
}

export async function deleteTaskAction(id: string) {
  const { error } = await supabaseAdmin
    .from("study_tasks")
    .delete()
    .eq("id", id);

  if (error) throw new Error(error.message);
  revalidatePath("/");
}
