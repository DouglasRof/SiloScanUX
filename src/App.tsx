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
import { HistoryModal } from './components/modals/HistoryModal'
import { AccountModal } from './components/modals/AccountModal'
import { useSiloStore } from './store/useSiloStore'
import { useTheme } from './hooks/useTheme'

type ModalKind = 'settings' | 'create-silo' | 'alerts' | 'reports' | 'history' | 'account' | null

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
  const alerts = useSiloStore((s) => s.alerts)
  const silos = useSiloStore((s) => s.silos)
  const activeSiloId = useSiloStore((s) => s.siloId)
  const switchToSilo = useSiloStore((s) => s.switchToSilo)
  const deleteSilo = useSiloStore((s) => s.deleteSilo)

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
    <div className="flex h-screen w-screen overflow-hidden bg-(--color-panel) pb-14 sm:pb-0">
      <IconRail
        active={activeRail}
        alertCount={alerts.length}
        onSelect={setActiveRail}
        onOpenSettings={() => setModal('settings')}
        onOpenReports={() => setModal('reports')}
        onOpenAlerts={() => setModal('alerts')}
        onOpenHistory={() => setModal('history')}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar
          silos={silos}
          activeSiloId={activeSiloId}
          onSwitchSilo={switchToSilo}
          onCreateSilo={() => setModal('create-silo')}
          onDeleteSilo={deleteSilo}
          theme={theme}
          onToggleTheme={toggleTheme}
          onOpenAccount={() => setModal('account')}
          onLogout={handleLogout}
        />

        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto sm:flex-row sm:overflow-hidden">
          <LeftPanel onOpenHistory={() => setModal('history')} />
          <main className="relative order-1 h-[42vh] w-full shrink-0 sm:order-none sm:h-auto sm:w-auto sm:min-w-0 sm:flex-1 sm:shrink">
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

      {modal === 'settings' && <SettingsModal mode="edit" onClose={() => setModal(null)} />}
      {modal === 'create-silo' && <SettingsModal mode="create" onClose={() => setModal(null)} />}
      {modal === 'alerts' && <AlertsPanel onClose={() => setModal(null)} />}
      {modal === 'reports' && <ReportsModal onClose={() => setModal(null)} />}
      {modal === 'history' && <HistoryModal onClose={() => setModal(null)} />}
      {modal === 'account' && <AccountModal onClose={() => setModal(null)} />}
    </div>
  )
}
