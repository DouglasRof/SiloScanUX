import { LogoutIcon, MoonIcon, SiloLogo, SunIcon, UserIcon } from '../icons'
import type { Theme } from '../../hooks/useTheme'
import type { PropertySummary, SiloSummary } from '../../types/silo'
import { PropertySiloSwitcher } from './PropertySiloSwitcher'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'

interface TopBarProps {
  properties: PropertySummary[]
  silos: SiloSummary[]
  activePropertyId: string | null
  activeSiloId: string | null
  onSwitchProperty: (id: string) => void
  onSwitchSilo: (id: string) => void
  onCreateProperty: () => void
  onCreateSilo: () => void
  onDeleteSilo: (id: string) => Promise<boolean>
  onRenameProperty: (propertyId: string, currentName: string) => void
  theme: Theme
  onToggleTheme: () => void
  onOpenAccount: () => void
  onLogout: () => void
}

export function TopBar({
  properties,
  silos,
  activePropertyId,
  activeSiloId,
  onSwitchProperty,
  onSwitchSilo,
  onCreateProperty,
  onCreateSilo,
  onDeleteSilo,
  onRenameProperty,
  theme,
  onToggleTheme,
  onOpenAccount,
  onLogout,
}: TopBarProps) {
  return (
    <header className="relative z-30 flex h-14 shrink-0 items-center justify-between px-3 sm:px-5">
      <div className="flex items-center gap-2.5">
        <SiloLogo />
        <span className="hidden text-[15px] font-bold tracking-tight text-(--color-ink) sm:inline">SiloScanUX</span>
        <Badge className="hidden h-auto rounded-full bg-(--color-navy-soft) px-2 py-0.5 text-[11px] font-semibold text-(--color-navy) sm:inline-flex">v{__APP_VERSION__}</Badge>
      </div>

      <PropertySiloSwitcher
        properties={properties}
        silos={silos}
        activePropertyId={activePropertyId}
        activeSiloId={activeSiloId}
        onSwitchProperty={onSwitchProperty}
        onSwitchSilo={onSwitchSilo}
        onCreateProperty={onCreateProperty}
        onCreateSilo={onCreateSilo}
        onDeleteSilo={onDeleteSilo}
        onRenameProperty={onRenameProperty}
      />

      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          onClick={onToggleTheme}
          className="h-9 w-9 rounded-xl text-(--color-icon) hover:bg-(--color-panel-soft)"
          title={theme === 'dark' ? 'Mudar para tema claro' : 'Mudar para tema escuro'}
        >
          {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
        </Button>
        <Button variant="ghost" onClick={onOpenAccount} className="h-9 w-9 rounded-xl text-(--color-icon) hover:bg-(--color-panel-soft)" title="Minha conta">
          <UserIcon />
        </Button>
        <Button variant="ghost" onClick={onLogout} className="h-9 w-9 rounded-xl text-(--color-icon) hover:bg-(--color-panel-soft)" title="Sair">
          <LogoutIcon />
        </Button>
      </div>
    </header>
  )
}
