import { useEffect, useState } from 'react'
import { IconRail } from './components/layout/IconRail'
import { TopBar } from './components/layout/TopBar'
import { LeftPanel } from './components/layout/LeftPanel'
import { SiloCanvas } from './components/silo3d/SiloCanvas'
import { SettingsModal } from './components/modals/SettingsModal'
import { AlertsPanel } from './components/modals/AlertsPanel'
import { ReportsModal } from './components/modals/ReportsModal'
import { useSiloStore } from './store/useSiloStore'

type ModalKind = 'settings' | 'alerts' | 'reports' | null

export default function App() {
  const [activeRail, setActiveRail] = useState('dashboard')
  const [modal, setModal] = useState<ModalKind>(null)

  const tick = useSiloStore((s) => s.tick)
  const siloName = useSiloStore((s) => s.siloName)
  const alerts = useSiloStore((s) => s.alerts)

  useEffect(() => {
    const interval = setInterval(() => tick(), 2200)
    return () => clearInterval(interval)
  }, [tick])

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-(--color-panel)">
      <IconRail
        active={activeRail}
        onSelect={setActiveRail}
        onOpenSettings={() => setModal('settings')}
        onOpenReports={() => setModal('reports')}
        onOpenAlerts={() => setModal('alerts')}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar siloName={siloName} alertCount={alerts.length} onOpenAlerts={() => setModal('alerts')} onOpenSettings={() => setModal('settings')} />

        <div className="flex min-h-0 flex-1">
          <LeftPanel onOpenReports={() => setModal('reports')} onOpenSettings={() => setModal('settings')} onOpenAlerts={() => setModal('alerts')} />
          <main className="min-w-0 flex-1">
            <SiloCanvas />
          </main>
        </div>
      </div>

      {modal === 'settings' && <SettingsModal onClose={() => setModal(null)} />}
      {modal === 'alerts' && <AlertsPanel onClose={() => setModal(null)} />}
      {modal === 'reports' && <ReportsModal onClose={() => setModal(null)} />}
    </div>
  )
}
