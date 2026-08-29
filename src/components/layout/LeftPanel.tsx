import { useState } from 'react'
import { useSiloStore } from '../../store/useSiloStore'
import { formatHours, formatNumber, formatTon } from '../../lib/format'
import { HISTORY_RANGES, type HistoryRange } from '../../lib/historyRanges'
import { TrendIcon } from '../icons'
import { GaugeCard } from './GaugeCard'
import { StatCard, BadgeCard } from './StatCard'
import { HistoryChart } from './HistoryChart'

const STATUS_LABEL: Record<string, string> = {
  critico: 'CRÍTICO',
  baixo: 'BAIXO',
  normal: 'NORMAL',
  alto: 'ALTO',
  cheio: 'CHEIO',
}
const STATUS_TONE: Record<string, 'good' | 'warn' | 'danger' | 'neutral'> = {
  critico: 'danger',
  baixo: 'warn',
  normal: 'good',
  alto: 'good',
  cheio: 'warn',
}

export function LeftPanel({ onOpenHistory }: { onOpenHistory: () => void }) {
  const [historyRange, setHistoryRange] = useState<HistoryRange>('24h')
  const volume = useSiloStore((s) => s.volume)
  const status = useSiloStore((s) => s.status)
  const flow = useSiloStore((s) => s.flow)
  const history = useSiloStore((s) => s.history)

  const inflow = flow.inflowLastHourTon
  const outflow = flow.outflowLastHourTon
  const netRate = flow.netRateTonHour

  return (
    <aside className="flex w-[300px] shrink-0 flex-col gap-3 overflow-y-auto border-r border-(--color-line) bg-(--color-panel-soft) p-3.5 scroll-slim">
      <GaugeCard label="Volume atual" valueM3={volume.volumeM3} percent={volume.levelPercent} />

      <StatCard label="Massa total" value={formatTon(volume.massTon)} unit="t" />

      <BadgeCard label="Nível" value={STATUS_LABEL[status]} sub="Operacional" tone={STATUS_TONE[status]} />

      <div className="grid grid-cols-2 gap-3">
        <StatCard label="Entrada última hora" value={formatTon(inflow)} unit="t" />
        <StatCard label="Saída última hora" value={formatTon(outflow)} unit="t" />
      </div>

      <StatCard
        label="Taxa de enchimento"
        value={`${netRate >= 0 ? '+' : ''}${formatNumber(netRate, 0)}`}
        unit="t/h"
        icon={<TrendIcon up={netRate >= 0} />}
      />

      <StatCard
        label={flow.hoursToEmpty !== null ? 'Duração estimada até esvaziar' : flow.hoursToFull !== null ? 'Duração estimada até encher' : 'Duração estimada'}
        value={flow.hoursToEmpty !== null ? formatHours(flow.hoursToEmpty) : flow.hoursToFull !== null ? formatHours(flow.hoursToFull) : 'Estável'}
        sub={
          flow.refillEta !== null
            ? `Abastecer em ~${formatHours(Math.max(0, (flow.refillEta - Date.now()) / 3_600_000))}`
            : 'Sem tendência de consumo'
        }
      />

      <div className="rounded-2xl border border-(--color-line) bg-(--color-panel) p-3.5">
        <div className="flex items-center justify-between">
          <p className="text-[11px] font-bold tracking-wide text-(--color-ink-faint)">HISTÓRICO DE NÍVEL</p>
          <div className="flex gap-1">
            {(Object.keys(HISTORY_RANGES) as HistoryRange[]).map((range) => (
              <button
                key={range}
                onClick={() => setHistoryRange(range)}
                className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold ${
                  historyRange === range ? 'bg-(--color-brand-soft) text-(--color-brand-dark)' : 'text-(--color-ink-faint) hover:bg-(--color-panel-soft)'
                }`}
              >
                {HISTORY_RANGES[range].label}
              </button>
            ))}
          </div>
        </div>
        <HistoryChart history={history} windowMs={HISTORY_RANGES[historyRange].windowMs} />
        <button onClick={onOpenHistory} className="mt-2 text-[11px] font-semibold text-(--color-brand-dark) hover:underline">
          Ver histórico completo →
        </button>
      </div>
    </aside>
  )
}
