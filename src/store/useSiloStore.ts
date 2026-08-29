import { create } from 'zustand'
import type {
  Alert,
  GrainProfile,
  HistorySample,
  LevelStatus,
  LidarScan,
  RawLidarScan,
  SiloDimensions,
  VolumeResult,
} from '../types/silo'
import { CUSTOM_SILO_ID, STANDARD_SILOS } from '../data/standardSilos'
import { GRAIN_PROFILES } from '../data/grainProfiles'
import { computeVolumeFromScan, rawPointToHeight } from '../lib/volume'
import { generateSyntheticScan, type FillMode } from '../lib/mockLidar'
import { computeFlowEstimate, type FlowLogEntry } from '../lib/flow'
import type { FlowEstimate } from '../types/silo'
import { supabase } from '../lib/supabaseClient'

const HISTORY_LIMIT = 600
const FLOW_LOG_LIMIT = 400

function levelStatusFor(percent: number): LevelStatus {
  if (percent < 15) return 'critico'
  if (percent < 35) return 'baixo'
  if (percent < 65) return 'normal'
  if (percent < 90) return 'alto'
  return 'cheio'
}

function buildAlerts(volume: VolumeResult, status: LevelStatus, temperatureC: number, flow: FlowEstimate): Alert[] {
  const alerts: Alert[] = []
  const now = Date.now()
  if (status === 'critico') {
    alerts.push({ id: 'level-critical', severity: 'critical', message: `Nível crítico (${volume.levelPercent.toFixed(0)}%) — abastecimento urgente`, createdAt: now })
  } else if (status === 'baixo') {
    alerts.push({ id: 'level-low', severity: 'warning', message: `Nível baixo (${volume.levelPercent.toFixed(0)}%) — planeje o abastecimento`, createdAt: now })
  } else if (status === 'cheio') {
    alerts.push({ id: 'level-full', severity: 'warning', message: 'Silo próximo da capacidade máxima', createdAt: now })
  }
  if (temperatureC >= 32) {
    alerts.push({ id: 'temp-high', severity: 'warning', message: `Temperatura elevada da massa (${temperatureC.toFixed(1)}°C)`, createdAt: now })
  }
  if (volume.heightGrid.coveragePercent < 70) {
    alerts.push({ id: 'scan-coverage', severity: 'info', message: `Cobertura do scanner LiDAR baixa (${volume.heightGrid.coveragePercent.toFixed(0)}%)`, createdAt: now })
  }
  if (flow.refillEta !== null && flow.refillEta - now < 24 * 3_600_000) {
    const hrs = Math.max(0, (flow.refillEta - now) / 3_600_000)
    alerts.push({ id: 'refill-soon', severity: 'info', message: `Abastecimento recomendado em ~${hrs.toFixed(1)} h`, createdAt: now })
  }
  return alerts
}

interface SiloState {
  siloId: string | null
  configLoaded: boolean
  siloName: string
  standardId: string
  dims: SiloDimensions
  grain: GrainProfile
  scan: LidarScan
  volume: VolumeResult
  temperatureC: number
  status: LevelStatus
  history: HistorySample[]
  flowLog: FlowLogEntry[]
  flow: FlowEstimate
  alerts: Alert[]
  mode: FillMode
  targetLevelPercent: number
  isSimulating: boolean
  lastScanError: string | null

  setSiloName: (name: string) => void
  setStandardSilo: (id: string) => void
  setCustomDimensions: (partial: Partial<SiloDimensions>) => void
  setGrainProfile: (id: string) => void
  setMode: (mode: FillMode) => void
  setTargetLevelPercent: (percent: number) => void
  toggleSimulation: () => void
  ingestScan: (scan: LidarScan) => void
  ingestRawScan: (raw: RawLidarScan) => void
  loadJsonScan: (json: unknown) => void
  tick: () => void
  loadOrCreateSiloConfig: (userId: string) => Promise<void>
  saveSiloConfig: () => Promise<boolean>
  resetConfig: () => void
}

function isRawScan(json: unknown): json is RawLidarScan {
  if (typeof json !== 'object' || json === null) return false
  const obj = json as Record<string, unknown>
  if (!Array.isArray(obj.points) || typeof obj.sensorHeightM !== 'number') return false
  const first = obj.points[0]
  return first !== undefined && typeof first === 'object' && first !== null && 'distanceM' in first
}

