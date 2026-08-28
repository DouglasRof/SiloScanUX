import { LogoutIcon, MoonIcon, SiloLogo, SunIcon } from '../icons'
import type { Theme } from '../../hooks/useTheme'

interface TopBarProps {
  siloName: string
  theme: Theme
  onToggleTheme: () => void
}

export function TopBar({ siloName, theme, onToggleTheme }: TopBarProps) {
  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-(--color-line) bg-(--color-panel) px-5">
      <div className="flex items-center gap-2.5">
        <SiloLogo />
        <span className="text-[15px] font-bold tracking-tight text-(--color-ink)">SiloScanUX</span>
        <span className="rounded-full bg-(--color-brand-soft) px-2 py-0.5 text-[11px] font-semibold text-(--color-brand-dark)">v{__APP_VERSION__}</span>
      </div>

      <h1 className="absolute left-1/2 -translate-x-1/2 text-[13px] font-bold tracking-[0.14em] text-(--color-ink-soft)">
        DASHBOARD DE CAPACIDADE — {siloName}
      </h1>

      <div className="flex items-center gap-1">
        <button
          onClick={onToggleTheme}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-(--color-ink-soft) hover:bg-(--color-panel-soft)"
          title={theme === 'dark' ? 'Mudar para tema claro' : 'Mudar para tema escuro'}
        >
          {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
        </button>
        <button className="flex h-9 w-9 items-center justify-center rounded-lg text-(--color-ink-soft) hover:bg-(--color-panel-soft)" title="Sair">
          <LogoutIcon />
        </button>
      </div>
    </header>
  )
}
