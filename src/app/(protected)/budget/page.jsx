'use client';
import { useEffect, useMemo, useState } from 'react';
import { get, patch, post } from '@/lib/api';
import { formatNPR } from '@/lib/format';
import { useAuth } from '@/context/AuthContext';
import { Check, Search, Send, Table2, X } from 'lucide-react';
import { toast } from 'sonner';

const SECTORS_COLORS = { 'Roads & Transport': '#2563EB', Health: '#10B981', Education: '#8B5CF6', 'Drinking Water': '#06B6D4', Agriculture: '#F59E0B', Energy: '#EF4444', 'Urban Development': '#EC4899', 'Disaster Management': '#F97316' };

const emptyProposal = { title: '', department: '', sector: '', amount: '', fiscalYear: '', district: '', reason: '' };

export default function BudgetPage() {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [changes, setChanges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [q, setQ] = useState('');
  const [sector, setSector] = useState('all');
  const [selected, setSelected] = useState(null);
  const [proposal, setProposal] = useState(emptyProposal);

  const canPropose = user?.role === 'analyst';
  const canApprove = user?.role === 'admin';

  const loadChanges = () => {
    if (!user || user.role === 'researcher') return;
    get('/api/budgets/changes?status=pending')
      .then(d => setChanges(d.changes || []))
      .catch(() => {});
  };

  useEffect(() => {
    const sp = new URLSearchParams();
    if (q) sp.set('q', q);
    if (sector !== 'all') sp.set('sector', sector);
    setLoading(true);
    const t = setTimeout(() => {
      get(`/api/budgets?${sp}`)
        .then(d => { setItems(d.items || []); setLoading(false); })
        .catch(() => setLoading(false));
    }, 300);
    return () => clearTimeout(t);
  }, [q, sector]);

  useEffect(() => {
    loadChanges();
  }, [user?.role]);

  const sectors = useMemo(() => [...new Set(items.map(i => i.sector))].sort(), [items]);
  const total = items.reduce((a, i) => a + i.amount, 0);

  const selectItem = (item) => {
    if (!canPropose) return;
    setSelected(item);
    setProposal({
      title: item.title || '',
      department: item.department || '',
      sector: item.sector || '',
      amount: item.amount || '',
      fiscalYear: item.fiscalYear || '',
      district: item.district || '',
      reason: '',
    });
  };

  const submitProposal = async (event) => {
    event.preventDefault();
    if (!selected) return;
    setSaving(true);
    try {
      await post(`/api/budgets/${selected._id}/changes`, proposal);
      toast.success('Change sent for admin approval');
      setSelected(null);
      setProposal(emptyProposal);
      loadChanges();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const reviewChange = async (id, status) => {
    try {
      await patch(`/api/budgets/changes/${id}`, { status });
      setChanges(prev => prev.filter(c => c._id !== id));
      toast.success(status === 'approved' ? 'Change approved' : 'Change rejected');
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <div className="max-w-[1400px] mx-auto space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Budget Explorer</h1>
        <p className="text-sm text-gray-500 mt-1">
          {canPropose ? 'Analysts can propose edits for admin approval' : canApprove ? 'Admins review and approve important data changes' : 'Read-only budget data for normal users'}
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-5">
        <div className="space-y-5">
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-[240px]">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search line items..." className="w-full h-10 pl-10 pr-4 rounded-xl border border-gray-200 bg-white text-sm focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 outline-none transition-all" />
            </div>
            <select value={sector} onChange={e => setSector(e.target.value)} className="h-10 px-4 rounded-xl border border-gray-200 bg-white text-sm focus:border-brand-500 outline-none min-w-[180px]">
              <option value="all">All sectors</option>
              {sectors.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3 bg-gray-50/50 border-b border-gray-100 text-xs text-gray-500">
              <span>{loading ? 'Loading...' : `${items.length} line items`}</span>
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
                    {canPropose && <th className="px-5 py-3 font-semibold text-right">Action</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {loading ? Array.from({ length: 8 }).map((_, i) => (
                    <tr key={i}><td colSpan={canPropose ? 6 : 5} className="px-5 py-4"><div className="shimmer h-4 rounded w-full" /></td></tr>
                  )) : items.length === 0 ? (
                    <tr><td colSpan={canPropose ? 6 : 5} className="px-5 py-16 text-center text-gray-400"><Table2 className="w-8 h-8 mx-auto mb-2 text-gray-300" />No budget lines found</td></tr>
                  ) : items.map(item => (
                    <tr key={item._id} className="hover:bg-gray-50/60 transition-colors">
                      <td className="px-5 py-3"><p className="font-medium text-gray-900 truncate max-w-[280px]">{item.title}</p>{item.district && <p className="text-xs text-gray-400">{item.district}</p>}</td>
                      <td className="px-5 py-3 text-gray-600 truncate max-w-[180px]">{item.department}</td>
                      <td className="px-5 py-3"><span className="flex items-center gap-1.5 text-xs text-gray-600"><span className="w-2 h-2 rounded-sm shrink-0" style={{ background: SECTORS_COLORS[item.sector] || '#2563EB' }} />{item.sector}</span></td>
                      <td className="px-5 py-3 text-xs text-gray-500">{item.fiscalYear}</td>
                      <td className="px-5 py-3 text-right font-semibold text-gray-900 tabular-nums">{formatNPR(item.amount)}</td>
                      {canPropose && <td className="px-5 py-3 text-right"><button onClick={() => selectItem(item)} className="h-8 px-3 rounded-lg border border-brand-100 bg-brand-50 text-xs font-semibold text-brand-700 hover:bg-brand-100">Propose edit</button></td>}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <aside className="space-y-5">
          {canPropose && (
            <form onSubmit={submitProposal} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
              <div>
                <h2 className="text-sm font-bold text-gray-900">Propose Data Change</h2>
                <p className="text-xs text-gray-500 mt-1">{selected ? 'Edit fields and submit for admin approval.' : 'Select a budget line to start.'}</p>
              </div>
              {['title', 'department', 'sector', 'fiscalYear', 'district'].map(field => (
                <input key={field} disabled={!selected} value={proposal[field]} onChange={e => setProposal(p => ({ ...p, [field]: e.target.value }))} placeholder={field} className="w-full h-10 px-3 rounded-lg border border-gray-200 text-sm outline-none focus:border-brand-500 disabled:bg-gray-50 disabled:text-gray-400" />
              ))}
              <input disabled={!selected} type="number" value={proposal.amount} onChange={e => setProposal(p => ({ ...p, amount: e.target.value }))} placeholder="amount" className="w-full h-10 px-3 rounded-lg border border-gray-200 text-sm outline-none focus:border-brand-500 disabled:bg-gray-50 disabled:text-gray-400" />
              <textarea disabled={!selected} value={proposal.reason} onChange={e => setProposal(p => ({ ...p, reason: e.target.value }))} placeholder="Reason for change" className="w-full min-h-[82px] px-3 py-2 rounded-lg border border-gray-200 text-sm outline-none focus:border-brand-500 disabled:bg-gray-50 disabled:text-gray-400" />
              <button disabled={!selected || saving} className="w-full h-10 rounded-lg bg-brand-600 text-white text-sm font-semibold hover:bg-brand-700 disabled:opacity-50 flex items-center justify-center gap-2"><Send className="w-4 h-4" />Submit proposal</button>
            </form>
          )}

          {(canApprove || canPropose) && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-5 py-3 border-b border-gray-100">
                <h2 className="text-sm font-bold text-gray-900">{canApprove ? 'Pending Approvals' : 'Your Pending Proposals'}</h2>
              </div>
              <div className="divide-y divide-gray-50 max-h-[520px] overflow-y-auto">
                {changes.length === 0 ? (
                  <p className="px-5 py-8 text-center text-sm text-gray-400">No pending changes</p>
                ) : changes.map(change => (
                  <div key={change._id} className="p-5 space-y-3">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{change.budgetItem?.title || 'Budget item'}</p>
                      {change.requestedBy?.name && <p className="text-xs text-gray-400">By {change.requestedBy.name}</p>}
                    </div>
                    <div className="space-y-1 text-xs text-gray-600">
                      {Object.entries(change.proposed || {}).map(([key, value]) => <p key={key}><span className="font-semibold capitalize">{key}:</span> {String(value)}</p>)}
                    </div>
                    {change.reason && <p className="text-xs text-gray-500 bg-gray-50 rounded-lg p-2">{change.reason}</p>}
                    {canApprove && (
                      <div className="flex gap-2">
                        <button onClick={() => reviewChange(change._id, 'approved')} className="flex-1 h-9 rounded-lg bg-emerald-600 text-white text-xs font-semibold flex items-center justify-center gap-1.5"><Check className="w-3.5 h-3.5" />Approve</button>
                        <button onClick={() => reviewChange(change._id, 'rejected')} className="flex-1 h-9 rounded-lg bg-red-600 text-white text-xs font-semibold flex items-center justify-center gap-1.5"><X className="w-3.5 h-3.5" />Reject</button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
