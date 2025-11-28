'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

export default function AuthPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    // Handle OAuth callback code if present in URL
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const error = urlParams.get('error');
    
    if (error) {
      setError(decodeURIComponent(error));
      // Clean URL
      window.history.replaceState({}, document.title, '/auth');
      return;
    }
    
    // If code is present, exchange it for session
    if (code) {
      handleOAuthCallback(code);
      return;
    }
    
    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        window.location.href = '/dashboard';
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        // Use window.location for full page reload to ensure cookies are set
        window.location.href = '/dashboard';
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleOAuthCallback = async (code: string) => {
    try {
      setLoading(true);
      setError('');
      
      console.log('Exchanging code for session...', code.substring(0, 10) + '...');
      
      // Exchange code for session
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);
      
      if (error) {
        console.error('Code exchange error:', error);
        throw error;
      }
      
      if (!data.session) {
        console.error('No session created after code exchange');
        throw new Error('No session created');
      }
      
      console.log('✅ Session created successfully');
      
      // Clean URL immediately
      window.history.replaceState({}, document.title, '/auth');
      
      // Wait a bit for cookies to be set
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Redirect to dashboard
      window.location.href = '/dashboard';
    } catch (err: any) {
      console.error('OAuth callback error:', err);
      setError(err.message || 'Failed to complete authentication');
      setLoading(false);
      // Clean URL
      window.history.replaceState({}, document.title, '/auth');
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError('');
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) throw error;
    } catch (error: any) {
      setError(error.message);
      setLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          },
        });
        if (error) throw error;
        alert('Check your email for the confirmation link!');
        setLoading(false);
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        // Wait a bit for session to be set in cookies
        await new Promise(resolve => setTimeout(resolve, 100));
        // Use window.location instead of router to ensure full page reload
        window.location.href = '/dashboard';
      }
    } catch (error: any) {
      setError(error.message);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-blue-50 to-cyan-100 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Decorative Elements */}
      <div className="absolute top-10 left-10 text-6xl font-bold text-white/30 rotate-12">
        Content
      </div>
      <div className="absolute bottom-20 right-20 text-6xl font-bold text-white/30 rotate-12">
        Creation
      </div>
      <div className="absolute bottom-20 right-20 w-40 h-40 opacity-20">
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" strokeWidth="2" className="text-cyan-300" />
          <circle cx="50" cy="50" r="30" fill="none" stroke="currentColor" strokeWidth="2" className="text-cyan-300" />
        </svg>
      </div>

      {/* Sign In Card */}
      <div className="w-full max-w-2xl bg-white rounded-3xl p-12  relative">
        {/* Decorative leaf */}
        <div className="absolute top-8 right-8">
          <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
            <path d="M20 40C20 40 30 20 40 20C50 20 60 40 60 40" stroke="#1e293b" strokeWidth="3" strokeLinecap="round"/>
            <ellipse cx="25" cy="35" rx="4" ry="6" fill="#67e8f9"/>
            <ellipse cx="32" cy="32" rx="4" ry="6" fill="#67e8f9"/>
            <ellipse cx="40" cy="30" rx="4" ry="6" fill="#67e8f9"/>
            <ellipse cx="48" cy="32" rx="4" ry="6" fill="#67e8f9"/>
            <ellipse cx="55" cy="35" rx="4" ry="6" fill="#67e8f9"/>
          </svg>
        </div>
        <div className="absolute top-12 left-12 w-8 h-8 border-2 border-blue-300 rounded-full"></div>
        <div className="absolute bottom-16 right-20 w-12 h-12 border-2 border-cyan-300 rounded-full"></div>

        <h2 className="text-4xl font-bold text-gray-800 mb-2">
          Welcome
        </h2>
        <p className="text-gray-500 mb-8">
          Sign in to access your content dashboard
        </p>

        {error && (
          <div className="mb-6 p-4 rounded-lg bg-red-50 text-red-700">
            {error}
          </div>
        )}

        {/* Email/Password Form */}
        <form onSubmit={handleEmailAuth} className="mb-6 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your.email@example.com"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gray-900 text-white rounded-lg font-semibold hover:bg-gray-800 transition-colors disabled:opacity-50"
          >
            {loading ? 'Loading...' : isSignUp ? 'Sign Up' : 'Sign In'}
          </button>
        </form>

        <div className="flex items-center gap-2 mb-6">
          <div className="flex-1 h-px bg-gray-200"></div>
          <span className="text-sm text-gray-500">or</span>
          <div className="flex-1 h-px bg-gray-200"></div>
        </div>

        {/* Google Sign In */}
        <div className="mb-6">
          <button
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full py-4 border-2 border-gray-200 rounded-full font-semibold hover:bg-gray-50 transition-colors flex items-center justify-center gap-3 disabled:opacity-50"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M19.6 10.227c0-.709-.064-1.39-.182-2.045H10v3.868h5.382a4.6 4.6 0 01-1.996 3.018v2.51h3.232c1.891-1.742 2.982-4.305 2.982-7.35z" fill="#4285F4"/>
              <path d="M10 20c2.7 0 4.964-.895 6.618-2.423l-3.232-2.509c-.895.6-2.04.955-3.386.955-2.605 0-4.81-1.76-5.595-4.123H1.064v2.59A9.996 9.996 0 0010 20z" fill="#34A853"/>
              <path d="M4.405 11.9c-.2-.6-.314-1.24-.314-1.9 0-.66.114-1.3.314-1.9V5.51H1.064A9.996 9.996 0 000 10c0 1.614.386 3.14 1.064 4.49l3.34-2.59z" fill="#FBBC05"/>
              <path d="M10 3.977c1.468 0 2.786.505 3.823 1.496l2.868-2.868C14.959.99 12.695 0 10 0 6.09 0 2.71 2.24 1.064 5.51l3.34 2.59C5.19 5.737 7.395 3.977 10 3.977z" fill="#EA4335"/>
            </svg>
            Continue with Google
          </button>
        </div>

        <div className="text-center">
          <button
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-sm text-gray-600 hover:text-gray-800"
          >
            {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
          </button>
        </div>
      </div>
    </div>
  );
}