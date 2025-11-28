export interface Note {
  id: number;
  user_id: string;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export async function getNotes(): Promise<Note[]> {
  const response = await fetch('/api/notes');
  if (!response.ok) {
    throw new Error('Failed to fetch notes');
  }
  const data = await response.json();
  return data.notes || [];
}

export async function getNote(id: number): Promise<Note> {
  const response = await fetch(`/api/notes/${id}`);
  if (!response.ok) {
    throw new Error('Failed to fetch note');
  }
  const data = await response.json();
  return data.note;
}

export async function createNote(note: {
  title?: string;
  content?: string;
}): Promise<Note> {
  const response = await fetch('/api/notes', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      title: note.title || 'Untitled Note',
      content: note.content || '',
    }),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to create note');
  }
  const data = await response.json();
  return data.note;
}

export async function updateNote(
  id: number,
  updates: Partial<Note>
): Promise<Note> {
  const response = await fetch(`/api/notes/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(updates),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to update note');
  }
  const data = await response.json();
  return data.note;
}

export async function deleteNote(id: number): Promise<void> {
  const response = await fetch(`/api/notes/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to delete note');
  }
}

