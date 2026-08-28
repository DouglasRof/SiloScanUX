import { formatNumber } from '../../lib/format'

interface GaugeCardProps {
  label: string
  valueM3: number
  percent: number
}

export function GaugeCard({ label, valueM3, percent }: GaugeCardProps) {
  const r = 46
  const cy = 56
  const arcLength = Math.PI * r
  const clamped = Math.min(100, Math.max(0, percent))
  const dash = (clamped / 100) * arcLength

  const color = clamped >= 90 ? 'var(--color-warn)' : clamped < 15 ? 'var(--color-danger)' : 'var(--color-brand)'

  return (
    <div className="rounded-2xl border border-(--color-line) bg-(--color-panel) p-4 shadow-[0_1px_2px_rgba(16,40,60,0.04)]">
      <p className="text-[11px] font-bold tracking-wide text-(--color-ink-faint)">{label.toUpperCase()}</p>
      <div className="relative mx-auto mt-1 h-[64px] w-[120px]">
        <svg viewBox="0 0 120 64" className="h-full w-full">
          <path d={`M 10 ${cy} A ${r} ${r} 0 0 1 110 ${cy}`} fill="none" stroke="var(--color-line)" strokeWidth="9" strokeLinecap="round" />
          <path
            d={`M 10 ${cy} A ${r} ${r} 0 0 1 110 ${cy}`}
            fill="none"
            stroke={color}
            strokeWidth="9"
            strokeLinecap="round"
            strokeDasharray={`${dash} ${arcLength}`}
            style={{ transition: 'stroke-dasharray 0.5s ease' }}
          />
        </svg>
        <div className="absolute inset-x-0 bottom-0 flex flex-col items-center">
          <span className="tabular text-[26px] font-extrabold leading-none text-(--color-ink)">{formatNumber(valueM3, 0)}</span>
          <span className="text-[11px] font-medium text-(--color-ink-soft)">
            m³ ({clamped.toFixed(0)}%)
          </span>
        </div>
      </div>
    </div>
  )
}
