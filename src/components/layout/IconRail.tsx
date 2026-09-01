import { BellIcon, ChartIcon, ClipboardIcon, GearIcon, HelpIcon, HomeIcon, ShieldIcon } from '../icons'
import type { UserRole } from '../../types/silo'

interface IconRailProps {
  active: string
  role: UserRole
  alertCount: number
  onSelect: (id: string) => void
  onOpenSettings: () => void
  onOpenReports: () => void
  onOpenAlerts: () => void
  onOpenHistory: () => void
}

export function IconRail({ active, role, alertCount, onSelect, onOpenSettings, onOpenReports, onOpenAlerts, onOpenHistory }: IconRailProps) {
  // 'dashboard' e 'admin' são destinos reais de navegação — os outros abrem um modal
  // e nunca ficam com o destaque de "ativo".
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <HomeIcon />, onClick: () => onSelect('dashboard') },
    ...(role === 'admin' ? [{ id: 'admin', label: 'Back office', icon: <ShieldIcon />, onClick: () => onSelect('admin') }] : []),
  ]
  const actionItems = [
    { id: 'relatorios', label: 'Relatórios', icon: <ClipboardIcon />, onClick: onOpenReports },
    { id: 'historico', label: 'Histórico', icon: <ChartIcon />, onClick: onOpenHistory },
    { id: 'alertas', label: 'Alertas', icon: <BellIcon />, onClick: onOpenAlerts, badge: alertCount },
    { id: 'config', label: 'Configurações', icon: <GearIcon />, onClick: onOpenSettings },
  ]

  return (
    // Barra inferior fixa no celular (nav típica de app mobile); vira rail vertical à
    // esquerda a partir do breakpoint `sm`, como sempre foi no desktop.
    <nav className="fixed inset-x-0 bottom-0 z-30 flex shrink-0 items-center justify-around border-t border-(--color-line) bg-(--color-panel) py-1.5 sm:static sm:inset-auto sm:z-auto sm:w-14 sm:flex-col sm:items-center sm:justify-between sm:border-t-0 sm:border-r sm:py-4">
      <div className="flex items-center gap-1 sm:flex-col">
        {navItems.map((item) => (
          <button
            key={item.id}
            title={item.label}
            onClick={item.onClick}
            className={`flex h-11 w-11 items-center justify-center rounded-xl transition-colors ${
              active === item.id
                ? 'bg-(--color-brand-soft) text-(--color-brand-dark)'
                : 'text-(--color-ink-faint) hover:bg-(--color-panel-soft) hover:text-(--color-ink-soft)'
            }`}
          >
            {item.icon}
          </button>
        ))}
        <div className="hidden sm:my-1.5 sm:block sm:h-px sm:w-7 sm:bg-(--color-line)" />
        {actionItems.map((item) => (
          <button
            key={item.id}
            title={item.label}
            aria-label={item.badge ? `${item.label} (${item.badge})` : item.label}
            onClick={item.onClick}
            className="relative flex h-11 w-11 items-center justify-center rounded-xl text-(--color-ink-faint) transition-colors hover:bg-(--color-panel-soft) hover:text-(--color-ink-soft)"
          >
            {item.icon}
            {!!item.badge && (
              <span className="absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-(--color-danger) px-1 text-[10px] font-bold text-white">
                {item.badge}
              </span>
            )}
          </button>
        ))}
      </div>
      <button
        title="Ajuda (em breve)"
        aria-disabled="true"
        disabled
        className="hidden h-11 w-11 cursor-not-allowed items-center justify-center rounded-xl text-(--color-ink-faint) opacity-40 sm:flex"
      >
        <HelpIcon />
      </button>
    </nav>
  )
}
