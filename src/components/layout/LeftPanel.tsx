import { useSiloStore } from '../../store/useSiloStore'
import { formatHours, formatNumber, formatTon } from '../../lib/format'
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

function TrendIcon({ up }: { up: boolean }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`h-4 w-4 ${up ? 'text-(--color-good)' : 'text-(--color-danger)'}`}>
      {up ? <path d="M4 16 10 10l4 4 6-7" strokeLinecap="round" strokeLinejoin="round" /> : <path d="M4 8l6 6 4-4 6 7" strokeLinecap="round" strokeLinejoin="round" />}
      <path d={up ? 'M16 8h4v4' : 'M16 16h4v-4'} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function DocIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4.5 w-4.5">
      <path d="M7 3.5h7l4 4V19a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 6 19V5A1.5 1.5 0 0 1 7 3.5Z" strokeLinejoin="round" />
      <path d="M14 3.5V8h4" strokeLinejoin="round" />
      <path d="M9 12.5h6M9 15.5h6M9 9.5h2" strokeLinecap="round" />
    </svg>
  )
}
function GearSmallIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4.5 w-4.5">
      <circle cx="12" cy="12" r="3" />
      <path d="M12 3.8v2M12 18.2v2M20.2 12h-2M5.8 12h-2M17.5 6.5l-1.4 1.4M7.9 16.1l-1.4 1.4M17.5 17.5l-1.4-1.4M7.9 7.9 6.5 6.5" strokeLinecap="round" />
    </svg>
  )
}
function WarnIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4.5 w-4.5">
      <path d="M12 4 21.5 20h-19Z" strokeLinejoin="round" />
      <path d="M12 10v4.5" strokeLinecap="round" />
      <circle cx="12" cy="17.3" r="0.9" fill="currentColor" stroke="none" />
    </svg>
  )
}

interface LeftPanelProps {
  onOpenReports: () => void
  onOpenSettings: () => void
  onOpenAlerts: () => void
}

export function LeftPanel({ onOpenReports, onOpenSettings, onOpenAlerts }: LeftPanelProps) {
  const volume = useSiloStore((s) => s.volume)
  const status = useSiloStore((s) => s.status)
  const flow = useSiloStore((s) => s.flow)
  const history = useSiloStore((s) => s.history)
  const alerts = useSiloStore((s) => s.alerts)

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
        <p className="text-[11px] font-bold tracking-wide text-(--color-ink-faint)">HISTÓRICO DE NÍVEL (24H)</p>
        <HistoryChart history={history} />
      </div>

      <div className="mt-1 flex flex-col gap-2">
        <button
          onClick={onOpenReports}
          className="flex items-center justify-center gap-2 rounded-xl bg-(--color-brand-soft) py-2.5 text-[13px] font-bold text-(--color-brand-dark) transition-colors hover:brightness-95"
        >
          <DocIcon /> Relatórios
        </button>
        <button
          onClick={onOpenSettings}
          className="flex items-center justify-center gap-2 rounded-xl bg-(--color-brand-soft) py-2.5 text-[13px] font-bold text-(--color-brand-dark) transition-colors hover:brightness-95"
        >
          <GearSmallIcon /> Configurações
        </button>
        <button
          onClick={onOpenAlerts}
          className="flex items-center justify-center gap-2 rounded-xl bg-(--color-warn-soft) py-2.5 text-[13px] font-bold text-(--color-warn) transition-colors hover:brightness-95"
        >
          <WarnIcon /> Alertas {alerts.length > 0 && `(${alerts.length})`}
        </button>
      </div>
    </aside>
  )
}
