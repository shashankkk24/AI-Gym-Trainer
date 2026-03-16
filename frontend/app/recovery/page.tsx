"use client"

import Link from "next/link"
import { useCallback, useEffect, useState } from "react"

import { InjuryForm } from "@/components/recovery/injury-form"
import { PainHeatmap } from "@/components/recovery/pain-heatmap"

// ─── Types ───────────────────────────────────────────────────

type Injury = {
  id: string
  body_part: string
  severity: string
  description: string
  is_active: boolean
  declared_date: string
  pain_logs: { date: string; pain_score: number; notes: string }[]
  rehab_exercises: unknown[]
}

type RehabExercise = {
  name: string
  sets: number
  reps: number
  hold_seconds: number
  video_url: string
}

// ─── Helpers ─────────────────────────────────────────────────

const USER_ID = "507f1f77bcf86cd799439011"

function daysSince(dateStr: string): number {
  const declared = new Date(dateStr)
  const now = new Date()
  return Math.max(0, Math.floor((now.getTime() - declared.getTime()) / 86_400_000))
}

function formatBodyPart(raw: string): string {
  return raw.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
}

const SEVERITY_STYLES: Record<string, { dot: string; label: string; border: string }> = {
  mild: { dot: "bg-yellow-400", label: "text-yellow-400", border: "border-yellow-400/20" },
  moderate: { dot: "bg-orange-400", label: "text-orange-400", border: "border-orange-400/20" },
  severe: { dot: "bg-red-400", label: "text-red-400", border: "border-red-400/20" },
}

// ─── Component ───────────────────────────────────────────────

