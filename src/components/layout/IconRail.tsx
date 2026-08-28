import { BellIcon, ClipboardIcon, GearIcon, HelpIcon, HomeIcon } from '../icons'

interface IconRailProps {
  active: string
  alertCount: number
  onSelect: (id: string) => void
  onOpenSettings: () => void
  onOpenReports: () => void
  onOpenAlerts: () => void
}

export function IconRail({ active, alertCount, onSelect, onOpenSettings, onOpenReports, onOpenAlerts }: IconRailProps) {
  // Only 'dashboard' is a real navigation destination — the others open a modal and
  // never become the "active" section, so they never get the selected highlight.
  const navItems = [{ id: 'dashboard', label: 'Dashboard', icon: <HomeIcon />, onClick: () => onSelect('dashboard') }]
  const actionItems = [
    { id: 'relatorios', label: 'Relatórios', icon: <ClipboardIcon />, onClick: onOpenReports },
    { id: 'alertas', label: 'Alertas', icon: <BellIcon />, onClick: onOpenAlerts, badge: alertCount },
    { id: 'config', label: 'Configurações', icon: <GearIcon />, onClick: onOpenSettings },
  ]

  return (
    <nav className="flex w-14 shrink-0 flex-col items-center justify-between border-r border-(--color-line) bg-(--color-panel) py-4">
      <div className="flex flex-col items-center gap-1">
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
        <div className="my-1.5 h-px w-7 bg-(--color-line)" />
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
        className="flex h-11 w-11 cursor-not-allowed items-center justify-center rounded-xl text-(--color-ink-faint) opacity-40"
      >
        <HelpIcon />
      </button>
    </nav>
  )
}
