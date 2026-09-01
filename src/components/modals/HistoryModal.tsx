import { useMemo, useState } from 'react'
import { useSiloStore } from '../../store/useSiloStore'
import { HISTORY_RANGES, type HistoryRange } from '../../lib/historyRanges'
import { formatDateTime, formatNumber, formatTon } from '../../lib/format'
import type { HistorySample } from '../../types/silo'
import { HistoryChart } from '../layout/HistoryChart'
import { Modal } from './Modal'
import { ToggleGroup, ToggleGroupItem } from '../ui/toggle-group'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table'

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
        <ToggleGroup variant="outline" value={[range]} onValueChange={(value) => value[0] && setRange(value[0] as HistoryRange)}>
          {(Object.keys(HISTORY_RANGES) as HistoryRange[]).map((r) => (
            <ToggleGroupItem key={r} value={r} className="rounded-md px-2.5 py-1 text-[11px] font-bold data-pressed:bg-(--color-navy-soft) data-pressed:text-(--color-navy)">
              {HISTORY_RANGES[r].label}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
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
        <Table className="min-w-[480px] text-[12px]">
          <TableHeader className="sticky top-0 bg-(--color-panel-soft) text-(--color-ink-faint)">
            <TableRow className="border-0 hover:bg-transparent">
              <TableHead className="h-auto px-3 py-2 font-semibold text-(--color-ink-faint)">Data/Hora</TableHead>
              <TableHead className="h-auto px-3 py-2 font-semibold text-(--color-ink-faint)">Nível</TableHead>
              <TableHead className="h-auto px-3 py-2 font-semibold text-(--color-ink-faint)">Volume</TableHead>
              <TableHead className="h-auto px-3 py-2 font-semibold text-(--color-ink-faint)">Massa</TableHead>
              <TableHead className="h-auto px-3 py-2 font-semibold text-(--color-ink-faint)">Temp.</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((r) => (
              <TableRow key={r.t} className="border-t border-(--color-line) hover:bg-transparent">
                <TableCell className="tabular px-3 py-1.5">{formatDateTime(r.t)}</TableCell>
                <TableCell className="tabular px-3 py-1.5">{r.levelPercent.toFixed(0)}%</TableCell>
                <TableCell className="tabular px-3 py-1.5">{formatNumber(r.volumeM3)} m³</TableCell>
                <TableCell className="tabular px-3 py-1.5">{formatTon(r.massTon)} t</TableCell>
                <TableCell className="tabular px-3 py-1.5">{r.temperatureC.toFixed(1)}°C</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </Modal>
  )
}
