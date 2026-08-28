import type { HeightGrid, LidarPoint, RawLidarPoint, SiloDimensions, VolumeResult } from '../types/silo'

/** Volume of a conical frustum between two parallel circular faces of radius r1 and r2, `height` apart. */
export function frustumVolume(height: number, r1: number, r2: number): number {
  if (height <= 0) return 0
  return ((Math.PI * height) / 3) * (r1 * r1 + r1 * r2 + r2 * r2)
}

export function hopperOutletRadius(dims: SiloDimensions): number {
  return dims.hopperType === 'cone' ? dims.outletDiameterM / 2 : dims.diameterM / 2
}

/** Ground clearance under the outlet for the support legs — cone-bottom silos only; a
 * flat-bottom silo sits directly on its pad. Shared by the 3D scene and the 2D elevation
 * so both draw legs of the same length and the same "floor" line. */
export function legClearanceM(dims: SiloDimensions): number {
  if (dims.hopperType !== 'cone' || dims.hopperHeightM <= 0) return 0
  return Math.max(0.5, dims.hopperHeightM * 0.4)
}

/** Leg silhouette proportions, shared by the 3D model and the 2D elevation cut so neither
 * can silently drift from the other: where the legs attach (as a fraction of the silo
 * radius and a fraction *down into* the hopper from the cylinder junction), how far they
 * splay out at the foot, and where along their length the cross-brace sits. */
export const LEG_TOP_RADIUS_FRAC = 0.82
export const LEG_BOTTOM_RADIUS_FRAC = 1.3
export const LEG_TOP_HEIGHT_FRAC = 0.15
export const LEG_BRACE_FRAC = 0.55

/** Full hopper volume (cone tapering from silo radius down to the outlet radius). Zero for flat-bottom silos. */
export function fullHopperVolumeM3(dims: SiloDimensions): number {
  if (dims.hopperType !== 'cone' || dims.hopperHeightM <= 0) return 0
  const R = dims.diameterM / 2
  const r0 = hopperOutletRadius(dims)
  return frustumVolume(dims.hopperHeightM, R, r0)
}

/** Cone-heap allowance above the eave, capped by the roof pitch — how much extra a heaped pile can hold. */
export function heapAllowanceM3(dims: SiloDimensions): number {
  const R = dims.diameterM / 2
  return (Math.PI * R * R * Math.max(dims.roofHeightM, 0)) / 3
}

export function cylinderVolumeM3(dims: SiloDimensions): number {
  const R = dims.diameterM / 2
  return Math.PI * R * R * dims.cylinderHeightM
}

export function totalCapacityM3(dims: SiloDimensions): number {
  return fullHopperVolumeM3(dims) + cylinderVolumeM3(dims) + heapAllowanceM3(dims)
}

/**
 * Partial hopper fill: the surface has receded below the cylinder/hopper junction (surfaceZ <= 0)
 * so grain occupies only the bottom of the cone, from the outlet up to height h1 = surfaceZ + hopperHeight.
 */
export function partialHopperVolumeM3(dims: SiloDimensions, surfaceZM: number): number {
  if (dims.hopperType !== 'cone' || dims.hopperHeightM <= 0) return 0
  if (surfaceZM >= 0) return fullHopperVolumeM3(dims)
  const Hh = dims.hopperHeightM
  if (surfaceZM <= -Hh) return 0
  const R = dims.diameterM / 2
  const r0 = hopperOutletRadius(dims)
  const h1 = surfaceZM + Hh
  const r1 = r0 + (R - r0) * (h1 / Hh)
  return frustumVolume(h1, r0, r1)
}

export function rawPointToHeight(point: RawLidarPoint, sensorHeightM: number): LidarPoint {
  return { angleDeg: point.angleDeg, radiusM: point.radiusM, heightM: sensorHeightM - point.distanceM }
}

const TWO_PI = Math.PI * 2

/**
 * Bins scattered (angle, radius, height) samples into a polar grid and integrates
 * volume as height * annular-sector-area per cell (numerical surface integration).
 */
