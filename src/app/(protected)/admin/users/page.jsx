'use client';
import { useEffect, useState } from 'react';
import { get, patch } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { formatNumber, relativeTime, initials } from '@/lib/format';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

export default function UsersPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.role !== 'admin') { router.push('/dashboard'); return; }
    get('/api/users').then(d => { setUsers(d.users || []); setLoading(false); }).catch(() => setLoading(false));
  }, [user, router]);

  const changeRole = async (id, role) => {
    try { await patch(`/api/users/${id}`, { role }); setUsers(prev => prev.map(u => u._id === id ? { ...u, role } : u)); toast.success('Role updated'); } catch (e) { toast.error(e.message); }
  };

  return (
    <div className="max-w-[1400px] mx-auto space-y-5">
      <div><h1 className="text-2xl font-bold text-gray-900">User Management</h1><p className="text-sm text-gray-500 mt-1">Manage team roles and access</p></div>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead><tr className="border-b border-gray-100 text-[10px] uppercase tracking-wider text-gray-400"><th className="px-5 py-3 text-left font-semibold">User</th><th className="px-5 py-3 text-left font-semibold">Docs</th><th className="px-5 py-3 text-left font-semibold">Role</th><th className="px-5 py-3 text-left font-semibold">Joined</th></tr></thead>
          <tbody className="divide-y divide-gray-50">
            {loading ? Array.from({ length: 4 }).map((_, i) => <tr key={i}><td colSpan={4} className="px-5 py-4"><div className="shimmer h-4 rounded w-full" /></td></tr>) : users.map(u => (
              <tr key={u._id} className="hover:bg-gray-50/60">
                <td className="px-5 py-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0" style={{ background: `linear-gradient(135deg, hsl(${u.avatarHue} 65% 52%), hsl(${(u.avatarHue + 40) % 360} 60% 45%))` }}>{initials(u.name)}</div>
                    <div><p className="font-medium text-gray-900">{u.name}</p><p className="text-xs text-gray-400">{u.email}</p></div>
                  </div>
                </td>
                <td className="px-5 py-3 text-gray-600 tabular-nums">{formatNumber(u.documentCount || 0)}</td>
                <td className="px-5 py-3">
                  <select value={u.role} onChange={e => changeRole(u._id, e.target.value)} disabled={u._id === user._id} className="h-8 px-2 rounded-lg border border-gray-200 text-xs bg-white focus:border-brand-500 outline-none disabled:opacity-50 capitalize">
                    <option value="admin">Admin</option><option value="analyst">Analyst</option><option value="researcher">Researcher</option>
                  </select>
                </td>
                <td className="px-5 py-3 text-xs text-gray-400">{relativeTime(u.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
