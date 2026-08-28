import type { StandardSiloModel } from '../types/silo'
import { totalCapacityM3 } from '../lib/volume'

const DEG = Math.PI / 180

export const LINE_ALIMENTADOR = 'Silo Granjeiro / Alimentador'
export const LINE_ARMAZENAGEM = 'Silo de Armazenagem'

function make(id: string, name: string, diameterM: number, cylinderHeightM: number, line: string, hopperAngleDeg = 45): StandardSiloModel {
  const R = diameterM / 2
  const roofHeightM = Number((R * Math.tan(28 * DEG)).toFixed(2))
  const hopperHeightM = Number((R * Math.tan(hopperAngleDeg * DEG)).toFixed(2))
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
    line,
    ...base,
    nominalCapacityM3: Math.round(totalCapacityM3(base)),
  }
}

// Small farm feed silos (poultry/swine "granja" sheds) — steeper hopper for reliable ração
// flow to the auger, and the current main focus of the product.
const ALIMENTADOR_SILOS: StandardSiloModel[] = [
  make('alim-150', 'Alimentador 2 t', 1.5, 1.4, LINE_ALIMENTADOR, 50),
  make('alim-180', 'Alimentador 4 t', 1.8, 2.2, LINE_ALIMENTADOR, 50),
  make('alim-210', 'Alimentador 6 t', 2.1, 2.8, LINE_ALIMENTADOR, 50),
  make('alim-240', 'Alimentador 9 t', 2.4, 3.6, LINE_ALIMENTADOR, 48),
  make('alim-270', 'Alimentador 13 t', 2.7, 4.6, LINE_ALIMENTADOR, 48),
  make('alim-300', 'Alimentador 18 t', 3.0, 5.8, LINE_ALIMENTADOR, 45),
]

// Large bulk grain storage silos.
const ARMAZENAGEM_SILOS: StandardSiloModel[] = [
  make('std-4600', 'SL 4.60 / 6', 4.6, 6, LINE_ARMAZENAGEM),
  make('std-6400', 'SL 6.40 / 8', 6.4, 8, LINE_ARMAZENAGEM),
  make('std-7300', 'SL 7.30 / 10', 7.3, 10, LINE_ARMAZENAGEM),
  make('std-9150', 'SL 9.15 / 12', 9.15, 12, LINE_ARMAZENAGEM),
  make('std-10980', 'SL 10.98 / 14', 10.98, 14, LINE_ARMAZENAGEM),
  make('std-13400', 'SL 13.40 / 16', 13.4, 16, LINE_ARMAZENAGEM),
  make('std-16500', 'SL 16.50 / 20', 16.5, 20, LINE_ARMAZENAGEM),
]

export const STANDARD_SILOS: StandardSiloModel[] = [...ALIMENTADOR_SILOS, ...ARMAZENAGEM_SILOS]

export const CUSTOM_SILO_ID = 'custom'
