'use client';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useAuth } from '@/context/AuthContext';
import { Eye, EyeOff, UploadCloud, FileCheck2, X, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

function LogoIcon({ size = 36 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <rect width="48" height="48" rx="14" fill="#2563EB" />
      <path d="M14 36V18L24 12L34 18V36" stroke="white" strokeWidth="2.4" strokeLinejoin="round" />
      <path d="M20 36V29M24 36V25M28 36V31" stroke="white" strokeWidth="2.4" strokeLinecap="round" />
    </svg>
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

export default function SignupPage() {
  const { signup } = useAuth();
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [docFile, setDocFile] = useState(null); // { name, dataUrl }
  const [docError, setDocError] = useState('');
  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm({
    defaultValues: { name: '', email: '', password: '', confirmPassword: '', role: 'researcher' },
  });

  const handleDocChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!/^image\/|^application\/pdf$/.test(file.type)) { setDocError('Please upload an image or PDF'); return; }
    if (file.size > 8 * 1024 * 1024) { setDocError('File is too large — max 8MB'); return; }
    setDocError('');
    try {
      const dataUrl = await fileToDataUrl(file);
      setDocFile({ name: file.name, dataUrl });
    } catch {
      setDocError('Could not read that file — try again');
    }
  };

  const onSubmit = async (values) => {
    setError('');
    if (!docFile) { setDocError('Citizenship certificate / national ID is required to verify your identity'); return; }
    try {
      await signup({ ...values, citizenshipDoc: docFile.dataUrl, citizenshipDocName: docFile.name });
      toast.success('Account created — welcome!');
    } catch (err) { setError(err.message); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#edf3fa] px-5 py-10">
      <div className="w-full max-w-[420px]">
        <div className="bg-white rounded-[20px] shadow-[0_20px_60px_-15px_rgba(18,60,120,0.15)] p-8 sm:p-10 border border-gray-100/60">
          <div className="flex flex-col items-center mb-8">
            <LogoIcon />
            <h2 className="mt-4 text-[22px] font-bold text-[#13294e]">Create Account</h2>
            <p className="mt-1 text-[14px] text-[#5a6f8c]">Join the budget intelligence platform</p>
          </div>

          {error && <div className="mb-5 rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-[13px] text-red-600">{error}</div>}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-[14px] font-bold text-[#13294e] mb-2">Full Name</label>
              <input placeholder="Enter your full name" className="w-full h-[48px] px-4 rounded-xl border border-[#d5e0ee] bg-white text-[14px] text-[#13294e] placeholder:text-[#9db0c7] outline-none transition-all focus:border-[#2e7cf6] focus:ring-4 focus:ring-[#2e7cf6]/10" {...register('name', { required: 'Name is required' })} />
              {errors.name && <p className="mt-1.5 text-[12px] text-red-500">{errors.name.message}</p>}
            </div>

            <div>
              <label className="block text-[14px] font-bold text-[#13294e] mb-2">Email Address</label>
              <input type="email" placeholder="Enter your email" className="w-full h-[48px] px-4 rounded-xl border border-[#d5e0ee] bg-white text-[14px] text-[#13294e] placeholder:text-[#9db0c7] outline-none transition-all focus:border-[#2e7cf6] focus:ring-4 focus:ring-[#2e7cf6]/10" {...register('email', { required: 'Email is required', pattern: { value: /\S+@\S+\.\S+/, message: 'Invalid email' } })} />
              {errors.email && <p className="mt-1.5 text-[12px] text-red-500">{errors.email.message}</p>}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[14px] font-bold text-[#13294e] mb-2">Password</label>
                <div className="relative">
                  <input type={showPw ? 'text' : 'password'} placeholder="Min 6 chars" className="w-full h-[48px] px-4 pr-10 rounded-xl border border-[#d5e0ee] bg-white text-[14px] text-[#13294e] placeholder:text-[#9db0c7] outline-none transition-all focus:border-[#2e7cf6] focus:ring-4 focus:ring-[#2e7cf6]/10" {...register('password', { required: 'Required', minLength: { value: 6, message: 'Min 6' } })} />
                  <button type="button" onClick={() => setShowPw(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8da3be] hover:text-[#2e7cf6]">
                    {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.password && <p className="mt-1 text-[11px] text-red-500">{errors.password.message}</p>}
              </div>
              <div>
                <label className="block text-[14px] font-bold text-[#13294e] mb-2">Confirm</label>
                <input type="password" placeholder="Re-enter" className="w-full h-[48px] px-4 rounded-xl border border-[#d5e0ee] bg-white text-[14px] text-[#13294e] placeholder:text-[#9db0c7] outline-none transition-all focus:border-[#2e7cf6] focus:ring-4 focus:ring-[#2e7cf6]/10" {...register('confirmPassword', { validate: v => v === watch('password') || "Passwords don't match" })} />
                {errors.confirmPassword && <p className="mt-1 text-[11px] text-red-500">{errors.confirmPassword.message}</p>}
              </div>
            </div>

            <div>
              <label className="block text-[14px] font-bold text-[#13294e] mb-2">Citizenship Certificate / National ID</label>
              <p className="text-[12px] text-[#5a6f8c] mb-2 flex items-start gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-[#2e7cf6] shrink-0 mt-0.5" />
                Required to verify your identity — this lets admins trace a report back to a real person if it's ever flagged as fake. Kept private, never shown publicly.
              </p>

              {!docFile ? (
                <label className="flex flex-col items-center justify-center gap-1.5 h-[100px] rounded-xl border-2 border-dashed border-[#d5e0ee] bg-[#f7fafd] cursor-pointer hover:border-[#2e7cf6] hover:bg-blue-50/40 transition-all">
                  <UploadCloud className="w-5 h-5 text-[#8da3be]" />
                  <span className="text-[12.5px] font-semibold text-[#5a6f8c]">Click to upload (image or PDF, max 8MB)</span>
                  <input type="file" accept="image/*,application/pdf" onChange={handleDocChange} className="hidden" />
                </label>
              ) : (
                <div className="flex items-center justify-between h-[56px] px-4 rounded-xl border border-emerald-200 bg-emerald-50">
                  <span className="flex items-center gap-2 text-[13px] font-medium text-emerald-700 truncate">
                    <FileCheck2 className="w-4 h-4 shrink-0" /> <span className="truncate">{docFile.name}</span>
                  </span>
                  <button type="button" onClick={() => setDocFile(null)} className="p-1 rounded-lg text-emerald-600 hover:bg-emerald-100 shrink-0">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
              {docError && <p className="mt-1.5 text-[12px] text-red-500">{docError}</p>}
            </div>

            <button type="submit" disabled={isSubmitting} className="w-full h-[50px] rounded-xl bg-[#7ec8d5] text-[15px] font-bold text-[#0c3550] hover:bg-[#6cc0cf] active:translate-y-[0.5px] transition-all disabled:opacity-60 shadow-sm">
              {isSubmitting ? 'Creating…' : 'Create Account'}
            </button>
          </form>

          <p className="mt-6 text-center text-[13.5px] text-[#5a6f8c]">
            Already have an account?{' '}
            <Link href="/login" className="font-semibold text-[#2e7cf6] hover:underline">Login</Link>
          </p>
        </div>

        <p className="text-center text-[13px] text-[#8da3be] mt-6">© {new Date().getFullYear()} GovInsight Nepal. All rights reserved.</p>
      </div>
    </div>
  );
}