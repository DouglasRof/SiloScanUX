import { useState, type ReactNode } from 'react'
import { useSiloStore } from '../../store/useSiloStore'
import { formatHours, formatNumber, formatTon } from '../../lib/format'
import { HISTORY_RANGES, type HistoryRange } from '../../lib/historyRanges'
import { TrendIcon } from '../icons'
import { HistoryChart } from './HistoryChart'
import { Button } from '../ui/button'
import { ToggleGroup, ToggleGroupItem } from '../ui/toggle-group'

const STATUS_LABEL: Record<string, string> = {
  critico: 'CRÍTICO',
  baixo: 'BAIXO',
  normal: 'NORMAL',
  alto: 'ALTO',
  cheio: 'CHEIO',
}
const STATUS_DOT: Record<string, string> = {
  critico: 'bg-(--color-danger)',
  baixo: 'bg-(--color-warn)',
  normal: 'bg-(--color-good)',
  alto: 'bg-(--color-good)',
  cheio: 'bg-(--color-warn)',
}
const STATUS_TEXT: Record<string, string> = {
  critico: 'text-(--color-danger)',
  baixo: 'text-(--color-warn)',
  normal: 'text-(--color-good)',
  alto: 'text-(--color-good)',
  cheio: 'text-(--color-warn)',
}

