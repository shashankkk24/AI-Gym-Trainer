"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { Canvas, useFrame, useLoader } from "@react-three/fiber"
import { OrbitControls } from "@react-three/drei"
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader.js"
import * as THREE from "three"

// ─── Types ───────────────────────────────────────────────────

type BodyPartData = {
  body_part: string
  pain_score: number
  severity: string
}

type RestrictedJoint = {
  joint: string
  mobility: string
}

type Body3DProps = {
  painRegions: BodyPartData[]
  restrictedJoints: RestrictedJoint[]
  onRegionClick?: (region: string) => void
}

// ─── Color helpers ───────────────────────────────────────────

function painToColor(score: number): string {
  if (score === 0) return "#262630"
  if (score <= 3) return "#f2cc10"
  if (score <= 6) return "#f28c18"
  return "#ea3535"
}

const RESTRICTED_COLOR = new THREE.Color(0.6, 0.3, 0.9)
const BASE_BODY_COLOR = new THREE.Color(0.22, 0.24, 0.28)

// ─── Hotspot positions on the body (Y-axis relative to model) ─

type HotspotConfig = {
  id: string
  label: string
  pos: [number, number, number]
}

const HOTSPOTS: HotspotConfig[] = [
  { id: "head", label: "Head", pos: [0, 1.65, 0.08] },
  { id: "neck", label: "Neck", pos: [0, 1.45, 0.05] },
  { id: "left_shoulder", label: "L Shoulder", pos: [-0.22, 1.32, 0.02] },
  { id: "right_shoulder", label: "R Shoulder", pos: [0.22, 1.32, 0.02] },
  { id: "upper_back", label: "Upper Back", pos: [0, 1.2, -0.06] },
  { id: "lower_back", label: "Lower Back", pos: [0, 0.95, -0.06] },
  { id: "left_elbow", label: "L Elbow", pos: [-0.38, 1.05, 0] },
  { id: "right_elbow", label: "R Elbow", pos: [0.38, 1.05, 0] },
  { id: "left_wrist", label: "L Wrist", pos: [-0.45, 0.78, 0.04] },
  { id: "right_wrist", label: "R Wrist", pos: [0.45, 0.78, 0.04] },
  { id: "abdomen", label: "Abdomen", pos: [0, 1.0, 0.1] },
  { id: "left_hip", label: "L Hip", pos: [-0.12, 0.82, 0.04] },
  { id: "right_hip", label: "R Hip", pos: [0.12, 0.82, 0.04] },
  { id: "left_knee", label: "L Knee", pos: [-0.12, 0.48, 0.06] },
  { id: "right_knee", label: "R Knee", pos: [0.12, 0.48, 0.06] },
  { id: "left_ankle", label: "L Ankle", pos: [-0.12, 0.1, 0.04] },
  { id: "right_ankle", label: "R Ankle", pos: [0.12, 0.1, 0.04] },
]

// ─── Animated hotspot sphere ─────────────────────────────────

function Hotspot({
  config,
  painScore,
  isRestricted,
  onClick,
}: {
  config: HotspotConfig
  painScore: number
  isRestricted: boolean
  onClick: () => void
}) {
  const ref = useRef<THREE.Mesh>(null!)
  const [hovered, setHovered] = useState(false)

  useFrame(({ clock }) => {
    if (!ref.current) return
    const mat = ref.current.material as THREE.MeshStandardMaterial

    if (isRestricted) {
      const t = (Math.sin(clock.getElapsedTime() * 5) + 1) / 2
      const base = painScore > 0 ? new THREE.Color(painToColor(painScore)) : new THREE.Color(0.4, 0.2, 0.6)
      mat.color.copy(base).lerp(RESTRICTED_COLOR, t * 0.8)
      mat.emissive.copy(RESTRICTED_COLOR).multiplyScalar(t * 0.5)
      ref.current.scale.setScalar(1 + t * 0.3)
    } else if (painScore > 0) {
      mat.color.set(painToColor(painScore))
      mat.emissive.set(painToColor(painScore)).multiplyScalar(0.15)
      ref.current.scale.setScalar(hovered ? 1.3 : 1)
    } else {
      mat.color.set(0x333340)
      mat.emissive.set(0, 0, 0)
      ref.current.scale.setScalar(hovered ? 1.2 : 0.7)
    }
  })

  return (
    <mesh
      ref={ref}
      position={config.pos}
      onClick={(e) => { e.stopPropagation(); onClick() }}
      onPointerOver={() => { setHovered(true); document.body.style.cursor = "pointer" }}
      onPointerOut={() => { setHovered(false); document.body.style.cursor = "default" }}
    >
      <sphereGeometry args={[0.025, 12, 12]} />
      <meshStandardMaterial transparent opacity={0.9} roughness={0.3} />
    </mesh>
  )
}

