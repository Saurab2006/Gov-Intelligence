'use client';
import { useEffect, useState } from 'react';
import { get, post } from '@/lib/api';
import { relativeTime, cn } from '@/lib/format';
import { toast } from 'sonner';
import {
  Building2, Star, Plus, Sparkles, Loader2, X, Phone, Mail, MapPin, ChevronDown, ChevronUp,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function AuthoritiesPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const canSuggest = user?.role === 'admin' || user?.role === 'analyst';

  const [authorities, setAuthorities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [districtFilter, setDistrictFilter] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [showSuggestBox, setShowSuggestBox] = useState(false);
  const [suggestDistrict, setSuggestDistrict] = useState('');
  const [suggesting, setSuggesting] = useState(false);
  const [expanded, setExpanded] = useState(null);

  const load = () => {
    setLoading(true);
    const q = districtFilter ? `?district=${encodeURIComponent(districtFilter)}` : '';
    get('/api/authorities' + q).then(r => setAuthorities(r.authorities || [])).catch(() => toast.error('Failed to load authorities')).finally(() => setLoading(false));
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [districtFilter]);

  const runAiSuggest = async () => {
    if (!suggestDistrict.trim()) { toast.error('Enter a district first'); return; }
    setSuggesting(true);
    try {
      const { message } = await post('/api/authorities/ai-suggest', { district: suggestDistrict.trim() });
      toast.success(message);
      setShowSuggestBox(false);
      setSuggestDistrict('');
      load();
    } catch (err) { toast.error(err.message); }
    setSuggesting(false);
  };

  return (
    <div className="max-w-[1200px] mx-auto space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Authorities</h1>
          <p className="text-sm text-gray-500 mt-1">See which authorities are resolving issues well, and rate them yourself</p>
        </div>
        <div className="flex gap-2">
          {canSuggest && (
            <button onClick={() => setShowSuggestBox(s => !s)} className="h-10 px-4 rounded-xl border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-brand-500" /> AI: Cover an Area
            </button>
          )}
          {isAdmin && (
            <button onClick={() => setShowAddForm(true)} className="h-10 px-4 rounded-xl bg-brand-500 text-white text-sm font-semibold hover:bg-brand-600 flex items-center gap-2">
              <Plus className="w-4 h-4" /> Add Authority
            </button>
          )}
        </div>
      </div>

      {showSuggestBox && (
        <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm flex flex-wrap items-center gap-2">
          <p className="text-xs text-gray-500 flex-1 min-w-[220px]">
            Give a district and the AI will add any missing authority types (roads, disaster management, water, electricity, urban dev, ward office) for that area.
          </p>
          <input value={suggestDistrict} onChange={e => setSuggestDistrict(e.target.value)} placeholder="District, e.g. Kathmandu" className="h-9 px-3 rounded-lg border border-gray-200 text-xs outline-none focus:border-brand-500 w-48" />
          <button disabled={suggesting} onClick={runAiSuggest} className="h-9 px-3 rounded-lg bg-gray-900 text-white text-xs font-semibold hover:bg-gray-800 disabled:opacity-60 flex items-center gap-1.5">
            {suggesting && <Loader2 className="w-3.5 h-3.5 animate-spin" />} Generate
          </button>
        </div>
      )}

      <input value={districtFilter} onChange={e => setDistrictFilter(e.target.value)} placeholder="Filter by district…" className="h-9 px-3 rounded-lg border border-gray-200 bg-white text-xs font-medium outline-none focus:border-brand-500 w-56" />

      {loading ? (
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">{Array.from({ length: 6 }).map((_, i) => <div key={i} className="shimmer h-[140px] rounded-2xl" />)}</div>
      ) : authorities.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-16 text-center text-gray-400">
          <Building2 className="w-8 h-8 mx-auto mb-2 text-gray-300" />
          No authorities registered yet.
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {authorities.map(a => (
            <AuthorityCard key={a._id} authority={a} expanded={expanded === a._id} onToggle={() => setExpanded(expanded === a._id ? null : a._id)} onChanged={load} />
          ))}
        </div>
      )}

      {showAddForm && <AddAuthorityForm onClose={() => setShowAddForm(false)} onCreated={() => { setShowAddForm(false); load(); }} />}
    </div>
  );
}

