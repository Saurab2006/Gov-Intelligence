'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Table2, Building2, BarChart3, Sparkles, Settings, Shield, Users, Home } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/format';

const NAV = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/budget', label: 'Budget Explorer', icon: Table2 },
  { href: '/departments', label: 'Departments', icon: Building2 },
  { href: '/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/reports', label: 'Reports', icon: Sparkles },
];

const ADMIN_NAV = [
  { href: '/admin/users', label: 'User Management', icon: Users },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuth();

  return (
    <aside className="hidden lg:flex w-[236px] shrink-0 flex-col border-r border-gray-200 bg-white h-screen sticky top-0">
      <div className="flex items-center gap-2.5 px-5 h-16 border-b border-gray-100">
        <div className="w-8 h-8 bg-brand-500 rounded-lg flex items-center justify-center">
          <Home className="w-4 h-4 text-white" />
        </div>
        <span className="text-sm font-bold text-gray-900">GovInsight</span>
      </div>

      {user && (
        <div className="mx-4 mt-4 mb-2 px-3 py-2.5 rounded-xl bg-brand-50 border border-brand-100">
          <p className="text-xs font-semibold text-brand-700 capitalize flex items-center gap-1.5">
            <Shield className="w-3 h-3" />
            {user.role} Dashboard
          </p>
        </div>
      )}

      <nav className="flex-1 px-3 py-2 space-y-0.5 overflow-y-auto">
        <p className="px-3 pt-2 pb-1.5 text-[10px] font-semibold uppercase tracking-widest text-gray-400">Menu</p>
        {NAV.map(item => {
          const active = pathname === item.href || pathname.startsWith(item.href + '/');
          const Icon = item.icon;
          return (
            <Link key={item.href} href={item.href} className={cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all',
              active ? 'bg-brand-50 text-brand-600 border border-brand-100' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 border border-transparent'
            )}>
              <Icon className={cn('w-4 h-4', active ? 'text-brand-500' : 'text-gray-400')} />
              {item.label}
            </Link>
          );
        })}

        {user?.role === 'admin' && (
          <>
            <p className="px-3 pt-4 pb-1.5 text-[10px] font-semibold uppercase tracking-widest text-gray-400">Admin</p>
            {ADMIN_NAV.map(item => {
              const active = pathname.startsWith(item.href);
              const Icon = item.icon;
              return (
                <Link key={item.href} href={item.href} className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all',
                  active ? 'bg-brand-50 text-brand-600 border border-brand-100' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 border border-transparent'
                )}>
                  <Icon className={cn('w-4 h-4', active ? 'text-brand-500' : 'text-gray-400')} />
                  {item.label}
                </Link>
              );
            })}
          </>
        )}

        <Link href="/settings" className={cn(
          'flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all mt-1',
          pathname === '/settings' ? 'bg-brand-50 text-brand-600 border border-brand-100' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 border border-transparent'
        )}>
          <Settings className={cn('w-4 h-4', pathname === '/settings' ? 'text-brand-500' : 'text-gray-400')} />
          Settings
        </Link>
      </nav>
    </aside>
  );
}
