export type Priority = 'none' | 'low' | 'medium' | 'high';

export interface TodoList {
  id: string;
  user_id: string;
  name: string;
  color: string;
  icon: string;
  position: number;
  created_at: string;
}

export interface TodoListWithCount extends TodoList {
  todo_count: number;
  completed_count: number;
}

export interface Todo {
  id: string;
  user_id: string;
  list_id: string | null;
  title: string;
  notes: string | null;
  due_date: string | null;
  due_time: string | null;
  priority: Priority;
  notify: boolean;
  is_completed: boolean;
  completed_at: string | null;
  position: number;
  created_at: string;
}

export type SmartListType = 'today' | 'scheduled' | 'all' | 'completed';

export type ActiveList =
  | { type: 'smart'; id: SmartListType }
  | { type: 'list'; id: string };
