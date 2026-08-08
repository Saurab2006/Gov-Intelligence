'use client';
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { get, post } from '@/lib/api';
import { relativeTime, cn } from '@/lib/format';
import { toast } from 'sonner';
import {
  AlertTriangle, MapPin, Plus, ArrowRight, Clock, Copy, ShieldAlert,
  Loader2, X, Crosshair, Check, ImageIcon,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

const STATUS_STYLE = {
  pending: 'bg-amber-50 text-amber-700 border-amber-100',
  verified: 'bg-blue-50 text-blue-700 border-blue-100',
  assigned: 'bg-violet-50 text-violet-700 border-violet-100',
  'in-progress': 'bg-cyan-50 text-cyan-700 border-cyan-100',
  completed: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  rejected: 'bg-gray-100 text-gray-500 border-gray-200',
  duplicate: 'bg-gray-100 text-gray-500 border-gray-200',
};
const SEVERITY_STYLE = {
  low: 'bg-gray-100 text-gray-600', medium: 'bg-amber-100 text-amber-700',
  high: 'bg-orange-100 text-orange-700', critical: 'bg-red-100 text-red-700',
};
const STATUS_FILTERS = ['all', 'pending', 'verified', 'assigned', 'in-progress', 'completed', 'rejected', 'duplicate'];

function StatusBadge({ status }) {
  return <span className={cn('text-[10px] font-semibold uppercase tracking-wide px-2 py-1 rounded-md border', STATUS_STYLE[status] || STATUS_STYLE.pending)}>{status.replace('-', ' ')}</span>;
}

export default function IssuesPage() {
  const { user } = useAuth();
  const isStaff = user?.role === 'admin' || user?.role === 'analyst';
  const isResearcher = user?.role === 'researcher';

  const [meta, setMeta] = useState({ categories: [], authorities: [] });
  const [stats, setStats] = useState(null);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [viewMine, setViewMine] = useState(false);
  const [viewFlagged, setViewFlagged] = useState(false);

  const load = () => {
    setLoading(true);
    const q = new URLSearchParams({ status: statusFilter, category: categoryFilter, mine: String(viewMine), flagged: String(viewFlagged) });
    Promise.all([get('/api/reports?' + q.toString()), get('/api/reports/stats')])
      .then(([r, s]) => { setReports(r.reports || []); setStats(s); })
      .catch(() => toast.error('Failed to load reports'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { get('/api/reports/meta').then(setMeta).catch(() => {}); }, []);
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [statusFilter, categoryFilter, viewMine, viewFlagged]);

  const categoryLabel = (v) => meta.categories.find(c => c.value === v)?.label || v;

  return (
    <div className="max-w-[1400px] mx-auto space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Community Reports</h1>
          <p className="text-sm text-gray-500 mt-1">
            {isStaff ? 'Review, assign, and resolve issues reported by citizens' : 'Report a flooded road, blocked tunnel, or other hazard near you'}
          </p>
        </div>
        {isResearcher && (
          <button onClick={() => setShowForm(true)} className="h-10 px-4 rounded-xl bg-brand-500 text-white text-sm font-semibold hover:bg-brand-600 active:translate-y-px transition-all flex items-center gap-2">
            <Plus className="w-4 h-4" /> Report an Issue
          </button>
        )}
      </div>

      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <StatCard label="Total" value={stats.total} />
          <StatCard label="Pending Review" value={stats.pending} accent="text-amber-600" />
          <StatCard label="Active" value={stats.active} accent="text-blue-600" />
          <StatCard label="Completed" value={stats.completed} accent="text-emerald-600" />
          <StatCard label="Flagged / Fake" value={stats.flagged} accent="text-red-600" />
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="h-9 px-3 rounded-lg border border-gray-200 bg-white text-xs font-medium outline-none focus:border-brand-500">
          {STATUS_FILTERS.map(s => <option key={s} value={s}>{s === 'all' ? 'All statuses' : s.replace('-', ' ')}</option>)}
        </select>
        <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} className="h-9 px-3 rounded-lg border border-gray-200 bg-white text-xs font-medium outline-none focus:border-brand-500">
          <option value="all">All categories</option>
          {meta.categories.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
        </select>
        {isStaff && (
          <>
            <FilterToggle active={viewMine} onClick={() => setViewMine(v => !v)} label="Assigned/reported by me" />
            <FilterToggle active={viewFlagged} onClick={() => setViewFlagged(v => !v)} label="Flagged as fake" icon={ShieldAlert} />
          </>
        )}
      </div>

      {loading ? (
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">{Array.from({ length: 6 }).map((_, i) => <div key={i} className="shimmer h-[180px] rounded-2xl" />)}</div>
      ) : reports.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-16 text-center text-gray-400">
          <AlertTriangle className="w-8 h-8 mx-auto mb-2 text-gray-300" />
          No reports match these filters yet.
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {reports.map(r => (
            <Link key={r._id} href={`/issues/${r._id}`} className="group bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:border-gray-200 hover:shadow-md transition-all flex flex-col">
              <div className="flex items-start justify-between gap-2">
                <StatusBadge status={r.status} />
                <span className={cn('text-[10px] font-semibold uppercase tracking-wide px-2 py-1 rounded-md', SEVERITY_STYLE[r.severity])}>{r.severity}</span>
              </div>
              <h3 className="mt-3 text-sm font-semibold text-gray-900 line-clamp-2">{r.title}</h3>
              <p className="text-xs text-gray-500 mt-1 flex items-center gap-1"><MapPin className="w-3 h-3 shrink-0" />{r.location.address}{r.location.district ? `, ${r.location.district}` : ''}</p>
              <p className="text-xs text-gray-400 mt-1">{categoryLabel(r.category)}</p>{r.photo && <img src={r.photo} alt="Report evidence" className="mt-3 h-28 w-full rounded-xl object-cover border border-gray-100" />}

              <div className="mt-3 flex flex-wrap gap-1.5">
                {r.confirmations > 1 && <span className="text-[10px] font-medium text-gray-600 bg-gray-100 rounded-md px-2 py-0.5 flex items-center gap-1"><Copy className="w-3 h-3" />{r.confirmations} reports</span>}
                {r.assignedDepartment && <span className="text-[10px] font-medium text-violet-700 bg-violet-50 rounded-md px-2 py-0.5">{r.assignedDepartment}</span>}
                {r.isFake && <span className="text-[10px] font-medium text-red-700 bg-red-50 rounded-md px-2 py-0.5 flex items-center gap-1"><ShieldAlert className="w-3 h-3" />Flagged</span>}
              </div>

              <div className="mt-auto pt-4 flex items-center justify-between text-xs text-gray-400">
                <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{r.status === 'completed' ? `Resolved ${relativeTime(r.completedAt)}` : `ETA ${new Date(r.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`}</span>
                <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-brand-500 group-hover:translate-x-0.5 transition-all" />
              </div>
            </Link>
          ))}
        </div>
      )}

      {showForm && <ReportForm meta={meta} onClose={() => setShowForm(false)} onCreated={() => { setShowForm(false); load(); }} />}
    </div>
  );
}

function StatCard({ label, value, accent }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">{label}</p>
      <p className={cn('text-xl font-bold mt-1 tabular-nums', accent || 'text-gray-900')}>{value}</p>
    </div>
  );
}

