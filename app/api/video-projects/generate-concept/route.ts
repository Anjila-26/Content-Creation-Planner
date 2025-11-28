import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

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
    const { video_project_id, title, hook, rough_sketch } = body;

    if (!video_project_id || !title) {
      return NextResponse.json({ error: 'video_project_id and title are required' }, { status: 400 });
    }

    // Fetch user's API key from settings
    const { data: userSettings, error: settingsError } = await supabase
      .from('user_settings')
      .select('gemini_api_key')
      .eq('user_id', user.id)
      .single();

    // Use user's API key if available, otherwise fall back to environment variable
    const apiKey = userSettings?.gemini_api_key || process.env.NEXT_PUBLIC_GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json({ 
        error: 'Gemini API key not configured. Please add your API key in Settings.' 
      }, { status: 500 });
    }

    // Generate concept using simple script format
    const conceptPrompt = `"You are a professional TikTok/Instagram content strategist and scriptwriter. "
         "Using the refined idea, return a complete short-form video script with this structure:\n\n"

         "[Hook – 3 sec]\n"
         "Style: (speaking / non-speaking / high-energy / slow-pace / time-lapse)\n"
         "Visuals: (describe the visuals)\n"
         "B-roll: (describe exact b-roll)\n"
         "You: (the hook line)\n\n"

         "[Body – 15 sec]\n"
         "Break this into 3–5 sentences. For EACH sentence, include:\n"
         "- Style: (speaking / non-speaking / high-energy / slow-pace / montage / timelapse)\n"
         "- Visuals: (describe visuals)\n"
         "- B-roll: (detailed shot ideas)\n"
         "- You: (dialogue or narration)\n\n"

         "[Wrap-up – 5 sec]\n"
         "Style: (speaking / non-speaking / aesthetic)\n"
         "Visuals: (describe visuals)\n"
         "B-roll: (describe closer shot)\n"
         "You: (final CTA line)\n\n"

         "IMPORTANT:\n"
         "- Keep lines short, high retention.\n"
         "- Make it platform-optimized.\n"
         "- Visual instructions must be specific.\n"
         "- B-roll must match the sentence perfectly.\n"
         "- Tone must be energetic, educational, or emotional depending on the idea."

Video Title: ${title}
${hook ? `Hook: ${hook}` : ''}
${rough_sketch ? `Rough Sketch: ${rough_sketch}` : ''}

Keep it simple, practical, beginner-friendly, and engaging. Focus on clear, actionable content that gets straight to the point.`;

    const conceptResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: conceptPrompt }]
        }]
      }),
    });

    if (!conceptResponse.ok) {
      const error = await conceptResponse.json();
      throw new Error(error.error?.message || 'Failed to generate concept');
    }

    const conceptData = await conceptResponse.json();
    const generatedConcept = conceptData.candidates?.[0]?.content?.parts?.[0]?.text || '';

    // Update video project with generated concept
    const { data, error: updateError } = await supabase
      .from('video_projects')
      .update({
        generated_concept: generatedConcept,
        updated_at: new Date().toISOString(),
      })
      .eq('id', video_project_id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (updateError) {
      console.error('Database error:', updateError);
      // Return concept even if DB update fails
      return NextResponse.json({
        concept: generatedConcept,
        project: null,
      });
    }

    return NextResponse.json({
      concept: generatedConcept,
      project: data,
    });
  } catch (error: any) {
    console.error('Error generating concept:', error);
    return NextResponse.json({ 
      error: error.message || 'Failed to generate concept' 
    }, { status: 500 });
  }
}

