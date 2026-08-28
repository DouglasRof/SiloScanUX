import { useSiloStore } from '../../store/useSiloStore'
import { formatClock } from '../../lib/format'
import { Modal } from './Modal'

const SEVERITY_STYLE: Record<string, string> = {
  critical: 'border-(--color-danger) bg-(--color-danger-soft) text-(--color-danger)',
  warning: 'border-(--color-warn) bg-(--color-warn-soft) text-(--color-warn)',
  info: 'border-(--color-brand) bg-(--color-brand-soft) text-(--color-brand-dark)',
}

export function AlertsPanel({ onClose }: { onClose: () => void }) {
  const alerts = useSiloStore((s) => s.alerts)

  return (
    <Modal title="Alertas do silo" onClose={onClose} width={420}>
      {alerts.length === 0 ? (
        <p className="py-6 text-center text-sm text-(--color-ink-faint)">Nenhum alerta ativo no momento.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {alerts.map((a) => (
            <div key={a.id} className={`rounded-xl border-l-4 px-3.5 py-2.5 ${SEVERITY_STYLE[a.severity]}`}>
              <p className="text-[13px] font-semibold">{a.message}</p>
              <p className="mt-0.5 text-[11px] opacity-70">{formatClock(a.createdAt)}</p>
            </div>
          ))}
        </div>
      )}
    </Modal>
  )
}
