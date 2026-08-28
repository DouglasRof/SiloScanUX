import type { ReactNode } from 'react'

interface StatCardProps {
  label: string
  value: string
  unit?: string
  icon?: ReactNode
  sub?: string
}

export function StatCard({ label, value, unit, icon, sub }: StatCardProps) {
  return (
    <div className="rounded-2xl border border-(--color-line) bg-(--color-panel) p-3.5 shadow-[0_1px_2px_rgba(16,40,60,0.04)]">
      <p className="text-[11px] font-bold tracking-wide text-(--color-ink-faint)">{label.toUpperCase()}</p>
      <div className="mt-1.5 flex items-baseline gap-1.5">
        {icon}
        <span className="tabular text-2xl font-extrabold leading-none text-(--color-ink)">{value}</span>
        {unit && <span className="text-xs font-semibold text-(--color-ink-soft)">{unit}</span>}
      </div>
      {sub && <p className="mt-1 text-[11px] text-(--color-ink-faint)">{sub}</p>}
    </div>
  )
}

interface BadgeCardProps {
  label: string
  value: string
  sub: string
  tone: 'good' | 'warn' | 'danger' | 'neutral'
}

const TONE_CLASSES: Record<BadgeCardProps['tone'], string> = {
  good: 'bg-(--color-good-soft) text-(--color-good)',
  warn: 'bg-(--color-warn-soft) text-(--color-warn)',
  danger: 'bg-(--color-danger-soft) text-(--color-danger)',
  neutral: 'bg-(--color-brand-soft) text-(--color-brand-dark)',
}

export function BadgeCard({ label, value, sub, tone }: BadgeCardProps) {
  return (
    <div className={`rounded-2xl p-3.5 ${TONE_CLASSES[tone]}`}>
      <p className="text-[11px] font-bold tracking-wide opacity-80">{label.toUpperCase()}</p>
      <p className="tabular mt-1 text-xl font-extrabold leading-none">{value}</p>
      <p className="mt-1 text-[11px] font-semibold opacity-80">{sub}</p>
    </div>
  )
}
