'use client';
import { useEffect, useMemo, useState } from 'react';
import { get, patch, post } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import { Check, MapPinned, Plus, ShieldCheck, X } from 'lucide-react';

const emptyWard = { province: '', district: '', municipality: '', ward: '', representative: '' };

export default function WardAdminPage() {
  const { user } = useAuth();
  const [wards, setWards] = useState([]);
  const [applications, setApplications] = useState([]);
  const [form, setForm] = useState(emptyWard);
  const [loading, setLoading] = useState(true);

  const reps = useMemo(() => applications.filter(a => a.role === 'ward_rep' && a.status === 'active'), [applications]);
  const load = () => Promise.all([get('/api/wards'), get('/api/wards/representatives/applications')]).then(([w, a]) => { setWards(w.wards || []); setApplications(a.applications || []); setLoading(false); }).catch(e => { toast.error(e.message); setLoading(false); });
  useEffect(() => { if (user?.role === 'admin') load(); }, [user?.role]);

  const saveWard = async (e) => {
    e.preventDefault();
    try { await post('/api/wards', form); toast.success('Ward saved'); setForm(emptyWard); load(); }
    catch (err) { toast.error(err.message); }
  };
  const review = async (id, wardRepresentativeStatus) => {
    try { await patch(`/api/users/${id}`, { wardRepresentativeStatus }); toast.success(wardRepresentativeStatus === 'approved' ? 'Ward representative approved' : 'Applicant rejected and banned'); load(); }
    catch (err) { toast.error(err.message); }
  };

  if (user?.role !== 'admin') return <div className="text-sm text-[#65706c]">Admin only.</div>;

  return (
    <div className="mx-auto max-w-[1400px] space-y-5">
      <div><h1 className="text-2xl font-black text-[#102a2b]">Province, District, Ward Representatives</h1><p className="mt-1 text-sm text-[#65706c]">Create wards, assign representatives, and approve pending requests.</p></div>

      <form onSubmit={saveWard} className="rounded-lg border border-[#ded6c8] bg-white p-5 shadow-sm">
        <h2 className="mb-4 flex items-center gap-2 text-sm font-black text-[#102a2b]"><Plus className="h-4 w-4 text-[#dc143c]" />Create or update ward</h2>
        <div className="grid gap-3 md:grid-cols-5"><input required value={form.province} onChange={e => setForm(f => ({ ...f, province: e.target.value }))} placeholder="Province" className="h-10 rounded-lg border border-[#ded6c8] px-3 text-sm outline-none focus:border-[#0f3d3e]" /><input required value={form.district} onChange={e => setForm(f => ({ ...f, district: e.target.value }))} placeholder="District" className="h-10 rounded-lg border border-[#ded6c8] px-3 text-sm outline-none focus:border-[#0f3d3e]" /><input value={form.municipality} onChange={e => setForm(f => ({ ...f, municipality: e.target.value }))} placeholder="Municipality" className="h-10 rounded-lg border border-[#ded6c8] px-3 text-sm outline-none focus:border-[#0f3d3e]" /><input required value={form.ward} onChange={e => setForm(f => ({ ...f, ward: e.target.value }))} placeholder="Ward" className="h-10 rounded-lg border border-[#ded6c8] px-3 text-sm outline-none focus:border-[#0f3d3e]" /><select value={form.representative} onChange={e => setForm(f => ({ ...f, representative: e.target.value }))} className="h-10 rounded-lg border border-[#ded6c8] px-3 text-sm outline-none focus:border-[#0f3d3e]"><option value="">No representative</option>{reps.map(r => <option key={r._id} value={r._id}>{r.name} - {r.email}</option>)}</select></div>
        <button className="mt-3 h-10 rounded-lg bg-[#0f3d3e] px-4 text-sm font-black text-white">Save ward</button>
      </form>

      <section className="rounded-lg border border-[#ded6c8] bg-white shadow-sm"><div className="border-b border-[#eee6d8] px-5 py-3"><h2 className="text-sm font-black text-[#102a2b]">Ward representative applications</h2></div><div className="divide-y divide-[#f2ede4]">{loading ? <p className="p-5 text-sm text-[#65706c]">Loading...</p> : applications.length === 0 ? <p className="p-5 text-sm text-[#65706c]">No applications yet.</p> : applications.map(a => <div key={a._id} className="grid gap-3 p-5 lg:grid-cols-[1fr_auto]"><div><p className="font-black text-[#102a2b]">{a.name} <span className="text-xs font-bold text-[#8c8272]">{a.email}</span></p><p className="mt-1 text-sm text-[#65706c]">{a.wardRepresentativeApplication?.province} / {a.wardRepresentativeApplication?.district} / {a.wardRepresentativeApplication?.municipality || 'Municipality not set'} / Ward {a.wardRepresentativeApplication?.ward}</p><p className="mt-2 rounded-lg bg-[#fffaf2] p-3 text-sm text-[#65706c]">{a.wardRepresentativeApplication?.details || 'No application detail.'}</p><span className="mt-2 inline-block rounded-md bg-amber-50 px-2 py-1 text-[10px] font-black uppercase tracking-wide text-amber-700">{a.wardRepresentativeApplication?.status || 'pending'}</span></div><div className="flex items-start gap-2">{a.wardRepresentativeApplication?.status === 'pending' && <><button onClick={() => review(a._id, 'approved')} className="inline-flex h-9 items-center gap-1 rounded-lg bg-emerald-600 px-3 text-xs font-black text-white"><Check className="h-3.5 w-3.5" />Approve</button><button onClick={() => review(a._id, 'rejected')} className="inline-flex h-9 items-center gap-1 rounded-lg bg-red-600 px-3 text-xs font-black text-white"><X className="h-3.5 w-3.5" />Reject + Ban</button></>}</div></div>)}</div></section>

      <section className="rounded-lg border border-[#ded6c8] bg-white shadow-sm"><div className="border-b border-[#eee6d8] px-5 py-3"><h2 className="flex items-center gap-2 text-sm font-black text-[#102a2b]"><MapPinned className="h-4 w-4 text-[#dc143c]" />Managed wards</h2></div><div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-b border-[#eee6d8] text-left text-[10px] font-black uppercase tracking-[0.14em] text-[#8c8272]"><th className="px-5 py-3">Province</th><th className="px-5 py-3">District</th><th className="px-5 py-3">Municipality</th><th className="px-5 py-3">Ward</th><th className="px-5 py-3">Representative</th></tr></thead><tbody className="divide-y divide-[#f2ede4]">{wards.map(w => <tr key={w._id}><td className="px-5 py-3">{w.province}</td><td className="px-5 py-3">{w.district}</td><td className="px-5 py-3">{w.municipality || '-'}</td><td className="px-5 py-3">{w.ward}</td><td className="px-5 py-3">{w.representative?.name || 'Unassigned'}</td></tr>)}</tbody></table></div></section>
    </div>
  );
}
