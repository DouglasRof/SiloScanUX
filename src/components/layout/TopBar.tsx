import { LogoutIcon, MoonIcon, SiloLogo, SunIcon, UserIcon } from '../icons'
import type { Theme } from '../../hooks/useTheme'
import type { SiloSummary } from '../../types/silo'
import { SiloSwitcher } from './SiloSwitcher'

interface TopBarProps {
  silos: SiloSummary[]
  activeSiloId: string | null
  onSwitchSilo: (id: string) => void
  onCreateSilo: () => void
  onDeleteSilo: (id: string) => void
  theme: Theme
  onToggleTheme: () => void
  onOpenAccount: () => void
  onLogout: () => void
}

export function TopBar({ silos, activeSiloId, onSwitchSilo, onCreateSilo, onDeleteSilo, theme, onToggleTheme, onOpenAccount, onLogout }: TopBarProps) {
  return (
    <header className="relative z-30 flex h-14 shrink-0 items-center justify-between border-b border-(--color-line) bg-(--color-panel) px-3 sm:px-5">
      <div className="flex items-center gap-2.5">
        <SiloLogo />
        <span className="hidden text-[15px] font-bold tracking-tight text-(--color-ink) sm:inline">SiloScanUX</span>
        <span className="hidden rounded-full bg-(--color-brand-soft) px-2 py-0.5 text-[11px] font-semibold text-(--color-brand-dark) sm:inline">v{__APP_VERSION__}</span>
      </div>

      <SiloSwitcher silos={silos} activeSiloId={activeSiloId} onSwitch={onSwitchSilo} onCreate={onCreateSilo} onDelete={onDeleteSilo} />

      <div className="flex items-center gap-1">
        <button
          onClick={onToggleTheme}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-(--color-ink-soft) hover:bg-(--color-panel-soft)"
          title={theme === 'dark' ? 'Mudar para tema claro' : 'Mudar para tema escuro'}
        >
          {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
        </button>
        <button onClick={onOpenAccount} className="flex h-9 w-9 items-center justify-center rounded-lg text-(--color-ink-soft) hover:bg-(--color-panel-soft)" title="Minha conta">
          <UserIcon />
        </button>
        <button onClick={onLogout} className="flex h-9 w-9 items-center justify-center rounded-lg text-(--color-ink-soft) hover:bg-(--color-panel-soft)" title="Sair">
          <LogoutIcon />
        </button>
      </div>
    </header>
  )
}
