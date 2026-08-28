import type { SiloDimensions, VolumeResult } from '../../types/silo'
import { profileAt, radialProfile } from '../../lib/topography'
import {
  hopperOutletRadius,
  legClearanceM,
  LEG_BOTTOM_RADIUS_FRAC,
  LEG_BRACE_FRAC,
  LEG_TOP_HEIGHT_FRAC,
  LEG_TOP_RADIUS_FRAC,
} from '../../lib/volume'

const PAD = 34
const CONTENT_H = 260
const PROFILE_SAMPLES = 40

export function SiloElevationView({ dims, volume }: { dims: SiloDimensions; volume: VolumeResult }) {
  const legClearance = legClearanceM(dims)
  const totalHeight = dims.hopperHeightM + dims.cylinderHeightM + dims.roofHeightM
  const pxPerM = CONTENT_H / Math.max(totalHeight + legClearance, 0.1)
  const R = dims.diameterM / 2
  const halfD = R * pxPerM
  const legBottomHalf = legClearance > 0 ? R * LEG_BOTTOM_RADIUS_FRAC * pxPerM : halfD
  const width = Math.max(halfD, legBottomHalf) * 2 + PAD * 2
  const height = CONTENT_H + PAD * 2
  const cx = width / 2

  const yTop = PAD
  const yRoofBase = yTop + dims.roofHeightM * pxPerM
  const yCylBottom = yRoofBase + dims.cylinderHeightM * pxPerM
  const yHopperBottom = yCylBottom + dims.hopperHeightM * pxPerM
  const r0 = hopperOutletRadius(dims)
  const outletHalf = r0 * pxPerM
  const maxHeight = dims.cylinderHeightM + Math.max(dims.roofHeightM, 0)

  const groundY = yHopperBottom + legClearance * pxPerM
  const legTopHalf = R * LEG_TOP_RADIUS_FRAC * pxPerM
  const legTopY = yCylBottom + dims.hopperHeightM * LEG_TOP_HEIGHT_FRAC * pxPerM
  const braceY = legTopY + (groundY - legTopY) * LEG_BRACE_FRAC
  // Same fraction along the leg's radius as braceY is along its height, so the brace
  // endpoints land exactly on the diagonal leg lines instead of drifting off them.
  const braceHalf = legTopHalf + (legBottomHalf - legTopHalf) * LEG_BRACE_FRAC

  const heightToY = (hM: number) => yCylBottom - hM * pxPerM

  const roofPath = [`M ${cx} ${yTop}`, `L ${cx + halfD} ${yRoofBase}`, `L ${cx - halfD} ${yRoofBase}`, 'Z'].join(' ')
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
        <linearGradient id="elevGrainGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#e0c084" />
          <stop offset="100%" stopColor="#a3792f" />
        </linearGradient>
        <linearGradient id="elevAirGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--color-app-from)" />
          <stop offset="100%" stopColor="var(--color-app-to)" />
        </linearGradient>
      </defs>

      <g clipPath="url(#elevClip)">
        <rect x={0} y={0} width={width} height={height} fill="url(#elevAirGrad)" />
        <path d={roofPath} fill="#aeb6bd" opacity={0.55} />
        {fillPath && <path d={fillPath} fill="url(#elevGrainGrad)" />}
      </g>

      <path d={outline} fill="none" stroke="var(--color-ink-soft)" strokeWidth={2} strokeLinejoin="round" />

      {legClearance > 0 && (
        <g stroke="var(--color-ink-faint)" strokeWidth={2} strokeLinecap="round" fill="none">
          <line x1={cx - legTopHalf} y1={legTopY} x2={cx - legBottomHalf} y2={groundY} />
          <line x1={cx + legTopHalf} y1={legTopY} x2={cx + legBottomHalf} y2={groundY} />
          <line x1={cx - braceHalf} y1={braceY} x2={cx + braceHalf} y2={braceY} strokeWidth={1.2} opacity={0.7} />
          <line x1={cx - legBottomHalf - 9} y1={groundY} x2={cx - legBottomHalf + 9} y2={groundY} strokeWidth={3} />
          <line x1={cx + legBottomHalf - 9} y1={groundY} x2={cx + legBottomHalf + 9} y2={groundY} strokeWidth={3} />
        </g>
      )}

      <line
        x1={cx - halfD - 10}
        y1={levelY}
        x2={cx + halfD + 10}
        y2={levelY}
        stroke="#2fb8d4"
        strokeWidth={1.4}
        strokeDasharray="4 3"
        opacity={0.9}
      />
      <g transform={`translate(${cx}, ${levelY})`}>
        <rect x={-20} y={-20} width={40} height={17} rx={8.5} fill="#1e2a33" opacity={0.88} />
        <text x={0} y={-8} textAnchor="middle" fontSize={11} fontWeight={700} fill="#ffffff">
          {levelPercent.toFixed(0)}%
        </text>
      </g>

      <text x={cx} y={height - 6} textAnchor="middle" fontSize={10} fontWeight={600} fill="var(--color-ink-faint)">
        ⌀ {dims.diameterM.toFixed(1)} m · {totalHeight.toFixed(1)} m
      </text>
    </svg>
  )
}
