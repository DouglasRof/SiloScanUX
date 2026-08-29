import { describe, expect, it } from 'vitest'
import type { HeightGrid, LidarPoint, SiloDimensions } from '../types/silo'
import {
  areaWeightedMeanHeightM,
  buildHeightGrid,
  computeVolumeFromScan,
  cylinderVolumeM3,
  frustumVolume,
  fullHopperVolumeM3,
  heapAllowanceM3,
  hopperOutletRadius,
  integrateCylinderVolumeM3,
  legClearanceM,
  partialHopperVolumeM3,
  rawPointToHeight,
  totalCapacityM3,
} from './volume'

const coneDims: SiloDimensions = {
  diameterM: 4,
  cylinderHeightM: 6,
  roofHeightM: 1,
  hopperType: 'cone',
  hopperHeightM: 2,
  outletDiameterM: 0.6,
}

const flatDims: SiloDimensions = {
  ...coneDims,
  hopperType: 'flat',
  hopperHeightM: 0,
}

function makeUniformGrid(rings: number, sectors: number, siloRadiusM: number, height: number): HeightGrid {
  const ringRadii = Array.from({ length: rings + 1 }, (_, i) => (siloRadiusM * i) / rings)
  const sectorAngles = Array.from({ length: sectors + 1 }, (_, i) => (2 * Math.PI * i) / sectors)
  const values = Array.from({ length: rings }, () => Array(sectors).fill(height))
  return { rings, sectors, ringRadii, sectorAngles, values, coveragePercent: 100 }
}

describe('frustumVolume', () => {
  it('is zero for non-positive height', () => {
    expect(frustumVolume(0, 1, 2)).toBe(0)
    expect(frustumVolume(-1, 1, 2)).toBe(0)
  })

  it('matches the cylinder formula when r1 === r2', () => {
    expect(frustumVolume(3, 2, 2)).toBeCloseTo(Math.PI * 2 * 2 * 3, 10)
  })

  it('matches the analytic frustum formula for distinct radii', () => {
    // (pi*h/3) * (r1^2 + r1*r2 + r2^2)
    expect(frustumVolume(3, 1, 2)).toBeCloseTo((Math.PI * 3) / 3 * (1 + 2 + 4), 10)
  })
})

describe('hopperOutletRadius', () => {
  it('uses the outlet diameter for cone hoppers', () => {
    expect(hopperOutletRadius(coneDims)).toBeCloseTo(0.3, 10)
  })

  it('uses the full silo radius for flat bottoms', () => {
    expect(hopperOutletRadius(flatDims)).toBeCloseTo(2, 10)
  })
})

describe('legClearanceM', () => {
  it('is zero for flat-bottom silos', () => {
    expect(legClearanceM(flatDims)).toBe(0)
  })

  it('is zero when the hopper has no height', () => {
    expect(legClearanceM({ ...coneDims, hopperHeightM: 0 })).toBe(0)
  })

  it('floors at 0.5m even for a shallow hopper', () => {
    expect(legClearanceM({ ...coneDims, hopperHeightM: 1 })).toBe(0.5)
  })

  it('scales with hopper height above the floor', () => {
    expect(legClearanceM({ ...coneDims, hopperHeightM: 2 })).toBeCloseTo(0.8, 10)
  })
})

describe('fullHopperVolumeM3', () => {
  it('is zero for flat-bottom silos', () => {
    expect(fullHopperVolumeM3(flatDims)).toBe(0)
  })

  it('matches a frustum from the silo radius down to the outlet radius', () => {
    const R = coneDims.diameterM / 2
    const r0 = hopperOutletRadius(coneDims)
    expect(fullHopperVolumeM3(coneDims)).toBeCloseTo(frustumVolume(coneDims.hopperHeightM, R, r0), 10)
  })
})

describe('heapAllowanceM3', () => {
  it('is zero without roof pitch', () => {
    expect(heapAllowanceM3({ ...coneDims, roofHeightM: 0 })).toBe(0)
  })

  it('matches a cone of the silo radius and roof height', () => {
    const R = coneDims.diameterM / 2
    expect(heapAllowanceM3(coneDims)).toBeCloseTo((Math.PI * R * R * coneDims.roofHeightM) / 3, 10)
  })
})

describe('cylinderVolumeM3 / totalCapacityM3', () => {
  it('computes the cylinder as pi r^2 h', () => {
    const R = coneDims.diameterM / 2
    expect(cylinderVolumeM3(coneDims)).toBeCloseTo(Math.PI * R * R * coneDims.cylinderHeightM, 10)
  })

  it('sums hopper + cylinder + heap allowance', () => {
    const expected = fullHopperVolumeM3(coneDims) + cylinderVolumeM3(coneDims) + heapAllowanceM3(coneDims)
    expect(totalCapacityM3(coneDims)).toBeCloseTo(expected, 10)
  })
})