export function buildHeightGrid(
  points: LidarPoint[],
  siloRadiusM: number,
  rings = 40,
  sectors = 96,
): HeightGrid {
  const ringRadii = Array.from({ length: rings + 1 }, (_, i) => (siloRadiusM * i) / rings)
  const sectorAngles = Array.from({ length: sectors + 1 }, (_, i) => (TWO_PI * i) / sectors)

  const sums: number[][] = Array.from({ length: rings }, () => Array(sectors).fill(0))
  const counts: number[][] = Array.from({ length: rings }, () => Array(sectors).fill(0))

  for (const p of points) {
    const r = Math.min(Math.max(p.radiusM, 0), siloRadiusM - 1e-6)
    const theta = ((p.angleDeg % 360) + 360) % 360 * (Math.PI / 180)
    const ring = Math.min(rings - 1, Math.floor((r / siloRadiusM) * rings))
    const sector = Math.min(sectors - 1, Math.floor((theta / TWO_PI) * sectors))
    sums[ring][sector] += p.heightM
    counts[ring][sector] += 1
  }

  const values: number[][] = Array.from({ length: rings }, () => Array(sectors).fill(0))
  let filled = 0
  const total = rings * sectors

  for (let i = 0; i < rings; i++) {
    for (let j = 0; j < sectors; j++) {
      if (counts[i][j] > 0) {
        values[i][j] = sums[i][j] / counts[i][j]
        filled++
      }
    }
  }

  // Fill empty cells (gaps in scan coverage) from the nearest populated neighbour. A
  // multi-source BFS flood-fill from every populated cell reaches each empty cell in
  // O(rings*sectors) total — the previous per-cell brute-force nearest-neighbour search was
  // O((rings*sectors)^2), which matters once real (sparsely-covered) sensor data is fed in
  // rather than the synthetic generator's always-fully-populated grid.
  if (filled < total && filled > 0) {
    const visited: boolean[][] = Array.from({ length: rings }, () => Array(sectors).fill(false))
    const queue: number[] = []
    for (let i = 0; i < rings; i++) {
      for (let j = 0; j < sectors; j++) {
        if (counts[i][j] > 0) {
          visited[i][j] = true
          queue.push(i * sectors + j)
        }
      }
    }
    for (let head = 0; head < queue.length; head++) {
      const i = Math.floor(queue[head] / sectors)
      const j = queue[head] % sectors
      const neighbours: [number, number][] = [
        [i - 1, j],
        [i + 1, j],
        [i, (j + 1) % sectors],
        [i, (j - 1 + sectors) % sectors],
      ]
      for (const [ni, nj] of neighbours) {
        if (ni < 0 || ni >= rings || visited[ni][nj]) continue
        visited[ni][nj] = true
        values[ni][nj] = values[i][j]
        queue.push(ni * sectors + nj)
      }
    }
  }

  return { rings, sectors, ringRadii, sectorAngles, values, coveragePercent: (filled / total) * 100 }
}

function cellArea(grid: HeightGrid, ring: number, sector: number): number {
  const r0 = grid.ringRadii[ring]
  const r1 = grid.ringRadii[ring + 1]
  const dTheta = grid.sectorAngles[sector + 1] - grid.sectorAngles[sector]
  return 0.5 * (r1 * r1 - r0 * r0) * dTheta
}

/**
 * Integrates the grain surface heightmap into a volume: clip each column to the cylinder's
 * usable height (eave + heap allowance) and sum height * cell-area (a disk/annular-sector quadrature).
 */
export function integrateCylinderVolumeM3(dims: SiloDimensions, grid: HeightGrid): number {
  const maxHeight = dims.cylinderHeightM + Math.max(dims.roofHeightM, 0)
  let volume = 0
  for (let i = 0; i < grid.rings; i++) {
    for (let j = 0; j < grid.sectors; j++) {
      const h = Math.min(Math.max(grid.values[i][j], 0), maxHeight)
      volume += h * cellArea(grid, i, j)
    }
  }
  return volume
}

export function areaWeightedMeanHeightM(grid: HeightGrid): number {
  let weighted = 0
  let area = 0
  for (let i = 0; i < grid.rings; i++) {
    for (let j = 0; j < grid.sectors; j++) {
      const a = cellArea(grid, i, j)
      weighted += grid.values[i][j] * a
      area += a
    }
  }
  return area > 0 ? weighted / area : 0
}

export function computeVolumeFromScan(
  dims: SiloDimensions,
  points: LidarPoint[],
  bulkDensityKgM3: number,
): VolumeResult {
  const R = dims.diameterM / 2
  const grid = buildHeightGrid(points, R)
  const meanHeight = areaWeightedMeanHeightM(grid)

  const cylinderPart = integrateCylinderVolumeM3(dims, grid)
  const hopperPart = partialHopperVolumeM3(dims, meanHeight)
  const volumeM3 = cylinderPart + hopperPart

  const capacityM3 = totalCapacityM3(dims)
  const capacityTon = (capacityM3 * bulkDensityKgM3) / 1000

  return {
    volumeM3,
    massTon: (volumeM3 * bulkDensityKgM3) / 1000,
    levelPercent: capacityM3 > 0 ? (volumeM3 / capacityM3) * 100 : 0,
    surfaceMeanHeightM: meanHeight,
    hopperVolumeM3: hopperPart,
    cylinderVolumeM3: cylinderPart,
    heapVolumeM3: heapAllowanceM3(dims),
    totalCapacityM3: capacityM3,
    totalCapacityTon: capacityTon,
    heightGrid: grid,
  }
}
