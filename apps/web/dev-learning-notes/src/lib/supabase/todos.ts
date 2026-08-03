import type { SupabaseClient } from '@supabase/supabase-js';
import type { Todo, TodoList } from '@/types/todos';

// ── Lists ─────────────────────────────────────────────────────────────────────

export async function getLists(db: SupabaseClient): Promise<TodoList[]> {
  const { data, error } = await db
    .from('lists')
    .select('*')
    .order('position', { ascending: true });
  if (error) throw error;
  return (data ?? []) as TodoList[];
}

export async function createList(
  db: SupabaseClient,
  payload: Pick<TodoList, 'user_id' | 'name' | 'color' | 'icon' | 'position'>
): Promise<TodoList> {
  const { data, error } = await db.from('lists').insert(payload).select().single();
  if (error) throw error;
  return data as TodoList;
}

export async function updateList(
  db: SupabaseClient,
  id: string,
  patch: Partial<Pick<TodoList, 'name' | 'color' | 'icon' | 'position'>>
): Promise<TodoList> {
  const { data, error } = await db.from('lists').update(patch).eq('id', id).select().single();
  if (error) throw error;
  return data as TodoList;
}

export async function deleteList(db: SupabaseClient, id: string): Promise<void> {
  const { error } = await db.from('lists').delete().eq('id', id);
  if (error) throw error;
}

// ── Todos ─────────────────────────────────────────────────────────────────────

export async function getTodos(db: SupabaseClient): Promise<Todo[]> {
  const { data, error } = await db
    .from('todos')
    .select('*')
    .order('position', { ascending: true })
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data ?? []) as Todo[];
}

export async function createTodo(
  db: SupabaseClient,
  payload: {
    user_id: string;
    list_id: string | null;
    title: string;
    notes?: string | null;
    due_date?: string | null;
    due_time?: string | null;
    priority?: string;
    position?: number;
  }
): Promise<Todo> {
  const { data, error } = await db.from('todos').insert(payload).select().single();
  if (error) throw error;
  return data as Todo;
}

export async function updateTodo(
  db: SupabaseClient,
  id: string,
  patch: Partial<
    Pick<
      Todo,
      | 'title' | 'notes' | 'due_date' | 'due_time' | 'priority'
      | 'notify' | 'is_completed' | 'completed_at' | 'list_id' | 'position'
    >
  >
): Promise<Todo> {
  const { data, error } = await db.from('todos').update(patch).eq('id', id).select().single();
  if (error) throw error;
  return data as Todo;
}

export async function deleteTodo(db: SupabaseClient, id: string): Promise<void> {
  const { error } = await db.from('todos').delete().eq('id', id);
  if (error) throw error;
}
