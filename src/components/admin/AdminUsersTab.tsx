import { useEffect, useState } from 'react'
import type { AdminUserRow } from '../../types/silo'
import { adminApproveUsername, adminListUsers, adminRejectUsername, adminSendPasswordReset, adminSetUserBlocked, adminSetUserRole } from '../../lib/admin'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table'

export function AdminUsersTab() {
  const [users, setUsers] = useState<AdminUserRow[] | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<string | null>(null)

  async function reload() {
    setUsers(await adminListUsers())
  }

  useEffect(() => {
    reload()
  }, [])

  async function withBusy(id: string, action: () => Promise<boolean>, message: string) {
    setBusyId(id)
    setFeedback(null)
    const ok = await action()
    setFeedback(ok ? message : 'Não foi possível concluir. Tente novamente.')
    if (ok) await reload()
    setBusyId(null)
  }

  if (users === null) {
    return <p className="text-sm text-(--color-ink-faint)">Carregando usuários…</p>
  }

  if (users.length === 0) {
    return <p className="text-sm text-(--color-ink-faint)">Nenhum usuário encontrado.</p>
  }

  const pendingCount = users.filter((u) => u.pendingUsername).length

  return (
    <div className="flex flex-col gap-3">
      {feedback && (
        <p className="text-[12px] font-semibold text-(--color-ink-soft)" role="status">
          {feedback}
        </p>
      )}

      {pendingCount > 0 && (
        <p className="text-[12px] font-semibold text-(--color-warn)">
          {pendingCount} {pendingCount === 1 ? 'troca de ID de usuário pendente' : 'trocas de ID de usuário pendentes'} — veja a coluna "ID de usuário".
        </p>
      )}

      <div className="overflow-x-auto rounded-xl border border-(--color-line)">
        <Table className="min-w-[760px] text-[13px]">
          <TableHeader className="bg-(--color-panel-soft) text-[11px] font-bold uppercase tracking-wide text-(--color-ink-faint)">
            <TableRow className="border-0 hover:bg-transparent">
              <TableHead className="h-auto px-3 py-2 text-(--color-ink-faint)">Nome</TableHead>
              <TableHead className="h-auto px-3 py-2 text-(--color-ink-faint)">ID de usuário</TableHead>
              <TableHead className="h-auto px-3 py-2 text-(--color-ink-faint)">E-mail</TableHead>
              <TableHead className="h-auto px-3 py-2 text-(--color-ink-faint)">Papel</TableHead>
              <TableHead className="h-auto px-3 py-2 text-(--color-ink-faint)">Status</TableHead>
              <TableHead className="h-auto px-3 py-2 text-(--color-ink-faint)">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((u) => (
              <TableRow key={u.id} className="border-t border-(--color-line) hover:bg-transparent">
                <TableCell className="px-3 py-2 font-medium text-(--color-ink)">{u.fullName ?? '—'}</TableCell>
                <TableCell className="px-3 py-2 text-(--color-ink-soft)">
                  {u.username ?? '—'}
                  {u.pendingUsername && (
                    <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
                      <Badge className="h-auto rounded-full bg-(--color-warn-soft) px-2 py-0.5 text-[11px] font-bold text-(--color-warn)">
                        → {u.pendingUsername} (pendente)
                      </Badge>
                      <Button
                        disabled={busyId === u.id}
                        onClick={() => withBusy(u.id, () => adminApproveUsername(u.id), 'Troca de ID de usuário aprovada.')}
                        className="h-auto rounded-md bg-(--color-good-soft) px-1.5 py-0.5 text-[11px] font-bold text-(--color-good) hover:bg-(--color-good-soft) disabled:opacity-50"
                      >
                        Aprovar
                      </Button>
                      <Button
                        disabled={busyId === u.id}
                        onClick={() => withBusy(u.id, () => adminRejectUsername(u.id), 'Troca de ID de usuário rejeitada.')}
                        className="h-auto rounded-md bg-(--color-danger-soft) px-1.5 py-0.5 text-[11px] font-bold text-(--color-danger) hover:bg-(--color-danger-soft) disabled:opacity-50"
                      >
                        Rejeitar
                      </Button>
                    </div>
                  )}
                </TableCell>
                <TableCell className="px-3 py-2 text-(--color-ink-soft)">{u.email ?? '—'}</TableCell>
                <TableCell className="px-3 py-2">
                  <Badge
                    className={`h-auto rounded-full px-2 py-0.5 text-[11px] font-bold ${
                      u.role === 'admin' ? 'bg-(--color-navy-soft) text-(--color-navy)' : 'bg-(--color-panel-soft) text-(--color-ink-faint)'
                    }`}
                  >
                    {u.role === 'admin' ? 'Admin' : 'Usuário'}
                  </Badge>
                </TableCell>
                <TableCell className="px-3 py-2">
                  <Badge
                    className={`h-auto rounded-full px-2 py-0.5 text-[11px] font-bold ${
                      u.blocked ? 'bg-(--color-danger-soft) text-(--color-danger)' : 'bg-(--color-good-soft) text-(--color-good)'
                    }`}
                  >
                    {u.blocked ? 'Bloqueado' : 'Ativo'}
                  </Badge>
                </TableCell>
                <TableCell className="px-3 py-2">
                  <div className="flex flex-wrap gap-1.5">
                    <Button
                      variant="outline"
                      disabled={busyId === u.id}
                      onClick={() => withBusy(u.id, () => adminSetUserRole(u.id, u.role === 'admin' ? 'user' : 'admin'), 'Papel atualizado.')}
                      className="h-auto rounded-lg px-2 py-1 text-[11px] font-semibold text-(--color-ink-soft)"
                    >
                      {u.role === 'admin' ? 'Remover admin' : 'Tornar admin'}
                    </Button>
                    <Button
                      variant="outline"
                      disabled={busyId === u.id}
                      onClick={() => withBusy(u.id, () => adminSetUserBlocked(u.id, !u.blocked), u.blocked ? 'Usuário desbloqueado.' : 'Usuário bloqueado.')}
                      className="h-auto rounded-lg px-2 py-1 text-[11px] font-semibold text-(--color-ink-soft)"
                    >
                      {u.blocked ? 'Desbloquear' : 'Bloquear'}
                    </Button>
                    <Button
                      variant="outline"
                      disabled={busyId === u.id || !u.email}
                      onClick={() => withBusy(u.id, () => adminSendPasswordReset(u.email as string), 'E-mail de redefinição enviado.')}
                      className="h-auto rounded-lg px-2 py-1 text-[11px] font-semibold text-(--color-ink-soft)"
                    >
                      Redefinir senha
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <p className="text-[11px] text-(--color-ink-faint)">
        Definir o ID de usuário por primeira vez é imediato; trocar um que já existe fica pendente aqui até aprovar ou rejeitar.
        "Bloquear" impede o uso do app (a sessão é encerrada ao carregar) — não é um banimento no Supabase Auth, que exigiria a
        service_role key fora do frontend. "Redefinir senha" manda o e-mail padrão do Supabase; não é possível definir a senha
        diretamente pelo back office pelo mesmo motivo.
      </p>
    </div>
  )
}
