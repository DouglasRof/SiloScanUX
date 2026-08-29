import { describe, expect, it } from 'vitest'
import type { HeightGrid } from '../types/silo'
import { ELEVATION_STOPS, elevationGradientCss, heightRange, heightToColor, profileAt, radialProfile } from './topography'

function makeGrid(values: number[][]): HeightGrid {
  const rings = values.length
  const sectors = values[0]?.length ?? 0
  return {
    rings,
    sectors,
    ringRadii: Array.from({ length: rings + 1 }, (_, i) => i),
    sectorAngles: Array.from({ length: sectors + 1 }, (_, i) => i),
    values,
    coveragePercent: 100,
  }
}

describe('heightRange', () => {
  it('finds the min and max across the grid', () => {
    const grid = makeGrid([
      [1, 5, 3],
      [-2, 4, 0],
    ])
    expect(heightRange(grid)).toEqual({ min: -2, max: 5 })
  })

  it('falls back to zero for a grid with no rows', () => {
    const grid = makeGrid([])
    expect(heightRange(grid)).toEqual({ min: 0, max: 0 })
  })
})

describe('heightToColor', () => {
  it('returns the lowest stop color at the bottom of the range', () => {
    const [r, g, b] = ELEVATION_STOPS[0].color
    expect(heightToColor(0, 0, 10)).toBe(`rgb(${r}, ${g}, ${b})`)
  })

  it('returns the highest stop color at the top of the range', () => {
    const last = ELEVATION_STOPS[ELEVATION_STOPS.length - 1].color
    expect(heightToColor(10, 0, 10)).toBe(`rgb(${last[0]}, ${last[1]}, ${last[2]})`)
  })

  it('clamps values outside the [min, max] range instead of extrapolating', () => {
    expect(heightToColor(-5, 0, 10)).toBe(heightToColor(0, 0, 10))
    expect(heightToColor(15, 0, 10)).toBe(heightToColor(10, 0, 10))
  })

  it('hits an exact intermediate stop precisely', () => {
    const stop = ELEVATION_STOPS[1]
    const min = 0
    const max = 10
    const h = min + stop.t * (max - min)
    expect(heightToColor(h, min, max)).toBe(`rgb(${stop.color[0]}, ${stop.color[1]}, ${stop.color[2]})`)
  })

  it('never divides by zero when min equals max', () => {
    expect(() => heightToColor(5, 5, 5)).not.toThrow()
  })
})

describe('elevationGradientCss', () => {
  it('renders every stop as a percentage in a left-to-right gradient', () => {
    const css = elevationGradientCss()
    expect(css.startsWith('linear-gradient(to right,')).toBe(true)
    for (const stop of ELEVATION_STOPS) {
      expect(css).toContain(`${(stop.t * 100).toFixed(0)}%`)
      expect(css).toContain(`rgb(${stop.color[0]}, ${stop.color[1]}, ${stop.color[2]})`)
    }
  })
})

describe('radialProfile', () => {
  it('averages each ring across all sectors', () => {
    const grid = makeGrid([
      [1, 2, 3],
      [10, 20, 30],
    ])
    expect(radialProfile(grid)).toEqual([2, 20])
  })
})

describe('profileAt', () => {
  it('returns 0 for an empty profile', () => {
    const grid = makeGrid([[1]])
    expect(profileAt([], grid, 0.5)).toBe(0)
  })

  it('looks up the nearest ring for a given radius', () => {
    const grid = makeGrid([
      [0, 0],
      [0, 0],
      [0, 0],
    ]) // ringRadii = [0, 1, 2, 3]
    const profile = [10, 20, 30]
    expect(profileAt(profile, grid, 0)).toBe(10)
    expect(profileAt(profile, grid, 3)).toBe(30)
  })
})
