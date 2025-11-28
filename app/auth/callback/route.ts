import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import type { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const origin = requestUrl.origin;

  if (!code) {
    return NextResponse.redirect(`${origin}/auth?error=No authorization code provided`);
  }

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
          set(name: string, value: string, options: any) {
            cookieStore.set({ name, value, ...options });
          },
          remove(name: string, options: any) {
            cookieStore.set({ name, value: '', ...options });
          },
        },
      }
    );

    // Exchange code for session
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (error) {
      console.error('Error exchanging code for session:', error);
      return NextResponse.redirect(`${origin}/auth?error=${encodeURIComponent(error.message || 'Could not authenticate user')}`);
    }

    if (data.session) {
      // Successfully authenticated - redirect to dashboard
      const forwardedHost = request.headers.get('x-forwarded-host');
      const isLocalEnv = process.env.NODE_ENV === 'development';
      
      if (isLocalEnv) {
        return NextResponse.redirect(`${origin}/dashboard`);
      } else if (forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}/dashboard`);
      } else {
        return NextResponse.redirect(`${origin}/dashboard`);
      }
    } else {
      // No session created
      return NextResponse.redirect(`${origin}/auth?error=No session created`);
    }
  } catch (error: any) {
    console.error('Callback error:', error);
    return NextResponse.redirect(`${origin}/auth?error=${encodeURIComponent(error.message || 'Authentication failed')}`);
  }
}


