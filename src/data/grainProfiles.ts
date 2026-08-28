import type { GrainProfile } from '../types/silo'

export const GRAIN_PROFILES: GrainProfile[] = [
  { id: 'milho', name: 'Milho', bulkDensityKgM3: 750, angleOfReposeDeg: 27 },
  { id: 'soja', name: 'Soja', bulkDensityKgM3: 770, angleOfReposeDeg: 25 },
  { id: 'trigo', name: 'Trigo', bulkDensityKgM3: 790, angleOfReposeDeg: 27 },
  { id: 'sorgo', name: 'Sorgo', bulkDensityKgM3: 720, angleOfReposeDeg: 26 },
  { id: 'racao', name: 'Ração Peletizada', bulkDensityKgM3: 640, angleOfReposeDeg: 35 },
  { id: 'farelo-soja', name: 'Farelo de Soja', bulkDensityKgM3: 600, angleOfReposeDeg: 38 },
]
