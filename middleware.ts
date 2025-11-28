import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  let res = NextResponse.next({
    request: {
      headers: req.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return req.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          req.cookies.set({
            name,
            value,
            ...options,
          });
          res.cookies.set({
            name,
            value,
            ...options,
          });
        },
        remove(name: string, options: any) {
          req.cookies.set({
            name,
            value: '',
            ...options,
          });
          res.cookies.set({
            name,
            value: '',
            ...options,
          });
        },
      },
    }
  );

  // Refresh session if expired - required for Server Components
  // https://supabase.com/docs/guides/auth/server-side/nextjs
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = req.nextUrl.pathname;
  const isApiRoute = pathname.startsWith('/api/');

  if (isApiRoute) {
    // Let API routes handle auth themselves to avoid redirecting fetch requests
    return res;
  }

  // Allow auth callback routes to pass through
  if (pathname.startsWith('/auth/callback')) {
    return res;
  }

  // Allow /auth page with code parameter (OAuth callback)
  if (pathname === '/auth' && req.nextUrl.searchParams.has('code')) {
    return res; // Let the auth page handle the code exchange
  }

  // If user is not signed in and trying to access protected routes, redirect to auth
  if (!user && !pathname.startsWith('/auth')) {
    const redirectUrl = req.nextUrl.clone();
    redirectUrl.pathname = '/auth';
    return NextResponse.redirect(redirectUrl);
  }

  // If user is signed in and trying to access auth page (without code), redirect to dashboard
  if (user && pathname.startsWith('/auth') && !req.nextUrl.searchParams.has('code')) {
    const redirectUrl = req.nextUrl.clone();
    redirectUrl.pathname = '/dashboard';
    return NextResponse.redirect(redirectUrl);
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
    '/auth/:path*',
  ],
};
