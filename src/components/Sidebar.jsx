'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Building2, ClipboardList, Gauge, Landmark, LineChart, Settings, Shield, Table2, Users } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/format';
import { CivicLogo } from './CivicBrand';

const NAV = [
  { href: '/dashboard', label: 'Civic Home', helper: 'what needs attention today', icon: Gauge },
  { href: '/issues', label: 'Issue Chain', helper: 'report, verify, assign, resolve', icon: ClipboardList },
  { href: '/authorities', label: 'Authorities', helper: 'who owns the work', icon: Landmark },
  { href: '/budget', label: 'Public Money', helper: 'funding behind services', icon: Table2 },
  { href: '/departments', label: 'Departments', helper: 'teams and responsibilities', icon: Building2 },
  { href: '/reports', label: 'AI Briefs', helper: 'plain-language summaries', icon: LineChart },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuth();
  const roleLabel = user?.role === 'researcher' ? 'Citizen' : user?.role === 'analyst' ? 'Local body staff' : 'Admin executive';

  return (
    <aside className="hidden h-screen w-[268px] shrink-0 flex-col border-r border-[#ded6c8] bg-[#fffcf7] lg:flex sticky top-0">
      <div className="border-b border-[#eee6d8] px-5 py-4">
        <CivicLogo />
      </div>

      {user && (
        <div className="mx-4 mt-4 rounded-lg border border-[#d9d1c1] bg-white p-3">
          <p className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-[0.14em] text-[#dc143c]">
            <Shield className="h-3.5 w-3.5" />
            {roleLabel}
          </p>
          <p className="mt-1 truncate text-xs text-[#65706c]">{user.organization || 'Civicदृष्टि'}</p>
        </div>
      )}

      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <p className="px-3 pb-2 text-[10px] font-black uppercase tracking-[0.18em] text-[#8c8272]">Civic service chain</p>
        <div className="space-y-1">
          {NAV.map(item => {
            const active = pathname === item.href || pathname.startsWith(item.href + '/');
            const Icon = item.icon;
            return (
              <Link key={item.href} href={item.href} className={cn(
                'flex gap-3 rounded-lg border px-3 py-3 transition',
                active ? 'border-[#0f3d3e] bg-[#eef6f4] text-[#0f3d3e]' : 'border-transparent text-[#65706c] hover:border-[#ded6c8] hover:bg-white hover:text-[#102a2b]'
              )}>
                <Icon className={cn('mt-0.5 h-4 w-4 shrink-0', active ? 'text-[#dc143c]' : 'text-[#8c8272]')} />
                <span>
                  <span className="block text-sm font-black leading-none">{item.label}</span>
                  <span className="mt-1 block text-[11px] leading-4 opacity-70">{item.helper}</span>
                </span>
              </Link>
            );
          })}
        </div>

        {user?.role === 'admin' && (
          <div className="mt-5">
            <p className="px-3 pb-2 text-[10px] font-black uppercase tracking-[0.18em] text-[#8c8272]">Executive</p>
            <Link href="/admin/users" className={cn(
              'flex items-center gap-3 rounded-lg border px-3 py-3 text-sm font-black transition',
              pathname.startsWith('/admin/users') ? 'border-[#0f3d3e] bg-[#eef6f4] text-[#0f3d3e]' : 'border-transparent text-[#65706c] hover:border-[#ded6c8] hover:bg-white'
            )}>
              <Users className="h-4 w-4 text-[#dc143c]" />
              User Management
            </Link>
          </div>
        )}

        <Link href="/settings" className={cn(
          'mt-5 flex items-center gap-3 rounded-lg border px-3 py-3 text-sm font-black transition',
          pathname === '/settings' ? 'border-[#0f3d3e] bg-[#eef6f4] text-[#0f3d3e]' : 'border-transparent text-[#65706c] hover:border-[#ded6c8] hover:bg-white'
        )}>
          <Settings className="h-4 w-4 text-[#8c8272]" />
          Settings
        </Link>
      </nav>
    </aside>
  );
}
