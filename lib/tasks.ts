export interface Task {
  id: number;
  user_id: string;
  title: string;
  description?: string | null;
  status: 'todo' | 'in_progress' | 'in_review' | 'done';
  category?: string | null;
  tags?: string[] | null;
  progress: number;
  due_date?: string | null;
  assignees?: string[] | null;
  created_at: string;
  updated_at: string;
}

export async function getTasks(status?: string): Promise<Task[]> {
  const url = status ? `/api/tasks?status=${status}` : '/api/tasks';
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Failed to fetch tasks');
  }
  const data = await response.json();
  return data.tasks || [];
}

export async function getTask(id: number): Promise<Task> {
  const response = await fetch(`/api/tasks/${id}`);
  if (!response.ok) {
    throw new Error('Failed to fetch task');
  }
  const data = await response.json();
  return data.task;
}

export async function createTask(task: {
  title: string;
  description?: string;
  status?: 'todo' | 'in_progress' | 'in_review' | 'done';
  category?: string;
  tags?: string[];
  progress?: number;
  due_date?: string;
  assignees?: string[];
}): Promise<Task> {
  const response = await fetch('/api/tasks', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(task),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to create task');
  }
  const data = await response.json();
  return data.task;
}

export async function updateTask(
  id: number,
  updates: Partial<Task>
): Promise<Task> {
  const response = await fetch(`/api/tasks/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(updates),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to update task');
  }
  const data = await response.json();
  return data.task;
}

export async function deleteTask(id: number): Promise<void> {
  const response = await fetch(`/api/tasks/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to delete task');
  }
}

