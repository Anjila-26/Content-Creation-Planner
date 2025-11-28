import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
        },
      }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data, error } = await supabase
      .from('video_projects')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ projects: data || [] });
  } catch (error: any) {
    console.error('Error fetching video projects:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch video projects' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
        },
      }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { title, hook, rough_sketch, status, progress, notes, production_date, release_date } = body;

    if (!title || !title.trim()) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('video_projects')
      .insert({
        user_id: user.id,
        title: title.trim(),
        hook: hook?.trim() || null,
        rough_sketch: rough_sketch?.trim() || null,
        status: status || 'ideation',
        progress: progress || 0,
        notes: notes || null,
        production_date: production_date || null,
        release_date: release_date || null,
      })
      .select()
      .single();

    if (error) throw error;

    // Return project immediately - concept generation will be triggered by frontend
    // This prevents blocking the response while waiting for AI generation
    return NextResponse.json({ project: data }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating video project:', error);
    return NextResponse.json({ error: error.message || 'Failed to create video project' }, { status: 500 });
  }
}

