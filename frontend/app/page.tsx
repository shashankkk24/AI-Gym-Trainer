"use client"

import Link from "next/link"
import { useEffect, useState } from "react"

import { InjuryForm } from "@/components/recovery/injury-form"
import { Button } from "@/components/ui/button"

const USER_ID = "507f1f77bcf86cd799439011"

/* ── tiny heartbeat SVG line ─────────────────────────────── */
function PulseLine({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 40" fill="none" className={className} preserveAspectRatio="none">
      <polyline
        points="0,20 40,20 50,20 55,5 60,35 65,12 70,28 75,20 90,20 200,20"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="animate-[dash_2s_linear_infinite]"
        strokeDasharray="220"
        strokeDashoffset="220"
      />
    </svg>
  )
}

/* ── animated counter ────────────────────────────────────── */
function Counter({ end, suffix = "" }: { end: number; suffix?: string }) {
  const [val, setVal] = useState(0)
  useEffect(() => {
    let frame: number
    const start = performance.now()
    const duration = 1800
    const tick = (now: number) => {
      const t = Math.min((now - start) / duration, 1)
      const ease = 1 - Math.pow(1 - t, 3)
      setVal(Math.round(ease * end))
      if (t < 1) frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [end])
  return <>{val}{suffix}</>
}

export default function Home() {
  return (
    <div className="min-h-screen bg-[#050505] text-white selection:bg-lime-400 selection:text-black">

      {/* ── TOPBAR ────────────────────────────────────────── */}
      <nav className="sticky top-0 z-50 flex items-center justify-between border-b border-white/[0.06] bg-[#050505]/80 px-6 py-4 backdrop-blur-xl md:px-12">
        <Link href="/" className="group flex items-baseline gap-1.5">
          <span className="text-xl font-black tracking-[-0.04em]">UNBROKEN</span>
          <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-lime-400">fitness&nbsp;ai</span>
        </Link>

        <div className="flex items-center gap-3">
          <Link href="/recovery" className="hidden text-[13px] font-medium text-white/40 transition hover:text-white sm:block">
            Recovery
          </Link>
          <Link href="/recovery/sleep" className="hidden text-[13px] font-medium text-white/40 transition hover:text-white sm:block">
            Sleep
          </Link>
          <Link href="/recovery/wellness" className="hidden text-[13px] font-medium text-white/40 transition hover:text-white sm:block">
            Wellness
          </Link>
          <InjuryForm userId={USER_ID} triggerLabel="+ Injury" />
        </div>
      </nav>

      {/* ── HERO ──────────────────────────────────────────── */}
      <section className="relative overflow-hidden px-6 pb-24 pt-16 md:px-12 md:pb-32 md:pt-28">
        {/* accent line */}
        <div className="absolute left-0 top-0 h-full w-px bg-gradient-to-b from-lime-400/60 via-lime-400/10 to-transparent" />

        <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-[1.2fr_1fr] lg:items-center">
          {/* left: copy */}
          <div>
            <p className="mb-5 flex items-center gap-3 text-xs font-bold uppercase tracking-[0.3em] text-lime-400">
              <span className="inline-block h-px w-8 bg-lime-400" />
              Recovery Intelligence
            </p>

            <h1 className="text-[clamp(2.6rem,7vw,5.5rem)] font-black leading-[0.92] tracking-[-0.04em]">
              Your body
              <br />
              knows.
              <br />
              <span className="text-lime-400/60">We listen.</span>
            </h1>

            <p className="mt-8 max-w-md text-base leading-relaxed text-white/40">
              Declare an injury. Get a week&ndash;by&ndash;week rehab plan built from physiotherapy science. Track pain, log sleep, and let your recovery score decide your training intensity.
            </p>

            <div className="mt-10 flex flex-wrap gap-3">
              <Button
                size="lg"
                className="rounded-none bg-lime-400 px-8 font-bold text-black shadow-[0_0_40px_rgba(163,230,53,0.15)] transition-all hover:bg-lime-300 hover:shadow-[0_0_60px_rgba(163,230,53,0.25)]"
                asChild
              >
                <Link href="/recovery">Enter Recovery Hub →</Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="rounded-none border-white/20 bg-white/5 px-8 font-bold text-white transition hover:border-white/40 hover:bg-white/10"
                asChild
              >
                <Link href="/recovery/wellness">Breathe</Link>
              </Button>
            </div>
          </div>

          {/* right: pulse visual */}
          <div className="relative flex items-center justify-center">
            {/* rings */}
            <div className="absolute h-72 w-72 rounded-full border border-white/[0.04]" />
            <div className="absolute h-56 w-56 rounded-full border border-white/[0.06]" />
            <div className="absolute h-40 w-40 rounded-full border border-white/[0.08] shadow-[0_0_80px_rgba(163,230,53,0.06)]" />

            {/* center dot */}
            <div className="relative z-10 flex h-20 w-20 items-center justify-center rounded-full bg-lime-400/10 backdrop-blur-sm">
              <div className="h-4 w-4 animate-pulse rounded-full bg-lime-400 shadow-[0_0_20px_rgba(163,230,53,0.6)]" />
            </div>

            {/* pulse line overlay */}
            <PulseLine className="absolute top-1/2 w-full -translate-y-1/2 text-lime-400/30" />
          </div>
        </div>
      </section>

      {/* ── BENTO GRID ────────────────────────────────────── */}
      <section className="border-t border-white/[0.06] px-6 py-20 md:px-12 md:py-28">
        <div className="mx-auto max-w-6xl">
          <p className="mb-12 text-xs font-bold uppercase tracking-[0.3em] text-white/20">What you get</p>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 lg:grid-rows-2">

            {/* Card 1 — large, spanning 2 rows */}
            <Link
              href="/recovery"
              className="group row-span-2 flex flex-col justify-between overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.02] p-8 transition-colors hover:border-lime-400/20 hover:bg-white/[0.04]"
            >
              <div>
                <span className="mb-4 inline-block rounded-full bg-lime-400/10 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-lime-400">
                  Core
                </span>
                <h3 className="mt-3 text-2xl font-bold leading-tight">Injury&nbsp;Declaration &amp; Rehab&nbsp;Plans</h3>
                <p className="mt-3 text-sm leading-relaxed text-white/35">
                  Select your body part, rate severity, and receive a progressive exercise plan that evolves each week from gentle ROM to full strength.
                </p>
              </div>
              <div className="mt-8 text-6xl font-black text-white/[0.06] transition-colors group-hover:text-lime-400/10">
                01
              </div>
            </Link>

            {/* Card 2 */}
            <Link
              href="/recovery/sleep"
              className="group flex flex-col justify-between overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.02] p-7 transition-colors hover:border-blue-400/20 hover:bg-white/[0.04]"
            >
              <div>
                <span className="mb-3 inline-block rounded-full bg-blue-400/10 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-blue-400">
                  Rest
                </span>
                <h3 className="mt-2 text-lg font-bold">Sleep Tracking</h3>
                <p className="mt-2 text-[13px] leading-relaxed text-white/35">
                  Log sleep &amp; quality. See how rest directly impacts your recovery score.
                </p>
              </div>
              <div className="mt-4 text-4xl font-black text-white/[0.06] transition-colors group-hover:text-blue-400/10">02</div>
            </Link>

            {/* Card 3 */}
            <Link
              href="/recovery/wellness"
              className="group flex flex-col justify-between overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.02] p-7 transition-colors hover:border-emerald-400/20 hover:bg-white/[0.04]"
            >
              <div>
                <span className="mb-3 inline-block rounded-full bg-emerald-400/10 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-emerald-400">
                  Mind
                </span>
                <h3 className="mt-2 text-lg font-bold">Guided Breathing</h3>
                <p className="mt-2 text-[13px] leading-relaxed text-white/35">
                  Box, 4‑7‑8, and energising patterns with real‑time visual guidance.
                </p>
              </div>
              <div className="mt-4 text-4xl font-black text-white/[0.06] transition-colors group-hover:text-emerald-400/10">03</div>
            </Link>

            {/* Card 4 */}
            <Link
              href="/recovery"
              className="group flex flex-col justify-between overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.02] p-7 transition-colors hover:border-amber-400/20 hover:bg-white/[0.04]"
            >
              <div>
                <span className="mb-3 inline-block rounded-full bg-amber-400/10 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-amber-400">
                  Score
                </span>
                <h3 className="mt-2 text-lg font-bold">Recovery Score</h3>
                <p className="mt-2 text-[13px] leading-relaxed text-white/35">
                  0–100 score fusing sleep, pain &amp; consistency. Tells you when to push and when to rest.
                </p>
              </div>
              <div className="mt-4 text-4xl font-black text-white/[0.06] transition-colors group-hover:text-amber-400/10">04</div>
            </Link>

            {/* Card 5 — wide */}
            <Link
              href="/recovery/wellness"
              className="group flex flex-col justify-between overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.02] p-7 transition-colors hover:border-rose-400/20 hover:bg-white/[0.04] sm:col-span-2 lg:col-span-1"
            >
              <div>
                <span className="mb-3 inline-block rounded-full bg-rose-400/10 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-rose-400">
                  Wellness
                </span>
                <h3 className="mt-2 text-lg font-bold">Mood &amp; Motivation</h3>
                <p className="mt-2 text-[13px] leading-relaxed text-white/35">
                  Daily stress check‑ins and curated quotes to keep your head in the game.
                </p>
              </div>
              <div className="mt-4 text-4xl font-black text-white/[0.06] transition-colors group-hover:text-rose-400/10">05</div>
            </Link>
          </div>
        </div>
      </section>

      {/* ── NUMBERS STRIP ─────────────────────────────────── */}
      <section className="border-t border-white/[0.06] px-6 py-16 md:px-12">
        <div className="mx-auto grid max-w-4xl gap-10 text-center sm:grid-cols-3">
          <div>
            <p className="text-5xl font-black tracking-tight text-lime-400">
              <Counter end={60} suffix="+" />
            </p>
            <p className="mt-2 text-xs font-bold uppercase tracking-[0.2em] text-white/25">Rehab exercises</p>
          </div>
          <div>
            <p className="text-5xl font-black tracking-tight text-white/80">
              <Counter end={9} />
            </p>
            <p className="mt-2 text-xs font-bold uppercase tracking-[0.2em] text-white/25">Body regions</p>
          </div>
          <div>
            <p className="text-5xl font-black tracking-tight text-white/80">
              <Counter end={3} />
            </p>
            <p className="mt-2 text-xs font-bold uppercase tracking-[0.2em] text-white/25">Breathing patterns</p>
          </div>
        </div>
      </section>

      {/* ── FOOTER ────────────────────────────────────────── */}
      <footer className="border-t border-white/[0.06] px-6 py-10 md:px-12">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 sm:flex-row">
          <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-white/15">
            UNBROKEN FITNESS AI © 2025
          </p>
          <p className="text-[11px] text-white/15">
            Recovery is not weakness — it is intelligence.
          </p>
        </div>
      </footer>

      {/* ── keyframe for pulse SVG ─────────────────────────── */}
      <style jsx global>{`
        @keyframes dash {
          to { stroke-dashoffset: 0; }
        }
      `}</style>
    </div>
  )
}
