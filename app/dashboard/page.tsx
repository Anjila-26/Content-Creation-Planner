'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase';
import Sidebar from '../../components/Sidebar';

export default function DashboardPage() {
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        window.location.href = '/auth';
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session && event === 'SIGNED_OUT') {
        window.location.href = '/auth';
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <div className="flex h-screen bg-gradient-to-br from-blue-100 via-blue-50 to-cyan-100">
      <Sidebar />
      <main className="flex-1 flex flex-col items-center justify-center p-8">
        <h1 className="text-4xl font-bold text-gray-800 mb-4">Welcome to your Dashboard!</h1>
        <p className="text-lg text-gray-600 mb-8">You are successfully logged in.</p>
        <div className="bg-white rounded-2xl shadow-sm p-8 w-full max-w-xl border border-gray-200">
          <h2 className="text-2xl font-semibold text-blue-700 mb-2">Get started:</h2>
          <ul className="list-disc pl-6 text-gray-700 space-y-2">
            <li>View and manage your video projects</li>
            <li>Check your schedule</li>
            <li>Take notes and organize ideas</li>
            <li>Try AI-powered suggestions</li>
          </ul>
        </div>
      </main>
    </div>
  );
}
