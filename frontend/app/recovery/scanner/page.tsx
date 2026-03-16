"use client"

import dynamic from "next/dynamic"
import Link from "next/link"
import { useState } from "react"

const Body3D = dynamic(() => import("@/components/recovery/body-3d"), { ssr: false })
const MovementScanner = dynamic(() => import("@/components/recovery/movement-scanner"), { ssr: false })

type ScanResult = {
  person_detected: boolean
  joints: { joint: string; label: string; measured_angle: number; expected_angle: number; mobility: string }[]
  restricted_joints: { joint: string; label: string; mobility: string; suggestion: string; exercises: string[]; measured_angle: number; expected_angle: number }[]
  recovery_penalty: number
  confidence: number
}

export default function ScannerPage() {
  const [restrictedJoints, setRestrictedJoints] = useState<{ joint: string; mobility: string }[]>([])
  const [scanResult, setScanResult] = useState<ScanResult | null>(null)

  const handleScanComplete = (result: ScanResult) => {
    setScanResult(result)
    if (result.restricted_joints) {
      setRestrictedJoints(result.restricted_joints.map((rj) => ({ joint: rj.joint, mobility: rj.mobility })))
    }
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white selection:bg-lime-400 selection:text-black">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 flex items-center justify-between border-b border-white/[0.06] bg-[#050505]/80 px-6 py-4 backdrop-blur-xl md:px-12">
        <Link href="/" className="group flex items-baseline gap-1.5">
          <span className="text-xl font-black tracking-[-0.04em]">UNBROKEN</span>
          <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-lime-400">fitness&nbsp;ai</span>
        </Link>
        <div className="flex items-center gap-3">
          <Link href="/recovery" className="text-[13px] font-medium text-white/40 transition hover:text-white">Recovery</Link>
          <Link href="/recovery/scanner" className="text-[13px] font-medium text-white transition hover:text-lime-400">Scanner</Link>
        </div>
      </nav>

      <div className="mx-auto max-w-6xl px-6 py-10 md:px-12 md:py-16">
        {/* Header */}
        <div className="mb-10">
          <p className="mb-3 flex items-center gap-3 text-xs font-bold uppercase tracking-[0.3em] text-lime-400">
            <span className="inline-block h-px w-8 bg-lime-400" />
            Movement Scanner
          </p>
          <h1 className="text-4xl font-black tracking-[-0.03em] md:text-5xl">
            AI Pose Analysis
          </h1>
          <p className="mt-2 text-sm text-white/35">
            Use your camera to detect movement restrictions and get recovery recommendations.
          </p>
        </div>

        {/* Two column: 3D model + Scanner */}
        <div className="grid gap-8 lg:grid-cols-2">
          {/* Left: 3D body model */}
          <div>
            <p className="mb-4 text-xs font-bold uppercase tracking-[0.2em] text-white/20">
              3D Body Model
            </p>
            <Body3D
              painRegions={[]}
              restrictedJoints={restrictedJoints}
              onRegionClick={(region) => console.log("Clicked:", region)}
            />
            {restrictedJoints.length > 0 && (
              <p className="mt-3 text-xs text-purple-400/60">
                ↑ Purple blinking regions indicate movement restrictions detected by the scanner.
              </p>
            )}
          </div>

          {/* Right: Camera scanner */}
          <div>
            <p className="mb-4 text-xs font-bold uppercase tracking-[0.2em] text-white/20">
              Camera Feed
            </p>
            <MovementScanner onScanComplete={handleScanComplete} />
          </div>
        </div>

        {/* Recovery penalty summary */}
        {scanResult && scanResult.recovery_penalty > 0 && (
          <div className="mt-10 rounded-2xl border border-orange-400/15 bg-orange-400/[0.03] p-6 text-center">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-orange-400/60">
              Movement Analysis Impact
            </p>
            <p className="mt-2 text-4xl font-black text-orange-400">
              -{scanResult.recovery_penalty}
            </p>
            <p className="mt-1 text-sm text-white/30">
              points deducted from recovery score due to {scanResult.restricted_joints.length} restricted joint{scanResult.restricted_joints.length !== 1 ? "s" : ""}
            </p>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="mt-12 border-t border-white/[0.06] px-6 py-8 md:px-12">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-white/15">UNBROKEN FITNESS AI</p>
          <Link href="/recovery" className="text-[11px] text-white/20 transition hover:text-white/40">← Back to Recovery Hub</Link>
        </div>
      </footer>
    </div>
  )
}
