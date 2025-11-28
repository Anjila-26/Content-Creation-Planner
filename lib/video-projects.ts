export interface VideoProject {
  id: number;
  user_id: string;
  title: string;
  hook?: string | null;
  rough_sketch?: string | null;
  generated_concept?: string | null;
  status: 'ideation' | 'filming' | 'editing' | 'publishing' | 'completed';
  progress: number;
  notes?: string | null;
  production_date?: string | null;
  release_date?: string | null;
  created_at: string;
  updated_at: string;
}


export async function getVideoProjects(): Promise<VideoProject[]> {
  const response = await fetch('/api/video-projects');
  if (!response.ok) {
    throw new Error('Failed to fetch video projects');
  }
  const data = await response.json();
  return data.projects || [];
}

export async function getVideoProject(id: number): Promise<VideoProject> {
  const response = await fetch(`/api/video-projects/${id}`);
  if (!response.ok) {
    throw new Error('Failed to fetch video project');
  }
  const data = await response.json();
  return data.project;
}

export async function createVideoProject(project: {
  title: string;
  rough_sketch?: string;
  status?: 'ideation' | 'filming' | 'editing' | 'publishing' | 'completed';
  progress?: number;
  notes?: string;
  production_date?: string;
  release_date?: string;
}): Promise<VideoProject> {
  const response = await fetch('/api/video-projects', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(project),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to create video project');
  }
  const data = await response.json();
  return data.project;
}

export async function updateVideoProject(
  id: number,
  updates: Partial<VideoProject>
): Promise<VideoProject> {
  const response = await fetch(`/api/video-projects/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(updates),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to update video project');
  }
  const data = await response.json();
  return data.project;
}

export async function deleteVideoProject(id: number): Promise<void> {
  const response = await fetch(`/api/video-projects/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to delete video project');
  }
}


