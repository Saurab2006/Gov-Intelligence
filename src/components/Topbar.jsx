'use client';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { LogOut, Search, Languages } from 'lucide-react';
import { initials } from '@/lib/format';
import Link from 'next/link';
import NotificationBell from './NotificationBell';
import { CivicLogo } from './CivicBrand';

export default function Topbar() {
  const { user, logout } = useAuth();
  const { locale, toggleLocale, t } = useLanguage();
  if (!user) return null;

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-[#ded6c8] bg-[#fffcf7]/90 px-4 backdrop-blur-sm sm:px-6">
      <Link href="/dashboard" className="flex items-center gap-2 lg:hidden">
        <CivicLogo compact />
      </Link>

      <div className="flex flex-1 justify-center">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8c8272]" />
          <input placeholder={t('topbar.search')} className="h-10 w-full rounded-lg border border-[#d9d1c1] bg-white pl-10 pr-4 text-sm outline-none transition focus:border-[#0f3d3e] focus:bg-white focus:ring-4 focus:ring-[#0f3d3e]/10" />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={toggleLocale}
          title={t('topbar.language')}
          className="flex h-9 items-center gap-1.5 rounded-lg border border-[#d9d1c1] px-3 text-xs font-bold text-[#65706c] transition-colors hover:bg-white hover:text-[#0f3d3e]"
        >
          <Languages className="w-3.5 h-3.5" />
          {locale === 'en' ? 'नेपाली' : 'English'}
        </button>
        <NotificationBell />
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg text-xs font-black text-white" style={{ background: `linear-gradient(135deg, #0f3d3e, #dc143c)` }}>
            {initials(user.name)}
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-bold leading-tight text-[#102a2b]">{user.name}</p>
            <p className="text-xs capitalize text-[#65706c]">{user.role === 'researcher' ? 'citizen' : user.role}</p>
          </div>
        </div>
        <button onClick={logout} className="rounded-lg p-2 text-[#8c8272] transition-colors hover:bg-red-50 hover:text-[#dc143c]" title={t('topbar.signOut')}>
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}
