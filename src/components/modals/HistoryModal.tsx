import { useMemo, useState } from 'react'
import { useSiloStore } from '../../store/useSiloStore'
import { HISTORY_RANGES, type HistoryRange } from '../../lib/historyRanges'
import { formatDateTime, formatNumber, formatTon } from '../../lib/format'
import type { HistorySample } from '../../types/silo'
import { HistoryChart } from '../layout/HistoryChart'
import { Modal } from './Modal'

function summarize(samples: HistorySample[]) {
  if (samples.length === 0) return null
  const levels = samples.map((s) => s.levelPercent)
  const temps = samples.map((s) => s.temperatureC)
  return {
    minLevel: Math.min(...levels),
    maxLevel: Math.max(...levels),
    avgLevel: levels.reduce((a, b) => a + b, 0) / levels.length,
    minTemp: Math.min(...temps),
    maxTemp: Math.max(...temps),
    avgTemp: temps.reduce((a, b) => a + b, 0) / temps.length,
  }
}

function StatBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-(--color-line) bg-(--color-panel-soft) p-3">
      <p className="text-[10px] font-bold tracking-wide text-(--color-ink-faint)">{label.toUpperCase()}</p>
      <p className="mt-1 text-base font-bold text-(--color-ink)">{value}</p>
    </div>
  )
}

export function HistoryModal({ onClose }: { onClose: () => void }) {
  const history = useSiloStore((s) => s.history)
  const siloName = useSiloStore((s) => s.siloName)
  const [range, setRange] = useState<HistoryRange>('24h')

  const windowMs = HISTORY_RANGES[range].windowMs
  const filtered = useMemo(() => {
    const newestT = history.length > 0 ? history[history.length - 1].t : 0
    const windowStart = newestT - windowMs
    return history.filter((h) => h.t >= windowStart)
  }, [history, windowMs])

  const stats = summarize(filtered)
  const rows = [...filtered].reverse()

  return (
    <Modal title={`Histórico completo — ${siloName}`} onClose={onClose} width={720}>
      <div className="flex items-center justify-end gap-1">
        {(Object.keys(HISTORY_RANGES) as HistoryRange[]).map((r) => (
          <button
            key={r}
            onClick={() => setRange(r)}
            className={`rounded-md px-2.5 py-1 text-[11px] font-bold ${
              range === r ? 'bg-(--color-brand-soft) text-(--color-brand-dark)' : 'text-(--color-ink-faint) hover:bg-(--color-panel-soft)'
            }`}
          >
            {HISTORY_RANGES[r].label}
          </button>
        ))}
      </div>

      <div className="mt-2 rounded-xl border border-(--color-line) bg-(--color-panel-soft) p-3.5">
        <HistoryChart history={history} windowMs={windowMs} width={640} height={140} />
      </div>

      {stats && (
        <div className="mt-3 grid grid-cols-3 gap-3">
          <StatBlock label="Nível mínimo" value={`${stats.minLevel.toFixed(0)}%`} />
          <StatBlock label="Nível médio" value={`${stats.avgLevel.toFixed(0)}%`} />
          <StatBlock label="Nível máximo" value={`${stats.maxLevel.toFixed(0)}%`} />
          <StatBlock label="Temp. mínima" value={`${stats.minTemp.toFixed(1)}°C`} />
          <StatBlock label="Temp. média" value={`${stats.avgTemp.toFixed(1)}°C`} />
          <StatBlock label="Temp. máxima" value={`${stats.maxTemp.toFixed(1)}°C`} />
        </div>
      )}

      <p className="mt-4 text-[11px] font-bold tracking-wide text-(--color-ink-faint)">{rows.length} LEITURAS NO PERÍODO</p>
      <div className="mt-1 max-h-64 overflow-auto rounded-xl border border-(--color-line) scroll-slim">
        <table className="w-full min-w-[480px] text-left text-[12px]">
          <thead className="sticky top-0 bg-(--color-panel-soft) text-(--color-ink-faint)">
            <tr>
              <th className="px-3 py-2 font-semibold">Data/Hora</th>
              <th className="px-3 py-2 font-semibold">Nível</th>
              <th className="px-3 py-2 font-semibold">Volume</th>
              <th className="px-3 py-2 font-semibold">Massa</th>
              <th className="px-3 py-2 font-semibold">Temp.</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.t} className="border-t border-(--color-line)">
                <td className="px-3 py-1.5 tabular">{formatDateTime(r.t)}</td>
                <td className="px-3 py-1.5 tabular">{r.levelPercent.toFixed(0)}%</td>
                <td className="px-3 py-1.5 tabular">{formatNumber(r.volumeM3)} m³</td>
                <td className="px-3 py-1.5 tabular">{formatTon(r.massTon)} t</td>
                <td className="px-3 py-1.5 tabular">{r.temperatureC.toFixed(1)}°C</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Modal>
  )
}