function VolumeGauge({ valueM3, percent }: { valueM3: number; percent: number }) {
  const r = 52
  const cy = 62
  const arcLength = Math.PI * r
  const clamped = Math.min(100, Math.max(0, percent))
  const dash = (clamped / 100) * arcLength
  const color = clamped >= 90 ? 'var(--color-warn)' : clamped < 15 ? 'var(--color-danger)' : 'var(--color-navy)'

  return (
    <div className="relative mx-auto h-[76px] w-[136px]">
      <svg viewBox="0 0 136 72" className="h-full w-full">
        <path d={`M 12 ${cy} A ${r} ${r} 0 0 1 124 ${cy}`} fill="none" stroke="var(--color-line)" strokeWidth="10" strokeLinecap="round" />
        <path
          d={`M 12 ${cy} A ${r} ${r} 0 0 1 124 ${cy}`}
          fill="none"
          stroke={color}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${arcLength}`}
          style={{ transition: 'stroke-dasharray 0.5s ease' }}
        />
      </svg>
      <div className="absolute inset-x-0 bottom-0 flex flex-col items-center">
        <span className="tabular text-[28px] font-extrabold leading-none text-(--color-ink)">{formatNumber(valueM3, 0)}</span>
        <span className="text-[11px] font-medium text-(--color-ink-soft)">m³ ({clamped.toFixed(0)}%)</span>
      </div>
    </div>
  )
}

function Metric({ label, value, unit, sub, icon }: { label: string; value: string; unit?: string; sub?: string; icon?: ReactNode }) {
  return (
    <div>
      <div className="flex items-center gap-1 text-(--color-ink-faint)">
        {icon}
        <p className="text-[10.5px] font-bold tracking-wide">{label.toUpperCase()}</p>
      </div>
      <div className="mt-1 flex items-baseline gap-1">
        <span className="tabular text-lg font-extrabold leading-none text-(--color-ink)">{value}</span>
        {unit && <span className="text-[11px] font-semibold text-(--color-ink-soft)">{unit}</span>}
      </div>
      {sub && <p className="mt-0.5 text-[10.5px] text-(--color-ink-faint)">{sub}</p>}
    </div>
  )
}

// Painel de vidro (translúcido + desfocado) ao lado da visualização — não por cima
// dela: sobrepor com position:absolute deixava o Silo2DView centralizando suas duas
// cartas em relação à largura TOTAL (incluindo a área escondida atrás do painel),
// abrindo um vão torto entre o painel e o conteúdo. Como flex normal, a área
// principal só recebe a largura que de fato sobra, então tudo se alinha certo.
// Dentro do painel, seções separadas por linhas finas em vez de vários cartões
// coloridos — cor só onde tem significado (arco do volume, status).
export function DashboardLayout({ mainContent, onOpenHistory }: { mainContent: ReactNode; onOpenHistory: () => void }) {
  const [historyRange, setHistoryRange] = useState<HistoryRange>('24h')
  const volume = useSiloStore((s) => s.volume)
  const status = useSiloStore((s) => s.status)
  const flow = useSiloStore((s) => s.flow)
  const history = useSiloStore((s) => s.history)

  const inflow = flow.inflowLastHourTon
  const outflow = flow.outflowLastHourTon
  const netRate = flow.netRateTonHour
  const durationLabel = flow.hoursToEmpty !== null ? 'Duração até esvaziar' : flow.hoursToFull !== null ? 'Duração até encher' : 'Duração estimada'
  const durationValue = flow.hoursToEmpty !== null ? formatHours(flow.hoursToEmpty) : flow.hoursToFull !== null ? formatHours(flow.hoursToFull) : 'Estável'
  const durationSub = flow.refillEta !== null ? `Abastecer em ~${formatHours(Math.max(0, (flow.refillEta - Date.now()) / 3_600_000))}` : 'Sem tendência de consumo'

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-4 scroll-slim sm:flex-row sm:overflow-hidden sm:p-5">
      <aside className="glass-panel order-2 w-full shrink-0 overflow-hidden rounded-3xl sm:order-none sm:w-[300px]">
        <div className="flex flex-col gap-4 p-5">
          <div className="border-b border-(--color-line)/60 pb-4">
            <p className="text-center text-[11px] font-bold tracking-wide text-(--color-ink-faint)">VOLUME ATUAL</p>
            <VolumeGauge valueM3={volume.volumeM3} percent={volume.levelPercent} />
          </div>

          <div className="flex items-center justify-between border-b border-(--color-line)/60 pb-4">
            <div className="flex items-center gap-1.5">
              <span className={`h-1.5 w-1.5 rounded-full ${STATUS_DOT[status]}`} />
              <span className={`text-[13px] font-extrabold ${STATUS_TEXT[status]}`}>{STATUS_LABEL[status]}</span>
            </div>
            <span className="text-[11px] font-medium text-(--color-ink-faint)">Operacional</span>
          </div>

          <div className="grid grid-cols-2 gap-4 border-b border-(--color-line)/60 pb-4">
            <Metric label="Massa total" value={formatTon(volume.massTon)} unit="t" />
            <Metric label="Entrada 1h" value={formatTon(inflow)} unit="t" />
            <Metric label="Saída 1h" value={formatTon(outflow)} unit="t" />
            <Metric label="Taxa" value={`${netRate >= 0 ? '+' : ''}${formatNumber(netRate, 0)}`} unit="t/h" icon={<TrendIcon up={netRate >= 0} />} />
          </div>

          <div className="border-b border-(--color-line)/60 pb-4">
            <Metric label={durationLabel} value={durationValue} sub={durationSub} />
          </div>

          <div>
            <div className="flex items-center justify-between">
              <p className="text-[10.5px] font-bold tracking-wide text-(--color-ink-faint)">HISTÓRICO DE NÍVEL</p>
              <ToggleGroup variant="default" size="sm" spacing={1} value={[historyRange]} onValueChange={(value) => value[0] && setHistoryRange(value[0] as HistoryRange)}>
                {(Object.keys(HISTORY_RANGES) as HistoryRange[]).map((range) => (
                  <ToggleGroupItem
                    key={range}
                    value={range}
                    className="rounded-md px-1.5 py-0.5 text-[10px] font-bold data-pressed:bg-(--color-navy-soft) data-pressed:text-(--color-navy)"
                  >
                    {HISTORY_RANGES[range].label}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
            </div>
            <HistoryChart history={history} windowMs={HISTORY_RANGES[historyRange].windowMs} />
            <Button onClick={onOpenHistory} variant="link" className="mt-2 h-auto p-0 text-[11px] font-semibold">
              Ver histórico completo →
            </Button>
          </div>
        </div>
      </aside>

      <div className="order-1 h-[46vh] w-full shrink-0 overflow-hidden rounded-3xl border border-(--color-line) sm:order-none sm:h-auto sm:min-w-0 sm:flex-1 sm:shrink">
        {mainContent}
      </div>
    </div>
  )
}
