import * as THREE from 'three'
import type { HeightGrid, SiloDimensions } from '../types/silo'
import { hopperOutletRadius } from './volume'

function polar(radius: number, angle: number, height: number): [number, number, number] {
  return [radius * Math.cos(angle), height, radius * Math.sin(angle)]
}

/**
 * Builds one closed solid mesh for the grain body: a bumpy top cap driven by the lidar
 * heightmap, an outer skirt down to the cylinder/hopper junction, and the hopper cone
 * (rendered full — the modeling assumption is the hopper stays topped up while any grain
 * remains above it, matching partialHopperVolumeM3 in lib/volume.ts).
 */
export function buildGrainGeometry(dims: SiloDimensions, grid: HeightGrid): THREE.BufferGeometry {
  const sectors = grid.sectors
  const rings = grid.rings
  const positions: number[] = []
  const indices: number[] = []

  const maxHeight = dims.cylinderHeightM + Math.max(dims.roofHeightM, 0)
  const clip = (h: number) => Math.min(Math.max(h, 0), maxHeight)
  const vertexIndex = (row: number, col: number) => row * sectors + col + 1

  const centerHeight = clip(grid.values[0].reduce((s, v) => s + v, 0) / sectors)
  positions.push(0, centerHeight, 0)

  for (let row = 1; row <= rings; row++) {
    const radius = grid.ringRadii[row]
    const cellRow = row - 1
    for (let col = 0; col < sectors; col++) {
      const angle = grid.sectorAngles[col]
      const height = clip(grid.values[cellRow][col])
      positions.push(...polar(radius, angle, height))
    }
  }

  for (let col = 0; col < sectors; col++) {
    indices.push(0, vertexIndex(1, col), vertexIndex(1, (col + 1) % sectors))
  }

  for (let row = 1; row < rings; row++) {
    for (let col = 0; col < sectors; col++) {
      const nextCol = (col + 1) % sectors
      const a = vertexIndex(row, col)
      const b = vertexIndex(row + 1, col)
      const c = vertexIndex(row + 1, nextCol)
      const d = vertexIndex(row, nextCol)
      indices.push(a, b, c, a, c, d)
    }
  }

  const R = dims.diameterM / 2
  const skirtBase = positions.length / 3
  for (let col = 0; col < sectors; col++) {
    positions.push(...polar(R, grid.sectorAngles[col], 0))
  }
  for (let col = 0; col < sectors; col++) {
    const nextCol = (col + 1) % sectors
    const topA = vertexIndex(rings, col)
    const topB = vertexIndex(rings, nextCol)
    const botA = skirtBase + col
    const botB = skirtBase + nextCol
    indices.push(topA, botA, botB, topA, botB, topB)
  }

  if (dims.hopperType === 'cone' && dims.hopperHeightM > 0) {
    const r0 = hopperOutletRadius(dims)
    const hopperBase = positions.length / 3
    for (let col = 0; col < sectors; col++) {
      positions.push(...polar(r0, grid.sectorAngles[col], -dims.hopperHeightM))
    }
    for (let col = 0; col < sectors; col++) {
      const nextCol = (col + 1) % sectors
      const topA = skirtBase + col
      const topB = skirtBase + nextCol
      const botA = hopperBase + col
      const botB = hopperBase + nextCol
      indices.push(topA, botA, botB, topA, botB, topB)
    }
    const outletCenterIdx = positions.length / 3
    positions.push(0, -dims.hopperHeightM, 0)
    for (let col = 0; col < sectors; col++) {
      const nextCol = (col + 1) % sectors
      indices.push(outletCenterIdx, hopperBase + nextCol, hopperBase + col)
    }
  }

  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  geometry.setIndex(indices)
  geometry.computeVertexNormals()
  return geometry
}
