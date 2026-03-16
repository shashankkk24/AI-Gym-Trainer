"use client"

import { useCallback, useEffect, useRef, useState } from "react"

import { Button } from "@/components/ui/button"

// ─── Types ───────────────────────────────────────────────────

type RestrictedJoint = {
  joint: string
  label: string
  measured_angle: number
  expected_angle: number
  mobility: string
  suggestion: string
  exercises: string[]
}

type ScanResult = {
  person_detected: boolean
  joints: {
    joint: string
    label: string
    measured_angle: number
    expected_angle: number
    mobility: string
  }[]
  restricted_joints: RestrictedJoint[]
  recovery_penalty: number
  confidence: number
}

type MovementScannerProps = {
  onScanComplete?: (result: ScanResult) => void
}

// ─── Component ───────────────────────────────────────────────

export function MovementScanner({ onScanComplete }: MovementScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const [cameraActive, setCameraActive] = useState(false)
  const [scanning, setScanning] = useState(false)
  const [latestResult, setLatestResult] = useState<ScanResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  // ── Start camera ───────────────────────────────────────────

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: "user" },
      })
      streamRef.current = stream
      setCameraActive(true)
      setError(null)
    } catch {
      setError("Camera access denied. Please enable camera permissions.")
    }
  }, [])

  // Attach stream to video element once it's rendered
  useEffect(() => {
    if (cameraActive && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current
      videoRef.current.play().catch(() => {})
    }
  }, [cameraActive])

  const stopCamera = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop())
      streamRef.current = null
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
    setCameraActive(false)
    setScanning(false)
  }, [])

  useEffect(() => {
    return () => stopCamera()
  }, [stopCamera])

  // ── Capture frame and send to backend ─────────────────────

  const captureAndAnalyze = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current) return

    const video = videoRef.current
    const canvas = canvasRef.current
    canvas.width = video.videoWidth || 640
    canvas.height = video.videoHeight || 480

    const ctx = canvas.getContext("2d")
    if (!ctx) return
    ctx.drawImage(video, 0, 0)

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", 0.7)
    )
    if (!blob) return

    const reader = new FileReader()
    reader.onloadend = async () => {
      const base64 = (reader.result as string).split(",")[1]
      try {
        const res = await fetch("/api/recovery/movement-analysis", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ frame: base64 }),
        })
        if (!res.ok) throw new Error("Analysis failed")
        const data: ScanResult = await res.json()
        setLatestResult(data)
        onScanComplete?.(data)
      } catch {
        // silently retry on next frame
      }
    }
    reader.readAsDataURL(blob)
  }, [onScanComplete])

  const startScan = () => {
    setScanning(true)
    setLatestResult(null)
    // Analyze every 2 seconds
    captureAndAnalyze()
    intervalRef.current = setInterval(captureAndAnalyze, 2000)
  }

  const stopScan = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    setScanning(false)
  }

  // ── Mobility badge color ───────────────────────────────────

  const mobilityStyle = (m: string) => {
    if (m === "severely_restricted") return "border-red-400/30 text-red-400"
    if (m === "restricted") return "border-orange-400/30 text-orange-400"
    if (m === "limited") return "border-yellow-400/30 text-yellow-400"
    return "border-white/10 text-white/40"
  }

  return (
    <div className="space-y-4">
      {/* Video feed */}
      <div className="relative overflow-hidden rounded-2xl border border-white/[0.06] bg-[#080810]">
        {!cameraActive && (
          <div className="flex h-64 items-center justify-center">
            <Button
              className="bg-lime-400 font-bold text-black hover:bg-lime-300"
              onClick={startCamera}
            >
              📷 Enable Camera
            </Button>
          </div>
        )}

        {/* Always render video so ref is available; hide when inactive */}
        <video
          ref={videoRef}
          className={`w-full object-cover ${cameraActive ? "h-64" : "hidden"}`}
          autoPlay
          muted
          playsInline
        />

        {/* Scan overlay */}
        {cameraActive && scanning && (
          <div className="absolute inset-0 border-2 border-lime-400/40 animate-pulse rounded-2xl" />
        )}

        {/* Confidence badge */}
        {cameraActive && latestResult?.person_detected && (
          <div className="absolute left-3 top-3 rounded-lg bg-black/70 px-2 py-1 text-[10px] font-bold text-lime-400 backdrop-blur-sm">
            Person detected · {Math.round((latestResult.confidence ?? 0) * 100)}% confidence
          </div>
        )}

        <canvas ref={canvasRef} className="hidden" />
      </div>

      {/* Controls */}
      {cameraActive && (
        <div className="flex gap-3">
          {!scanning ? (
            <Button
              className="flex-1 bg-lime-400 font-bold text-black hover:bg-lime-300"
              onClick={startScan}
            >
              🔍 Start Movement Scan
            </Button>
          ) : (
            <Button
              className="flex-1 bg-white/10 font-bold text-white hover:bg-white/15"
              onClick={stopScan}
            >
              ⏹ Stop Scan
            </Button>
          )}
          <Button
            variant="outline"
            className="border-white/10 text-white/50 hover:border-white/20 hover:text-white"
            onClick={stopCamera}
          >
            Close Camera
          </Button>
        </div>
      )}

      {error && (
        <p className="rounded-xl border border-red-400/20 bg-red-400/5 p-3 text-sm text-red-400">
          {error}
        </p>
      )}

      {/* Results */}
      {latestResult && latestResult.person_detected && (
        <div className="space-y-3">
          {/* Joint status */}
          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5">
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-white/20">
              Joint mobility
            </p>
            <div className="grid gap-2 sm:grid-cols-2">
              {latestResult.joints.map((j) => (
                <div
                  key={j.joint}
                  className="flex items-center justify-between rounded-lg border border-white/[0.06] p-2.5"
                >
                  <span className="text-xs font-medium">{j.label}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-white/30">{j.measured_angle}°/{j.expected_angle}°</span>
                    <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase ${mobilityStyle(j.mobility)}`}>
                      {j.mobility.replace("_", " ")}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Restrictions with suggestions */}
          {latestResult.restricted_joints.length > 0 && (
            <div className="rounded-2xl border border-orange-400/15 bg-orange-400/[0.03] p-5">
              <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-orange-400/60">
                ⚠ Movement restrictions detected
              </p>
              <div className="space-y-3">
                {latestResult.restricted_joints.map((rj) => (
                  <div key={rj.joint}>
                    <p className="text-sm font-bold">{rj.label}</p>
                    <p className="mt-0.5 text-xs text-white/40">{rj.suggestion}</p>
                    <p className="mt-1 text-xs text-lime-400/60">
                      Recommended: {rj.exercises.join(", ")}
                    </p>
                  </div>
                ))}
              </div>

              {latestResult.recovery_penalty > 0 && (
                <p className="mt-3 border-t border-white/[0.06] pt-3 text-xs text-white/30">
                  Recovery score penalty: <span className="font-bold text-orange-400">-{latestResult.recovery_penalty}</span> points
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {latestResult && !latestResult.person_detected && (
        <p className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 text-center text-sm text-white/30">
          No person detected — step into frame and try again.
        </p>
      )}
    </div>
  )
}

export default MovementScanner
