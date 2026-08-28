import { useEffect, useState } from 'react'
import { LoginScreen } from './components/auth/LoginScreen'
import { IconRail } from './components/layout/IconRail'
import { TopBar } from './components/layout/TopBar'
import { LeftPanel } from './components/layout/LeftPanel'
import { ViewModeToggle, type ViewMode } from './components/layout/ViewModeToggle'
import { SiloCanvas } from './components/silo3d/SiloCanvas'
import { Silo2DView } from './components/silo2d/Silo2DView'
import { SettingsModal } from './components/modals/SettingsModal'
import { AlertsPanel } from './components/modals/AlertsPanel'
import { ReportsModal } from './components/modals/ReportsModal'
import { useSiloStore } from './store/useSiloStore'
import { useTheme } from './hooks/useTheme'

type ModalKind = 'settings' | 'alerts' | 'reports' | null

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [activeRail, setActiveRail] = useState('dashboard')
  const [modal, setModal] = useState<ModalKind>(null)
  const [viewMode, setViewMode] = useState<ViewMode>('3d')
  const { theme, toggleTheme } = useTheme()

  const tick = useSiloStore((s) => s.tick)
  const siloName = useSiloStore((s) => s.siloName)
  const alerts = useSiloStore((s) => s.alerts)

  useEffect(() => {
    const interval = setInterval(() => tick(), 2200)
    return () => clearInterval(interval)
  }, [tick])

  if (!isLoggedIn) {
    return <LoginScreen onLogin={() => setIsLoggedIn(true)} />
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-(--color-panel)">
      <IconRail
        active={activeRail}
        alertCount={alerts.length}
        onSelect={setActiveRail}
        onOpenSettings={() => setModal('settings')}
        onOpenReports={() => setModal('reports')}
        onOpenAlerts={() => setModal('alerts')}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar siloName={siloName} theme={theme} onToggleTheme={toggleTheme} onLogout={() => setIsLoggedIn(false)} />

        <div className="flex min-h-0 flex-1">
          <LeftPanel />
          <main className="relative min-w-0 flex-1">
            {viewMode === '3d' ? <SiloCanvas /> : <Silo2DView />}
            <ViewModeToggle mode={viewMode} onChange={setViewMode} />
          </main>
        </div>
      </div>

      {modal === 'settings' && <SettingsModal onClose={() => setModal(null)} />}
      {modal === 'alerts' && <AlertsPanel onClose={() => setModal(null)} />}
      {modal === 'reports' && <ReportsModal onClose={() => setModal(null)} />}
    </div>
  )
}
