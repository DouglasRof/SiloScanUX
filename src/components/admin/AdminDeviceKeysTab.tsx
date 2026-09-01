import { useEffect, useState } from 'react'
import type { DeviceApiKeyRow } from '../../types/silo'
import { adminCreateDeviceKey, adminListDeviceKeys, adminRevokeDeviceKey } from '../../lib/admin'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Badge } from '../ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table'

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
          <Input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Rótulo (ex: silo-galpao-2)" className="flex-1 bg-(--color-panel)" />
          <Button onClick={handleCreate} disabled={!label.trim() || creating} className="h-auto shrink-0 rounded-lg px-3 py-1.5 text-xs font-bold">
            {creating ? 'Criando…' : 'Criar chave'}
          </Button>
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
          <Table className="min-w-[480px] text-[13px]">
            <TableHeader className="bg-(--color-panel-soft) text-[11px] font-bold uppercase tracking-wide text-(--color-ink-faint)">
              <TableRow className="border-0 hover:bg-transparent">
                <TableHead className="h-auto px-3 py-2 text-(--color-ink-faint)">Rótulo</TableHead>
                <TableHead className="h-auto px-3 py-2 text-(--color-ink-faint)">Criada em</TableHead>
                <TableHead className="h-auto px-3 py-2 text-(--color-ink-faint)">Status</TableHead>
                <TableHead className="h-auto px-3 py-2 text-(--color-ink-faint)">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {keys.map((k) => (
                <TableRow key={k.id} className="border-t border-(--color-line) hover:bg-transparent">
                  <TableCell className="px-3 py-2 font-medium text-(--color-ink)">{k.label}</TableCell>
                  <TableCell className="px-3 py-2 text-(--color-ink-soft)">{new Date(k.createdAt).toLocaleDateString('pt-BR')}</TableCell>
                  <TableCell className="px-3 py-2">
                    <Badge
                      className={`h-auto rounded-full px-2 py-0.5 text-[11px] font-bold ${
                        k.revokedAt ? 'bg-(--color-danger-soft) text-(--color-danger)' : 'bg-(--color-good-soft) text-(--color-good)'
                      }`}
                    >
                      {k.revokedAt ? 'Revogada' : 'Ativa'}
                    </Badge>
                  </TableCell>
                  <TableCell className="px-3 py-2">
                    {!k.revokedAt && (
                      <Button
                        variant="outline"
                        onClick={() => handleRevoke(k.id)}
                        className="h-auto rounded-lg px-2 py-1 text-[11px] font-semibold text-(--color-ink-soft) hover:bg-(--color-danger-soft) hover:text-(--color-danger)"
                      >
                        Revogar
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
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
