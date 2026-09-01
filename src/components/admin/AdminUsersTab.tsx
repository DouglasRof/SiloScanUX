import { useEffect, useState } from 'react'
import type { AdminUserRow } from '../../types/silo'
import { adminApproveUsername, adminListUsers, adminRejectUsername, adminSendPasswordReset, adminSetUserBlocked, adminSetUserRole } from '../../lib/admin'

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
        <table className="w-full min-w-[760px] text-left text-[13px]">
          <thead className="bg-(--color-panel-soft) text-[11px] font-bold uppercase tracking-wide text-(--color-ink-faint)">
            <tr>
              <th className="px-3 py-2">Nome</th>
              <th className="px-3 py-2">ID de usuário</th>
              <th className="px-3 py-2">E-mail</th>
              <th className="px-3 py-2">Papel</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2">Ações</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-t border-(--color-line)">
                <td className="px-3 py-2 font-medium text-(--color-ink)">{u.fullName ?? '—'}</td>
                <td className="px-3 py-2 text-(--color-ink-soft)">
                  {u.username ?? '—'}
                  {u.pendingUsername && (
                    <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
                      <span className="rounded-full bg-(--color-warn-soft) px-2 py-0.5 text-[11px] font-bold text-(--color-warn)">
                        → {u.pendingUsername} (pendente)
                      </span>
                      <button
                        disabled={busyId === u.id}
                        onClick={() => withBusy(u.id, () => adminApproveUsername(u.id), 'Troca de ID de usuário aprovada.')}
                        className="rounded-md bg-(--color-good-soft) px-1.5 py-0.5 text-[11px] font-bold text-(--color-good) disabled:opacity-50"
                      >
                        Aprovar
                      </button>
                      <button
                        disabled={busyId === u.id}
                        onClick={() => withBusy(u.id, () => adminRejectUsername(u.id), 'Troca de ID de usuário rejeitada.')}
                        className="rounded-md bg-(--color-danger-soft) px-1.5 py-0.5 text-[11px] font-bold text-(--color-danger) disabled:opacity-50"
                      >
                        Rejeitar
                      </button>
                    </div>
                  )}
                </td>
                <td className="px-3 py-2 text-(--color-ink-soft)">{u.email ?? '—'}</td>
                <td className="px-3 py-2">
                  <span
                    className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${
                      u.role === 'admin' ? 'bg-(--color-brand-soft) text-(--color-brand-dark)' : 'bg-(--color-panel-soft) text-(--color-ink-faint)'
                    }`}
                  >
                    {u.role === 'admin' ? 'Admin' : 'Usuário'}
                  </span>
                </td>
                <td className="px-3 py-2">
                  <span
                    className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${
                      u.blocked ? 'bg-(--color-danger-soft) text-(--color-danger)' : 'bg-(--color-good-soft) text-(--color-good)'
                    }`}
                  >
                    {u.blocked ? 'Bloqueado' : 'Ativo'}
                  </span>
                </td>
                <td className="px-3 py-2">
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      disabled={busyId === u.id}
                      onClick={() => withBusy(u.id, () => adminSetUserRole(u.id, u.role === 'admin' ? 'user' : 'admin'), 'Papel atualizado.')}
                      className="rounded-lg border border-(--color-line) px-2 py-1 text-[11px] font-semibold text-(--color-ink-soft) hover:bg-(--color-panel-soft) disabled:opacity-50"
                    >
                      {u.role === 'admin' ? 'Remover admin' : 'Tornar admin'}
                    </button>
                    <button
                      disabled={busyId === u.id}
                      onClick={() => withBusy(u.id, () => adminSetUserBlocked(u.id, !u.blocked), u.blocked ? 'Usuário desbloqueado.' : 'Usuário bloqueado.')}
                      className="rounded-lg border border-(--color-line) px-2 py-1 text-[11px] font-semibold text-(--color-ink-soft) hover:bg-(--color-panel-soft) disabled:opacity-50"
                    >
                      {u.blocked ? 'Desbloquear' : 'Bloquear'}
                    </button>
                    <button
                      disabled={busyId === u.id || !u.email}
                      onClick={() => withBusy(u.id, () => adminSendPasswordReset(u.email as string), 'E-mail de redefinição enviado.')}
                      className="rounded-lg border border-(--color-line) px-2 py-1 text-[11px] font-semibold text-(--color-ink-soft) hover:bg-(--color-panel-soft) disabled:opacity-50"
                    >
                      Redefinir senha
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
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
