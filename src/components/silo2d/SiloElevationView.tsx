import type { SiloDimensions, VolumeResult } from '../../types/silo'
import { profileAt, radialProfile } from '../../lib/topography'
import { hopperOutletRadius } from '../../lib/volume'

const GRAIN_COLOR = '#c9a15f'
const PAD = 30
const CONTENT_H = 260
const PROFILE_SAMPLES = 40

export function SiloElevationView({ dims, volume }: { dims: SiloDimensions; volume: VolumeResult }) {
  const totalHeight = dims.hopperHeightM + dims.cylinderHeightM + dims.roofHeightM
  const pxPerM = CONTENT_H / Math.max(totalHeight, 0.1)
  const R = dims.diameterM / 2
  const halfD = R * pxPerM
  const width = halfD * 2 + PAD * 2
  const height = CONTENT_H + PAD * 2
  const cx = width / 2

  const yTop = PAD
  const yRoofBase = yTop + dims.roofHeightM * pxPerM
  const yCylBottom = yRoofBase + dims.cylinderHeightM * pxPerM
  const yHopperBottom = yCylBottom + dims.hopperHeightM * pxPerM
  const r0 = hopperOutletRadius(dims)
  const outletHalf = r0 * pxPerM
  const maxHeight = dims.cylinderHeightM + Math.max(dims.roofHeightM, 0)

  const heightToY = (hM: number) => yCylBottom - hM * pxPerM

  const outline = [
    `M ${cx} ${yTop}`,
    `L ${cx + halfD} ${yRoofBase}`,
    `L ${cx + halfD} ${yCylBottom}`,
    `L ${cx + outletHalf} ${yHopperBottom}`,
    `L ${cx - outletHalf} ${yHopperBottom}`,
    `L ${cx - halfD} ${yCylBottom}`,
    `L ${cx - halfD} ${yRoofBase}`,
    'Z',
  ].join(' ')

  const surfaceZM = volume.surfaceMeanHeightM
  const grid = volume.heightGrid
  const profile = radialProfile(grid)

  let fillPath = ''
  if (surfaceZM > -dims.hopperHeightM + 1e-6) {
    if (surfaceZM < 0 && dims.hopperType === 'cone' && dims.hopperHeightM > 0) {
      // Surface sits inside the hopper: a partial frustum with tapered walls, flat top.
      const h1 = surfaceZM + dims.hopperHeightM
      const rTop = r0 + (R - r0) * (h1 / dims.hopperHeightM)
      const yTopFill = heightToY(surfaceZM)
      const topHalf = rTop * pxPerM
      fillPath = [
        `M ${cx - outletHalf} ${yHopperBottom}`,
        `L ${cx - topHalf} ${yTopFill}`,
        `L ${cx + topHalf} ${yTopFill}`,
        `L ${cx + outletHalf} ${yHopperBottom}`,
        'Z',
      ].join(' ')
    } else {
      // Hopper assumed full + cylinder filled up to the mounded/funnelled surface profile.
      const top: string[] = []
      for (let i = 0; i <= PROFILE_SAMPLES; i++) {
        const xM = -R + (2 * R * i) / PROFILE_SAMPLES
        const h = Math.min(Math.max(profileAt(profile, grid, Math.abs(xM)), 0), maxHeight)
        const x = cx + xM * pxPerM
        top.push(`L ${x.toFixed(1)} ${heightToY(h).toFixed(1)}`)
      }
      fillPath = [
        `M ${cx - outletHalf} ${yHopperBottom}`,
        `L ${cx - halfD} ${yCylBottom}`,
        ...top,
        `L ${cx + halfD} ${yCylBottom}`,
        `L ${cx + outletHalf} ${yHopperBottom}`,
        'Z',
      ].join(' ')
    }
  }

  const levelPercent = Math.min(100, Math.max(0, volume.levelPercent))
  const levelY = heightToY(Math.min(Math.max(surfaceZM, -dims.hopperHeightM), maxHeight))

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="h-full w-full">
      <defs>
        <clipPath id="elevClip">
          <path d={outline} />
        </clipPath>
      </defs>
      <g clipPath="url(#elevClip)">{fillPath && <path d={fillPath} fill={GRAIN_COLOR} />}</g>
      <path d={outline} fill="none" stroke="var(--color-ink-soft)" strokeWidth={1.6} strokeLinejoin="round" />
      <line
        x1={cx - halfD - 8}
        y1={levelY}
        x2={cx + halfD + 8}
        y2={levelY}
        stroke="#5fd4e8"
        strokeWidth={1.4}
        strokeDasharray="4 3"
        opacity={0.85}
      />
      <text x={cx} y={levelY - 6} textAnchor="middle" fontSize={11} fontWeight={700} fill="var(--color-ink)">
        {levelPercent.toFixed(0)}%
      </text>
    </svg>
  )
}
