import type { SupabaseClient } from "@supabase/supabase-js";

export async function loadProgress(
  supabase: SupabaseClient,
  trackerKey: string
): Promise<string[]> {
  const { data, error } = await supabase
    .from("user_progress")
    .select("checked")
    .eq("tracker_key", trackerKey)
    .maybeSingle();

  if (error) throw error;
  return (data?.checked as string[]) ?? [];
}

export async function saveProgress(
  supabase: SupabaseClient,
  trackerKey: string,
  checked: string[]
): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return; // not logged in — skip remote save

  const { error } = await supabase
    .from("user_progress")
    .upsert(
      { user_id: user.id, tracker_key: trackerKey, checked },
      { onConflict: "user_id,tracker_key" }
    );

  if (error) throw error;
}
