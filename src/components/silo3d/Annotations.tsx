import { useMemo } from 'react'
import * as THREE from 'three'
import { Html, Line } from '@react-three/drei'
import type { SiloDimensions, VolumeResult } from '../../types/silo'

function DashedLine({ points, color = '#4a7fa8' }: { points: [number, number, number][]; color?: string }) {
  return <Line points={points} color={color} dashed dashSize={0.18} gapSize={0.12} lineWidth={1.6} transparent opacity={0.85} />
}

export function Annotations({ dims, volume }: { dims: SiloDimensions; volume: VolumeResult }) {
  const R = dims.diameterM / 2
  const totalHeight = dims.hopperHeightM + dims.cylinderHeightM + dims.roofHeightM
  const baseY = -dims.hopperHeightM
  const topY = dims.cylinderHeightM + dims.roofHeightM
  const offsetX = -(R + 1.1)

  const heightLinePoints = useMemo<[number, number, number][]>(
    () => [
      [offsetX, baseY, 0],
      [offsetX, topY, 0],
    ],
    [offsetX, baseY, topY],
  )
  const tickTop = useMemo<[number, number, number][]>(() => [[offsetX - 0.15, topY, 0], [offsetX + 0.15, topY, 0]], [offsetX, topY])
  const tickBottom = useMemo<[number, number, number][]>(() => [[offsetX - 0.15, baseY, 0], [offsetX + 0.15, baseY, 0]], [offsetX, baseY])

  const diameterPoints = useMemo<[number, number, number][]>(
    () => [
      [-R, baseY - 0.4, 0],
      [R, baseY - 0.4, 0],
    ],
    [R, baseY],
  )

  const levelPercent = Math.min(100, Math.max(0, volume.levelPercent))
  const ringY = Math.min(Math.max(volume.surfaceMeanHeightM, baseY * 0.98), topY)
  const pillAngle = Math.PI / 4
  const pillPos = new THREE.Vector3((R + 0.05) * Math.cos(pillAngle), ringY, (R + 0.05) * Math.sin(pillAngle))

  return (
    <group>
      <DashedLine points={heightLinePoints} />
      <DashedLine points={tickTop} />
      <DashedLine points={tickBottom} />
      <Html position={[offsetX, (baseY + topY) / 2, 0]} center distanceFactor={12} zIndexRange={[1, 0]} className="pointer-events-none select-none">
        <div className="whitespace-nowrap rounded-md bg-white/90 px-2 py-0.5 text-[11px] font-semibold text-slate-600 shadow-sm">
          {totalHeight.toFixed(1)} m
        </div>
      </Html>

      <DashedLine points={diameterPoints} color="#5b8fb5" />
      <Html position={[0, baseY - 0.4, 0]} center distanceFactor={12} zIndexRange={[1, 0]} className="pointer-events-none select-none">
        <div className="whitespace-nowrap rounded-md bg-white/90 px-2 py-0.5 text-[11px] font-semibold text-slate-600 shadow-sm">
          ⌀ {dims.diameterM.toFixed(1)} m
        </div>
      </Html>

      <Html position={pillPos} center distanceFactor={10} zIndexRange={[1, 0]} className="pointer-events-none select-none">
        <div className="whitespace-nowrap rounded-full bg-slate-800/85 px-3 py-1 text-[13px] font-bold text-white shadow-lg">
          {levelPercent.toFixed(0)}%
        </div>
      </Html>
    </group>
  )
}
