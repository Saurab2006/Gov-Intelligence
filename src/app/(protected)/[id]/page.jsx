'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { get, post, patch } from '@/lib/api';
import { relativeTime, cn, initials } from '@/lib/format';
import { toast } from 'sonner';
import {
  ArrowLeft, MapPin, Clock, Copy, ShieldAlert, CheckCircle2, UserCheck,
  PlayCircle, Loader2, Star, Map as MapIcon, Radio, Plus,
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

// Ordered progression used to show the reporter a "live" sense of where the
// work stands, independent of the free-form timeline notes below it.
const LIVE_STEPS = ['pending', 'verified', 'assigned', 'in-progress', 'completed'];

export default function ReportDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const isStaff = user?.role === 'admin' || user?.role === 'analyst';

  const [report, setReport] = useState(null);
  const [meta, setMeta] = useState({ categories: [], authorities: [] });
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const [etaDays, setEtaDays] = useState('');
  const [assignDept, setAssignDept] = useState('');
  const [assignContact, setAssignContact] = useState('');
  const [fakeReason, setFakeReason] = useState('');
  const [showFakeBox, setShowFakeBox] = useState(false);

  const [authority, setAuthority] = useState(null);
  const [reviews, setReviews] = useState([]);

  const load = () => {
    setLoading(true);
    Promise.all([get(`/api/reports/${id}`), get('/api/reports/meta')])
      .then(([r, m]) => { setReport(r.report); setMeta(m); setEtaDays(String(r.report.estimatedDays)); setAssignDept(r.report.assignedDepartment || m.authorities[0]); setAssignContact(r.report.assignedContact || ''); })
      .catch(() => toast.error('Failed to load report'))
      .finally(() => setLoading(false));
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [id]);

  // Once we know which authority this report is assigned to, look up its
  // profile + reviews so people can see (and rate) how it's performing.
  useEffect(() => {
    if (!report?.assignedDepartment) { setAuthority(null); setReviews([]); return; }
    get('/api/authorities').then(({ authorities }) => {
      const match = authorities.find(a => a.name === report.assignedDepartment) || null;
      setAuthority(match);
      if (match) get(`/api/authorities/${match._id}/reviews`).then(({ reviews }) => setReviews(reviews)).catch(() => {});
    }).catch(() => {});
    // eslint-disable-next-line
  }, [report?.assignedDepartment]);

  const refreshReviews = () => {
    if (!authority) return;
    get('/api/authorities').then(({ authorities }) => setAuthority(authorities.find(a => a._id === authority._id) || authority)).catch(() => {});
    get(`/api/authorities/${authority._id}/reviews`).then(({ reviews }) => setReviews(reviews)).catch(() => {});
  };

  const act = async (action, payload, successMsg) => {
    setBusy(true);
    try {
      const { report: updated } = await patch(`/api/reports/${id}`, { action, ...payload });
      setReport(prev => ({ ...updated, duplicates: prev.duplicates }));
      toast.success(successMsg);
      load();
    } catch (err) { toast.error(err.message); }
    setBusy(false);
  };

  if (loading) return <div className="max-w-[900px] mx-auto space-y-4"><div className="shimmer h-8 w-40 rounded-lg" /><div className="shimmer h-64 rounded-2xl" /></div>;
  if (!report) return <div className="max-w-[900px] mx-auto text-center py-16 text-gray-400">Report not found.</div>;

  const categoryLabel = meta.categories.find(c => c.value === report.category)?.label || report.category;

  return (
    <div className="max-w-[900px] mx-auto space-y-5">
      <button onClick={() => router.push('/issues')} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800"><ArrowLeft className="w-4 h-4" />Back to Community Reports</button>

      <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className={cn('text-[10px] font-semibold uppercase tracking-wide px-2 py-1 rounded-md border', STATUS_STYLE[report.status])}>{report.status.replace('-', ' ')}</span>
              <span className="text-[10px] font-semibold uppercase tracking-wide px-2 py-1 rounded-md bg-gray-100 text-gray-600">{report.severity}</span>
              {report.isFake && <span className="text-[10px] font-semibold uppercase tracking-wide px-2 py-1 rounded-md bg-red-50 text-red-700 flex items-center gap-1"><ShieldAlert className="w-3 h-3" />Flagged fake</span>}
            </div>
            <h1 className="text-xl font-bold text-gray-900 mt-2">{report.title}</h1>
            <p className="text-sm text-gray-500 mt-1 flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{report.location.address}{report.location.district ? `, ${report.location.district}` : ''}{report.location.ward ? `, Ward ${report.location.ward}` : ''}</p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-[10px] uppercase tracking-wide text-gray-400 font-semibold">{categoryLabel}</p>
            <p className="text-xs text-gray-400 mt-1">Reported {relativeTime(report.createdAt)}</p>
          </div>
        </div>

        <p className="text-sm text-gray-700 leading-relaxed">{report.description}</p>

        <div className="flex flex-wrap gap-2 pt-1">
          <InfoPill icon={Clock} label={report.status === 'completed' ? `Resolved ${relativeTime(report.completedAt)}` : `AI estimate: ${report.estimatedDays} day(s) — due ${new Date(report.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`} />
          {report.confirmations > 1 && <InfoPill icon={Copy} label={`${report.confirmations} citizens reported this issue`} />}
          {report.assignedDepartment && <InfoPill icon={UserCheck} label={`Assigned to ${report.assignedDepartment}${report.assignedContact ? ` · ${report.assignedContact}` : ''}`} />}
        </div>

        {report.reportedBy && (
          <div className="flex items-center gap-2 pt-2 border-t border-gray-50">
            <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0" style={{ background: `linear-gradient(135deg, hsl(${report.reportedBy.avatarHue} 65% 52%), hsl(${(report.reportedBy.avatarHue + 40) % 360} 60% 45%))` }}>{initials(report.reportedBy.name)}</div>
            <p className="text-xs text-gray-500">Reported by <span className="font-medium text-gray-700">{report.reportedBy.name}</span>{report.reporterContact ? ` · ${report.reporterContact}` : ''}</p>
          </div>
        )}
      </div>

      {!['rejected', 'duplicate'].includes(report.status) && <LiveTrackingCard report={report} />}

      <MapCard location={report.location} />

      {isStaff && !['completed', 'rejected'].includes(report.status) && (
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm space-y-5">
          <h3 className="text-sm font-semibold text-gray-900">Manage this report</h3>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <p className="text-xs font-semibold text-gray-700">Assign to authority</p>
              <div className="flex gap-2">
                <select value={assignDept} onChange={e => setAssignDept(e.target.value)} className="flex-1 h-9 px-2 rounded-lg border border-gray-200 text-xs outline-none focus:border-brand-500">
                  {meta.authorities.map(a => <option key={a} value={a}>{a}</option>)}
                </select>
              </div>
              <input value={assignContact} onChange={e => setAssignContact(e.target.value)} placeholder="Contact person (optional)" className="w-full h-9 px-2 rounded-lg border border-gray-200 text-xs outline-none focus:border-brand-500" />
              <button disabled={busy} onClick={() => act('assign', { assignedDepartment: assignDept, assignedContact: assignContact }, 'Assigned')} className="h-9 px-3 rounded-lg bg-gray-900 text-white text-xs font-semibold hover:bg-gray-800 disabled:opacity-60">Assign</button>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-semibold text-gray-700">AI-suggested completion (editable)</p>
              <div className="flex gap-2">
                <input type="number" min="1" value={etaDays} onChange={e => setEtaDays(e.target.value)} className="w-24 h-9 px-2 rounded-lg border border-gray-200 text-xs outline-none focus:border-brand-500" />
                <span className="text-xs text-gray-500 self-center">day(s)</span>
                <button disabled={busy} onClick={() => act('set-eta', { estimatedDays: etaDays }, 'Estimate updated')} className="h-9 px-3 rounded-lg bg-gray-900 text-white text-xs font-semibold hover:bg-gray-800 disabled:opacity-60">Save</button>
              </div>
              <div className="flex gap-1.5">
                {[1, 3, 7].map(extra => (
                  <button key={extra} type="button" disabled={busy} onClick={() => setEtaDays(String((Number(etaDays) || 0) + extra))} className="h-7 px-2 rounded-md border border-gray-200 text-[11px] font-medium text-gray-600 hover:bg-gray-50 flex items-center gap-1">
                    <Plus className="w-3 h-3" />{extra}d
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-50">
            {report.status === 'pending' && <ActionButton icon={CheckCircle2} label="Verify" onClick={() => act('verify', {}, 'Marked verified')} busy={busy} />}
            {['assigned', 'verified'].includes(report.status) && <ActionButton icon={PlayCircle} label="Start work" onClick={() => act('start', {}, 'Work started')} busy={busy} />}
            <ActionButton icon={CheckCircle2} label="Mark completed" tone="success" onClick={() => act('complete', {}, 'Marked complete — reporters notified')} busy={busy} />
            <ActionButton icon={ShieldAlert} label="Flag as fake" tone="danger" onClick={() => setShowFakeBox(s => !s)} busy={busy} />
          </div>

          {showFakeBox && (
            <div className="flex gap-2 pt-1">
              <input value={fakeReason} onChange={e => setFakeReason(e.target.value)} placeholder="Why is this report fake or invalid?" className="flex-1 h-9 px-2 rounded-lg border border-gray-200 text-xs outline-none focus:border-red-400" />
              <button disabled={busy || !fakeReason.trim()} onClick={() => act('mark-fake', { reason: fakeReason }, 'Report closed as fake').then(() => setShowFakeBox(false))} className="h-9 px-3 rounded-lg bg-red-600 text-white text-xs font-semibold hover:bg-red-700 disabled:opacity-60">Confirm</button>
            </div>
          )}
        </div>
      )}

      {report.duplicates?.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm space-y-3">
          <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2"><Copy className="w-4 h-4 text-gray-400" />Other reports of the same issue ({report.duplicates.length})</h3>
          <div className="space-y-2">
            {report.duplicates.map(d => (
              <div key={d._id} className="flex items-center justify-between text-xs bg-gray-50 rounded-lg px-3 py-2">
                <span className="text-gray-600">{d.reportedBy?.name || 'Citizen'} — {relativeTime(d.createdAt)}</span>
                <span className="text-gray-400">{d.location.address}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">Timeline</h3>
        <div className="space-y-4">
          {report.timeline.slice().reverse().map((t, i) => (
            <div key={i} className="flex gap-3">
              <div className="w-6 h-6 rounded-full bg-brand-50 border border-brand-100 flex items-center justify-center shrink-0 mt-0.5"><div className="w-1.5 h-1.5 rounded-full bg-brand-500" /></div>
              <div>
                <p className="text-xs font-semibold text-gray-800 capitalize">{t.action.replace(/-/g, ' ')}{t.by ? ` — ${t.by.name}` : ''}</p>
                {t.note && <p className="text-xs text-gray-500 mt-0.5">{t.note}</p>}
                <p className="text-[10px] text-gray-400 mt-0.5">{relativeTime(t.at)}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {report.assignedDepartment && (
        <ReviewsCard authority={authority} authorityName={report.assignedDepartment} reportId={report._id} reviews={reviews} onChanged={refreshReviews} />
      )}
    </div>
  );
}

function LiveTrackingCard({ report }) {
  const stepIndex = LIVE_STEPS.indexOf(report.status);
  const dueDate = report.dueDate ? new Date(report.dueDate) : null;
  const overdue = dueDate && report.status !== 'completed' && dueDate.getTime() < Date.now();
  const daysLeft = dueDate ? Math.ceil((dueDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : null;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2"><Radio className="w-4 h-4 text-brand-500" />Live tracking</h3>
        {report.status !== 'completed' && (
          <span className={cn('text-[10px] font-semibold uppercase tracking-wide px-2 py-1 rounded-md', overdue ? 'bg-red-50 text-red-700' : 'bg-gray-100 text-gray-600')}>
            {overdue ? `${Math.abs(daysLeft)} day(s) overdue` : daysLeft != null ? `${daysLeft} day(s) left` : ''}
          </span>
        )}
      </div>
      <div className="flex items-center">
        {LIVE_STEPS.map((step, i) => (
          <div key={step} className="flex items-center flex-1 last:flex-initial">
            <div className={cn('w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-[10px] font-bold border-2',
              i <= stepIndex ? 'bg-brand-500 border-brand-500 text-white' : 'bg-white border-gray-200 text-gray-300')}>
              {i <= stepIndex ? <CheckCircle2 className="w-3.5 h-3.5" /> : i + 1}
            </div>
            {i < LIVE_STEPS.length - 1 && <div className={cn('h-0.5 flex-1 mx-1', i < stepIndex ? 'bg-brand-500' : 'bg-gray-200')} />}
          </div>
        ))}
      </div>
      <div className="flex justify-between text-[10px] font-medium text-gray-400 uppercase tracking-wide -mt-2">
        {LIVE_STEPS.map(step => <span key={step} className="flex-1 text-center first:text-left last:text-right">{step.replace('-', ' ')}</span>)}
      </div>
    </div>
  );
}

function MapCard({ location }) {
  const hasCoords = Number.isFinite(location?.lat) && Number.isFinite(location?.lng);
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm space-y-3">
      <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2"><MapIcon className="w-4 h-4 text-gray-400" />Location</h3>
      {hasCoords ? (
        <div className="rounded-xl overflow-hidden border border-gray-100">
          <iframe
            title="Report location"
            className="w-full h-64"
            src={`https://www.openstreetmap.org/export/embed.html?bbox=${location.lng - 0.01}%2C${location.lat - 0.01}%2C${location.lng + 0.01}%2C${location.lat + 0.01}&layer=mapnik&marker=${location.lat}%2C${location.lng}`}
          />
          <a
            className="block text-center text-xs text-brand-600 hover:underline py-2 bg-gray-50"
            href={`https://www.openstreetmap.org/?mlat=${location.lat}&mlon=${location.lng}#map=17/${location.lat}/${location.lng}`}
            target="_blank" rel="noreferrer"
          >
            Open larger map
          </a>
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-gray-200 p-6 text-center text-xs text-gray-400">
          No GPS coordinates were pinned for this report — only the written address is available.
        </div>
      )}
    </div>
  );
}

function ReviewsCard({ authority, authorityName, reportId, reviews, onChanged }) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const submitReview = async () => {
    if (!authority) { toast.error('This authority isn\'t registered yet — ask an admin to add it'); return; }
    setSubmitting(true);
    try {
      await post(`/api/authorities/${authority._id}/reviews`, { rating, comment, report: reportId });
      toast.success('Review submitted');
      setComment('');
      onChanged();
    } catch (err) { toast.error(err.message); }
    setSubmitting(false);
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900">Reviews — {authorityName}</h3>
        {authority && (
          <span className="flex items-center gap-1 text-xs font-semibold text-amber-600">
            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />{authority.ratingAvg?.toFixed(1) || '0.0'}
            <span className="text-gray-400 font-normal">({authority.ratingCount || 0})</span>
          </span>
        )}
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map(n => (
            <button key={n} type="button" onClick={() => setRating(n)}>
              <Star className={cn('w-5 h-5', n <= rating ? 'fill-amber-400 text-amber-400' : 'text-gray-200')} />
            </button>
          ))}
        </div>
        <input value={comment} onChange={e => setComment(e.target.value)} placeholder="How is this authority handling it?" className="flex-1 min-w-[180px] h-9 px-2 rounded-lg border border-gray-200 text-xs outline-none focus:border-brand-500" />
        <button disabled={submitting} onClick={submitReview} className="h-9 px-3 rounded-lg bg-gray-900 text-white text-xs font-semibold hover:bg-gray-800 disabled:opacity-60">
          {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Submit review'}
        </button>
      </div>

      <div className="space-y-3 pt-2 border-t border-gray-50">
        {reviews.length === 0 ? (
          <p className="text-xs text-gray-400">No reviews yet — be the first to rate this authority.</p>
        ) : reviews.map(r => (
          <div key={r._id} className="flex items-start justify-between gap-3 text-xs">
            <div>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map(n => <Star key={n} className={cn('w-3 h-3', n <= r.rating ? 'fill-amber-400 text-amber-400' : 'text-gray-200')} />)}
                <span className="font-medium text-gray-700 ml-1">{r.user?.name || 'User'}</span>
              </div>
              {r.comment && <p className="text-gray-500 mt-0.5">{r.comment}</p>}
            </div>
            <span className="text-[10px] text-gray-400 shrink-0">{relativeTime(r.createdAt)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function InfoPill({ icon: Icon, label }) {
  return <span className="inline-flex items-center gap-1.5 text-xs text-gray-600 bg-gray-50 border border-gray-100 rounded-lg px-2.5 py-1.5"><Icon className="w-3.5 h-3.5 text-gray-400" />{label}</span>;
}

function ActionButton({ icon: Icon, label, onClick, busy, tone }) {
  const toneClass = tone === 'danger' ? 'bg-red-50 text-red-700 hover:bg-red-100' : tone === 'success' ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100' : 'bg-gray-100 text-gray-700 hover:bg-gray-200';
  return (
    <button disabled={busy} onClick={onClick} className={cn('h-9 px-3 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-60', toneClass)}>
      {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Icon className="w-3.5 h-3.5" />}{label}
    </button>
  );
}