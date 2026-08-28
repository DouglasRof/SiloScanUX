function HomeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8" stroke="currentColor" className="h-5 w-5">
      <path d="M3 11.5 12 4l9 7.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5.5 9.5V19a1 1 0 0 0 1 1H10a.5.5 0 0 0 .5-.5V15a1.5 1.5 0 0 1 3 0v4.5a.5.5 0 0 0 .5.5h3.5a1 1 0 0 0 1-1V9.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
function ClipboardIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8" stroke="currentColor" className="h-5 w-5">
      <rect x="5.5" y="4.5" width="13" height="16" rx="1.8" />
      <path d="M9 4.5V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v.5" strokeLinecap="round" />
      <path d="M8.5 11h7M8.5 15h7M8.5 19h4" strokeLinecap="round" />
    </svg>
  )
}
function GearIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8" stroke="currentColor" className="h-5 w-5">
      <circle cx="12" cy="12" r="3.1" />
      <path
        d="M12 3.5v2M12 18.5v2M20.5 12h-2M5.5 12h-2M17.7 6.3l-1.4 1.4M7.7 16.3l-1.4 1.4M17.7 17.7l-1.4-1.4M7.7 7.7 6.3 6.3"
        strokeLinecap="round"
      />
    </svg>
  )
}
function BellIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8" stroke="currentColor" className="h-5 w-5">
      <path d="M6 10a6 6 0 0 1 12 0c0 4 1.5 5.5 1.5 5.5H4.5S6 14 6 10Z" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M10 18.5a2 2 0 0 0 4 0" strokeLinecap="round" />
    </svg>
  )
}
function HelpIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8" stroke="currentColor" className="h-5 w-5">
      <circle cx="12" cy="12" r="9" />
      <path d="M9.6 9.3a2.4 2.4 0 1 1 3.5 2.1c-.8.5-1.1.9-1.1 1.9" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="12" cy="16.7" r="0.9" fill="currentColor" stroke="none" />
    </svg>
  )
}

interface IconRailProps {
  active: string
  onSelect: (id: string) => void
  onOpenSettings: () => void
  onOpenReports: () => void
  onOpenAlerts: () => void
}

export function IconRail({ active, onSelect, onOpenSettings, onOpenReports, onOpenAlerts }: IconRailProps) {
  const items = [
    { id: 'dashboard', label: 'Dashboard', icon: <HomeIcon />, onClick: () => onSelect('dashboard') },
    { id: 'config', label: 'Configurações', icon: <GearIcon />, onClick: onOpenSettings },
    { id: 'relatorios', label: 'Relatórios', icon: <ClipboardIcon />, onClick: onOpenReports },
    { id: 'alertas', label: 'Alertas', icon: <BellIcon />, onClick: onOpenAlerts },
  ]

  return (
    <nav className="flex w-14 shrink-0 flex-col items-center justify-between border-r border-(--color-line) bg-(--color-panel) py-4">
      <div className="flex flex-col items-center gap-1">
        {items.map((item) => (
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
      </div>
      <button
        title="Ajuda"
        className="flex h-11 w-11 items-center justify-center rounded-xl text-(--color-ink-faint) hover:bg-(--color-panel-soft) hover:text-(--color-ink-soft)"
      >
        <HelpIcon />
      </button>
    </nav>
  )
}