describe('partialHopperVolumeM3', () => {
  it('is zero for flat-bottom silos', () => {
    expect(partialHopperVolumeM3(flatDims, -1)).toBe(0)
  })

  it('is the full hopper once the surface reaches the cylinder junction', () => {
    expect(partialHopperVolumeM3(coneDims, 0)).toBeCloseTo(fullHopperVolumeM3(coneDims), 10)
    expect(partialHopperVolumeM3(coneDims, 1.5)).toBeCloseTo(fullHopperVolumeM3(coneDims), 10)
  })

  it('is empty once the surface drops below the outlet', () => {
    expect(partialHopperVolumeM3(coneDims, -coneDims.hopperHeightM)).toBe(0)
    expect(partialHopperVolumeM3(coneDims, -coneDims.hopperHeightM - 1)).toBe(0)
  })

  it('is strictly between empty and full partway down the hopper', () => {
    const half = partialHopperVolumeM3(coneDims, -coneDims.hopperHeightM / 2)
    expect(half).toBeGreaterThan(0)
    expect(half).toBeLessThan(fullHopperVolumeM3(coneDims))
  })
})

describe('rawPointToHeight', () => {
  it('converts slant distance to height above the junction', () => {
    const point = rawPointToHeight({ angleDeg: 45, radiusM: 1, distanceM: 3 }, 5)
    expect(point).toEqual({ angleDeg: 45, radiusM: 1, heightM: 2 })
  })
})

describe('buildHeightGrid', () => {
  it('reports zero coverage with no points', () => {
    const grid = buildHeightGrid([], 2, 4, 8)
    expect(grid.coveragePercent).toBe(0)
    expect(grid.values.flat().every((v) => v === 0)).toBe(true)
  })

  it('flood-fills a single sample across the whole grid', () => {
    const points: LidarPoint[] = [{ angleDeg: 10, radiusM: 0.5, heightM: 3.7 }]
    const grid = buildHeightGrid(points, 2, 4, 8)
    expect(grid.coveragePercent).toBeCloseTo((1 / (4 * 8)) * 100, 10)
    expect(grid.values.flat().every((v) => v === 3.7)).toBe(true)
  })

  it('averages multiple samples landing in the same cell', () => {
    const points: LidarPoint[] = [
      { angleDeg: 5, radiusM: 0.1, heightM: 2 },
      { angleDeg: 5, radiusM: 0.1, heightM: 4 },
    ]
    const grid = buildHeightGrid(points, 2, 1, 1)
    expect(grid.values[0][0]).toBe(3)
  })
})

describe('integrateCylinderVolumeM3 / areaWeightedMeanHeightM', () => {
  it('integrates a uniform grid to pi r^2 h exactly', () => {
    const R = coneDims.diameterM / 2
    const height = 3.2
    const grid = makeUniformGrid(6, 12, R, height)
    expect(integrateCylinderVolumeM3(coneDims, grid)).toBeCloseTo(Math.PI * R * R * height, 6)
    expect(areaWeightedMeanHeightM(grid)).toBeCloseTo(height, 10)
  })

  it('clips a uniform grid to the usable cylinder+roof height', () => {
    const R = coneDims.diameterM / 2
    const maxHeight = coneDims.cylinderHeightM + coneDims.roofHeightM
    const grid = makeUniformGrid(6, 12, R, maxHeight + 5)
    expect(integrateCylinderVolumeM3(coneDims, grid)).toBeCloseTo(Math.PI * R * R * maxHeight, 6)
  })
})

describe('computeVolumeFromScan', () => {
  it('matches the analytic cylinder+hopper volume for a uniform full surface', () => {
    const height = 2.5 // within the cylinder, above the junction
    const points: LidarPoint[] = Array.from({ length: 20 }, (_, i) => ({
      angleDeg: (i * 360) / 20,
      radiusM: (coneDims.diameterM / 2) * 0.5,
      heightM: height,
    }))
    const result = computeVolumeFromScan(coneDims, points, 750)

    const R = coneDims.diameterM / 2
    const expectedVolume = Math.PI * R * R * height + fullHopperVolumeM3(coneDims)
    expect(result.volumeM3).toBeCloseTo(expectedVolume, 6)
    expect(result.massTon).toBeCloseTo((result.volumeM3 * 750) / 1000, 10)
    expect(result.totalCapacityTon).toBeCloseTo((result.totalCapacityM3 * 750) / 1000, 10)
    expect(result.levelPercent).toBeCloseTo((result.volumeM3 / result.totalCapacityM3) * 100, 10)
  })

  it('returns a zero level for an empty silo', () => {
    const points: LidarPoint[] = Array.from({ length: 20 }, (_, i) => ({
      angleDeg: (i * 360) / 20,
      radiusM: (coneDims.diameterM / 2) * 0.5,
      heightM: -coneDims.hopperHeightM,
    }))
    const result = computeVolumeFromScan(coneDims, points, 750)
    expect(result.volumeM3).toBeCloseTo(0, 6)
    expect(result.levelPercent).toBeCloseTo(0, 6)
  })
})