// ─── OBJ Body Model ──────────────────────────────────────────

function BodyModel() {
  const obj = useLoader(OBJLoader, "/models/FinalBaseMesh.obj")

  const scene = useMemo(() => {
    const cloned = obj.clone()

    // Compute bounding box to center and normalize
    const box = new THREE.Box3().setFromObject(cloned)
    const center = box.getCenter(new THREE.Vector3())
    const size = box.getSize(new THREE.Vector3())
    const maxDim = Math.max(size.x, size.y, size.z)
    const scale = 2 / maxDim // normalize to ~2 units tall

    cloned.position.set(-center.x * scale, -box.min.y * scale, -center.z * scale)
    cloned.scale.setScalar(scale)

    // Apply dark material
    cloned.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.material = new THREE.MeshStandardMaterial({
          color: BASE_BODY_COLOR,
          roughness: 0.7,
          metalness: 0.05,
          transparent: true,
          opacity: 0.55,
          side: THREE.DoubleSide,
        })
      }
    })

    return cloned
  }, [obj])

  return <primitive object={scene} />
}

// ─── Scene ───────────────────────────────────────────────────

function BodyScene({ painRegions, restrictedJoints, onRegionClick }: Body3DProps) {
  const painMap = new Map<string, number>()
  for (const pr of painRegions) painMap.set(pr.body_part, pr.pain_score)

  const restrictedSet = new Set<string>()
  for (const rj of restrictedJoints) restrictedSet.add(rj.joint)

  return (
    <>
      <ambientLight intensity={0.6} />
      <directionalLight position={[3, 5, 4]} intensity={0.9} />
      <directionalLight position={[-2, 3, -3]} intensity={0.3} />
      <pointLight position={[0, 2, 2]} intensity={0.4} color="#a3e635" />

      <group>
        <BodyModel />

        {/* Pain/restriction hotspots */}
        {HOTSPOTS.map((hs) => (
          <Hotspot
            key={hs.id}
            config={hs}
            painScore={painMap.get(hs.id) ?? 0}
            isRestricted={restrictedSet.has(hs.id)}
            onClick={() => onRegionClick?.(hs.id)}
          />
        ))}
      </group>

      <OrbitControls
        enablePan={false}
        enableZoom={true}
        minDistance={2}
        maxDistance={6}
        autoRotate
        autoRotateSpeed={0.6}
        target={[0, 0.9, 0]}
      />
    </>
  )
}

// ─── Export ──────────────────────────────────────────────────

export function Body3D({ painRegions, restrictedJoints, onRegionClick }: Body3DProps) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  if (!mounted) {
    return (
      <div className="flex h-[500px] items-center justify-center rounded-2xl border border-white/[0.06] bg-[#080810]">
        <p className="text-sm text-white/20">Loading 3D model…</p>
      </div>
    )
  }

  return (
    <div className="relative h-[500px] w-full rounded-2xl border border-white/[0.06] bg-[#080810]">
      <Canvas camera={{ position: [0, 1, 3.5], fov: 35 }}>
        <BodyScene
          painRegions={painRegions}
          restrictedJoints={restrictedJoints}
          onRegionClick={onRegionClick}
        />
      </Canvas>

      {/* Legend overlay */}
      <div className="absolute bottom-3 left-3 flex flex-wrap gap-3 rounded-lg border border-white/[0.06] bg-black/60 px-3 py-2 text-[10px] text-white/50 backdrop-blur-sm">
        <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-[#333340]" /> No pain</span>
        <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-yellow-400" /> Mild</span>
        <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-orange-400" /> Moderate</span>
        <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-red-500" /> Severe</span>
        <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-purple-500 animate-pulse" /> Restricted</span>
      </div>
    </div>
  )
}

export default Body3D
