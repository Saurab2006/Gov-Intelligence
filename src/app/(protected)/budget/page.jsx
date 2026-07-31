'use client';
import { useEffect, useState } from 'react';
import { get } from '@/lib/api';
import { formatNPR, cn } from '@/lib/format';
import { Search, Table2 } from 'lucide-react';

const SECTORS_COLORS = { 'Roads & Transport': '#2563EB', Health: '#10B981', Education: '#8B5CF6', 'Drinking Water': '#06B6D4', Agriculture: '#F59E0B', Energy: '#EF4444', 'Urban Development': '#EC4899', 'Disaster Management': '#F97316' };

export default function BudgetPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [sector, setSector] = useState('all');

  useEffect(() => {
    const sp = new URLSearchParams();
    if (q) sp.set('q', q);
    if (sector !== 'all') sp.set('sector', sector);
    setLoading(true);
    const t = setTimeout(() => {
      get(`/api/budgets?${sp}`).then(d => { setItems(d.items || []); setLoading(false); }).catch(() => setLoading(false));
    }, 300);
    return () => clearTimeout(t);
  }, [q, sector]);

  const sectors = [...new Set(items.map(i => i.sector))].sort();
  const total = items.reduce((a, i) => a + i.amount, 0);

  return (
    <div className="max-w-[1400px] mx-auto space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Budget Explorer</h1>
        <p className="text-sm text-gray-500 mt-1">Every extracted budget line — searchable and filterable</p>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search line items…" className="w-full h-10 pl-10 pr-4 rounded-xl border border-gray-200 bg-white text-sm focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 outline-none transition-all" />
        </div>
        <select value={sector} onChange={e => setSector(e.target.value)} className="h-10 px-4 rounded-xl border border-gray-200 bg-white text-sm focus:border-brand-500 outline-none min-w-[180px]">
          <option value="all">All sectors</option>
          {sectors.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 bg-gray-50/50 border-b border-gray-100 text-xs text-gray-500">
          <span>{loading ? 'Loading…' : `${items.length} line items`}</span>
          <span className="font-semibold text-gray-900">{formatNPR(total)}</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-[10px] uppercase tracking-wider text-gray-400 text-left">
                <th className="px-5 py-3 font-semibold">Line item</th>
                <th className="px-5 py-3 font-semibold">Department</th>
                <th className="px-5 py-3 font-semibold">Sector</th>
                <th className="px-5 py-3 font-semibold">FY</th>
                <th className="px-5 py-3 font-semibold text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? Array.from({ length: 8 }).map((_, i) => (
                <tr key={i}><td colSpan={5} className="px-5 py-4"><div className="shimmer h-4 rounded w-full" /></td></tr>
              )) : items.length === 0 ? (
                <tr><td colSpan={5} className="px-5 py-16 text-center text-gray-400"><Table2 className="w-8 h-8 mx-auto mb-2 text-gray-300" />No budget lines found</td></tr>
              ) : items.map(item => (
                <tr key={item._id} className="hover:bg-gray-50/60 transition-colors">
                  <td className="px-5 py-3"><p className="font-medium text-gray-900 truncate max-w-[280px]">{item.title}</p>{item.district && <p className="text-xs text-gray-400">{item.district}</p>}</td>
                  <td className="px-5 py-3 text-gray-600 truncate max-w-[180px]">{item.department}</td>
                  <td className="px-5 py-3"><span className="flex items-center gap-1.5 text-xs text-gray-600"><span className="w-2 h-2 rounded-sm shrink-0" style={{ background: SECTORS_COLORS[item.sector] || '#2563EB' }} />{item.sector}</span></td>
                  <td className="px-5 py-3 text-xs text-gray-500">{item.fiscalYear}</td>
                  <td className="px-5 py-3 text-right font-semibold text-gray-900 tabular-nums">{formatNPR(item.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
