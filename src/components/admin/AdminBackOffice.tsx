import { useState } from 'react'
import { AdminUsersTab } from './AdminUsersTab'
import { AdminPropertiesTab } from './AdminPropertiesTab'
import { AdminDeviceKeysTab } from './AdminDeviceKeysTab'

const TABS = [
  { id: 'usuarios', label: 'Usuários' },
  { id: 'propriedades', label: 'Propriedades & Silos' },
  { id: 'chaves', label: 'Chaves de Sensor' },
] as const

type TabId = (typeof TABS)[number]['id']

export function AdminBackOffice() {
  const [tab, setTab] = useState<TabId>('usuarios')

  return (
    <div className="flex h-full w-full flex-col overflow-y-auto bg-(--color-panel-soft) p-4 sm:p-6">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-4">
        <div>
          <h1 className="text-lg font-bold text-(--color-ink)">Back office</h1>
          <p className="text-[12px] text-(--color-ink-faint)">Funções administrativas — visíveis só para contas com papel "admin".</p>
        </div>

        <div className="flex gap-1 rounded-lg bg-(--color-panel) p-1 shadow-sm">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex-1 rounded-lg py-1.5 text-[12px] font-bold transition-colors ${
                tab === t.id ? 'bg-(--color-brand) text-white' : 'text-(--color-ink-soft) hover:bg-(--color-panel-soft)'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="rounded-2xl border border-(--color-line) bg-(--color-panel) p-4">
          {tab === 'usuarios' && <AdminUsersTab />}
          {tab === 'propriedades' && <AdminPropertiesTab />}
          {tab === 'chaves' && <AdminDeviceKeysTab />}
        </div>
      </div>
    </div>
  )
}
