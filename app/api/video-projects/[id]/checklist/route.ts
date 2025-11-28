import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
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
      .from('video_checklist_items')
      .select('*')
      .eq('video_project_id', id)
      .eq('user_id', user.id)
      .order('category', { ascending: true })
      .order('display_order', { ascending: true })
      .order('created_at', { ascending: true });

    if (error) throw error;

    return NextResponse.json({ items: data || [] });
  } catch (error: any) {
    console.error('Error fetching checklist items:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch checklist items' }, { status: 500 });
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
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
    const { text, category, completed, display_order } = body;

    if (!text || !category) {
      return NextResponse.json({ error: 'text and category are required' }, { status: 400 });
    }

    // Check if item already exists (prevent duplicates)
    const { data: existingItem } = await supabase
      .from('video_checklist_items')
      .select('id')
      .eq('video_project_id', id)
      .eq('user_id', user.id)
      .eq('text', text.trim())
      .eq('category', category)
      .single();

    if (existingItem) {
      // Item already exists, return it
      const { data: item } = await supabase
        .from('video_checklist_items')
        .select('*')
        .eq('id', existingItem.id)
        .single();
      return NextResponse.json({ item }, { status: 200 });
    }

    // Get max display_order for this category
    const { data: existingItems } = await supabase
      .from('video_checklist_items')
      .select('display_order')
      .eq('video_project_id', id)
      .eq('category', category)
      .order('display_order', { ascending: false })
      .limit(1);

    const nextOrder = existingItems && existingItems.length > 0 
      ? (existingItems[0].display_order || 0) + 1 
      : 0;

    const { data, error } = await supabase
      .from('video_checklist_items')
      .insert({
        user_id: user.id,
        video_project_id: parseInt(id),
        text: text.trim(),
        category,
        completed: completed || false,
        display_order: display_order !== undefined ? display_order : nextOrder,
      })
      .select()
      .single();

    if (error) {
      // If unique constraint violation, try to return existing item
      if (error.code === '23505') {
        const { data: existing } = await supabase
          .from('video_checklist_items')
          .select('*')
          .eq('video_project_id', id)
          .eq('user_id', user.id)
          .eq('text', text.trim())
          .eq('category', category)
          .single();
        if (existing) {
          return NextResponse.json({ item: existing }, { status: 200 });
        }
      }
      throw error;
    }

    return NextResponse.json({ item: data }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating checklist item:', error);
    return NextResponse.json({ error: error.message || 'Failed to create checklist item' }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
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
    const { item_id, text, category, completed, display_order } = body;

    if (!item_id) {
      return NextResponse.json({ error: 'item_id is required' }, { status: 400 });
    }

    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    if (text !== undefined) updateData.text = text.trim();
    if (category !== undefined) updateData.category = category;
    if (completed !== undefined) updateData.completed = completed;
    if (display_order !== undefined) updateData.display_order = display_order;

    const { data, error } = await supabase
      .from('video_checklist_items')
      .update(updateData)
      .eq('id', item_id)
      .eq('video_project_id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) throw error;

    if (!data) {
      return NextResponse.json({ error: 'Checklist item not found' }, { status: 404 });
    }

    return NextResponse.json({ item: data });
  } catch (error: any) {
    console.error('Error updating checklist item:', error);
    return NextResponse.json({ error: error.message || 'Failed to update checklist item' }, { status: 500 });
  }
}

