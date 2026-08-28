import { useMemo } from 'react'
import type { SiloDimensions, VolumeResult } from '../../types/silo'
import { heightRange, heightToColor } from '../../lib/topography'

const DISPLAY_RINGS = 20
const DISPLAY_SECTORS = 48
const SIZE = 260
const CENTER = SIZE / 2

function polar(cx: number, cy: number, r: number, angle: number): [number, number] {
  return [cx + r * Math.cos(angle), cy + r * Math.sin(angle)]
}

function annularSectorPath(cx: number, cy: number, r0: number, r1: number, a0: number, a1: number): string {
  const [x0a, y0a] = polar(cx, cy, r0, a0)
  const [x1a, y1a] = polar(cx, cy, r1, a0)
  const [x1b, y1b] = polar(cx, cy, r1, a1)
  const [x0b, y0b] = polar(cx, cy, r0, a1)
  const largeArc = a1 - a0 > Math.PI ? 1 : 0
  return [
    `M ${x0a.toFixed(2)} ${y0a.toFixed(2)}`,
    `L ${x1a.toFixed(2)} ${y1a.toFixed(2)}`,
    `A ${r1.toFixed(2)} ${r1.toFixed(2)} 0 ${largeArc} 1 ${x1b.toFixed(2)} ${y1b.toFixed(2)}`,
    `L ${x0b.toFixed(2)} ${y0b.toFixed(2)}`,
    `A ${r0.toFixed(2)} ${r0.toFixed(2)} 0 ${largeArc} 0 ${x0a.toFixed(2)} ${y0a.toFixed(2)}`,
    'Z',
  ].join(' ')
}

export function SiloPlanView({ dims, volume }: { dims: SiloDimensions; volume: VolumeResult }) {
  const grid = volume.heightGrid
  const R = dims.diameterM / 2
  const pxPerM = (CENTER - 14) / R

  const cells = useMemo(() => {
    const { min, max } = heightRange(grid)
    const out: { d: string; color: string }[] = []
    for (let i = 0; i < DISPLAY_RINGS; i++) {
      const srcRow = Math.min(grid.rings - 1, Math.floor(((i + 0.5) / DISPLAY_RINGS) * grid.rings))
      const r0 = (i / DISPLAY_RINGS) * R * pxPerM
      const r1 = ((i + 1) / DISPLAY_RINGS) * R * pxPerM
      for (let j = 0; j < DISPLAY_SECTORS; j++) {
        const srcCol = Math.min(grid.sectors - 1, Math.floor(((j + 0.5) / DISPLAY_SECTORS) * grid.sectors))
        const a0 = (j / DISPLAY_SECTORS) * Math.PI * 2
        const a1 = ((j + 1) / DISPLAY_SECTORS) * Math.PI * 2
        const height = grid.values[srcRow][srcCol]
        out.push({ d: annularSectorPath(CENTER, CENTER, r0, r1, a0, a1), color: heightToColor(height, min, max) })
      }
    }
    return out
  }, [grid, R, pxPerM])

  const outletR = dims.hopperType === 'cone' ? (dims.outletDiameterM / 2) * pxPerM : 0
  const outerR = R * pxPerM

  return (
    <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="h-full w-full">
      <defs>
        <clipPath id="planClip">
          <circle cx={CENTER} cy={CENTER} r={outerR} />
        </clipPath>
      </defs>
      <g clipPath="url(#planClip)">
        {cells.map((c, i) => (
          <path key={i} d={c.d} fill={c.color} stroke={c.color} strokeWidth={0.6} />
        ))}
      </g>
      <circle cx={CENTER} cy={CENTER} r={outerR} fill="none" stroke="var(--color-ink-soft)" strokeWidth={1.6} />
      {outletR > 0 && <circle cx={CENTER} cy={CENTER} r={outletR} fill="none" stroke="var(--color-panel)" strokeWidth={1.2} strokeDasharray="2 2" opacity={0.7} />}
      <circle cx={CENTER} cy={CENTER} r={1.6} fill="var(--color-ink-soft)" />
    </svg>
  )
}
