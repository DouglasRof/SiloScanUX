import { AdminUsersTab } from './AdminUsersTab'
import { AdminPropertiesTab } from './AdminPropertiesTab'
import { AdminDeviceKeysTab } from './AdminDeviceKeysTab'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'

const TABS = [
  { id: 'usuarios', label: 'Usuários' },
  { id: 'propriedades', label: 'Propriedades & Silos' },
  { id: 'chaves', label: 'Chaves de Sensor' },
] as const

export function AdminBackOffice() {
  return (
    <div className="flex h-full w-full flex-col overflow-y-auto bg-(--color-panel-soft) p-4 sm:p-6">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-4">
        <div>
          <h1 className="text-lg font-bold text-(--color-ink)">Back office</h1>
          <p className="text-[12px] text-(--color-ink-faint)">Funções administrativas — visíveis só para contas com papel "admin".</p>
        </div>

        <Tabs defaultValue="usuarios">
          <TabsList className="h-auto w-full gap-1 bg-(--color-panel) p-1 shadow-sm">
            {TABS.map((t) => (
              <TabsTrigger
                key={t.id}
                value={t.id}
                className="h-auto flex-1 rounded-lg py-1.5 text-[12px] font-bold text-(--color-ink-soft) data-active:bg-(--color-navy) data-active:text-white data-active:shadow-none"
              >
                {t.label}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="usuarios" className="rounded-2xl border border-(--color-line) bg-(--color-panel) p-4">
            <AdminUsersTab />
          </TabsContent>
          <TabsContent value="propriedades" className="rounded-2xl border border-(--color-line) bg-(--color-panel) p-4">
            <AdminPropertiesTab />
          </TabsContent>
          <TabsContent value="chaves" className="rounded-2xl border border-(--color-line) bg-(--color-panel) p-4">
            <AdminDeviceKeysTab />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
