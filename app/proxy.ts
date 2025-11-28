import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function proxy(req: NextRequest) {
  let res = NextResponse.next();

  const pathname = req.nextUrl.pathname;
  const isApiRoute = pathname.startsWith('/api/');

  // Skip auth logic for API routes – the handlers already do their own auth checks.
  if (isApiRoute) {
    return res;
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return req.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          res.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: any) {
          res.cookies.set({ name, value: '', ...options });
        },
      },
    }
  );

  const {
    data: { session },
  } = await supabase.auth.getSession();

    // Only protect dashboard, video detail, videos, notes, schedule
    const protectedRoutes = ['/dashboard', '/video', '/videos', '/notes', '/schedule'];
    const isProtected = protectedRoutes.some((route) => pathname.startsWith(route));

    // If user is not signed in and trying to access protected routes, redirect to auth
    if (!session && isProtected) {
      return NextResponse.redirect(new URL('/auth', req.url));
    }

    // If user is signed in and trying to access auth page, redirect to dashboard
    if (session && req.nextUrl.pathname.startsWith('/auth')) {
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }

  return res;
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/videos/:path*',
    '/video/:path*',
    '/notes/:path*',
    '/schedule/:path*',
    '/auth',
  ],
};
