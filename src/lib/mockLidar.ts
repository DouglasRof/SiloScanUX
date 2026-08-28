import type { GrainProfile, LidarPoint, LidarScan, SiloDimensions } from '../types/silo'
import { computeVolumeFromScan, totalCapacityM3 } from './volume'

export type FillMode = 'filling' | 'draining' | 'idle'

const DEG = Math.PI / 180

function shapeAt(rNorm: number, mode: FillMode): number {
  if (mode === 'filling') return 1 - rNorm
  if (mode === 'draining') return -(1 - rNorm)
  return 0
}

interface GeneratorOptions {
  rings?: number
  sectors?: number
  noiseM?: number
  resolutionM?: number
  seedOffset?: number
}

function pseudoNoise(i: number, j: number, seed: number): number {
  const x = Math.sin(i * 12.9898 + j * 78.233 + seed * 37.719) * 43758.5453
  return x - Math.floor(x)
}

function buildPoints(
  dims: SiloDimensions,
  mode: FillMode,
  base: number,
  amplitude: number,
  opts: Required<GeneratorOptions>,
): LidarPoint[] {
  const R = dims.diameterM / 2
  const points: LidarPoint[] = []
  for (let i = 0; i < opts.rings; i++) {
    const rNorm = (i + 0.5) / opts.rings
    const radiusM = rNorm * R
    for (let j = 0; j < opts.sectors; j++) {
      const angleDeg = ((j + 0.5) / opts.sectors) * 360
      const noise = (pseudoNoise(i, j, opts.seedOffset) - 0.5) * 2 * opts.noiseM
      const raw = base + amplitude * shapeAt(rNorm, mode) + noise
      const heightM = Math.round(raw / opts.resolutionM) * opts.resolutionM
      points.push({ angleDeg, radiusM, heightM })
    }
  }
  return points
}

function solveBaseForTargetVolume(
  dims: SiloDimensions,
  mode: FillMode,
  amplitude: number,
  bulkDensityKgM3: number,
  targetVolumeM3: number,
  opts: Required<GeneratorOptions>,
): number {
  let lo = -dims.hopperHeightM - 1
  let hi = dims.cylinderHeightM + dims.roofHeightM + 1
  for (let iter = 0; iter < 22; iter++) {
    const mid = (lo + hi) / 2
    const points = buildPoints(dims, mode, mid, amplitude, { ...opts, noiseM: 0 })
    const result = computeVolumeFromScan(dims, points, bulkDensityKgM3)
    if (result.volumeM3 < targetVolumeM3) lo = mid
    else hi = mid
  }
  return (lo + hi) / 2
}

export function generateSyntheticScan(
  dims: SiloDimensions,
  grain: GrainProfile,
  targetLevelPercent: number,
  mode: FillMode,
  seedOffset = 0,
  options: GeneratorOptions = {},
): LidarScan {
  const opts: Required<GeneratorOptions> = {
    rings: options.rings ?? 22,
    sectors: options.sectors ?? 48,
    noiseM: options.noiseM ?? 0.015,
    resolutionM: options.resolutionM ?? 0.01,
    seedOffset,
  }
  const R = dims.diameterM / 2
  const capacityM3 = totalCapacityM3(dims)
  const targetVolumeM3 = Math.min(Math.max(targetLevelPercent, 0), 100) / 100 * capacityM3

  const amplitude =
    mode === 'filling'
      ? R * Math.tan(grain.angleOfReposeDeg * DEG) * 0.55
      : mode === 'draining'
        ? dims.hopperHeightM * 0.45
        : R * 0.03

  const base = solveBaseForTargetVolume(dims, mode, amplitude, grain.bulkDensityKgM3, targetVolumeM3, opts)
  const points = buildPoints(dims, mode, base, amplitude, opts)

  return {
    id: `scan-${Date.now()}-${seedOffset}`,
    timestamp: Date.now(),
    sensorHeightM: dims.cylinderHeightM + dims.roofHeightM + 0.5,
    resolutionM: opts.resolutionM,
    points,
  }
}
