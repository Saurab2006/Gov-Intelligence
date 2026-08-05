'use client';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useAuth } from '@/context/AuthContext';
import { CivicBadge, CivicLogo } from '@/components/CivicBrand';
import { Eye, EyeOff, FileCheck2, Loader2, MapPinned, ShieldCheck, UploadCloud, UserRoundCheck, X } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

const ROLE_CARDS = [
  { value: 'researcher', title: 'Citizen', copy: 'Report a real problem, add your ward, and follow the fix until it is closed.' },
  { value: 'analyst', title: 'Local body staff', copy: 'Review reports, assign responsible teams, and keep citizens updated.' },
];

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('Could not read the file'));
    reader.readAsDataURL(file);
  });
}

export default function SignupPage() {
  const { signup } = useAuth();
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [docFile, setDocFile] = useState(null);
  const [docError, setDocError] = useState('');
  const { register, handleSubmit, watch, setValue, formState: { errors, isSubmitting } } = useForm({
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      role: 'researcher',
      province: '',
      district: '',
      municipality: '',
      ward: '',
    },
  });
  const role = watch('role');

  const handleDocChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!/^image\/|^application\/pdf$/.test(file.type)) { setDocError('Upload an image or PDF'); return; }
    if (file.size > 8 * 1024 * 1024) { setDocError('File is too large. Max 8MB'); return; }
    setDocError('');
    try {
      const dataUrl = await fileToDataUrl(file);
      setDocFile({ name: file.name, dataUrl });
    } catch {
      setDocError('Could not read that file. Try again.');
    }
  };

  const onSubmit = async (values) => {
    setError('');
    if (values.role === 'researcher' && !docFile) {
      setDocError('Citizenship certificate or national ID is required for citizen reporting.');
      return;
    }
    const organization = [values.municipality, values.ward ? `Ward ${values.ward}` : '', values.district].filter(Boolean).join(', ') || 'GovInsight Nepal';
    try {
      await signup({
        ...values,
        organization,
        citizenshipDoc: docFile?.dataUrl || '',
        citizenshipDocName: docFile?.name || '',
      });
      toast.success('Account created. Welcome to GovInsight.');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <main className="min-h-screen bg-[#f5f1e8] px-5 py-8 text-[#102a2b]">
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-6xl gap-8 lg:grid-cols-[0.86fr_1.14fr]">
        <section className="flex flex-col justify-between rounded-lg bg-[#0f3d3e] p-7 text-white lg:p-9">
          <CivicLogo />
          <div className="py-10">
            <CivicBadge>Start a civic service chain</CivicBadge>
            <h1 className="mt-5 text-4xl font-black leading-tight tracking-tight">Create your GovInsight account.</h1>
            <p className="mt-4 text-sm leading-7 text-white/70">
              Your ward, reports, authority assignments, evidence, timelines, and verification history stay connected so public problems do not disappear into a complaint inbox.
            </p>
            <div className="mt-8 space-y-3">
              {['Submit a ward issue with location, contact, and evidence', 'Similar citizen reports become one stronger shared issue', 'Authorities update progress until citizens can verify the fix'].map((item, idx) => (
                <div key={item} className="flex gap-3 rounded-lg border border-white/15 bg-white/10 p-3">
                  <span className="grid h-7 w-7 shrink-0 place-items-center rounded-md bg-[#dc143c] text-xs font-black">{idx + 1}</span>
                  <p className="text-sm font-semibold text-white/85">{item}</p>
                </div>
              ))}
            </div>
          </div>
          <p className="text-xs leading-5 text-white/50">Identity documents are private. They help keep reports accountable without showing your ID publicly.</p>
        </section>

        <section className="flex items-center">
          <div className="w-full rounded-lg border border-[#ded6c8] bg-white p-5 shadow-[0_24px_70px_-35px_rgba(16,42,43,.45)] sm:p-7">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#dc143c]">Join GovInsight Nepal</p>
                <h2 className="mt-2 text-3xl font-black tracking-tight">Create account</h2>
              </div>
              <Link href="/login" className="rounded-lg border border-[#d9d1c1] px-3 py-2 text-xs font-bold text-[#0f3d3e] hover:border-[#0f3d3e]">Log in</Link>
            </div>

            {error && <div className="mt-5 rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

            <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Full name" error={errors.name?.message}>
                  <input className="civic-input" placeholder="Sita Sharma" {...register('name', { required: 'Name is required' })} />
                </Field>
                <Field label="Email" error={errors.email?.message}>
                  <input type="email" className="civic-input" placeholder="you@example.com" {...register('email', { required: 'Email is required', pattern: { value: /\S+@\S+\.\S+/, message: 'Invalid email' } })} />
                </Field>
              </div>

              <div>
                <p className="mb-2 text-sm font-bold">Account type</p>
                <div className="grid gap-3 sm:grid-cols-2">
                  {ROLE_CARDS.map(card => (
                    <button
                      key={card.value}
                      type="button"
                      onClick={() => setValue('role', card.value)}
                      className={`rounded-lg border p-4 text-left transition ${role === card.value ? 'border-[#0f3d3e] bg-[#eef6f4] ring-4 ring-[#0f3d3e]/10' : 'border-[#ded6c8] bg-[#fffcf7] hover:border-[#0f3d3e]'}`}
                    >
                      <span className="flex items-center gap-2 text-sm font-black"><UserRoundCheck className="h-4 w-4 text-[#dc143c]" />{card.title}</span>
                      <span className="mt-1 block text-xs leading-5 text-[#65706c]">{card.copy}</span>
                    </button>
                  ))}
                </div>
                <input type="hidden" {...register('role')} />
              </div>

              <div className="rounded-lg border border-[#eee6d8] bg-[#fffcf7] p-4">
                <p className="mb-3 flex items-center gap-2 text-sm font-bold"><MapPinned className="h-4 w-4 text-[#dc143c]" />Jurisdiction</p>
                <div className="grid gap-3 sm:grid-cols-4">
                  <input className="civic-input" placeholder="Province" {...register('province')} />
                  <input className="civic-input" placeholder="District" {...register('district')} />
                  <input className="civic-input sm:col-span-1" placeholder="Municipality" {...register('municipality')} />
                  <input className="civic-input" placeholder="Ward" {...register('ward')} />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Password" error={errors.password?.message}>
                  <div className="relative">
                    <input type={showPw ? 'text' : 'password'} className="civic-input pr-10" placeholder="Min 6 characters" {...register('password', { required: 'Required', minLength: { value: 6, message: 'Min 6 characters' } })} />
                    <button type="button" onClick={() => setShowPw(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-[#65706c] hover:bg-[#f5f1e8]">
                      {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </Field>
                <Field label="Confirm password" error={errors.confirmPassword?.message}>
                  <input type="password" className="civic-input" placeholder="Re-enter password" {...register('confirmPassword', { validate: v => v === watch('password') || "Passwords don't match" })} />
                </Field>
              </div>

              <div>
                <p className="mb-2 flex items-center gap-2 text-sm font-bold"><ShieldCheck className="h-4 w-4 text-[#dc143c]" />Citizenship certificate / national ID</p>
                {!docFile ? (
                  <label className="flex min-h-[96px] cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-[#d9d1c1] bg-[#fffcf7] p-4 text-center hover:border-[#0f3d3e]">
                    <UploadCloud className="h-5 w-5 text-[#65706c]" />
                    <span className="mt-2 text-xs font-bold text-[#65706c]">Upload image or PDF, max 8MB</span>
                    <input type="file" accept="image/*,application/pdf" onChange={handleDocChange} className="hidden" />
                  </label>
                ) : (
                  <div className="flex items-center justify-between rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3">
                    <span className="flex min-w-0 items-center gap-2 text-sm font-bold text-emerald-700"><FileCheck2 className="h-4 w-4 shrink-0" /><span className="truncate">{docFile.name}</span></span>
                    <button type="button" onClick={() => setDocFile(null)} className="rounded-md p-1 text-emerald-700 hover:bg-emerald-100"><X className="h-4 w-4" /></button>
                  </div>
                )}
                {docError && <p className="mt-1 text-xs text-red-600">{docError}</p>}
              </div>

              <button type="submit" disabled={isSubmitting} className="flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-[#dc143c] text-sm font-black text-white transition hover:bg-[#b80f31] disabled:opacity-60">
                {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                Create account
              </button>
            </form>
          </div>
        </section>
      </div>
      <style jsx global>{`.civic-input{height:3rem;width:100%;border-radius:.5rem;border:1px solid #d9d1c1;background:#fffcf7;padding:0 .875rem;font-size:.875rem;outline:none;transition:border-color .15s,box-shadow .15s}.civic-input:focus{border-color:#0f3d3e;box-shadow:0 0 0 4px rgb(15 61 62 / .1)}`}</style>
    </main>
  );
}

function Field({ label, error, children }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-bold">{label}</span>
      {children}
      {error && <span className="mt-1 block text-xs text-red-600">{error}</span>}
    </label>
  );
}
