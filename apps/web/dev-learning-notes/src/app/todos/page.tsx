import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { TodosClient } from "./TodosClient";

export const metadata: Metadata = {
  title: "Reminders – Dev Notes",
};

export default async function TodosPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="h-full">
      <TodosClient userId={user.id} />
    </div>
  );
}
