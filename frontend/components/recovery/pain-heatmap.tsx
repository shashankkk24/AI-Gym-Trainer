"use client"

import { useEffect, useState } from "react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Slider } from "@/components/ui/slider"
import { Textarea } from "@/components/ui/textarea"

// ─── Types ───────────────────────────────────────────────────

type PainLog = { date: string; pain_score: number; notes: string }

type Injury = {
  id: string
  body_part: string
  severity: string
  is_active: boolean
  pain_logs: PainLog[]
}

type BodyRegion = {
  id: string
  label: string
  d: string
}

type PainEntry = {
  regionId: string
  injuryId: string
  score: number
  notes: string
}

type PainHeatmapProps = {
  injuries: Injury[]
  onPainLogged?: () => void
}

// ─── SVG body region paths (front view) ─────────────────────

const BODY_REGIONS: BodyRegion[] = [
  { id: "head", label: "Head", d: "M140,30 Q140,10 160,10 Q180,10 180,30 Q180,50 160,55 Q140,50 140,30 Z" },
  { id: "neck", label: "Neck", d: "M152,55 L168,55 L170,72 L150,72 Z" },
  { id: "left_shoulder", label: "Left Shoulder", d: "M115,75 Q110,72 105,78 L100,95 L120,92 L130,78 Z" },
  { id: "right_shoulder", label: "Right Shoulder", d: "M205,75 Q210,72 215,78 L220,95 L200,92 L190,78 Z" },
  { id: "upper_back", label: "Upper Back", d: "M130,75 L190,75 L195,110 L125,110 Z" },
  { id: "lower_back", label: "Lower Back", d: "M128,110 L192,110 L190,160 L130,160 Z" },
  { id: "left_elbow", label: "Left Elbow", d: "M88,128 L102,125 L105,150 L90,152 Z" },
  { id: "right_elbow", label: "Right Elbow", d: "M218,125 L232,128 L230,152 L215,150 Z" },
  { id: "left_wrist", label: "Left Wrist", d: "M78,170 L92,168 L90,192 L76,194 Z" },
  { id: "right_wrist", label: "Right Wrist", d: "M228,168 L242,170 L244,194 L230,192 Z" },
  { id: "abdomen", label: "Abdomen", d: "M132,160 L188,160 L185,195 L135,195 Z" },
  { id: "left_hip", label: "Left Hip", d: "M120,195 L150,195 L145,230 L118,225 Z" },
  { id: "right_hip", label: "Right Hip", d: "M170,195 L200,195 L202,225 L175,230 Z" },
  { id: "left_knee", label: "Left Knee", d: "M122,270 L148,270 L150,305 L120,305 Z" },
  { id: "right_knee", label: "Right Knee", d: "M172,270 L198,270 L200,305 L170,305 Z" },
  { id: "left_ankle", label: "Left Ankle", d: "M125,345 L147,345 L148,375 L124,375 Z" },
  { id: "right_ankle", label: "Right Ankle", d: "M173,345 L195,345 L196,375 L172,375 Z" },
]

// ─── Helpers ─────────────────────────────────────────────────

function getLatestPainScore(injury: Injury): number {
  if (!injury.pain_logs || injury.pain_logs.length === 0) return 0
  return injury.pain_logs[injury.pain_logs.length - 1].pain_score
}

function painColor(score: number, isSelected = false): string {
  if (isSelected) return "rgba(163,230,53,0.35)"
  if (score === 0) return "rgba(255,255,255,0.04)"
  if (score <= 3) return "rgba(250,204,21,0.5)"
  if (score <= 6) return "rgba(251,146,60,0.6)"
  return "rgba(239,68,68,0.7)"
}

function painGlow(score: number): string {
  if (score === 0) return "none"
  if (score <= 3) return "drop-shadow(0 0 6px rgba(250,204,21,0.4))"
  if (score <= 6) return "drop-shadow(0 0 8px rgba(251,146,60,0.5))"
  return "drop-shadow(0 0 10px rgba(239,68,68,0.6))"
}

function scoreEmoji(score: number): string {
  if (score <= 2) return "😌"
  if (score <= 4) return "😐"
  if (score <= 6) return "😣"
  if (score <= 8) return "😖"
  return "🔥"
}

function regionLabel(id: string): string {
  return BODY_REGIONS.find((r) => r.id === id)?.label ?? id
}

// ─── Component ───────────────────────────────────────────────

