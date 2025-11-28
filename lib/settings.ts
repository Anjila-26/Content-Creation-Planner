export interface UserSettings {
  id?: number;
  user_id: string;
  gemini_api_key?: string | null;
  created_at?: string;
  updated_at?: string;
}

export async function getSettings(): Promise<UserSettings> {
  const response = await fetch('/api/settings');
  if (!response.ok) {
    throw new Error('Failed to fetch settings');
  }
  const data = await response.json();
  return data.settings;
}

export async function updateSettings(settings: {
  gemini_api_key?: string | null;
}): Promise<UserSettings> {
  const response = await fetch('/api/settings', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(settings),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to update settings');
  }
  const data = await response.json();
  return data.settings;
}

