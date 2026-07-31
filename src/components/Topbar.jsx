'use client';
import { useAuth } from '@/context/AuthContext';
import { LogOut, Search } from 'lucide-react';
import { initials } from '@/lib/format';
import { Home } from 'lucide-react';
import Link from 'next/link';

export default function Topbar() {
  const { user, logout } = useAuth();
  if (!user) return null;

  return (
    <header className="sticky top-0 z-30 h-16 border-b border-gray-200 bg-white/90 backdrop-blur-sm flex items-center gap-4 px-6">
      <Link href="/dashboard" className="flex items-center gap-2 lg:hidden">
        <div className="w-7 h-7 bg-brand-500 rounded-lg flex items-center justify-center">
          <Home className="w-3.5 h-3.5 text-white" />
        </div>
        <span className="text-sm font-bold text-gray-900">GovInsight</span>
      </Link>

      <div className="flex-1 flex justify-center">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input placeholder="Search budgets, departments, projects…" className="w-full h-10 pl-10 pr-4 rounded-xl border border-gray-200 bg-gray-50 text-sm outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 focus:bg-white transition-all" />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ background: `linear-gradient(135deg, hsl(${user.avatarHue} 65% 52%), hsl(${(user.avatarHue + 40) % 360} 60% 45%))` }}>
            {initials(user.name)}
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-semibold text-gray-900 leading-tight">{user.name}</p>
            <p className="text-xs text-gray-500 capitalize">{user.role}</p>
          </div>
        </div>
        <button onClick={logout} className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors" title="Sign out">
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}