export function PainHeatmap({ injuries, onPainLogged }: PainHeatmapProps) {
  const [hoveredRegion, setHoveredRegion] = useState<string | null>(null)

  // Multi-select state
  const [selectedEntries, setSelectedEntries] = useState<Map<string, PainEntry>>(new Map())
  const [dialogOpen, setDialogOpen] = useState(false)

  // Single-region editing within dialog
  const [editingRegion, setEditingRegion] = useState<string | null>(null)

  const [submitting, setSubmitting] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  // Build lookup: body_part → injury
  const injuryMap = new Map<string, Injury>()
  for (const inj of injuries) {
    if (inj.is_active) injuryMap.set(inj.body_part, inj)
  }

  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 2500)
      return () => clearTimeout(t)
    }
  }, [toast])

  // ── Toggle region selection on body click ───────────────────

  const toggleRegion = (regionId: string) => {
    const injury = injuryMap.get(regionId)
    if (!injury) return

    setSelectedEntries((prev) => {
      const next = new Map(prev)
      if (next.has(regionId)) {
        next.delete(regionId)
      } else {
        next.set(regionId, {
          regionId,
          injuryId: injury.id,
          score: 5,
          notes: "",
        })
      }
      return next
    })
  }

  // ── Open dialog to review & adjust scores ───────────────────

  const openLogDialog = () => {
    if (selectedEntries.size === 0) return
    setEditingRegion(null)
    setDialogOpen(true)
  }

  const updateEntry = (regionId: string, updates: Partial<PainEntry>) => {
    setSelectedEntries((prev) => {
      const next = new Map(prev)
      const existing = next.get(regionId)
      if (existing) next.set(regionId, { ...existing, ...updates })
      return next
    })
  }

  const removeEntry = (regionId: string) => {
    setSelectedEntries((prev) => {
      const next = new Map(prev)
      next.delete(regionId)
      if (next.size === 0) setDialogOpen(false)
      return next
    })
  }

  // ── Submit all pain logs ────────────────────────────────────

  const handleSubmitAll = async () => {
    setSubmitting(true)
    let successCount = 0
    const entries = Array.from(selectedEntries.values())

    for (const entry of entries) {
      try {
        const res = await fetch("/api/recovery/pain-log", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            injury_id: entry.injuryId,
            pain_score: entry.score,
            notes: entry.notes,
          }),
        })
        if (res.ok) successCount++
      } catch {
        // continue with remaining
      }
    }

    setSubmitting(false)
    setDialogOpen(false)
    setSelectedEntries(new Map())
    setToast(`${successCount} pain log${successCount !== 1 ? "s" : ""} saved`)
    onPainLogged?.()
  }

  const hoveredInjury = hoveredRegion ? injuryMap.get(hoveredRegion) : null
  const hoveredScore = hoveredInjury ? getLatestPainScore(hoveredInjury) : 0

  return (
    <div className="relative">
      {/* ── Tooltip ───────────────────────────────────────── */}
      {hoveredRegion && (
        <div className="pointer-events-none absolute -top-2 left-1/2 z-20 -translate-x-1/2 -translate-y-full rounded-lg border border-white/10 bg-[#111] px-3 py-2 text-xs shadow-xl">
          <p className="font-bold text-white">{regionLabel(hoveredRegion)}</p>
          {hoveredInjury ? (
            <p className="mt-0.5 text-white/50">
              Pain: <span className="text-white">{hoveredScore}/10</span> · {hoveredInjury.severity}
            </p>
          ) : (
            <p className="mt-0.5 text-white/40">No active injury</p>
          )}
          {injuryMap.has(hoveredRegion) && (
            <p className="mt-0.5 text-lime-400/60 text-[10px]">Click to {selectedEntries.has(hoveredRegion) ? "deselect" : "select"}</p>
          )}
        </div>
      )}

      {/* ── SVG Body ──────────────────────────────────────── */}
      <svg
        viewBox="0 0 320 400"
        className="mx-auto h-auto w-full max-w-[280px]"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Body silhouette outline */}
        <path
          d="M160,10 Q140,10 140,30 Q140,50 160,55 Q180,50 180,30 Q180,10 160,10 Z
             M150,55 L152,72 L105,78 L95,100 L85,130 L78,170 L72,200 L80,200 L95,155 L110,92 L120,80 L130,75
             L130,195 L118,225 L120,270 L118,305 L120,345 L122,385 L150,385 L148,345 L150,305 L148,270 L145,230 L160,200
             L175,230 L172,270 L170,305 L172,345 L170,385 L198,385 L200,345 L202,305 L200,270 L202,225 L190,195
             L190,75 L200,80 L210,92 L225,155 L240,200 L248,200 L242,170 L235,130 L225,100 L215,78 L168,72 L170,55 Z"
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth="1"
        />

        {/* Clickable regions */}
        {BODY_REGIONS.map((region) => {
          const injury = injuryMap.get(region.id)
          const score = injury ? getLatestPainScore(injury) : 0
          const isHovered = hoveredRegion === region.id
          const isInjured = Boolean(injury)
          const isSelected = selectedEntries.has(region.id)

          return (
            <path
              key={region.id}
              d={region.d}
              fill={painColor(score, isSelected)}
              stroke={
                isSelected
                  ? "rgba(163,230,53,0.8)"
                  : isHovered
                    ? "rgba(163,230,53,0.4)"
                    : isInjured
                      ? "rgba(255,255,255,0.1)"
                      : "rgba(255,255,255,0.03)"
              }
              strokeWidth={isSelected ? 2.5 : isHovered ? 2 : 1}
              className={`transition-all duration-200 ${isInjured ? "cursor-pointer" : "cursor-default"}`}
              style={{ filter: isSelected ? "drop-shadow(0 0 8px rgba(163,230,53,0.3))" : painGlow(score) }}
              onMouseEnter={() => setHoveredRegion(region.id)}
              onMouseLeave={() => setHoveredRegion(null)}
              onClick={() => toggleRegion(region.id)}
            />
          )
        })}
      </svg>

      {/* ── Legend ─────────────────────────────────────────── */}
      <div className="mt-4 flex items-center justify-center gap-4 text-[11px] text-white/30">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-sm bg-white/5 border border-white/10" /> None
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-sm bg-yellow-400/50" /> Mild
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-sm bg-orange-400/60" /> Moderate
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-sm bg-red-500/70" /> Severe
        </span>
      </div>

      {/* ── Selected count + Log button ───────────────────── */}
      {selectedEntries.size > 0 && (
        <div className="mt-4 flex items-center justify-between rounded-xl border border-lime-400/20 bg-lime-400/[0.05] px-4 py-3">
          <p className="text-sm text-white/60">
            <span className="font-bold text-lime-400">{selectedEntries.size}</span> region{selectedEntries.size !== 1 ? "s" : ""} selected
          </p>
          <Button
            size="sm"
            className="bg-lime-400 font-bold text-black hover:bg-lime-300"
            onClick={openLogDialog}
          >
            Log Pain →
          </Button>
        </div>
      )}

      {/* ── Multi-Pain Log Dialog ─────────────────────────── */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Log Pain — {selectedEntries.size} Region{selectedEntries.size !== 1 ? "s" : ""}</DialogTitle>
            <DialogDescription>
              Set pain levels for each selected body part, then submit all at once.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            {Array.from(selectedEntries.values()).map((entry) => {
              const isExpanded = editingRegion === entry.regionId

              return (
                <div
                  key={entry.regionId}
                  className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-4"
                >
                  {/* Region header row */}
                  <div className="flex items-center justify-between">
                    <button
                      className="flex items-center gap-3 text-left"
                      onClick={() => setEditingRegion(isExpanded ? null : entry.regionId)}
                    >
                      <span className="font-bold text-sm">{regionLabel(entry.regionId)}</span>
                      <span className="text-lg">{scoreEmoji(entry.score)}</span>
                    </button>

                    <div className="flex items-center gap-3">
                      <span className="text-2xl font-black text-white/80">{entry.score}</span>
                      <span className="text-xs text-white/20">/10</span>
                      <button
                        className="ml-1 rounded-md p-1 text-white/20 transition hover:bg-white/10 hover:text-white/50"
                        onClick={() => removeEntry(entry.regionId)}
                        title="Remove"
                      >
                        ✕
                      </button>
                    </div>
                  </div>

                  {/* Inline slider (always visible) */}
                  <div className="mt-3 px-1">
                    <Slider
                      min={1}
                      max={10}
                      step={1}
                      value={[entry.score]}
                      onValueChange={([v]) => updateEntry(entry.regionId, { score: v })}
                    />
                  </div>

                  {/* Expandable notes */}
                  {isExpanded && (
                    <div className="mt-3">
                      <Textarea
                        placeholder="Optional notes…"
                        value={entry.notes}
                        onChange={(e) => updateEntry(entry.regionId, { notes: e.target.value })}
                        className="bg-white/5 border-white/10 text-sm text-white placeholder:text-white/20"
                        rows={2}
                      />
                    </div>
                  )}

                  {!isExpanded && (
                    <button
                      className="mt-2 text-[11px] text-white/25 transition hover:text-white/40"
                      onClick={() => setEditingRegion(entry.regionId)}
                    >
                      + Add notes
                    </button>
                  )}
                </div>
              )
            })}

            <Button
              className="w-full bg-lime-400 font-bold text-black hover:bg-lime-300"
              onClick={handleSubmitAll}
              disabled={submitting}
            >
              {submitting
                ? "Saving…"
                : `Log ${selectedEntries.size} Pain${selectedEntries.size !== 1 ? "s" : ""}`}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Toast ─────────────────────────────────────────── */}
      {toast && (
        <div className="fixed bottom-4 right-4 z-[60] rounded-xl border border-lime-400/30 bg-[#0a0a0f] px-4 py-3 text-sm text-lime-400 shadow-lg">
          {toast}
        </div>
      )}
    </div>
  )
}

export default PainHeatmap
