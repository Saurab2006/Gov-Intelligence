'use client';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useAuth } from '@/context/AuthContext';
import { CivicBadge, CivicLogo, CivicTrustStrip } from '@/components/CivicBrand';
import { Eye, EyeOff, Loader2, LockKeyhole, MapPin, RadioTower, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

export default function LoginPage() {
  const { login } = useAuth();
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const { register, handleSubmit, setValue, formState: { errors, isSubmitting } } = useForm({
    defaultValues: { email: '', password: '', remember: true },
  });

  const onSubmit = async (values) => {
    setError('');
    try {
      const user = await login(values);
      toast.success(`Welcome back, ${user.name.split(' ')[0]}`);
    } catch (err) {
      setError(err.message);
    }
  };

  const demoFill = (email, pass) => {
    setValue('email', email);
    setValue('password', pass);
  };

  return (
    <main className="min-h-screen bg-[#f5f1e8] text-[#102a2b]">
      <div className="grid min-h-screen lg:grid-cols-[1.08fr_0.92fr]">
        <section className="relative overflow-hidden bg-[#0f3d3e] px-6 py-8 text-white sm:px-10 lg:px-14">
          <div className="absolute inset-x-0 bottom-0 h-56 bg-[linear-gradient(135deg,rgba(220,20,60,.9),rgba(255,255,255,0)_58%)]" />
          <div className="absolute right-8 top-24 hidden h-56 w-56 rounded-full border border-white/10 lg:block" />
          <div className="relative z-10 flex h-full flex-col">
            <Link href="/" className="w-fit">
              <CivicLogo />
            </Link>

            <div className="my-auto max-w-2xl py-12">
              <CivicBadge>People-first civic accountability</CivicBadge>
              <h1 className="mt-6 max-w-xl text-4xl font-black leading-tight tracking-tight sm:text-5xl">
                Turn everyday ward problems into visible public action.
              </h1>
              <p className="mt-5 max-w-lg text-sm leading-7 text-white/72">
                GovInsight makes a flooded road, broken water line, blocked drain, or unsafe streetlight traceable from the first report to the final citizen-verified fix.
              </p>
              <div className="mt-8 grid max-w-xl gap-3 sm:grid-cols-3">
                {[
                  [MapPin, 'Your ward', 'See what people nearby are reporting.'],
                  [RadioTower, 'Live progress', 'Follow review, assignment, field work, and closure.'],
                  [ShieldCheck, 'Human trust', 'Duplicates, fake reports, and evidence stay reviewable.'],
                ].map(([Icon, title, copy]) => (
                  <div key={title} className="rounded-lg border border-white/15 bg-white/10 p-4">
                    <Icon className="h-5 w-5 text-[#ffccd5]" />
                    <p className="mt-3 text-sm font-bold">{title}</p>
                    <p className="mt-1 text-xs leading-5 text-white/65">{copy}</p>
                  </div>
                ))}
              </div>
            </div>

            <CivicTrustStrip className="relative z-10 max-w-2xl" />
          </div>
        </section>

        <section className="flex items-center justify-center px-5 py-10">
          <div className="w-full max-w-[430px]">
            <div className="mb-8 flex items-center justify-between">
              <Link href="/">
                <CivicLogo compact />
              </Link>
              <Link href="/signup" className="rounded-lg border border-[#d9d1c1] bg-white px-3 py-2 text-xs font-bold text-[#0f3d3e] shadow-sm hover:border-[#0f3d3e]">
                Create account
              </Link>
            </div>

            <div className="rounded-lg border border-[#ded6c8] bg-white p-6 shadow-[0_24px_70px_-35px_rgba(16,42,43,.45)] sm:p-8">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#dc143c]">Secure sign in</p>
                <h2 className="mt-2 text-3xl font-black tracking-tight">Log in</h2>
                <p className="mt-2 text-sm leading-6 text-[#65706c]">Continue reporting, reviewing, assigning, and tracking public service issues.</p>
              </div>

              {error && <div className="mt-5 rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

              <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
                <label className="block">
                  <span className="text-sm font-bold">Email</span>
                  <input
                    type="email"
                    placeholder="you@example.com"
                    className="mt-2 h-12 w-full rounded-lg border border-[#d9d1c1] bg-[#fffcf7] px-4 text-sm outline-none transition focus:border-[#0f3d3e] focus:ring-4 focus:ring-[#0f3d3e]/10"
                    {...register('email', { required: 'Email is required' })}
                  />
                  {errors.email && <span className="mt-1 block text-xs text-red-600">{errors.email.message}</span>}
                </label>

                <label className="block">
                  <span className="text-sm font-bold">Password</span>
                  <div className="relative mt-2">
                    <input
                      type={showPw ? 'text' : 'password'}
                      placeholder="Enter your password"
                      className="h-12 w-full rounded-lg border border-[#d9d1c1] bg-[#fffcf7] px-4 pr-12 text-sm outline-none transition focus:border-[#0f3d3e] focus:ring-4 focus:ring-[#0f3d3e]/10"
                      {...register('password', { required: 'Password is required' })}
                    />
                    <button type="button" onClick={() => setShowPw(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-[#65706c] hover:bg-[#f5f1e8]" aria-label={showPw ? 'Hide password' : 'Show password'}>
                      {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {errors.password && <span className="mt-1 block text-xs text-red-600">{errors.password.message}</span>}
                </label>

                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 text-sm font-semibold text-[#65706c]">
                    <input type="checkbox" className="rounded border-[#d9d1c1] text-[#0f3d3e] focus:ring-[#0f3d3e]" {...register('remember')} />
                    Remember me
                  </label>
                  <span className="text-xs font-semibold text-[#65706c]">Ward data protected</span>
                </div>

                <button type="submit" disabled={isSubmitting} className="flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-[#dc143c] text-sm font-black text-white shadow-sm transition hover:bg-[#b80f31] disabled:opacity-60">
                  {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <LockKeyhole className="h-4 w-4" />}
                  Log in
                </button>
              </form>

              <div className="mt-6 border-t border-[#eee6d8] pt-5">
                <p className="text-center text-sm text-[#65706c]">
                  No account? <Link href="/signup" className="font-bold text-[#0f3d3e] underline-offset-4 hover:underline">Join GovInsight</Link>
                </p>
                <div className="mt-4 grid grid-cols-3 gap-2">
                  {[
                    ['Admin', 'admin@govinsight.np', 'admin123'],
                    ['Officer', 'analyst@govinsight.np', 'analyst123'],
                    ['Citizen', 'researcher@govinsight.np', 'researcher123'],
                  ].map(([label, email, pass]) => (
                    <button key={label} type="button" onClick={() => demoFill(email, pass)} className="rounded-lg border border-[#ded6c8] bg-[#fffcf7] px-2 py-2 text-[11px] font-bold text-[#65706c] hover:border-[#0f3d3e] hover:text-[#0f3d3e]">
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
