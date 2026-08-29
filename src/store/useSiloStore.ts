import { create } from 'zustand'
import type {
  Alert,
  GrainProfile,
  HistorySample,
  LevelStatus,
  LidarScan,
  RawLidarScan,
  SiloDimensions,
  SiloSummary,
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
// Trava contra um arquivo .json malformado/malicioso travando o navegador ao tentar
// processar uma varredura absurdamente densa — nenhum scan real chega perto disso.
const MAX_IMPORTED_POINTS = 5000
const HISTORY_PERSIST_INTERVAL_MS = 5 * 60 * 1000
const PERSISTED_HISTORY_WINDOW_MS = 7 * 24 * 3_600_000

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
  userId: string | null
  silos: SiloSummary[]
  siloId: string | null
  configLoaded: boolean
  lastHistoryPersistAt: number
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
  switchToSilo: (siloId: string) => Promise<void>
  createSiloWithConfig: (config: { nome: string; standardId: string; dims: SiloDimensions; grainId: string }) => Promise<boolean>
  deleteSilo: (siloId: string) => Promise<void>
  exportMyData: () => Promise<Record<string, unknown> | null>
  deleteMyAccount: () => Promise<boolean>
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

export const initialDims = STANDARD_SILOS[3]
export const initialGrain = GRAIN_PROFILES.find((g) => g.id === 'racao') ?? GRAIN_PROFILES[0]
const initial = freshState(initialDims, initialGrain, 68)

interface SiloRow {
  id: string
  nome: string
  standard_id: string
  dims: SiloDimensions
  grain_id: string
}

async function insertDefaultSilo(userId: string, nome: string): Promise<SiloRow | null> {
  const { data, error } = await supabase
    .from('silos')
    .insert({ user_id: userId, nome, standard_id: initialDims.id, dims: initialDims, grain_id: initialGrain.id })
    .select()
    .single()

  if (error || !data) {
    console.error('Falha ao criar silo padrão:', error)
    return null
  }
  return data as SiloRow
}

async function loadHistoryAndLevel(siloId: string): Promise<{ history: HistorySample[]; levelPercent: number }> {
  const windowStart = new Date(Date.now() - PERSISTED_HISTORY_WINDOW_MS).toISOString()
  const { data, error } = await supabase
    .from('historico_niveis')
    .select('ocorrido_em, level_percent, volume_m3, mass_ton, temperature_c')
    .eq('silo_id', siloId)
    .gte('ocorrido_em', windowStart)
    .order('ocorrido_em', { ascending: true })

  if (error || !data || data.length === 0) {
    if (error) console.error('Falha ao carregar histórico persistido:', error)
    return { history: [], levelPercent: NaN }
  }

  const history: HistorySample[] = data.map((row) => ({
    t: new Date(row.ocorrido_em).getTime(),
    levelPercent: row.level_percent,
    volumeM3: row.volume_m3,
    massTon: row.mass_ton,
    temperatureC: row.temperature_c,
  }))

  return { history, levelPercent: history[history.length - 1].levelPercent }
}

/** Makes `row` the active/working silo: loads its persisted history (if any) to resume
 * roughly where it left off, instead of always restarting every silo at a fixed level. */
async function applySiloRow(row: SiloRow, set: (partial: Partial<SiloState>) => void, get: () => SiloState) {
  const dims = row.dims
  const grain = GRAIN_PROFILES.find((g) => g.id === row.grain_id) ?? get().grain
  const { history: persisted, levelPercent } = await loadHistoryAndLevel(row.id)
  const startLevel = Number.isFinite(levelPercent) ? levelPercent : 50
  const fresh = freshState(dims, grain, startLevel)
  const history = persisted.length > 0 ? [...persisted, fresh.history[0]] : fresh.history

  set({
    siloId: row.id,
    siloName: row.nome,
    standardId: row.standard_id,
    dims,
    grain,
    flowLog: [],
    scan: fresh.scan,
    volume: fresh.volume,
    status: fresh.status,
    flow: fresh.flow,
    history,
    targetLevelPercent: startLevel,
    mode: 'idle',
    isSimulating: true,
    alerts: buildAlerts(fresh.volume, fresh.status, get().temperatureC, fresh.flow),
    configLoaded: true,
    lastHistoryPersistAt: Date.now(),
  })
}

export const useSiloStore = create<SiloState>((set, get) => ({
  userId: null,
  silos: [],
  siloId: null,
  configLoaded: false,
  lastHistoryPersistAt: 0,
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

    const { siloId, lastHistoryPersistAt } = get()
    if (siloId && now - lastHistoryPersistAt >= HISTORY_PERSIST_INTERVAL_MS) {
      set({ lastHistoryPersistAt: now })
      supabase
        .from('historico_niveis')
        .insert({
          silo_id: siloId,
          ocorrido_em: new Date(now).toISOString(),
          level_percent: volume.levelPercent,
          volume_m3: volume.volumeM3,
          mass_ton: volume.massTon,
          temperature_c: temperatureC,
        })
        .then(({ error }) => {
          if (error) console.error('Falha ao salvar histórico de nível:', error)
        })
    }
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
        if (json.points.length > MAX_IMPORTED_POINTS) {
          set({ lastScanError: `Arquivo tem pontos demais (máx. ${MAX_IMPORTED_POINTS}).` })
          return
        }
        get().ingestRawScan(json)
      } else if (isProcessedScan(json)) {
        if (json.points.length > MAX_IMPORTED_POINTS) {
          set({ lastScanError: `Arquivo tem pontos demais (máx. ${MAX_IMPORTED_POINTS}).` })
          return
        }
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
    set({ userId })
    const { data: rows, error } = await supabase
      .from('silos')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Falha ao carregar os silos do usuário:', error)
      return
    }

    if (rows && rows.length > 0) {
      set({ silos: rows.map((r) => ({ id: r.id, nome: r.nome })) })
      await applySiloRow(rows[0] as SiloRow, set, get)
      return
    }

    const created = await insertDefaultSilo(userId, 'Silo 1')
    if (!created) return
    set({ silos: [{ id: created.id, nome: created.nome }] })
    await applySiloRow(created, set, get)
  },

  switchToSilo: async (siloId) => {
    if (siloId === get().siloId) return
    const { data: row, error } = await supabase.from('silos').select('*').eq('id', siloId).single()
    if (error || !row) {
      console.error('Falha ao trocar de silo:', error)
      return
    }
    await applySiloRow(row as SiloRow, set, get)
  },

  createSiloWithConfig: async (config) => {
    const { userId } = get()
    if (!userId) return false
    const { data: created, error } = await supabase
      .from('silos')
      .insert({ user_id: userId, nome: config.nome, standard_id: config.standardId, dims: config.dims, grain_id: config.grainId })
      .select()
      .single()

    if (error || !created) {
      console.error('Falha ao criar silo:', error)
      return false
    }

    set({ silos: [...get().silos, { id: created.id, nome: created.nome }] })
    await applySiloRow(created as SiloRow, set, get)
    return true
  },

  deleteSilo: async (siloId) => {
    const { error } = await supabase.from('silos').delete().eq('id', siloId)
    if (error) {
      console.error('Falha ao excluir silo:', error)
      return
    }

    const remaining = get().silos.filter((s) => s.id !== siloId)
    set({ silos: remaining })

    if (get().siloId !== siloId) return

    if (remaining.length > 0) {
      await get().switchToSilo(remaining[0].id)
      return
    }

    const userId = get().userId
    if (!userId) return
    const created = await insertDefaultSilo(userId, 'Silo 1')
    if (!created) return
    set({ silos: [{ id: created.id, nome: created.nome }] })
    await applySiloRow(created, set, get)
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
    set({ silos: get().silos.map((s) => (s.id === siloId ? { ...s, nome: siloName } : s)) })
    return true
  },

  exportMyData: async () => {
    const { userId } = get()
    if (!userId) return null

    const { data: silos, error: silosError } = await supabase.from('silos').select('*').eq('user_id', userId)
    if (silosError || !silos) {
      console.error('Falha ao exportar silos:', silosError)
      return null
    }

    const siloIds = silos.map((s) => s.id)
    if (siloIds.length === 0) {
      return { exportadoEm: new Date().toISOString(), silos: [], leituras: [], historicoNiveis: [], alertas: [] }
    }

    const [leiturasRes, historicoRes, alertasRes] = await Promise.all([
      supabase.from('leituras').select('*').in('silo_id', siloIds),
      supabase.from('historico_niveis').select('*').in('silo_id', siloIds),
      supabase.from('alertas').select('*').in('silo_id', siloIds),
    ])

    if (leiturasRes.error || historicoRes.error || alertasRes.error) {
      console.error('Falha ao exportar dados relacionados:', leiturasRes.error, historicoRes.error, alertasRes.error)
      return null
    }

    return {
      exportadoEm: new Date().toISOString(),
      silos,
      leituras: leiturasRes.data ?? [],
      historicoNiveis: historicoRes.data ?? [],
      alertas: alertasRes.data ?? [],
    }
  },

  deleteMyAccount: async () => {
    const { error } = await supabase.rpc('delete_my_account')
    if (error) {
      console.error('Falha ao excluir a conta:', error)
      return false
    }
    return true
  },

  resetConfig: () => set({ userId: null, silos: [], siloId: null, configLoaded: false, lastHistoryPersistAt: 0 }),
}))
