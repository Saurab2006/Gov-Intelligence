'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { CivicLogo } from '@/components/CivicBrand';
import { getToken } from '@/lib/api';
import { GitBranch, MapPin, Network, Route, UsersRound } from 'lucide-react';

const steps = [
  ['01', 'Report', 'A citizen reports a problem with a photo and location, in their own words, Nepali or English.'],
  ['02', 'Cluster', 'Reports about the same problem merge into one issue. 14 reports become one case, not 14 tickets.'],
  ['03', 'Verify', "Neighbours confirm the issue is real. Three confirmations move it into the municipality's queue."],
  ['04', 'Assign', 'The section head routes it to an officer. Every handoff is recorded on a public timeline.'],
  ['05', 'Resolve', 'The officer posts photo evidence of the fix. The community confirms or reopens it.'],
];

const signals = [
  [GitBranch, 'Duplication is a signal', 'More reports on one problem means more people affected. Priority rises automatically with the count.'],
  [Network, 'Root causes, not symptoms', 'Patterns across nearby issues surface systemic causes. A human official always reviews before anything is created.'],
  [UsersRound, 'Community keeps it honest', 'Citizens verify both the problem and the fix. A resolution only stands when the people who reported it agree.'],
  [MapPin, 'Nothing sits quietly', 'Issues that wait too long are flagged in plain terms, visible to everyone.'],
];

export default function LandingPage() {
  const [hasToken, setHasToken] = useState(false);

  useEffect(() => {
    setHasToken(Boolean(getToken()));
  }, []);

  return (
    <main className="min-h-screen bg-[#faf9f6] text-[#25221f]">
      <header className="sticky top-0 z-40 border-b border-[#e7e0d6] bg-[#faf9f6]/95 backdrop-blur">
        <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between px-6">
          <Link href="/" className="flex items-center">
            <CivicLogo />
          </Link>
          <nav className="flex items-center gap-5 text-sm font-bold">
            {hasToken && <Link href="/dashboard" className="text-[#4e4a45] hover:text-[#111]">Dashboard</Link>}
            <Link href="/login" className="text-[#4e4a45] hover:text-[#111]">Log in</Link>
            <Link href="/signup" className="rounded-lg bg-[#cf1f3b] px-4 py-2.5 text-white shadow-sm hover:bg-[#b81831]">
              Sign up
            </Link>
          </nav>
        </div>
      </header>

      <section className="border-b border-[#e7e0d6]">
        <div className="mx-auto grid min-h-[660px] max-w-7xl items-center gap-12 px-6 py-20 lg:grid-cols-[1fr_520px]">
          <div>
            <p className="flex items-center gap-3 text-[13px] font-black uppercase tracking-[0.28em] text-[#cf1f3b]">
              <span className="text-lg leading-none">▸</span>
              सुनिने आवाज, दर्ज इतिहास
            </p>
            <h1 className="mt-7 max-w-2xl text-[54px] font-black leading-[0.98] tracking-tight text-[#282522] sm:text-[72px]">
              Reports the system can&apos;t ignore.
            </h1>
            <p className="mt-8 max-w-2xl text-[22px] leading-9 text-[#68615b]">
              GovInsight turns citizen complaints into public, trackable issues, clustered by community, verified by neighbours, and followed from report to resolution.
            </p>
            <div className="mt-10 flex flex-wrap gap-3">
              <Link href="/signup" className="rounded-lg bg-[#cf1f3b] px-5 py-3 text-base font-black text-white shadow-sm hover:bg-[#b81831]">
                Report an issue
              </Link>
              <Link href="/login" className="rounded-lg border border-[#ded6cc] bg-white px-5 py-3 text-base font-black text-[#25221f] hover:border-[#25221f]">
                Log in
              </Link>
            </div>
          </div>

          <div className="relative hidden lg:block">
            <div className="absolute -left-3 -top-3 h-full w-full rounded-lg border border-[#e7e0d6]" />
            <div className="absolute -left-1 -top-1 h-full w-full rounded-lg border border-[#e7e0d6]" />
            <div className="relative rounded-lg border border-[#e7e0d6] bg-white p-6 shadow-sm">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-xl font-black tracking-tight">Road damage - Bhrikuti Chowk</h2>
                  <p className="mt-1 text-sm text-[#68615b]">Ward 7 · Lalitpur Metropolitan City</p>
                </div>
                <span className="rounded-full bg-[#fff0e5] px-3 py-1 text-xs font-black uppercase text-[#d46612]">High</span>
              </div>
              <div className="mt-7 flex items-center justify-between text-sm">
                <span className="font-bold">14 citizens affected</span>
                <span className="text-[#68615b]">Open 3d</span>
              </div>
              <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-[#eee9e2]">
                <div className="h-full w-[88%] rounded-full bg-[#cf1f3b]" />
              </div>
              <div className="mt-6 border-t border-[#e7e0d6] pt-4">
                <p className="flex items-center gap-3 text-sm text-[#68615b]">
                  <GitBranch className="h-4 w-4 text-[#cf1f3b]" />
                  14 reports merged into one issue
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-[#e7e0d6] bg-white">
        <div className="mx-auto max-w-7xl px-6 py-20">
          <h2 className="text-3xl font-black tracking-tight">From complaint to closed - in public</h2>
          <div className="mt-12 grid gap-10 md:grid-cols-5">
            {steps.map(([num, title, copy]) => (
              <div key={num}>
                <p className="text-4xl font-black text-[#cf1f3b]">{num}</p>
                <h3 className="mt-5 text-lg font-black">{title}</h3>
                <p className="mt-4 text-base leading-7 text-[#68615b]">{copy}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#faf9f6]">
        <div className="mx-auto grid max-w-7xl gap-x-20 gap-y-12 px-6 py-20 md:grid-cols-2">
          {signals.map(([Icon, title, copy]) => (
            <div key={title} className="flex gap-5">
              <div className="grid h-12 w-12 shrink-0 place-items-center rounded-lg bg-[#fff0f2]">
                <Icon className="h-5 w-5 text-[#cf1f3b]" />
              </div>
              <div>
                <h3 className="text-lg font-black">{title}</h3>
                <p className="mt-2 text-base leading-7 text-[#68615b]">{copy}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <footer className="bg-[#23344f] text-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-6 py-14 md:flex-row md:items-center md:justify-between">
          <CivicLogo />
          <p className="text-base font-semibold text-white/80">Making civic issues accountable, transparent, and harder to ignore.</p>
        </div>
      </footer>
    </main>
  );
}
