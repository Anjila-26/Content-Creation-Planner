'use client';

import { 
  LayoutDashboard, 
  Calendar, 
  FileText, 
  Settings,
  HelpCircle,
  Video,
  LogOut
} from 'lucide-react';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { supabase } from '../lib/supabase';
import { signOut } from '../lib/auth';

const menuItems = [
  { icon: Video, label: 'Video Projects', href: '/videos' },
  { icon: Calendar, label: 'Schedule', href: '/schedule' },
  { icon: FileText, label: 'Notes', href: '/notes' },
];

const bottomItems = [
  { icon: Settings, label: 'Settings', href: '/settings' },
  { icon: HelpCircle, label: 'Support' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    // Get initial user
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    try {
      await signOut();
      router.push('/auth');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <div className="w-64 bg-white h-screen flex flex-col border-r border-gray-200">
      {/* Logo */}
      <div className="p-6 flex items-center gap-3 cursor-pointer" onClick={() => router.push('/dashboard')}>
        <div className="w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center overflow-hidden border border-gray-100">
          <Image
            src="/logo/image.png"
            alt="Planner logo"
            width={48}
            height={48}
            className="object-cover w-full h-full"
            priority
          />
        </div>
        <span className="text-xl font-semibold text-gray-800 font-handwriting">Planner</span>
      </div>

      {/* Main Menu */}
      <nav className="flex-1 px-4 py-2">
        <div className="mb-6">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 px-3">
            Main
          </h3>
          {menuItems.map((item) => (
            <button
              key={item.label}
              onClick={() => router.push(item.href)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg mb-1 transition-colors ${
                pathname === item.href || 
                (pathname.startsWith('/video/') && item.href === '/videos')
                  ? 'bg-blue-50 text-blue-900'
                  : 'text-gray-600 hover:bg-blue-50'
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span className="text-sm font-medium">{item.label}</span>
            </button>
          ))}
        </div>
      </nav>

      {/* Bottom Items */}
      <div className="p-4 border-t border-gray-200">
        {bottomItems.map((item) => (
          <button
            key={item.label}
            onClick={() => item.href && router.push(item.href)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg mb-1 transition-colors ${
              pathname === item.href
                ? 'bg-blue-50 text-blue-900'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <item.icon className="w-5 h-5" />
            <span className="text-sm font-medium">{item.label}</span>
          </button>
        ))}
        
        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg mb-1 text-red-600 hover:bg-red-50 transition-colors"
        >
          <LogOut className="w-5 h-5" />
          <span className="text-sm font-medium">Sign Out</span>
        </button>
        
        {/* User Profile */}
        {user && (
          <div className="mt-4 flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-gray-50 rounded-lg">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold">
              {user.email?.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-semibold text-gray-800 truncate">
                {user.user_metadata?.full_name || user.email?.split('@')[0]}
              </p>
              <p className="text-xs text-gray-500 truncate">{user.email}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