function FilterToggle({ active, onClick, label, icon: Icon }) {
  return (
    <button onClick={onClick} className={cn('h-9 px-3 rounded-lg border text-xs font-medium flex items-center gap-1.5 transition-colors', active ? 'bg-brand-50 border-brand-200 text-brand-700' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50')}>
      {Icon && <Icon className="w-3.5 h-3.5" />}{label}
    </button>
  );
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('Could not read the file'));
    reader.readAsDataURL(file);
  });
}
const SEVERITIES = [
  { value: 'low', label: 'Low — minor inconvenience' },
  { value: 'medium', label: 'Medium — needs attention soon' },
  { value: 'high', label: 'High — actively disruptive' },
  { value: 'critical', label: 'Critical — danger to safety' },
];

function ReportForm({ meta, onClose, onCreated }) {
  const [form, setForm] = useState({ title: '', category: meta.categories[0]?.value || 'flood', severity: 'medium', description: '', address: '', district: '', municipality: '', ward: '', reporterContact: '' });
  const [submitting, setSubmitting] = useState(false);
  const [coords, setCoords] = useState(null);
  const [locating, setLocating] = useState(false);
  const [photoFile, setPhotoFile] = useState(null);
  const [photoError, setPhotoError] = useState('');
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));


  const handlePhotoChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { setPhotoError('Please upload an image'); return; }
    if (file.size > 5 * 1024 * 1024) { setPhotoError('Photo is too large - max 5MB'); return; }
    setPhotoError('');
    try {
      const dataUrl = await fileToDataUrl(file);
      setPhotoFile({ name: file.name, dataUrl });
    } catch {
      setPhotoError('Could not read that photo');
    }
  };
  const captureLocation = () => {
    if (!navigator.geolocation) { toast.error('Location isn\'t available in this browser'); return; }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => { setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }); setLocating(false); toast.success('Location pinned — this will show on the map'); },
      () => { setLocating(false); toast.error('Could not get your location'); },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.description.trim() || !form.address.trim()) { toast.error('Title, description and address are required'); return; }
    if (!form.reporterContact.trim()) { toast.error('Please add a contact number — it\'s required so authorities can reach you'); return; }
    if (!coords) { toast.error('Please pin your live location — it\'s required to submit a report'); return; }
    setSubmitting(true);
    try {
      const { report } = await post('/api/reports', {
        title: form.title, category: form.category, severity: form.severity, description: form.description,
        reporterContact: form.reporterContact,
        photo: photoFile?.dataUrl || '', photoName: photoFile?.name || '',
        location: { address: form.address, district: form.district, municipality: form.municipality, ward: form.ward, lat: coords?.lat ?? null, lng: coords?.lng ?? null },
      });
      if (report.duplicateOfTitle) {
        toast.success(`Linked to an existing report: "${report.duplicateOfTitle}". You'll be notified when it's resolved.`);
      } else {
        toast.success(`Reported — AI estimates ${report.estimatedDays} day(s) to resolve`);
      }
      onCreated();
    } catch (err) { toast.error(err.message); }
    setSubmitting(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4" onClick={onClose}>
      <form onClick={e => e.stopPropagation()} onSubmit={submit} className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white">
          <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-brand-500" />Report an Issue</h3>
          <button type="button" onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-50"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-5 space-y-4">
          <Field label="What's the problem?">
            <input value={form.title} onChange={e => set('title', e.target.value)} placeholder="e.g. Flooded underpass near Kalanki tunnel" className="input" />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Category">
              <select value={form.category} onChange={e => set('category', e.target.value)} className="input">
                {meta.categories.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </Field>
            <Field label="Severity">
              <select value={form.severity} onChange={e => set('severity', e.target.value)} className="input">
                {SEVERITIES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </Field>
          </div>
          <Field label="Description">
            <textarea value={form.description} onChange={e => set('description', e.target.value)} rows={3} placeholder="What's happening, since when, and who's affected?" className="input resize-none" />
          </Field>
          <Field label="Location / landmark">
            <input value={form.address} onChange={e => set('address', e.target.value)} placeholder="e.g. Kalanki tunnel, Ring Road" className="input" />
          </Field>
          <div>
            <button type="button" onClick={captureLocation} disabled={locating} className={cn('h-9 px-3 rounded-lg border text-xs font-semibold flex items-center gap-1.5 disabled:opacity-60', coords ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100')}>
              {locating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : coords ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Crosshair className="w-3.5 h-3.5" />}
              {coords ? 'Live location pinned — tap to update' : 'Pin my live location (required)'}
            </button>
            {!coords && <p className="mt-1 text-[11px] text-gray-400">We need your live GPS location so field teams can find the exact spot.</p>}
          </div>
          <div className="grid grid-cols-3 gap-3">
            <Field label="District"><input value={form.district} onChange={e => set('district', e.target.value)} className="input" /></Field>
            <Field label="Municipality"><input value={form.municipality} onChange={e => set('municipality', e.target.value)} className="input" /></Field>
            <Field label="Ward"><input value={form.ward} onChange={e => set('ward', e.target.value)} className="input" /></Field>
          </div>
          <div>
            <span className="block text-xs font-semibold text-gray-700 mb-1">Evidence photo (optional, max 5MB)</span>
            {!photoFile ? (
              <label className="flex h-20 cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 text-xs font-semibold text-gray-500 hover:border-brand-300 hover:bg-brand-50/40">
                <ImageIcon className="w-4 h-4" /> Upload photo
                <input type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" />
              </label>
            ) : (
              <div className="flex items-center gap-3 rounded-xl border border-emerald-100 bg-emerald-50 p-2">
                <img src={photoFile.dataUrl} alt="Evidence preview" className="h-14 w-16 rounded-lg object-cover" />
                <span className="min-w-0 flex-1 truncate text-xs font-semibold text-emerald-700">{photoFile.name}</span>
                <button type="button" onClick={() => setPhotoFile(null)} className="rounded-lg p-1 text-emerald-700 hover:bg-emerald-100"><X className="w-4 h-4" /></button>
              </div>
            )}
            {photoError && <p className="mt-1 text-xs text-red-500">{photoError}</p>}
          </div>
          <Field label="Your contact number (required)">
            <input value={form.reporterContact} onChange={e => set('reporterContact', e.target.value)} placeholder="e.g. 98XXXXXXXX" className="input" required />
            <span className="block mt-1 text-[11px] text-gray-400">Used to reach you for follow-up and to verify this isn't a fake report.</span>
          </Field>
        </div>
        <div className="px-5 py-4 border-t border-gray-100 flex justify-end gap-2 sticky bottom-0 bg-white">
          <button type="button" onClick={onClose} className="h-10 px-4 rounded-xl border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50">Cancel</button>
          <button type="submit" disabled={submitting} className="h-10 px-4 rounded-xl bg-brand-500 text-white text-sm font-semibold hover:bg-brand-600 disabled:opacity-60 flex items-center gap-2">
            {submitting && <Loader2 className="w-4 h-4 animate-spin" />}Submit Report
          </button>
        </div>
      </form>
      <style jsx global>{`.input{width:100%;padding:.5rem .75rem;border-radius:.75rem;border:1px solid #e5e7eb;font-size:.813rem;outline:none}.input:focus{border-color:#2563EB}`}</style>
    </div>
  );
}

function Field({ label, children }) {
  return <label className="block"><span className="block text-xs font-semibold text-gray-700 mb-1">{label}</span>{children}</label>;
}

