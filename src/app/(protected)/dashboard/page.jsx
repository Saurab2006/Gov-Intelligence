'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { get } from '@/lib/api';
import { formatNPR, formatNumber, relativeTime, cn } from '@/lib/format';
import { useAuth } from '@/context/AuthContext';
import { Area, AreaChart, Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { AlertTriangle, ArrowRight, Building2, CheckCircle2, ClipboardList, Landmark, LineChart, MapPinned, RadioTower, Sparkles, Table2, UploadCloud } from 'lucide-react';

const ICONS = { upload: UploadCloud, processed: Sparkles, auth: RadioTower, account: CheckCircle2 };

export default function DashboardPage() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [reportStats, setReportStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      get('/api/analytics').catch(() => null),
      get('/api/reports/stats').catch(() => null),
    ]).then(([analytics, stats]) => {
      setData(analytics);
      setReportStats(stats);
      setLoading(false);
    });
  }, []);

  const Skeleton = ({ className }) => <div className={cn('shimmer rounded-lg', className)} />;
  const k = data?.kpis || {};
  const roleLabel = user?.role === 'researcher' ? 'Citizen' : user?.role === 'analyst' ? 'Local Body Staff' : 'Executive Admin';

  const kpis = [
    { label: 'Citizen reports', value: reportStats ? formatNumber(reportStats.total || 0) : loading ? null : '0', icon: ClipboardList, sub: 'people asking for action' },
    { label: 'Needs attention', value: reportStats ? formatNumber((reportStats.pending || 0) + (reportStats.active || 0)) : loading ? null : '0', icon: AlertTriangle, sub: 'waiting, assigned, or in progress' },
    { label: 'Closed loop', value: reportStats ? formatNumber(reportStats.completed || 0) : loading ? null : '0', icon: CheckCircle2, sub: 'resolved with a record' },
    { label: 'Public budget', value: loading ? null : formatNPR(k.totalBudget || 0), icon: Table2, sub: 'money behind services' },
  ];

  return (
    <div className="mx-auto max-w-[1400px] space-y-6">
      <section className="overflow-hidden rounded-lg bg-[#0f3d3e] text-white">
        <div className="grid gap-6 p-6 sm:p-8 lg:grid-cols-[1fr_360px]">
          <div>
            <p className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-white/55">
              <MapPinned className="h-4 w-4" />
              {roleLabel} Civic Home
            </p>
            <h1 className="mt-3 max-w-2xl text-3xl font-black tracking-tight sm:text-4xl">
              See where people are asking for help, who owns the work, and what has been fixed.
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-white/70">
              Civicदृष्टि keeps the civic service chain visible: a citizen reports a problem, the community confirms it, officials assign responsibility, and the outcome stays traceable.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/issues" className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#dc143c] px-4 text-sm font-black text-white hover:bg-[#b80f31]">
                Open Issue Chain <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/authorities" className="inline-flex h-10 items-center gap-2 rounded-lg border border-white/20 px-4 text-sm font-black text-white/85 hover:bg-white/10">
                Review Authorities
              </Link>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[
              ['Report', 'A citizen pins the issue'],
              ['Verify', 'Neighbors or staff confirm it'],
              ['Assign', 'The right office owns it'],
              ['Resolve', 'The fix is recorded'],
            ].map(([label, copy], index) => (
              <div key={label} className="rounded-lg border border-white/15 bg-white/10 p-4">
                <p className="text-2xl font-black tabular-nums text-[#ffccd5]">0{index + 1}</p>
                <p className="mt-2 text-sm font-black">{label}</p>
                <p className="mt-1 text-xs leading-5 text-white/60">{copy}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {kpis.map((c) => (
          <div key={c.label} className="rounded-lg border border-[#ded6c8] bg-white p-5 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-xs font-bold text-[#65706c]">{c.label}</span>
              <div className="grid h-9 w-9 place-items-center rounded-lg bg-[#eef6f4]">
                <c.icon className="h-4 w-4 text-[#0f3d3e]" />
              </div>
            </div>
            {c.value === null ? <Skeleton className="h-8 w-24" /> : <p className="text-2xl font-black tracking-tight text-[#102a2b]">{c.value}</p>}
            <p className="mt-1 text-[11px] text-[#8c8272]">{c.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-5 xl:grid-cols-[1fr_360px]">
        <div className="space-y-5">
          <div className="grid gap-5 lg:grid-cols-2">
            <Panel title="Budget Trend" subtitle="Public money available for real service delivery">
              {loading ? <Skeleton className="h-[260px]" /> : (
                <ResponsiveContainer width="100%" height={260}>
                  <AreaChart data={data?.budgetTrend || []}>
                    <defs><linearGradient id="civicArea" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#0f3d3e" stopOpacity={0.22} /><stop offset="95%" stopColor="#0f3d3e" stopOpacity={0} /></linearGradient></defs>
                    <XAxis dataKey="key" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 10 }} tickFormatter={v => formatNPR(v)} width={80} />
                    <Tooltip formatter={(v) => formatNPR(v)} />
                    <Area type="monotone" dataKey="value" stroke="#0f3d3e" strokeWidth={2.5} fill="url(#civicArea)" />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </Panel>

            <Panel title="Department Load" subtitle="Which offices carry the biggest service responsibility">
              {loading ? <Skeleton className="h-[260px]" /> : (
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={(data?.topDepartments || []).slice(0, 6)}>
                    <XAxis dataKey="key" tick={{ fontSize: 10 }} interval={0} angle={-18} textAnchor="end" height={54} />
                    <YAxis tick={{ fontSize: 10 }} tickFormatter={v => formatNPR(v)} width={80} />
                    <Tooltip formatter={(v) => formatNPR(v)} />
                    <Bar dataKey="value" fill="#dc143c" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </Panel>
          </div>

          <Panel title="Recent Chain Activity" subtitle="What changed recently across reports, users, and data">
            <ul className="divide-y divide-[#eee6d8]">
              {loading ? Array.from({ length: 5 }).map((_, i) => (
                <li key={i} className="flex items-center gap-3 py-3"><Skeleton className="h-9 w-9" /><Skeleton className="h-4 flex-1" /></li>
              )) : (data?.activity || []).map((a) => {
                const Icon = ICONS[a.type] || Sparkles;
                return (
                  <li key={a._id} className="flex items-center gap-3 py-3">
                    <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-[#eef6f4]">
                      <Icon className="h-4 w-4 text-[#0f3d3e]" />
                    </div>
                    <span className="flex-1 truncate text-sm text-[#102a2b]">{a.message}</span>
                    <span className="shrink-0 text-xs text-[#8c8272]">{relativeTime(a.createdAt)}</span>
                  </li>
                );
              })}
            </ul>
          </Panel>
        </div>

        <aside className="space-y-5">
          <Panel title="Civicदृष्टि Service Chain" subtitle="CivicChain-style features active in your app">
            <div className="space-y-3">
              {[
                [ClipboardList, 'Community reports', 'citizens submit issues with location, severity, category, and contact'],
                [Landmark, 'Authority ownership', 'local offices can be assigned, reviewed, and rated by people'],
                [LineChart, 'AI intelligence', 'duplicate/fake status, analytics, and plain-language trend summaries'],
                [Building2, 'Budget context', 'public money and departments connect civic demand to resources'],
              ].map(([Icon, title, copy]) => (
                <div key={title} className="flex gap-3 rounded-lg border border-[#eee6d8] bg-[#fffcf7] p-3">
                  <Icon className="mt-0.5 h-4 w-4 shrink-0 text-[#dc143c]" />
                  <div>
                    <p className="text-sm font-black">{title}</p>
                    <p className="mt-1 text-xs leading-5 text-[#65706c]">{copy}</p>
                  </div>
                </div>
              ))}
            </div>
          </Panel>

          <Panel title="Operational Status" subtitle="Issue review snapshot">
            <div className="space-y-3">
              {[
                ['Pending review', reportStats?.pending || 0, 'text-amber-700 bg-amber-50'],
                ['Active / assigned', reportStats?.active || 0, 'text-blue-700 bg-blue-50'],
                ['Completed', reportStats?.completed || 0, 'text-emerald-700 bg-emerald-50'],
                ['Flagged / fake', reportStats?.flagged || 0, 'text-red-700 bg-red-50'],
              ].map(([label, value, cls]) => (
                <div key={label} className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-[#65706c]">{label}</span>
                  <span className={cn('rounded-md px-2.5 py-1 text-sm font-black tabular-nums', cls)}>{formatNumber(value)}</span>
                </div>
              ))}
            </div>
          </Panel>
        </aside>
      </div>
    </div>
  );
}

function Panel({ title, subtitle, children }) {
  return (
    <section className="rounded-lg border border-[#ded6c8] bg-white p-5 shadow-sm">
      <div className="mb-4">
        <h2 className="text-sm font-black text-[#102a2b]">{title}</h2>
        <p className="mt-1 text-xs text-[#8c8272]">{subtitle}</p>
      </div>
      {children}
    </section>
  );
}