function isProcessedScan(json: unknown): json is LidarScan {
  if (typeof json !== 'object' || json === null) return false
  const obj = json as Record<string, unknown>
  if (!Array.isArray(obj.points)) return false
  const first = obj.points[0]
  return first !== undefined && typeof first === 'object' && first !== null && 'heightM' in first
}

function freshState(dims: SiloDimensions, grain: GrainProfile, levelPercent: number) {
  const scan = generateSyntheticScan(dims, grain, levelPercent, 'idle', 0)
  const volume = computeVolumeFromScan(dims, scan.points, grain.bulkDensityKgM3)
  const status = levelStatusFor(volume.levelPercent)
  const now = Date.now()
  const flow = computeFlowEstimate([], volume.massTon, volume.totalCapacityTon, now)
  const history: HistorySample[] = [{ t: now, levelPercent: volume.levelPercent, volumeM3: volume.volumeM3, massTon: volume.massTon, temperatureC: 24 }]
  return { scan, volume, status, flow, history }
}

const initialDims = STANDARD_SILOS[3]
const initialGrain = GRAIN_PROFILES.find((g) => g.id === 'racao') ?? GRAIN_PROFILES[0]
const initial = freshState(initialDims, initialGrain, 68)

export const useSiloStore = create<SiloState>((set, get) => ({
  siloId: null,
  configLoaded: false,
  siloName: 'SILO ALIMENTADOR 01',
  standardId: initialDims.id,
  dims: initialDims,
  grain: initialGrain,
  scan: initial.scan,
  volume: initial.volume,
  temperatureC: 24,
  status: initial.status,
  history: initial.history,
  flowLog: [],
  flow: initial.flow,
  alerts: buildAlerts(initial.volume, initial.status, 24, initial.flow),
  mode: 'idle',
  targetLevelPercent: 68,
  isSimulating: true,
  lastScanError: null,

  setSiloName: (name) => set({ siloName: name }),

  setStandardSilo: (id) => {
    const model = STANDARD_SILOS.find((s) => s.id === id)
    if (!model) return
    const { grain, targetLevelPercent } = get()
    const fresh = freshState(model, grain, targetLevelPercent)
    set({ standardId: id, dims: model, flowLog: [], ...fresh, alerts: buildAlerts(fresh.volume, fresh.status, get().temperatureC, fresh.flow) })
  },

  setCustomDimensions: (partial) => {
    const { dims, grain, targetLevelPercent } = get()
    const merged: SiloDimensions = { ...dims, ...partial }
    const fresh = freshState(merged, grain, targetLevelPercent)
    set({ standardId: CUSTOM_SILO_ID, dims: merged, flowLog: [], ...fresh, alerts: buildAlerts(fresh.volume, fresh.status, get().temperatureC, fresh.flow) })
  },

  setGrainProfile: (id) => {
    const grain = GRAIN_PROFILES.find((g) => g.id === id)
    if (!grain) return
    const { dims, scan, history, temperatureC } = get()
    const volume = computeVolumeFromScan(dims, scan.points, grain.bulkDensityKgM3)
    const status = levelStatusFor(volume.levelPercent)
    const now = Date.now()
    // Mass jumps with the new bulk density even though nothing physically moved — rebase the
    // last history point and drop flowLog so the next tick doesn't read that as a real
    // fill/drain event (which spiked netRateTonHour and could fire a bogus refill alert).
    const rebasedLast: HistorySample = { t: now, levelPercent: volume.levelPercent, volumeM3: volume.volumeM3, massTon: volume.massTon, temperatureC }
    const rebasedHistory = history.length > 0 ? [...history.slice(0, -1), rebasedLast] : [rebasedLast]
    const flow = computeFlowEstimate([], volume.massTon, volume.totalCapacityTon, now)
    set({ grain, volume, status, flowLog: [], flow, history: rebasedHistory, alerts: buildAlerts(volume, status, temperatureC, flow) })
  },

  setMode: (mode) => set({ mode }),
  setTargetLevelPercent: (percent) => set({ targetLevelPercent: Math.min(100, Math.max(0, percent)) }),
  toggleSimulation: () => set((s) => ({ isSimulating: !s.isSimulating })),

  ingestScan: (scan) => {
    const { dims, grain, history, flowLog, temperatureC } = get()
    const volume = computeVolumeFromScan(dims, scan.points, grain.bulkDensityKgM3)
    const status = levelStatusFor(volume.levelPercent)
    const now = scan.timestamp

    const prevMass = history.length > 0 ? history[history.length - 1].massTon : volume.massTon
    const deltaTon = volume.massTon - prevMass
    const nextFlowLog = deltaTon !== 0 ? [...flowLog, { t: now, deltaTon }].slice(-FLOW_LOG_LIMIT) : flowLog

    const flow = computeFlowEstimate(nextFlowLog, volume.massTon, volume.totalCapacityTon, now)
    const nextHistory = [...history, { t: now, levelPercent: volume.levelPercent, volumeM3: volume.volumeM3, massTon: volume.massTon, temperatureC }].slice(-HISTORY_LIMIT)

    set({
      scan,
      volume,
      status,
      history: nextHistory,
      flowLog: nextFlowLog,
      flow,
      alerts: buildAlerts(volume, status, temperatureC, flow),
      lastScanError: null,
    })
  },

  ingestRawScan: (raw) => {
    const sensorHeightM = raw.sensorHeightM
    const processed: LidarScan = {
      id: raw.id ?? `ext-${Date.now()}`,
      timestamp: raw.timestamp ?? Date.now(),
      sensorHeightM,
      resolutionM: raw.resolutionM ?? 0.01,
      points: raw.points.map((p) => rawPointToHeight(p, sensorHeightM)),
    }
    get().ingestScan(processed)
  },

  loadJsonScan: (json) => {
    try {
      if (isRawScan(json)) {
        get().ingestRawScan(json)
      } else if (isProcessedScan(json)) {
        get().ingestScan(json)
      } else {
        set({ lastScanError: 'JSON não reconhecido: esperado { sensorHeightM, points:[{angleDeg,radiusM,distanceM|heightM}] }' })
      }
    } catch {
      set({ lastScanError: 'Falha ao processar o JSON recebido do sensor.' })
    }
  },

  tick: () => {
    const { dims, grain, targetLevelPercent, volume, mode, temperatureC, isSimulating } = get()
    if (!isSimulating) return

    let nextLevel = volume.levelPercent
    let effectiveMode: FillMode = 'idle'
    const diff = targetLevelPercent - volume.levelPercent
    if (Math.abs(diff) > 0.15) {
      const step = Math.sign(diff) * Math.min(Math.abs(diff), mode === 'idle' ? 0.6 : 1.4)
      nextLevel = volume.levelPercent + step
      effectiveMode = diff > 0 ? 'filling' : 'draining'
    }

    const nextTemp = Math.min(40, Math.max(16, temperatureC + (Math.random() - 0.5) * 0.4))
    const scan = generateSyntheticScan(dims, grain, nextLevel, mode === 'idle' ? effectiveMode : mode, Date.now())
    get().ingestScan(scan)
    set({ temperatureC: nextTemp })
  },

  loadOrCreateSiloConfig: async (userId) => {
    const { data: existing, error: selectError } = await supabase
      .from('silos')
      .select('*')
      .eq('user_id', userId)
      .limit(1)
      .maybeSingle()

    if (selectError) {
      console.error('Falha ao carregar o silo do usuário:', selectError)
      return
    }

    if (existing) {
      const dims = existing.dims as SiloDimensions
      const grain = GRAIN_PROFILES.find((g) => g.id === existing.grain_id) ?? get().grain
      const fresh = freshState(dims, grain, get().targetLevelPercent)
      set({
        siloId: existing.id,
        siloName: existing.nome,
        standardId: existing.standard_id,
        dims,
        grain,
        flowLog: [],
        ...fresh,
        alerts: buildAlerts(fresh.volume, fresh.status, get().temperatureC, fresh.flow),
        configLoaded: true,
      })
      return
    }

    const { siloName, standardId, dims, grain } = get()
    const { data: created, error: insertError } = await supabase
      .from('silos')
      .insert({ user_id: userId, nome: siloName, standard_id: standardId, dims, grain_id: grain.id })
      .select()
      .single()

    if (insertError) {
      console.error('Falha ao criar o silo padrão do usuário:', insertError)
      return
    }

    set({ siloId: created.id, configLoaded: true })
  },

  saveSiloConfig: async () => {
    const { siloId, siloName, standardId, dims, grain } = get()
    if (!siloId) return false
    const { error } = await supabase
      .from('silos')
      .update({ nome: siloName, standard_id: standardId, dims, grain_id: grain.id })
      .eq('id', siloId)
    if (error) {
      console.error('Falha ao salvar configuração do silo:', error)
      return false
    }
    return true
  },

  resetConfig: () => set({ siloId: null, configLoaded: false }),
}))
