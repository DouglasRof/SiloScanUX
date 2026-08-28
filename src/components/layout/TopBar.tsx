interface TopBarProps {
  siloName: string
  alertCount: number
  onOpenAlerts: () => void
  onOpenSettings: () => void
}

function BellIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8" stroke="currentColor" className="h-5 w-5">
      <path d="M6 10a6 6 0 0 1 12 0c0 4 1.5 5.5 1.5 5.5H4.5S6 14 6 10Z" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M10 18.5a2 2 0 0 0 4 0" strokeLinecap="round" />
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
function LogoutIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8" stroke="currentColor" className="h-5 w-5">
      <path d="M15 4.5h2.5a1.5 1.5 0 0 1 1.5 1.5v12a1.5 1.5 0 0 1-1.5 1.5H15" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M11 8l4 4-4 4M15 12H3.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
function SiloLogo() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6">
      <rect x="3" y="9" width="14" height="11" rx="1.4" fill="var(--color-brand)" opacity="0.15" />
      <path d="M3 9 10 4l7 5" stroke="var(--color-brand)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <rect x="3" y="9" width="14" height="11" rx="1.4" stroke="var(--color-brand)" strokeWidth="1.8" fill="none" />
      <path d="M6.5 13.5h7" stroke="var(--color-brand)" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  )
}

export function TopBar({ siloName, alertCount, onOpenAlerts, onOpenSettings }: TopBarProps) {
  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-(--color-line) bg-(--color-panel) px-5">
      <div className="flex items-center gap-2.5">
        <SiloLogo />
        <span className="text-[15px] font-bold tracking-tight text-(--color-ink)">SiloScanUX</span>
        <span className="rounded-full bg-(--color-brand-soft) px-2 py-0.5 text-[11px] font-semibold text-(--color-brand-dark)">v2.1</span>
      </div>

      <h1 className="absolute left-1/2 -translate-x-1/2 text-[13px] font-bold tracking-[0.14em] text-(--color-ink-soft)">
        DASHBOARD DE CAPACIDADE — {siloName}
      </h1>

      <div className="flex items-center gap-1">
        <button
          onClick={onOpenAlerts}
          className="relative flex h-9 w-9 items-center justify-center rounded-lg text-(--color-ink-soft) hover:bg-(--color-panel-soft)"
          title="Alertas"
        >
          <BellIcon />
          {alertCount > 0 && (
            <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-(--color-danger) px-1 text-[10px] font-bold text-white">
              {alertCount}
            </span>
          )}
        </button>
        <button onClick={onOpenSettings} className="flex h-9 w-9 items-center justify-center rounded-lg text-(--color-ink-soft) hover:bg-(--color-panel-soft)" title="Configurações">
          <GearIcon />
        </button>
        <button className="flex h-9 w-9 items-center justify-center rounded-lg text-(--color-ink-soft) hover:bg-(--color-panel-soft)" title="Sair">
          <LogoutIcon />
        </button>
      </div>
    </header>
  )
}
