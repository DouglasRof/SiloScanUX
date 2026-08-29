export type HopperType = 'flat' | 'cone'

export interface SiloDimensions {
  diameterM: number
  cylinderHeightM: number
  roofHeightM: number
  hopperType: HopperType
  hopperHeightM: number
  outletDiameterM: number
}

/** Lightweight entry for the silo switcher — the full config only loads when it becomes active. */
export interface SiloSummary {
  id: string
  nome: string
}

export interface StandardSiloModel extends SiloDimensions {
  id: string
  name: string
  line: string
  nominalCapacityM3: number
}

export interface GrainProfile {
  id: string
  name: string
  bulkDensityKgM3: number
  angleOfReposeDeg: number
}

/** Surface sample already resolved to (azimuth, radius, height-above-junction). */
export interface LidarPoint {
  angleDeg: number
  radiusM: number
  heightM: number
}

export interface LidarScan {
  id: string
  timestamp: number
  sensorHeightM: number
  resolutionM: number
  points: LidarPoint[]
}

/** Raw ingestion form: sensor reports slant distance down to the surface, not height. */
export interface RawLidarPoint {
  angleDeg: number
  radiusM: number
  distanceM: number
}

export interface RawLidarScan {
  id?: string
  timestamp?: number
  sensorHeightM: number
  resolutionM?: number
  points: RawLidarPoint[]
}

export interface HeightGrid {
  rings: number
  sectors: number
  ringRadii: number[]
  sectorAngles: number[]
  values: number[][]
  coveragePercent: number
}

export interface VolumeResult {
  volumeM3: number
  massTon: number
  levelPercent: number
  surfaceMeanHeightM: number
  hopperVolumeM3: number
  cylinderVolumeM3: number
  heapVolumeM3: number
  totalCapacityM3: number
  totalCapacityTon: number
  heightGrid: HeightGrid
}

export type LevelStatus = 'critico' | 'baixo' | 'normal' | 'alto' | 'cheio'

export interface HistorySample {
  t: number
  levelPercent: number
  volumeM3: number
  massTon: number
  temperatureC: number
}

export interface FlowEstimate {
  inflowLastHourTon: number
  outflowLastHourTon: number
  netRateTonHour: number
  hoursToEmpty: number | null
  hoursToFull: number | null
  refillEta: number | null
}

export interface Alert {
  id: string
  severity: 'info' | 'warning' | 'critical'
  message: string
  createdAt: number
}
