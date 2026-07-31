'use client';
import { useEffect, useState } from 'react';
import { get } from '@/lib/api';
import { formatNPR, formatNumber, relativeTime, cn } from '@/lib/format';
import { useAuth } from '@/context/AuthContext';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';
import { Table2, Building2, FolderKanban, CalendarRange, Sparkles, UploadCloud, LogIn, UserPlus } from 'lucide-react';

const PIE_COLORS = ['#2563EB', '#10B981', '#8B5CF6', '#06B6D4', '#F59E0B', '#EF4444', '#EC4899', '#F97316'];
const ICONS = { upload: UploadCloud, processed: Sparkles, auth: LogIn, account: UserPlus };

export default function DashboardPage() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    get('/api/analytics').then(d => { setData(d); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const Skeleton = ({ className }) => <div className={cn('shimmer rounded-xl', className)} />;
  const k = data?.kpis || {};

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          {user?.role === 'admin' ? 'Admin Dashboard' : user?.role === 'researcher' ? 'Research Dashboard' : 'Analyst Dashboard'}
        </h1>
        <p className="text-sm text-gray-500 mt-1">Live summary of the indexed Nepal public budget corpus</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Budget', value: loading ? null : formatNPR(k.totalBudget || 0), icon: Table2, sub: 'extracted across all documents' },
          { label: 'Departments', value: loading ? null : formatNumber(k.departments || 0), icon: Building2, sub: 'implementing agencies' },
          { label: 'Projects', value: loading ? null : formatNumber(k.projects || 0), icon: FolderKanban, sub: 'detected & tracked' },
          { label: 'Fiscal Year', value: loading ? null : (k.latestFy || '—'), icon: CalendarRange, sub: 'latest indexed period' },
        ].map((c, i) => (
          <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-gray-500">{c.label}</span>
              <div className="w-9 h-9 rounded-xl bg-brand-50 flex items-center justify-center">
                <c.icon className="w-4 h-4 text-brand-500" />
              </div>
            </div>
            {c.value === null ? <Skeleton className="h-8 w-28" /> : <p className="text-2xl font-bold text-gray-900 tracking-tight">{c.value}</p>}
            <p className="text-[11px] text-gray-400 mt-1">{c.sub}</p>
          </div>
        ))}
      </div>

      {/* Charts Row 1 */}
      <div className="grid lg:grid-cols-2 gap-5">
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-900 mb-1">Budget Allocation</h3>
          <p className="text-xs text-gray-400 mb-4">Share of extracted spend by sector</p>
          {loading ? <Skeleton className="h-[260px]" /> : (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={data.sectorBreakdown} dataKey="value" nameKey="key" cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={2} label={({ key }) => key.length > 12 ? key.slice(0, 11) + '…' : key} labelLine={false} fontSize={10}>
                  {data.sectorBreakdown.map((s, i) => <Cell key={s.key} fill={s.color || PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v) => formatNPR(v)} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-900 mb-1">Budget Utilization</h3>
          <p className="text-xs text-gray-400 mb-4">Committed vs allocated by sector</p>
          {loading ? <Skeleton className="h-[260px]" /> : (
            <div className="space-y-4 pt-2">
              {(data.utilization || []).map((u, i) => (
                <div key={u.key}>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="font-medium text-gray-700">{u.key}</span>
                    <span className="text-gray-400 tabular-nums">{u.percent}%</span>
                  </div>
                  <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-700" style={{ width: `${u.percent}%`, background: u.color }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid lg:grid-cols-2 gap-5">
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-900 mb-1">Department Comparison</h3>
          <p className="text-xs text-gray-400 mb-4">Top implementing agencies</p>
          {loading ? <Skeleton className="h-[260px]" /> : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={data.topDepartments.slice(0, 6)}>
                <XAxis dataKey="key" tick={{ fontSize: 10 }} interval={0} angle={-20} textAnchor="end" height={50} />
                <YAxis tick={{ fontSize: 10 }} tickFormatter={v => formatNPR(v)} width={80} />
                <Tooltip formatter={(v) => formatNPR(v)} />
                <Bar dataKey="value" fill="#2563EB" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-900 mb-1">Budget Trend</h3>
          <p className="text-xs text-gray-400 mb-4">Total allocation per fiscal year</p>
          {loading ? <Skeleton className="h-[260px]" /> : (
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={data.budgetTrend}>
                <defs><linearGradient id="aGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#2563EB" stopOpacity={0.15} /><stop offset="95%" stopColor="#2563EB" stopOpacity={0} /></linearGradient></defs>
                <XAxis dataKey="key" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 10 }} tickFormatter={v => formatNPR(v)} width={80} />
                <Tooltip formatter={(v) => formatNPR(v)} />
                <Area type="monotone" dataKey="value" stroke="#2563EB" strokeWidth={2.5} fill="url(#aGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Recent Activity</h3>
            <p className="text-xs text-gray-400">Latest 5 events in your workspace</p>
          </div>
        </div>
        <ul className="divide-y divide-gray-50">
          {loading ? Array.from({ length: 5 }).map((_, i) => (
            <li key={i} className="px-5 py-3 flex gap-3 items-center"><Skeleton className="w-8 h-8 rounded-lg" /><Skeleton className="h-4 flex-1" /></li>
          )) : (data?.activity || []).map((a, i) => {
            const Icon = ICONS[a.type] || Sparkles;
            return (
              <li key={a._id} className="px-5 py-3 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-brand-50 flex items-center justify-center shrink-0">
                  <Icon className="w-3.5 h-3.5 text-brand-500" />
                </div>
                <span className="flex-1 text-sm text-gray-700 truncate">{a.message}</span>
                <span className="text-xs text-gray-400 shrink-0">{relativeTime(a.createdAt)}</span>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
