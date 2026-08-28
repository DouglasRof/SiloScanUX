import { useRef, useState, type ChangeEvent, type ReactNode } from 'react'
import { useSiloStore } from '../../store/useSiloStore'
import { STANDARD_SILOS, CUSTOM_SILO_ID } from '../../data/standardSilos'
import { GRAIN_PROFILES } from '../../data/grainProfiles'
import { totalCapacityM3 } from '../../lib/volume'
import type { FillMode } from '../../lib/mockLidar'
import { Modal } from './Modal'

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[11px] font-bold tracking-wide text-(--color-ink-faint)">{label.toUpperCase()}</span>
      {children}
    </label>
  )
}

const inputClass =
  'w-full rounded-lg border border-(--color-line) bg-(--color-panel-soft) px-2.5 py-1.5 text-sm text-(--color-ink) outline-none focus:border-(--color-brand)'

export function SettingsModal({ onClose }: { onClose: () => void }) {
  const siloName = useSiloStore((s) => s.siloName)
  const standardId = useSiloStore((s) => s.standardId)
  const dims = useSiloStore((s) => s.dims)
  const grain = useSiloStore((s) => s.grain)
  const mode = useSiloStore((s) => s.mode)
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

  const fileRef = useRef<HTMLInputElement>(null)
  const [jsonError, setJsonError] = useState<string | null>(null)

  const isCustom = standardId === CUSTOM_SILO_ID

  function handleFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
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
    <Modal title="Configurações do silo" onClose={onClose} width={520}>
      <div className="flex flex-col gap-4">
        <Field label="Identificação">
          <input className={inputClass} value={siloName} onChange={(e) => setSiloName(e.target.value)} placeholder="SILO 03" />
        </Field>

        <Field label="Modelo de silo">
          <select
            className={inputClass}
            value={standardId}
            onChange={(e) => setStandardSilo(e.target.value)}
          >
            {STANDARD_SILOS.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} — Ø{s.diameterM}m × {s.cylinderHeightM}m ({Math.round(s.nominalCapacityM3)} m³)
              </option>
            ))}
            <option value={CUSTOM_SILO_ID}>Personalizado…</option>
          </select>
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Diâmetro (m)">
            <input
              type="number"
              step="0.1"
              className={inputClass}
              value={dims.diameterM}
              onChange={(e) => setCustomDimensions({ diameterM: Number(e.target.value) || 0 })}
            />
          </Field>
          <Field label="Altura da parede (m)">
            <input
              type="number"
              step="0.1"
              className={inputClass}
              value={dims.cylinderHeightM}
              onChange={(e) => setCustomDimensions({ cylinderHeightM: Number(e.target.value) || 0 })}
            />
          </Field>
          <Field label="Altura do telhado (m)">
            <input
              type="number"
              step="0.1"
              className={inputClass}
              value={dims.roofHeightM}
              onChange={(e) => setCustomDimensions({ roofHeightM: Number(e.target.value) || 0 })}
            />
          </Field>
          <Field label="Tipo de fundo">
            <select
              className={inputClass}
              value={dims.hopperType}
              onChange={(e) => setCustomDimensions({ hopperType: e.target.value as 'flat' | 'cone' })}
            >
              <option value="cone">Fundo cônico (moega)</option>
              <option value="flat">Fundo plano</option>
            </select>
          </Field>
          {dims.hopperType === 'cone' && (
            <>
              <Field label="Altura da moega (m)">
                <input
                  type="number"
                  step="0.1"
                  className={inputClass}
                  value={dims.hopperHeightM}
                  onChange={(e) => setCustomDimensions({ hopperHeightM: Number(e.target.value) || 0 })}
                />
              </Field>
              <Field label="Diâmetro da saída (m)">
                <input
                  type="number"
                  step="0.05"
                  className={inputClass}
                  value={dims.outletDiameterM}
                  onChange={(e) => setCustomDimensions({ outletDiameterM: Number(e.target.value) || 0 })}
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
          <select className={inputClass} value={grain.id} onChange={(e) => setGrainProfile(e.target.value)}>
            {GRAIN_PROFILES.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name} — {g.bulkDensityKgM3} kg/m³
              </option>
            ))}
          </select>
        </Field>

        <div className="rounded-xl border border-(--color-line) bg-(--color-panel-soft) p-3.5">
          <p className="mb-2 text-[11px] font-bold tracking-wide text-(--color-ink-faint)">SIMULAÇÃO DO SENSOR LIDAR</p>
          <div className="flex items-center gap-3">
            <input
              type="range"
              min={0}
              max={100}
              value={targetLevelPercent}
              onChange={(e) => setTargetLevelPercent(Number(e.target.value))}
              className="flex-1 accent-(--color-brand)"
            />
            <span className="w-12 text-right text-sm font-bold tabular">{targetLevelPercent.toFixed(0)}%</span>
          </div>
          <div className="mt-3 flex items-center gap-2">
            {(['idle', 'filling', 'draining'] as FillMode[]).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${
                  mode === m ? 'bg-(--color-brand) text-white' : 'bg-white text-(--color-ink-soft) border border-(--color-line)'
                }`}
              >
                {m === 'idle' ? 'Repouso' : m === 'filling' ? 'Abastecendo' : 'Descarregando'}
              </button>
            ))}
            <button
              onClick={toggleSimulation}
              className={`ml-auto rounded-lg px-3 py-1.5 text-xs font-semibold ${
                isSimulating ? 'bg-(--color-good-soft) text-(--color-good)' : 'bg-(--color-danger-soft) text-(--color-danger)'
              }`}
            >
              {isSimulating ? 'Ativa' : 'Pausada'}
            </button>
          </div>
        </div>

        <div className="rounded-xl border border-(--color-line) p-3.5">
          <p className="mb-2 text-[11px] font-bold tracking-wide text-(--color-ink-faint)">IMPORTAR LEITURA DO SENSOR (JSON)</p>
          <p className="mb-2 text-[11px] text-(--color-ink-faint)">
            Aceita <code>{'{ sensorHeightM, points:[{angleDeg,radiusM,distanceM}] }'}</code> ou pontos já convertidos com <code>heightM</code>.
          </p>
          <button
            onClick={() => fileRef.current?.click()}
            className="rounded-lg bg-(--color-brand-soft) px-3 py-1.5 text-xs font-semibold text-(--color-brand-dark)"
          >
            Carregar arquivo .json
          </button>
          <input ref={fileRef} type="file" accept="application/json" className="hidden" onChange={handleFile} />
          {(jsonError || lastScanError) && <p className="mt-2 text-[11px] font-medium text-(--color-danger)">{jsonError ?? lastScanError}</p>}
        </div>
      </div>
    </Modal>
  )
}
