'use client';
import { useAuth } from '@/context/AuthContext';
import { initials } from '@/lib/format';

export default function SettingsPage() {
  const { user } = useAuth();
  if (!user) return null;

  return (
    <div className="max-w-[860px] mx-auto space-y-5">
      <div><h1 className="text-2xl font-bold text-gray-900">Settings</h1><p className="text-sm text-gray-500 mt-1">Profile and account information</p></div>
      <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-14 h-14 rounded-full flex items-center justify-center text-white text-lg font-bold" style={{ background: `linear-gradient(135deg, hsl(${user.avatarHue} 65% 52%), hsl(${(user.avatarHue + 40) % 360} 60% 45%))` }}>
            {initials(user.name)}
          </div>
          <div>
            <p className="text-lg font-bold text-gray-900">{user.name}</p>
            <p className="text-sm text-gray-500">{user.email}</p>
            <span className="inline-block mt-1 text-[10px] font-semibold uppercase tracking-wider text-brand-600 bg-brand-50 rounded-md px-2 py-0.5">{user.role}</span>
          </div>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          {[{ l: 'Full Name', v: user.name }, { l: 'Email', v: user.email }, { l: 'Role', v: user.role }, { l: 'Organization', v: user.organization || '—' }, { l: 'Job Title', v: user.jobTitle || '—' }, { l: 'Member Since', v: new Date(user.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) }].map((f, i) => (
            <div key={i}>
              <label className="block text-xs font-medium text-gray-400 mb-1">{f.l}</label>
              <div className="h-10 px-3 rounded-xl border border-gray-200 bg-gray-50 flex items-center text-sm text-gray-700">{f.v}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
