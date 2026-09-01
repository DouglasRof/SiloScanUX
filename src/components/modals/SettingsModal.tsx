import { useEffect, useRef, useState, type ChangeEvent, type ReactNode } from 'react'
import { useSiloStore, initialDims, initialGrain } from '../../store/useSiloStore'
import { STANDARD_SILOS, CUSTOM_SILO_ID } from '../../data/standardSilos'
import { GRAIN_PROFILES } from '../../data/grainProfiles'
import { totalCapacityM3 } from '../../lib/volume'
import type { FillMode } from '../../lib/mockLidar'
import type { SiloDimensions } from '../../types/silo'
import { Modal } from './Modal'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Slider } from '../ui/slider'
import { ToggleGroup, ToggleGroupItem } from '../ui/toggle-group'
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '../ui/select'

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <Label className="text-[11px] font-bold tracking-wide text-(--color-ink-faint)">{label.toUpperCase()}</Label>
      {children}
    </div>
  )
}

/** Dimension fields can't go negative — a stray "-" typed into a number input would
 * otherwise flow straight into totalCapacityM3() and produce a nonsensical capacity. */
function nonNegative(value: string): number {
  return Math.max(0, Number(value) || 0)
}

const siloLines = [...new Set(STANDARD_SILOS.map((s) => s.line))]

// Base UI's <Select.Value> shows the raw selected value by default — these map it back
// to the descriptive label the matching <SelectItem> renders, for each of the 3 selects below.
function standardLabel(id: string): string {
  if (id === CUSTOM_SILO_ID) return 'Personalizado…'
  const s = STANDARD_SILOS.find((x) => x.id === id)
  return s ? `${s.name} — Ø${s.diameterM}m × ${s.cylinderHeightM}m (${Math.round(s.nominalCapacityM3)} m³)` : id
}

const HOPPER_TYPE_LABEL: Record<string, string> = { cone: 'Fundo cônico (moega)', flat: 'Fundo plano' }

function grainLabel(id: string): string {
  const g = GRAIN_PROFILES.find((x) => x.id === id)
  return g ? `${g.name} — ${g.bulkDensityKgM3} kg/m³` : id
}

// 2MB é folgado pra um scan real, apertado o bastante contra um arquivo absurdo.
const MAX_FILE_SIZE_BYTES = 2 * 1024 * 1024

const SIM_MODE_LABEL: Record<FillMode, string> = { idle: 'Repouso', filling: 'Abastecendo', draining: 'Descarregando' }

interface SettingsModalProps {
  onClose: () => void
  /** 'create' drafts a brand-new silo locally and only touches the database once the
   * user confirms — it must never mutate whichever silo is currently on screen. */
  mode?: 'edit' | 'create'
}