export default function RecoveryPage() {
  const [injuries, setInjuries] = useState<Injury[]>([])
  const [selectedInjury, setSelectedInjury] = useState<Injury | null>(null)
  const [exercises, setExercises] = useState<RehabExercise[]>([])
  const [loadingInjuries, setLoadingInjuries] = useState(true)
  const [loadingExercises, setLoadingExercises] = useState(false)

  // ── Fetch injuries ──────────────────────────────────────────

  const fetchInjuries = useCallback(async () => {
    setLoadingInjuries(true)
    try {
      const res = await fetch(`/api/recovery/injuries/${USER_ID}`)
      if (!res.ok) throw new Error("Failed to fetch injuries")
      const data = await res.json()
      setInjuries(data.injuries ?? [])
    } catch {
      setInjuries([])
    } finally {
      setLoadingInjuries(false)
    }
  }, [])

  useEffect(() => {
    fetchInjuries()
  }, [fetchInjuries])

  // ── Fetch rehab exercises ─────────────────────────────────

  const selectInjury = async (injury: Injury) => {
    setSelectedInjury(injury)
    setLoadingExercises(true)
    try {
      const res = await fetch(`/api/recovery/rehab/${injury.id}?week=1`)
      if (!res.ok) throw new Error("Failed to fetch exercises")
      const data = await res.json()
      setExercises(data.exercises ?? [])
    } catch {
      setExercises([])
    } finally {
      setLoadingExercises(false)
    }
  }

  // ── Render ──────────────────────────────────────────────────

  const sev = selectedInjury ? SEVERITY_STYLES[selectedInjury.severity] : null

  return (
    <div className="min-h-screen bg-[#050505] text-white selection:bg-lime-400 selection:text-black">

      {/* ── Navbar ─────────────────────────────────────────── */}
      <nav className="sticky top-0 z-50 flex items-center justify-between border-b border-white/[0.06] bg-[#050505]/80 px-6 py-4 backdrop-blur-xl md:px-12">
        <Link href="/" className="group flex items-baseline gap-1.5">
          <span className="text-xl font-black tracking-[-0.04em]">UNBROKEN</span>
          <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-lime-400">fitness&nbsp;ai</span>
        </Link>

        <div className="flex items-center gap-3">
          <Link href="/recovery" className="text-[13px] font-medium text-white transition hover:text-lime-400">
            Recovery
          </Link>
          <Link href="/recovery/sleep" className="hidden text-[13px] font-medium text-white/40 transition hover:text-white sm:block">
            Sleep
          </Link>
          <Link href="/recovery/wellness" className="hidden text-[13px] font-medium text-white/40 transition hover:text-white sm:block">
            Wellness
          </Link>
          <Link href="/recovery/scanner" className="text-[13px] font-medium text-white/40 transition hover:text-lime-400 sm:block">
            🔍 Scanner
          </Link>
        </div>
      </nav>

      <div className="mx-auto max-w-6xl px-6 py-10 md:px-12 md:py-16">

        {/* ── Header ───────────────────────────────────────── */}
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-3 flex items-center gap-3 text-xs font-bold uppercase tracking-[0.3em] text-lime-400">
              <span className="inline-block h-px w-8 bg-lime-400" />
              Recovery Hub
            </p>
            <h1 className="text-4xl font-black tracking-[-0.03em] md:text-5xl">
              Your injuries
            </h1>
            <p className="mt-2 text-sm text-white/35">
              Track progress and follow your personalised rehab plan.
            </p>
          </div>

          <InjuryForm
            userId={USER_ID}
            triggerLabel="+ Declare Injury"
            onSuccess={() => fetchInjuries()}
          />
        </div>

        {/* ── Pain Heatmap ──────────────────────────────── */}
        {!loadingInjuries && injuries.length > 0 && (
          <div className="mt-12">
            <p className="mb-4 text-xs font-bold uppercase tracking-[0.2em] text-white/20">
              Pain map — click an injured region to log pain
            </p>
            <div className="mx-auto max-w-xs rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6">
              <PainHeatmap injuries={injuries} onPainLogged={() => fetchInjuries()} />
            </div>
          </div>
        )}

        {/* ── Two-column layout ────────────────────────────── */}
        <div className="mt-12 grid gap-8 lg:grid-cols-[1fr_1.2fr]">

          {/* ── Left: Injury list ──────────────────────────── */}
          <section>
            <p className="mb-4 text-xs font-bold uppercase tracking-[0.2em] text-white/20">
              Active injuries
            </p>

            {loadingInjuries ? (
              <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-10 text-center text-sm text-white/30">
                Loading…
              </div>
            ) : injuries.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-white/[0.08] p-12 text-center">
                <p className="text-3xl">💪</p>
                <p className="mt-3 text-sm font-medium text-white/40">No injuries declared</p>
                <p className="mt-1 text-xs text-white/20">Stay healthy — or declare one above.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {injuries.map((injury) => {
                  const isSelected = selectedInjury?.id === injury.id
                  const s = SEVERITY_STYLES[injury.severity] ?? SEVERITY_STYLES.mild
                  const days = daysSince(injury.declared_date)

                  return (
                    <button
                      key={injury.id}
                      onClick={() => selectInjury(injury)}
                      className={`group w-full rounded-2xl border p-5 text-left transition-all ${
                        isSelected
                          ? `border-lime-400/30 bg-lime-400/[0.04] shadow-[0_0_30px_rgba(163,230,53,0.05)]`
                          : "border-white/[0.06] bg-white/[0.02] hover:border-white/[0.12] hover:bg-white/[0.04]"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="text-base font-bold">{formatBodyPart(injury.body_part)}</h3>
                          <p className="mt-1 text-xs text-white/30">
                            {days} day{days !== 1 ? "s" : ""} ago
                          </p>
                        </div>
                        <span className={`flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider ${s.label} ${s.border}`}>
                          <span className={`inline-block h-1.5 w-1.5 rounded-full ${s.dot}`} />
                          {injury.severity}
                        </span>
                      </div>
                      {injury.description && (
                        <p className="mt-3 line-clamp-2 text-[13px] leading-relaxed text-white/30">
                          {injury.description}
                        </p>
                      )}
                    </button>
                  )
                })}
              </div>
            )}
          </section>

          {/* ── Right: Rehab exercises ─────────────────────── */}
          <section>
            <p className="mb-4 text-xs font-bold uppercase tracking-[0.2em] text-white/20">
              Rehab plan
            </p>

            {!selectedInjury ? (
              <div className="rounded-2xl border border-dashed border-white/[0.08] p-16 text-center">
                <p className="text-sm text-white/30">← Select an injury to view exercises</p>
              </div>
            ) : loadingExercises ? (
              <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-10 text-center text-sm text-white/30">
                Loading exercises…
              </div>
            ) : exercises.length === 0 ? (
              <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-10 text-center text-sm text-white/30">
                No exercises found for this injury.
              </div>
            ) : (
              <div>
                {/* Selected injury header */}
                <div className={`mb-5 rounded-xl border ${sev?.border ?? "border-white/[0.06]"} bg-white/[0.02] px-5 py-4`}>
                  <p className="text-xs text-white/30">Week 1 plan for</p>
                  <p className="mt-1 text-lg font-bold">
                    {formatBodyPart(selectedInjury.body_part)}
                    <span className={`ml-2 text-sm font-medium ${sev?.label ?? ""}`}>
                      {selectedInjury.severity}
                    </span>
                  </p>
                </div>

                {/* Exercise cards */}
                <div className="grid gap-3 sm:grid-cols-2">
                  {exercises.map((ex, i) => (
                    <div
                      key={ex.name}
                      className="group rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 transition-colors hover:border-lime-400/15 hover:bg-white/[0.04]"
                    >
                      <div className="flex items-start justify-between">
                        <h4 className="font-bold">{ex.name}</h4>
                        <span className="text-xs font-bold text-white/10">{String(i + 1).padStart(2, "0")}</span>
                      </div>

                      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[13px] text-white/40">
                        <span>{ex.sets} sets × {ex.reps} reps</span>
                        {ex.hold_seconds > 0 && <span>Hold {ex.hold_seconds}s</span>}
                      </div>

                      {ex.video_url && (
                        <a
                          href={ex.video_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-3 inline-block text-xs font-bold uppercase tracking-wider text-lime-400 transition hover:text-lime-300"
                        >
                          Watch demo →
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>
        </div>
      </div>

      {/* ── Footer ─────────────────────────────────────────── */}
      <footer className="mt-12 border-t border-white/[0.06] px-6 py-8 md:px-12">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-white/15">UNBROKEN FITNESS AI</p>
          <Link href="/" className="text-[11px] text-white/20 transition hover:text-white/40">← Back to home</Link>
        </div>
      </footer>
    </div>
  )
}
