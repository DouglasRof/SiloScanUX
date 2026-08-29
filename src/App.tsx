import { useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { LoginScreen } from './components/auth/LoginScreen'
import { supabase } from './lib/supabaseClient'
import { ErrorBoundary } from './components/ErrorBoundary'
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

function Silo3DErrorFallback({ onRetry, onSwitchTo2D }: { onRetry: () => void; onSwitchTo2D: () => void }) {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-3 bg-linear-to-b from-(--color-app-from) to-(--color-app-to) p-6 text-center">
      <p className="text-sm font-semibold text-(--color-ink)">A visualização 3D encontrou um problema.</p>
      <p className="max-w-xs text-xs text-(--color-ink-faint)">Os dados do silo continuam intactos — só a cena 3D travou.</p>
      <div className="flex gap-2">
        <button
          onClick={onRetry}
          className="rounded-lg bg-(--color-brand) px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:brightness-95"
        >
          Tentar novamente
        </button>
        <button
          onClick={onSwitchTo2D}
          className="rounded-lg border border-(--color-line) px-3 py-1.5 text-xs font-semibold text-(--color-ink-soft) hover:bg-(--color-panel-soft)"
        >
          Ver em 2D
        </button>
      </div>
    </div>
  )
}

export default function App() {
  // undefined = ainda checando a sessão existente; null = sem sessão (mostra login)
  const [session, setSession] = useState<Session | null | undefined>(undefined)
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

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, next) => setSession(next))
    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (session === undefined) return
    if (session) {
      useSiloStore.getState().loadOrCreateSiloConfig(session.user.id)
    } else {
      useSiloStore.getState().resetConfig()
    }
  }, [session])

  async function handleLogout() {
    setModal(null)
    setActiveRail('dashboard')
    await supabase.auth.signOut()
  }

  if (session === undefined) {
    return <div className="h-screen w-screen bg-(--color-panel)" />
  }

  if (session === null) {
    return <LoginScreen />
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
        <TopBar siloName={siloName} theme={theme} onToggleTheme={toggleTheme} onLogout={handleLogout} />

        <div className="flex min-h-0 flex-1">
          <LeftPanel />
          <main className="relative min-w-0 flex-1">
            {viewMode === '3d' ? (
              <ErrorBoundary
                fallback={(retry) => <Silo3DErrorFallback onRetry={retry} onSwitchTo2D={() => setViewMode('2d')} />}
              >
                <SiloCanvas />
              </ErrorBoundary>
            ) : (
              <Silo2DView />
            )}
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
