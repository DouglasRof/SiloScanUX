import * as THREE from 'three'
import { describe, expect, it } from 'vitest'
import type { HeightGrid, SiloDimensions } from '../types/silo'
import { buildGrainGeometry } from './grainGeometry'

const rings = 3
const sectors = 6

function makeGrid(height: number): HeightGrid {
  return {
    rings,
    sectors,
    ringRadii: Array.from({ length: rings + 1 }, (_, i) => i),
    sectorAngles: Array.from({ length: sectors + 1 }, (_, i) => (2 * Math.PI * i) / sectors),
    values: Array.from({ length: rings }, () => Array(sectors).fill(height)),
    coveragePercent: 100,
  }
}

const flatDims: SiloDimensions = {
  diameterM: 4,
  cylinderHeightM: 6,
  roofHeightM: 1,
  hopperType: 'flat',
  hopperHeightM: 0,
  outletDiameterM: 0.6,
}

const coneDims: SiloDimensions = { ...flatDims, hopperType: 'cone', hopperHeightM: 2 }

function allFinite(attribute: THREE.BufferAttribute): boolean {
  return attribute.array.every((v) => Number.isFinite(v))
}

describe('buildGrainGeometry', () => {
  it('builds a valid indexed geometry for a flat-bottom silo', () => {
    const geometry = buildGrainGeometry(flatDims, makeGrid(3))
    expect(geometry).toBeInstanceOf(THREE.BufferGeometry)

    const position = geometry.getAttribute('position') as THREE.BufferAttribute
    const color = geometry.getAttribute('color') as THREE.BufferAttribute
    // 1 center vertex + the top-surface ring/sector grid + a skirt ring at the base.
    const expectedVertices = 1 + rings * sectors + sectors
    expect(position.count).toBe(expectedVertices)
    expect(color.count).toBe(expectedVertices)
    expect(allFinite(position)).toBe(true)
    expect(geometry.getIndex()).not.toBeNull()
    expect(geometry.getAttribute('normal')).toBeDefined()
  })

  it('adds the hopper cone and outlet vertices for a cone-bottom silo', () => {
    const geometry = buildGrainGeometry(coneDims, makeGrid(3))
    const position = geometry.getAttribute('position') as THREE.BufferAttribute
    // Flat-bottom vertex count, plus a hopper base ring and one outlet center vertex.
    const expectedVertices = 1 + rings * sectors + sectors + sectors + 1
    expect(position.count).toBe(expectedVertices)
    expect(allFinite(position)).toBe(true)
  })

  it('clips the top surface to the usable cylinder + roof height', () => {
    const tooTall = buildGrainGeometry(flatDims, makeGrid(1000))
    const position = tooTall.getAttribute('position') as THREE.BufferAttribute
    const maxHeight = flatDims.cylinderHeightM + flatDims.roofHeightM
    for (let i = 0; i < position.count; i++) {
      expect(position.getY(i)).toBeLessThanOrEqual(maxHeight + 1e-9)
    }
  })

  it('does not divide by zero when the surface is perfectly flat', () => {
    expect(() => buildGrainGeometry(flatDims, makeGrid(2))).not.toThrow()
  })
})
