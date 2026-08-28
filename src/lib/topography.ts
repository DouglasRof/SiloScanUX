import type { HeightGrid } from '../types/silo'

/** Elevation ramp — low spots to high ground, distinct hues per band so relief reads at a
 * glance instead of a single tinted color. Same stops drive both the plan-view fill and the
 * legend bar, so they never drift apart. */
export const ELEVATION_STOPS: { t: number; color: [number, number, number] }[] = [
  { t: 0, color: [51, 98, 148] }, // low ground — blue
  { t: 0.28, color: [63, 156, 132] }, // teal
  { t: 0.52, color: [217, 190, 90] }, // sandy yellow — mid
  { t: 0.76, color: [214, 122, 53] }, // orange
  { t: 1, color: [176, 57, 46] }, // high ground — red
]

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t
}

export function heightRange(grid: HeightGrid): { min: number; max: number } {
  let min = Infinity
  let max = -Infinity
  for (const row of grid.values) {
    for (const v of row) {
      if (v < min) min = v
      if (v > max) max = v
    }
  }
  if (!Number.isFinite(min)) return { min: 0, max: 0 }
  return { min, max }
}

export function heightToColor(h: number, min: number, max: number): string {
  const span = Math.max(max - min, 0.02)
  const t = Math.min(1, Math.max(0, (h - min) / span))
  let lo = ELEVATION_STOPS[0]
  let hi = ELEVATION_STOPS[ELEVATION_STOPS.length - 1]
  for (let i = 0; i < ELEVATION_STOPS.length - 1; i++) {
    if (t >= ELEVATION_STOPS[i].t && t <= ELEVATION_STOPS[i + 1].t) {
      lo = ELEVATION_STOPS[i]
      hi = ELEVATION_STOPS[i + 1]
      break
    }
  }
  const localT = (t - lo.t) / Math.max(hi.t - lo.t, 1e-6)
  const r = Math.round(lerp(lo.color[0], hi.color[0], localT))
  const g = Math.round(lerp(lo.color[1], hi.color[1], localT))
  const b = Math.round(lerp(lo.color[2], hi.color[2], localT))
  return `rgb(${r}, ${g}, ${b})`
}

/** CSS gradient string for the ELEVATION_STOPS ramp — used to paint the legend bar. */
export function elevationGradientCss(): string {
  const stops = ELEVATION_STOPS.map((s) => `rgb(${s.color[0]}, ${s.color[1]}, ${s.color[2]}) ${(s.t * 100).toFixed(0)}%`)
  return `linear-gradient(to right, ${stops.join(', ')})`
}

/** Sector-averaged height per ring — a radial cross-section profile through the pile. */
export function radialProfile(grid: HeightGrid): number[] {
  return grid.values.map((row) => row.reduce((s, v) => s + v, 0) / row.length)
}

/** Looks up the radial profile at an arbitrary radius (0..siloRadiusM), nearest-ring. */
export function profileAt(profile: number[], grid: HeightGrid, radiusM: number): number {
  if (profile.length === 0) return 0
  const rNorm = radiusM / grid.ringRadii[grid.rings]
  const row = Math.min(profile.length - 1, Math.max(0, Math.round(rNorm * profile.length - 0.5)))
  return profile[row]
}