function AuthorityCard({ authority, expanded, onToggle, onChanged }) {
  const [reviews, setReviews] = useState([]);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!expanded) return;
    setLoadingReviews(true);
    get(`/api/authorities/${authority._id}/reviews`).then(r => setReviews(r.reviews || [])).catch(() => {}).finally(() => setLoadingReviews(false));
  }, [expanded, authority._id]);

  const submitReview = async () => {
    setSubmitting(true);
    try {
      await post(`/api/authorities/${authority._id}/reviews`, { rating, comment });
      toast.success('Review submitted');
      setComment('');
      const r = await get(`/api/authorities/${authority._id}/reviews`);
      setReviews(r.reviews || []);
      onChanged();
    } catch (err) { toast.error(err.message); }
    setSubmitting(false);
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm flex flex-col">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold text-gray-900">{authority.name}</h3>
          {authority.district && <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1"><MapPin className="w-3 h-3" />{authority.district}</p>}
        </div>
        <span className={cn('text-[10px] font-semibold uppercase tracking-wide px-2 py-1 rounded-md shrink-0', authority.source === 'ai' ? 'bg-violet-50 text-violet-700' : authority.source === 'seed' ? 'bg-gray-100 text-gray-500' : 'bg-brand-50 text-brand-700')}>
          {authority.source === 'ai' ? 'AI added' : authority.source === 'seed' ? 'Default' : 'Admin added'}
        </span>
      </div>

      <div className="flex items-center gap-1 mt-3">
        {[1, 2, 3, 4, 5].map(n => <Star key={n} className={cn('w-3.5 h-3.5', n <= Math.round(authority.ratingAvg) ? 'fill-amber-400 text-amber-400' : 'text-gray-200')} />)}
        <span className="text-xs font-semibold text-gray-700 ml-1">{authority.ratingAvg?.toFixed(1) || '0.0'}</span>
        <span className="text-xs text-gray-400">({authority.ratingCount || 0} review{authority.ratingCount === 1 ? '' : 's'})</span>
      </div>

      {(authority.contactEmail || authority.contactPhone) && (
        <div className="mt-2 space-y-0.5">
          {authority.contactPhone && <p className="text-xs text-gray-500 flex items-center gap-1"><Phone className="w-3 h-3" />{authority.contactPhone}</p>}
          {authority.contactEmail && <p className="text-xs text-gray-500 flex items-center gap-1"><Mail className="w-3 h-3" />{authority.contactEmail}</p>}
        </div>
      )}

      <button onClick={onToggle} className="mt-3 text-xs font-semibold text-brand-600 flex items-center gap-1 hover:underline">
        {expanded ? <>Hide reviews <ChevronUp className="w-3.5 h-3.5" /></> : <>See reviews & rate <ChevronDown className="w-3.5 h-3.5" /></>}
      </button>

      {expanded && (
        <div className="mt-3 pt-3 border-t border-gray-50 space-y-3">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-0.5">
              {[1, 2, 3, 4, 5].map(n => (
                <button key={n} type="button" onClick={() => setRating(n)}>
                  <Star className={cn('w-4 h-4', n <= rating ? 'fill-amber-400 text-amber-400' : 'text-gray-200')} />
                </button>
              ))}
            </div>
            <input value={comment} onChange={e => setComment(e.target.value)} placeholder="Add a comment (optional)" className="flex-1 min-w-[140px] h-8 px-2 rounded-lg border border-gray-200 text-xs outline-none focus:border-brand-500" />
            <button disabled={submitting} onClick={submitReview} className="h-8 px-2.5 rounded-lg bg-gray-900 text-white text-xs font-semibold hover:bg-gray-800 disabled:opacity-60">
              {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Rate'}
            </button>
          </div>

          {loadingReviews ? (
            <div className="shimmer h-12 rounded-lg" />
          ) : reviews.length === 0 ? (
            <p className="text-xs text-gray-400">No reviews yet.</p>
          ) : (
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {reviews.map(r => (
                <div key={r._id} className="text-xs">
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map(n => <Star key={n} className={cn('w-2.5 h-2.5', n <= r.rating ? 'fill-amber-400 text-amber-400' : 'text-gray-200')} />)}
                    <span className="font-medium text-gray-700">{r.user?.name || 'User'}</span>
                    <span className="text-[10px] text-gray-400">· {relativeTime(r.createdAt)}</span>
                  </div>
                  {r.comment && <p className="text-gray-500 mt-0.5">{r.comment}</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function AddAuthorityForm({ onClose, onCreated }) {
  const [form, setForm] = useState({ name: '', department: '', district: '', contactEmail: '', contactPhone: '' });
  const [submitting, setSubmitting] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) { toast.error('Authority name is required'); return; }
    setSubmitting(true);
    try {
      await post('/api/authorities', form);
      toast.success('Authority added');
      onCreated();
    } catch (err) { toast.error(err.message); }
    setSubmitting(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4" onClick={onClose}>
      <form onClick={e => e.stopPropagation()} onSubmit={submit} className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2"><Building2 className="w-4 h-4 text-brand-500" />Add Authority</h3>
          <button type="button" onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-50"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-5 space-y-3">
          <Field label="Name"><input value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Department of Roads — Kathmandu" className="input" /></Field>
          <Field label="Department (optional)"><input value={form.department} onChange={e => set('department', e.target.value)} className="input" /></Field>
          <Field label="District (optional)"><input value={form.district} onChange={e => set('district', e.target.value)} className="input" /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Contact phone"><input value={form.contactPhone} onChange={e => set('contactPhone', e.target.value)} className="input" /></Field>
            <Field label="Contact email"><input value={form.contactEmail} onChange={e => set('contactEmail', e.target.value)} className="input" /></Field>
          </div>
        </div>
        <div className="px-5 py-4 border-t border-gray-100 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="h-10 px-4 rounded-xl border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50">Cancel</button>
          <button type="submit" disabled={submitting} className="h-10 px-4 rounded-xl bg-brand-500 text-white text-sm font-semibold hover:bg-brand-600 disabled:opacity-60 flex items-center gap-2">
            {submitting && <Loader2 className="w-4 h-4 animate-spin" />}Add Authority
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