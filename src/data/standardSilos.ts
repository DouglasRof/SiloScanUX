import type { StandardSiloModel } from '../types/silo'
import { totalCapacityM3 } from '../lib/volume'

const DEG = Math.PI / 180

function make(id: string, name: string, diameterM: number, cylinderHeightM: number): StandardSiloModel {
  const R = diameterM / 2
  const roofHeightM = Number((R * Math.tan(28 * DEG)).toFixed(2))
  const hopperHeightM = Number((R * Math.tan(45 * DEG)).toFixed(2))
  const outletDiameterM = Number(Math.max(0.3, diameterM * 0.05).toFixed(2))
  const base = {
    diameterM,
    cylinderHeightM,
    roofHeightM,
    hopperType: 'cone' as const,
    hopperHeightM,
    outletDiameterM,
  }
  return {
    id,
    name,
    line: 'SiloScanUX Standard',
    ...base,
    nominalCapacityM3: Math.round(totalCapacityM3(base)),
  }
}

export const STANDARD_SILOS: StandardSiloModel[] = [
  make('std-4600', 'SL 4.60 / 6', 4.6, 6),
  make('std-6400', 'SL 6.40 / 8', 6.4, 8),
  make('std-7300', 'SL 7.30 / 10', 7.3, 10),
  make('std-9150', 'SL 9.15 / 12', 9.15, 12),
  make('std-10980', 'SL 10.98 / 14', 10.98, 14),
  make('std-13400', 'SL 13.40 / 16', 13.4, 16),
  make('std-16500', 'SL 16.50 / 20', 16.5, 20),
]

export const CUSTOM_SILO_ID = 'custom'
