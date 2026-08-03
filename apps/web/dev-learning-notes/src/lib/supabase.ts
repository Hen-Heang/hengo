import { createClient, type SupabaseClient } from "@supabase/supabase-js";

type TypedClient = SupabaseClient;

let browserClient: TypedClient | null = null;
let adminClient: TypedClient | null = null;

function getEnv(name: string) {
  return process.env[name];
}

function createBrowserClient(): TypedClient {
  const url = getEnv("NEXT_PUBLIC_SUPABASE_URL");
  const anonKey = getEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY");

  if (!url || !anonKey) {
    throw new Error("Supabase public env vars are not configured");
  }

  return createClient(url, anonKey);
}

function createAdminClient(): TypedClient {
  const url = getEnv("NEXT_PUBLIC_SUPABASE_URL");
  const serviceKey =
    getEnv("SUPABASE_SERVICE_ROLE_KEY") ?? getEnv("SUPABASE_SECRET_KEY");
  const anonKey = getEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY");

  if (!url || (!serviceKey && !anonKey)) {
    throw new Error("Supabase server env vars are not configured");
  }

  return createClient(url, serviceKey || anonKey!);
}

function getBrowserClient(): TypedClient {
  if (!browserClient) {
    browserClient = createBrowserClient();
  }

  return browserClient;
}

function getAdminClient(): TypedClient {
  if (!adminClient) {
    adminClient = createAdminClient();
  }

  return adminClient;
}

export const supabase = new Proxy({} as TypedClient, {
  get(_, prop) {
    return getBrowserClient()[prop as keyof TypedClient];
  },
});

export const supabaseAdmin = new Proxy({} as TypedClient, {
  get(_, prop) {
    return getAdminClient()[prop as keyof TypedClient];
  },
});

export function createServerClient(): TypedClient {
  return createAdminClient();
}


export interface Note {
  id: string;
  slug: string;
  title: string;
  description: string;
  category: string;
  content: string;
  tags: string[];
  created_at: string;
  updated_at: string;
}

export interface StudyTask {
  id: string;
  title: string;
  phase: string;
  category: string;
  notes: string;
  status: "todo" | "doing" | "done";
  sort_order: number;
  created_at: string;
  updated_at: string;
}
