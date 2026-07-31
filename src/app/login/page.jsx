'use client';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useAuth } from '@/context/AuthContext';
import { Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

/* ─── SVG decorations ─── */

function DotGrid() {
  const dots = [];
  for (let row = 0; row < 5; row++)
    for (let col = 0; col < 8; col++)
      dots.push(<circle key={`${row}-${col}`} cx={col * 14 + 7} cy={row * 14 + 7} r="2.5" fill="#2e7cf6" opacity="0.35" />);
  return (
    <svg width="119" height="77" className="absolute top-6 left-6 hidden lg:block" aria-hidden="true">
      {dots}
    </svg>
  );
}

function CircleDecor() {
  return (
    <>
      <div className="absolute -top-20 -left-20 w-[280px] h-[280px] rounded-full border border-[#c7dcf5] hidden lg:block" aria-hidden />
      <div className="absolute top-28 left-[46%] w-3 h-3 rounded-full border-2 border-[#b4cff0] hidden lg:block" aria-hidden />
    </>
  );
}

function Sparkles() {
  return (
    <svg width="36" height="40" viewBox="0 0 36 40" fill="none" className="absolute -right-1 -top-2" aria-hidden="true">
      <path d="M8 4 L9.5 8.5 L14 10 L9.5 11.5 L8 16 L6.5 11.5 L2 10 L6.5 8.5Z" fill="#2e7cf6" opacity="0.7" />
      <path d="M24 0 L25 3 L28 4 L25 5 L24 8 L23 5 L20 4 L23 3Z" fill="#5aa2f8" opacity="0.5" />
      <path d="M28 18 L29 20.5 L31.5 21.5 L29 22.5 L28 25 L27 22.5 L24.5 21.5 L27 20.5Z" fill="#2e7cf6" opacity="0.4" />
    </svg>
  );
}

function Waves() {
  return (
    <svg className="absolute bottom-0 left-0 w-[680px] h-[320px] hidden lg:block" viewBox="0 0 680 320" fill="none" preserveAspectRatio="none" aria-hidden="true">
      <path d="M-20 320 L-20 240 C 60 120 220 200 380 180 C 480 168 560 220 680 320 Z" fill="#5aa2f8" />
      <path d="M-20 320 L-20 260 C 80 160 260 230 420 210 C 520 198 600 240 680 320 Z" fill="#1d6bd1" />
      <path d="M-20 290 C 100 180 300 260 500 230 C 580 218 640 260 680 300" stroke="white" strokeWidth="3" opacity="0.6" fill="none" />
    </svg>
  );
}

function Building() {
  return (
    <svg viewBox="0 0 460 340" fill="none" stroke="#1a4a8a" strokeWidth="1.2" className="absolute bottom-4 right-0 w-[420px] opacity-[0.18] hidden lg:block" aria-hidden="true">
      {/* roof tanks */}
      <rect x="125" y="100" width="20" height="20" rx="2" />
      <rect x="158" y="94" width="16" height="26" rx="2" />
      <rect x="255" y="100" width="22" height="20" rx="2" />
      {/* antenna */}
      <line x1="215" y1="120" x2="215" y2="78" />
      <polygon points="215,78 235,84 215,90" fill="none" />
      {/* main block */}
      <rect x="90" y="120" width="210" height="180" />
      <line x1="90" y1="168" x2="300" y2="168" />
      <line x1="90" y1="218" x2="300" y2="218" />
      <line x1="90" y1="264" x2="300" y2="264" />
      {/* windows rows */}
      {[132, 180, 228].map(y =>
        [106, 140, 175, 210, 245, 278].map(x => (
          <rect key={`${x}-${y}`} x={x} y={y} width="14" height="22" />
        ))
      )}
      {/* entrance */}
      <rect x="180" y="270" width="30" height="30" />
      <line x1="195" y1="270" x2="195" y2="300" />
      {/* right wing */}
      <rect x="300" y="185" width="76" height="115" />
      <line x1="300" y1="225" x2="376" y2="225" />
      <line x1="300" y1="260" x2="376" y2="260" />
      {[195, 232, 268].map(y =>
        [312, 345].map(x => (
          <rect key={`r${x}-${y}`} x={x} y={y} width="14" height="18" />
        ))
      )}
      {/* tree */}
      <line x1="410" y1="300" x2="410" y2="276" />
      <ellipse cx="410" cy="264" rx="18" ry="22" />
      {/* ground */}
      <line x1="30" y1="300" x2="445" y2="300" />
    </svg>
  );
}

function LogoIcon({ size = 44 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <rect width="48" height="48" rx="12" fill="#2563EB" />
      <path d="M14 36V18L24 12L34 18V36" stroke="white" strokeWidth="2.2" strokeLinejoin="round" />
      <path d="M20 36V29M24 36V25M28 36V31" stroke="white" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  );
}

function LogoIconSmall({ size = 36 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <rect width="48" height="48" rx="14" fill="#2563EB" />
      <path d="M14 36V18L24 12L34 18V36" stroke="white" strokeWidth="2.4" strokeLinejoin="round" />
      <path d="M20 36V29M24 36V25M28 36V31" stroke="white" strokeWidth="2.4" strokeLinecap="round" />
    </svg>
  );
}

/* ─── Page ─── */

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
      toast.success(`Welcome, ${user.name.split(' ')[0]}!`);
    } catch (err) { setError(err.message); }
  };

  const demoFill = (email, pass) => { setValue('email', email); setValue('password', pass); };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#edf3fa] flex">
      {/* decorations */}
      <DotGrid />
      <CircleDecor />
      <Waves />
      <Building />

      {/* ── LEFT HERO ── */}
      <div className="hidden lg:flex flex-col flex-1 relative z-10 px-12 xl:px-16 py-10">
        {/* top logo */}
        <div className="flex items-center gap-3 mb-auto">
          <LogoIcon />
          <div className="leading-tight">
            <span className="text-[17px] font-bold text-[#1d4fa8] block">GovInsight</span>
            <span className="text-[15px] font-bold text-[#2e7cf6]">Nepal</span>
          </div>
        </div>

        {/* hero text */}
        <div className="mt-auto mb-auto">
          <h1 className="text-[34px] font-bold text-[#13294e] leading-tight">Welcome to</h1>
          <div className="relative inline-block mt-1">
            <span className="text-[72px] font-extrabold leading-[1] tracking-tight">
              <span className="text-[#13294e]">Gov</span>
              <span className="text-[#2e7cf6]">Insight</span>
            </span>
            <Sparkles />
          </div>

          <div className="mt-6 w-20 h-[3px] bg-[#2e7cf6] rounded-full" />

          <p className="mt-6 max-w-[420px] text-[15.5px] leading-[1.75] text-[#415a7b]">
            AI-powered public budget intelligence platform
            connecting government documents and citizens for{' '}
            <span className="font-semibold text-[#2e7cf6]">fiscal transparency.</span>
          </p>
        </div>
      </div>

      {/* ── RIGHT CARD ── */}
      <div className="flex items-center justify-center w-full lg:w-[520px] xl:w-[560px] shrink-0 px-5 py-10 relative z-10">
        <div className="w-full max-w-[400px]">
          <div className="bg-white rounded-[20px] shadow-[0_20px_60px_-15px_rgba(18,60,120,0.15)] p-8 sm:p-10 border border-gray-100/60">
            {/* card logo */}
            <div className="flex flex-col items-center mb-8">
              <LogoIconSmall />
              <h2 className="mt-4 text-[22px] font-bold text-[#13294e]">GovInsight Nepal</h2>
              <p className="mt-1 text-[14px] text-[#5a6f8c]">Public Budget Intelligence Platform</p>
            </div>

            {error && (
              <div className="mb-5 rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-[13px] text-red-600">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              {/* Email */}
              <div>
                <label className="block text-[14px] font-bold text-[#13294e] mb-2">Email Address</label>
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="w-full h-[50px] px-4 rounded-xl border border-[#d5e0ee] bg-white text-[14px] text-[#13294e] placeholder:text-[#9db0c7] outline-none transition-all focus:border-[#2e7cf6] focus:ring-4 focus:ring-[#2e7cf6]/10"
                  {...register('email', { required: 'Email is required' })}
                />
                {errors.email && <p className="mt-1.5 text-[12px] text-red-500">{errors.email.message}</p>}
              </div>

              {/* Password */}
              <div>
                <label className="block text-[14px] font-bold text-[#13294e] mb-2">Password</label>
                <div className="relative">
                  <input
                    type={showPw ? 'text' : 'password'}
                    placeholder="Enter your password"
                    className="w-full h-[50px] px-4 pr-12 rounded-xl border border-[#d5e0ee] bg-white text-[14px] text-[#13294e] placeholder:text-[#9db0c7] outline-none transition-all focus:border-[#2e7cf6] focus:ring-4 focus:ring-[#2e7cf6]/10"
                    {...register('password', { required: 'Password is required' })}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(v => !v)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[#8da3be] hover:text-[#2e7cf6] transition-colors"
                    aria-label={showPw ? 'Hide password' : 'Show password'}
                  >
                    {showPw ? <EyeOff className="w-[18px] h-[18px]" /> : <Eye className="w-[18px] h-[18px]" />}
                  </button>
                </div>
                {errors.password && <p className="mt-1.5 text-[12px] text-red-500">{errors.password.message}</p>}
              </div>

              {/* Remember + Forgot */}
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    className="w-[18px] h-[18px] rounded border-[#c3d2e5] text-[#2e7cf6] focus:ring-[#2e7cf6] cursor-pointer"
                    {...register('remember')}
                  />
                  <span className="text-[14px] font-bold text-[#13294e]">Remember Me</span>
                </label>
                <Link href="/login" className="text-[14px] font-medium text-[#2e7cf6] hover:underline">
                  Forgot Password?
                </Link>
              </div>

              {/* Login button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-[50px] rounded-xl bg-[#7ec8d5] text-[15px] font-bold text-[#0c3550] hover:bg-[#6cc0cf] active:translate-y-[0.5px] transition-all disabled:opacity-60 shadow-sm"
              >
                {isSubmitting ? 'Signing in…' : 'Login'}
              </button>
            </form>

            {/* Footer links */}
            <p className="mt-6 text-center text-[13.5px] text-[#5a6f8c]">
              Don&apos;t have an account?{' '}
              <Link href="/signup" className="font-semibold text-[#2e7cf6] hover:underline">Sign up</Link>
            </p>

            {/* Demo buttons */}
            <div className="mt-4 pt-4 border-t border-[#eef2f7] flex flex-wrap justify-center gap-2">
              {[
                { label: 'Admin', email: 'admin@govinsight.np', pass: 'admin123' },
                { label: 'Analyst', email: 'analyst@govinsight.np', pass: 'analyst123' },
                { label: 'Researcher', email: 'researcher@govinsight.np', pass: 'researcher123' },
              ].map(d => (
                <button
                  key={d.label}
                  type="button"
                  onClick={() => demoFill(d.email, d.pass)}
                  className="px-3 py-1.5 rounded-lg border border-[#e2eaf3] bg-[#f7fafd] text-[11px] font-semibold text-[#5a6f8c] hover:border-[#2e7cf6] hover:text-[#2e7cf6] hover:bg-blue-50 transition-all"
                >
                  {d.label} Demo
                </button>
              ))}
            </div>
          </div>

          {/* Copyright */}
          <p className="text-center text-[13px] text-[#8da3be] mt-6">
            © {new Date().getFullYear()} GovInsight Nepal. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}
