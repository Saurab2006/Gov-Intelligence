'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ClipboardList, Gauge, Landmark, LineChart, LogOut, MapPinned, Settings, Table2, Users } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { cn, initials } from '@/lib/format';
import { CivicLogo } from './CivicBrand';

const GROUPS = [
  {
    label: 'Where the money goes',
    items: [
      { href: '/dashboard', label: 'Overview', icon: Gauge },
      { href: '/budget', label: 'Budget explorer', icon: Table2 },
    ],
  },
  {
    label: 'People & decisions',
    items: [
      { href: '/issues', label: 'Civic issues', icon: ClipboardList },
      { href: '/authorities', label: 'Authorities', icon: Landmark },
      { href: '/reports', label: 'AI briefs', icon: LineChart },
    ],
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const roleLabel = user?.role === 'researcher' ? 'Citizen' : user?.role === 'analyst' ? 'Local body staff' : user?.role === 'ward_rep' ? 'Ward representative' : 'Admin';
  const accessLabel = user?.role === 'admin' ? 'full access' : user?.role === 'researcher' ? 'citizen access' : 'staff access';

  const isActive = (href) => pathname === href || pathname.startsWith(href + '/');

  return (
    <aside className="hidden h-screen w-[248px] shrink-0 flex-col border-r border-[#eae4d8] bg-white lg:flex sticky top-0">
      <div className="px-5 py-5">
        <CivicLogo />
      </div>

      <nav className="flex-1 overflow-y-auto px-3 pt-2">
        {GROUPS.map((group) => (
          <div key={group.label} className="mb-5">
            <p className="px-3 pb-1.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-[#a39d8d]">{group.label}</p>
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const active = isActive(item.href);
                const Icon = item.icon;
                return (
                  <Link key={item.href} href={item.href} className={cn(
                    'flex items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors',
                    active ? 'bg-[#f1efe8] font-semibold text-[#102a2b]' : 'text-[#5c574c] hover:bg-[#f6f4ef] hover:text-[#102a2b]'
                  )}>
                    <Icon className={cn('h-4 w-4 shrink-0', active ? 'text-[#102a2b]' : 'text-[#a39d8d]')} />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}

        {user?.role === 'admin' && (
          <div className="mb-5">
            <p className="px-3 pb-1.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-[#a39d8d]">Executive</p>
            <div className="space-y-0.5">
              <Link href="/admin/users" className={cn(
                'flex items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors',
                isActive('/admin/users') ? 'bg-[#f1efe8] font-semibold text-[#102a2b]' : 'text-[#5c574c] hover:bg-[#f6f4ef] hover:text-[#102a2b]'
              )}>
                <Users className={cn('h-4 w-4', isActive('/admin/users') ? 'text-[#102a2b]' : 'text-[#a39d8d]')} />
                User management
              </Link>
              <Link href="/admin/wards" className={cn(
                'flex items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors',
                isActive('/admin/wards') ? 'bg-[#f1efe8] font-semibold text-[#102a2b]' : 'text-[#5c574c] hover:bg-[#f6f4ef] hover:text-[#102a2b]'
              )}>
                <MapPinned className={cn('h-4 w-4', isActive('/admin/wards') ? 'text-[#102a2b]' : 'text-[#a39d8d]')} />
                Wards & representatives
              </Link>
            </div>
          </div>
        )}

        <div className="mb-5">
          <Link href="/settings" className={cn(
            'flex items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors',
            isActive('/settings') ? 'bg-[#f1efe8] font-semibold text-[#102a2b]' : 'text-[#5c574c] hover:bg-[#f6f4ef] hover:text-[#102a2b]'
          )}>
            <Settings className={cn('h-4 w-4', isActive('/settings') ? 'text-[#102a2b]' : 'text-[#a39d8d]')} />
            Settings
          </Link>
        </div>
      </nav>

      {user && (
        <div className="flex items-center gap-2.5 border-t border-[#eae4d8] px-4 py-3.5">
          <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#f1efe8] text-xs font-semibold text-[#102a2b]">
            {initials(user.name)}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold leading-tight text-[#102a2b]">{user.name}</p>
            <p className="truncate text-xs capitalize text-[#a39d8d]">{roleLabel} · {accessLabel}</p>
          </div>
          <button onClick={logout} title="Sign out" className="shrink-0 rounded-md p-1.5 text-[#a39d8d] transition-colors hover:bg-red-50 hover:text-[#dc143c]">
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      )}
    </aside>
  );
}