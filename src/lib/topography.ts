import type { HeightGrid } from '../types/silo'

/** Deep valley → sunlit ridge, in the same warm grain palette used by the 3D scene. */
const LOW_COLOR: [number, number, number] = [130, 96, 54]
const HIGH_COLOR: [number, number, number] = [227, 193, 133]

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
  const r = Math.round(LOW_COLOR[0] + (HIGH_COLOR[0] - LOW_COLOR[0]) * t)
  const g = Math.round(LOW_COLOR[1] + (HIGH_COLOR[1] - LOW_COLOR[1]) * t)
  const b = Math.round(LOW_COLOR[2] + (HIGH_COLOR[2] - LOW_COLOR[2]) * t)
  return `rgb(${r}, ${g}, ${b})`
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
