import { useEffect, useState } from 'react'
import type { DeviceApiKeyRow } from '../../types/silo'
import { adminCreateDeviceKey, adminListDeviceKeys, adminRevokeDeviceKey } from '../../lib/admin'

export function AdminDeviceKeysTab() {
  const [keys, setKeys] = useState<DeviceApiKeyRow[] | null>(null)
  const [label, setLabel] = useState('')
  const [creating, setCreating] = useState(false)
  const [justCreated, setJustCreated] = useState<DeviceApiKeyRow | null>(null)

  async function reload() {
    setKeys(await adminListDeviceKeys())
  }

  useEffect(() => {
    reload()
  }, [])

  async function handleCreate() {
    const trimmed = label.trim()
    if (!trimmed) return
    setCreating(true)
    const created = await adminCreateDeviceKey(trimmed)
    setCreating(false)
    if (created) {
      setJustCreated(created)
      setLabel('')
      await reload()
    }
  }

  async function handleRevoke(id: string) {
    await adminRevokeDeviceKey(id)
    await reload()
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-xl border border-(--color-line) bg-(--color-panel-soft) p-3.5">
        <p className="mb-2 text-[11px] font-bold tracking-wide text-(--color-ink-faint)">NOVA CHAVE</p>
        <div className="flex gap-2">
          <input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="Rótulo (ex: silo-galpao-2)"
            className="flex-1 rounded-lg border border-(--color-line) bg-(--color-panel) px-2.5 py-1.5 text-sm text-(--color-ink) outline-none focus:border-(--color-brand)"
          />
          <button
            onClick={handleCreate}
            disabled={!label.trim() || creating}
            className="rounded-lg bg-(--color-brand) px-3 py-1.5 text-xs font-bold text-white hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {creating ? 'Criando…' : 'Criar chave'}
          </button>
        </div>
        {justCreated && (
          <div className="mt-3 rounded-lg border border-(--color-warn) bg-(--color-warn-soft) p-2.5">
            <p className="text-[11px] font-bold text-(--color-warn)">Guarde esta chave agora — ela não aparece de novo depois:</p>
            <code className="mt-1 block break-all rounded-md bg-(--color-panel) px-2 py-1 text-[12px] text-(--color-ink)">{justCreated.apiKey}</code>
          </div>
        )}
      </div>

      {keys === null ? (
        <p className="text-sm text-(--color-ink-faint)">Carregando chaves…</p>
      ) : keys.length === 0 ? (
        <p className="text-sm text-(--color-ink-faint)">Nenhuma chave criada ainda.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-(--color-line)">
          <table className="w-full min-w-[480px] text-left text-[13px]">
            <thead className="bg-(--color-panel-soft) text-[11px] font-bold uppercase tracking-wide text-(--color-ink-faint)">
              <tr>
                <th className="px-3 py-2">Rótulo</th>
                <th className="px-3 py-2">Criada em</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Ações</th>
              </tr>
            </thead>
            <tbody>
              {keys.map((k) => (
                <tr key={k.id} className="border-t border-(--color-line)">
                  <td className="px-3 py-2 font-medium text-(--color-ink)">{k.label}</td>
                  <td className="px-3 py-2 text-(--color-ink-soft)">{new Date(k.createdAt).toLocaleDateString('pt-BR')}</td>
                  <td className="px-3 py-2">
                    <span
                      className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${
                        k.revokedAt ? 'bg-(--color-danger-soft) text-(--color-danger)' : 'bg-(--color-good-soft) text-(--color-good)'
                      }`}
                    >
                      {k.revokedAt ? 'Revogada' : 'Ativa'}
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    {!k.revokedAt && (
                      <button
                        onClick={() => handleRevoke(k.id)}
                        className="rounded-lg border border-(--color-line) px-2 py-1 text-[11px] font-semibold text-(--color-ink-soft) hover:bg-(--color-danger-soft) hover:text-(--color-danger)"
                      >
                        Revogar
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p className="text-[11px] text-(--color-ink-faint)">
        Chave de API por dispositivo, usada pela função <code>ingest_scan</code> (o sensor de campo não tem login de usuário).
        Uma chave válida hoje grava leituras em qualquer silo — ainda não existe vínculo dispositivo → silo (ver
        BACKEND_HANDOFF.md).
      </p>
    </div>
  )
}