export function SettingsModal({ onClose, mode = 'edit' }: SettingsModalProps) {
  const isCreateMode = mode === 'create'

  const activeSiloName = useSiloStore((s) => s.siloName)
  const activeStandardId = useSiloStore((s) => s.standardId)
  const activeDims = useSiloStore((s) => s.dims)
  const activeGrain = useSiloStore((s) => s.grain)
  const simMode = useSiloStore((s) => s.mode)
  const isSimulating = useSiloStore((s) => s.isSimulating)
  const targetLevelPercent = useSiloStore((s) => s.targetLevelPercent)
  const lastScanError = useSiloStore((s) => s.lastScanError)

  const setSiloName = useSiloStore((s) => s.setSiloName)
  const setStandardSilo = useSiloStore((s) => s.setStandardSilo)
  const setCustomDimensions = useSiloStore((s) => s.setCustomDimensions)
  const setGrainProfile = useSiloStore((s) => s.setGrainProfile)
  const setMode = useSiloStore((s) => s.setMode)
  const setTargetLevelPercent = useSiloStore((s) => s.setTargetLevelPercent)
  const toggleSimulation = useSiloStore((s) => s.toggleSimulation)
  const loadJsonScan = useSiloStore((s) => s.loadJsonScan)
  const saveSiloConfig = useSiloStore((s) => s.saveSiloConfig)
  const createSiloWithConfig = useSiloStore((s) => s.createSiloWithConfig)

  // Draft state used only in create mode, kept completely separate from the active
  // silo above so filling out this form never touches whatever is on screen already.
  const [draftName, setDraftName] = useState('Novo silo')
  const [draftStandardId, setDraftStandardId] = useState(initialDims.id)
  const [draftDims, setDraftDims] = useState<SiloDimensions>(initialDims)
  const [draftGrainId, setDraftGrainId] = useState(initialGrain.id)

  const siloName = isCreateMode ? draftName : activeSiloName
  const standardId = isCreateMode ? draftStandardId : activeStandardId
  const dims = isCreateMode ? draftDims : activeDims
  const grain = isCreateMode ? (GRAIN_PROFILES.find((g) => g.id === draftGrainId) ?? initialGrain) : activeGrain

  const fileRef = useRef<HTMLInputElement>(null)
  const [jsonError, setJsonError] = useState<string | null>(null)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')

  const isCustom = standardId === CUSTOM_SILO_ID

  // Volta pro estado neutro um tempo depois de mostrar "Salvo" ou o erro, em vez de ficar preso ali.
  useEffect(() => {
    if (saveStatus !== 'saved' && saveStatus !== 'error') return
    const timeout = setTimeout(() => setSaveStatus('idle'), 2500)
    return () => clearTimeout(timeout)
  }, [saveStatus])

  function handleNameChange(value: string) {
    if (isCreateMode) setDraftName(value)
    else setSiloName(value)
  }

  function handleStandardChange(id: string) {
    if (!isCreateMode) {
      setStandardSilo(id)
      return
    }
    const model = STANDARD_SILOS.find((s) => s.id === id)
    if (!model) return
    setDraftStandardId(id)
    setDraftDims(model)
  }

  function handleDimsChange(partial: Partial<SiloDimensions>) {
    if (!isCreateMode) {
      setCustomDimensions(partial)
      return
    }
    setDraftStandardId(CUSTOM_SILO_ID)
    setDraftDims((d) => ({ ...d, ...partial }))
  }

  function handleGrainChange(id: string) {
    if (isCreateMode) setDraftGrainId(id)
    else setGrainProfile(id)
  }

  async function handleSave() {
    setSaveStatus('saving')
    if (isCreateMode) {
      const ok = await createSiloWithConfig({ nome: draftName.trim() || 'Novo silo', standardId: draftStandardId, dims: draftDims, grainId: draftGrainId })
      if (ok) {
        onClose()
        return
      }
      setSaveStatus('error')
      return
    }
    const ok = await saveSiloConfig()
    setSaveStatus(ok ? 'saved' : 'error')
  }

  function handleFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > MAX_FILE_SIZE_BYTES) {
      setJsonError(`Arquivo maior que ${MAX_FILE_SIZE_BYTES / (1024 * 1024)}MB.`)
      e.target.value = ''
      return
    }
    file
      .text()
      .then((text) => {
        try {
          const json = JSON.parse(text)
          loadJsonScan(json)
          setJsonError(null)
        } catch {
          setJsonError('Arquivo não é um JSON válido.')
        }
      })
      .catch(() => setJsonError('Não foi possível ler o arquivo.'))
    e.target.value = ''
  }

  return (
    <Modal title={isCreateMode ? 'Novo silo' : 'Configurações do silo'} onClose={onClose} width={520} closeOnBackdropClick={false}>
      <div className="flex flex-col gap-4">
        <Field label="Identificação">
          <Input value={siloName} onChange={(e) => handleNameChange(e.target.value)} placeholder="SILO 03" />
        </Field>

        <Field label="Modelo de silo">
          <Select value={standardId} onValueChange={(value) => value && handleStandardChange(value)}>
            <SelectTrigger className="w-full">
              <SelectValue>{(value: string) => standardLabel(value)}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              {siloLines.map((line) => (
                <SelectGroup key={line}>
                  <SelectLabel>{line}</SelectLabel>
                  {STANDARD_SILOS.filter((s) => s.line === line).map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name} — Ø{s.diameterM}m × {s.cylinderHeightM}m ({Math.round(s.nominalCapacityM3)} m³)
                    </SelectItem>
                  ))}
                </SelectGroup>
              ))}
              <SelectItem value={CUSTOM_SILO_ID}>Personalizado…</SelectItem>
            </SelectContent>
          </Select>
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Diâmetro (m)">
            <Input
              type="number"
              step="0.1"
              min={0}
              value={dims.diameterM}
              onChange={(e) => handleDimsChange({ diameterM: nonNegative(e.target.value) })}
            />
          </Field>
          <Field label="Altura da parede (m)">
            <Input
              type="number"
              step="0.1"
              min={0}
              value={dims.cylinderHeightM}
              onChange={(e) => handleDimsChange({ cylinderHeightM: nonNegative(e.target.value) })}
            />
          </Field>
          <Field label="Altura do telhado (m)">
            <Input
              type="number"
              step="0.1"
              min={0}
              value={dims.roofHeightM}
              onChange={(e) => handleDimsChange({ roofHeightM: nonNegative(e.target.value) })}
            />
          </Field>
          <Field label="Tipo de fundo">
            <Select value={dims.hopperType} onValueChange={(value) => handleDimsChange({ hopperType: value as 'flat' | 'cone' })}>
              <SelectTrigger className="w-full">
                <SelectValue>{(value: string) => HOPPER_TYPE_LABEL[value] ?? value}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cone">Fundo cônico (moega)</SelectItem>
                <SelectItem value="flat">Fundo plano</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          {dims.hopperType === 'cone' && (
            <>
              <Field label="Altura da moega (m)">
                <Input
                  type="number"
                  step="0.1"
                  min={0}
                  value={dims.hopperHeightM}
                  onChange={(e) => handleDimsChange({ hopperHeightM: nonNegative(e.target.value) })}
                />
              </Field>
              <Field label="Diâmetro da saída (m)">
                <Input
                  type="number"
                  step="0.05"
                  min={0}
                  value={dims.outletDiameterM}
                  onChange={(e) => handleDimsChange({ outletDiameterM: nonNegative(e.target.value) })}
                />
              </Field>
            </>
          )}
        </div>

        <p className="text-[11px] text-(--color-ink-faint)">
          Capacidade nominal estimada: <span className="font-semibold text-(--color-ink-soft)">{Math.round(totalCapacityM3(dims)).toLocaleString('pt-BR')} m³</span>
          {!isCustom && ' · edite qualquer medida acima para personalizar.'}
        </p>

        <Field label="Produto armazenado">
          <Select value={grain.id} onValueChange={(value) => value && handleGrainChange(value)}>
            <SelectTrigger className="w-full">
              <SelectValue>{(value: string) => grainLabel(value)}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              {GRAIN_PROFILES.map((g) => (
                <SelectItem key={g.id} value={g.id}>
                  {g.name} — {g.bulkDensityKgM3} kg/m³
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>

        <div className="flex items-center gap-3 border-t border-(--color-line) pt-4">
          <Button onClick={handleSave} disabled={saveStatus === 'saving'} className="h-auto rounded-lg px-4 py-2 text-xs font-bold">
            {isCreateMode ? (saveStatus === 'saving' ? 'Criando…' : 'Criar silo') : saveStatus === 'saving' ? 'Salvando…' : 'Salvar configurações'}
          </Button>
          {saveStatus === 'saved' && (
            <span className="text-xs font-semibold text-(--color-good)" role="status">
              Salvo com sucesso.
            </span>
          )}
          {saveStatus === 'error' && (
            <span className="text-xs font-semibold text-(--color-danger)" role="alert">
              {isCreateMode ? 'Não foi possível criar o silo. Tente novamente.' : 'Não foi possível salvar. Tente novamente.'}
            </span>
          )}
        </div>

        {!isCreateMode && (
          <>
            <div className="rounded-xl border border-(--color-line) bg-(--color-panel-soft) p-3.5">
              <p className="mb-2 text-[11px] font-bold tracking-wide text-(--color-ink-faint)">SIMULAÇÃO DO SENSOR LIDAR</p>
              <div className="flex items-center gap-3">
                <Slider
                  min={0}
                  max={100}
                  value={[targetLevelPercent]}
                  onValueChange={(value) => setTargetLevelPercent(Array.isArray(value) ? value[0] : value)}
                  aria-label="Nível alvo do silo (%)"
                  className="flex-1"
                />
                <span className="w-12 text-right text-sm font-bold tabular">{targetLevelPercent.toFixed(0)}%</span>
              </div>
              <div className="mt-3 flex items-center gap-2">
                <ToggleGroup
                  variant="outline"
                  value={[simMode]}
                  onValueChange={(value) => value[0] && setMode(value[0] as FillMode)}
                >
                  {(['idle', 'filling', 'draining'] as FillMode[]).map((m) => (
                    <ToggleGroupItem key={m} value={m} className="rounded-lg px-3 py-1.5 text-xs font-semibold data-pressed:bg-(--color-navy) data-pressed:text-white">
                      {SIM_MODE_LABEL[m]}
                    </ToggleGroupItem>
                  ))}
                </ToggleGroup>
                <Button
                  onClick={toggleSimulation}
                  variant="ghost"
                  className={`ml-auto h-auto rounded-lg px-3 py-1.5 text-xs font-semibold ${
                    isSimulating ? 'bg-(--color-good-soft) text-(--color-good) hover:bg-(--color-good-soft)' : 'bg-(--color-danger-soft) text-(--color-danger) hover:bg-(--color-danger-soft)'
                  }`}
                >
                  {isSimulating ? 'Ativa' : 'Pausada'}
                </Button>
              </div>
            </div>

            <div className="rounded-xl border border-(--color-line) p-3.5">
              <p className="mb-2 text-[11px] font-bold tracking-wide text-(--color-ink-faint)">IMPORTAR LEITURA DO SENSOR (JSON)</p>
              <p className="mb-2 text-[11px] text-(--color-ink-faint)">
                Aceita <code>{'{ sensorHeightM, points:[{angleDeg,radiusM,distanceM}] }'}</code> ou pontos já convertidos com <code>heightM</code>.
              </p>
              <Button onClick={() => fileRef.current?.click()} variant="secondary" className="h-auto rounded-lg px-3 py-1.5 text-xs font-semibold">
                Carregar arquivo .json
              </Button>
              <input ref={fileRef} type="file" accept="application/json" className="hidden" onChange={handleFile} />
              {(jsonError || lastScanError) && <p className="mt-2 text-[11px] font-medium text-(--color-danger)">{jsonError ?? lastScanError}</p>}
            </div>
          </>
        )}
      </div>
    </Modal>
  )
}
