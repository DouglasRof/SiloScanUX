import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { useSiloStore } from '../../store/useSiloStore'
import { isValidUsername } from '../../lib/auth'
import { Modal } from './Modal'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'

export function AccountModal({ onClose }: { onClose: () => void }) {
  const [email, setEmail] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [username, setUsername] = useState('')
  // Persistente (não é um toast que some sozinho) — reflete profiles.pending_username
  // enquanto um admin não aprova ou rejeita a troca.
  const [pendingUsername, setPendingUsername] = useState<string | null>(null)
  const [usernameStatus, setUsernameStatus] = useState<'idle' | 'saving' | 'saved' | 'error' | 'taken'>('idle')
  const [exportStatus, setExportStatus] = useState<'idle' | 'exporting' | 'error'>('idle')
  const [confirmText, setConfirmText] = useState('')
  const [deleteStatus, setDeleteStatus] = useState<'idle' | 'deleting' | 'error'>('idle')

  const exportMyData = useSiloStore((s) => s.exportMyData)
  const deleteMyAccount = useSiloStore((s) => s.deleteMyAccount)

  useEffect(() => {
    let cancelled = false
    supabase.auth.getUser().then(({ data }) => {
      if (cancelled) return
      const user = data.user
      setEmail(user?.email ?? null)
      setUserId(user?.id ?? null)
      if (!user) return
      supabase
        .from('profiles')
        .select('username, pending_username')
        .eq('id', user.id)
        .single()
        .then(({ data: profile }) => {
          if (cancelled) return
          setUsername(profile?.username ?? '')
          setPendingUsername(profile?.pending_username ?? null)
        })
    })
    return () => {
      cancelled = true
    }
  }, [])

  // Volta pro estado neutro um tempo depois de mostrar o resultado, em vez de ficar preso ali.
  useEffect(() => {
    if (usernameStatus === 'idle' || usernameStatus === 'saving') return
    const timeout = setTimeout(() => setUsernameStatus('idle'), 2500)
    return () => clearTimeout(timeout)
  }, [usernameStatus])

  const usernameTouched = username.length > 0
  const usernameValid = isValidUsername(username)

  async function handleSaveUsername() {
    if (!userId || !usernameValid) return
    setUsernameStatus('saving')
    // RPC em vez de update direto: profiles não tem policy de UPDATE geral pra
    // usuário comum (de propósito — ver set_my_username em login_por_usuario.sql),
    // só essa porta estreita que troca unicamente o próprio username. Devolve
    // 'applied' (primeira vez, sem nada pra trocar) ou 'pending' (já tinha um —
    // fica esperando um admin aprovar).
    const { data, error } = await supabase.rpc('set_my_username', { p_username: username })
    if (error) {
      // Violação da constraint unique — mensagem específica em vez do erro genérico.
      setUsernameStatus(error.code === '23505' ? 'taken' : 'error')
      return
    }
    if (data === 'pending') {
      setPendingUsername(username)
      setUsernameStatus('idle')
      return
    }
    setPendingUsername(null)
    setUsernameStatus('saved')
  }

  async function handleExport() {
    setExportStatus('exporting')
    const data = await exportMyData()
    if (!data) {
      setExportStatus('error')
      return
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'siloscanux_meus_dados.json'
    link.click()
    URL.revokeObjectURL(url)
    setExportStatus('idle')
  }

  async function handleDelete() {
    setDeleteStatus('deleting')
    const ok = await deleteMyAccount()
    if (!ok) {
      setDeleteStatus('error')
      return
    }
    await supabase.auth.signOut()
  }

  const canDelete = confirmText.trim().toUpperCase() === 'EXCLUIR'

  return (
    <Modal title="Minha conta" onClose={onClose} width={440} closeOnBackdropClick={false}>
      <div className="flex flex-col gap-4">
        <div>
          <p className="text-[11px] font-bold tracking-wide text-(--color-ink-faint)">E-MAIL</p>
          <p className="text-sm font-semibold text-(--color-ink)">{email ?? '—'}</p>
        </div>

        <div className="flex flex-col gap-1">
          <Label htmlFor="account-username" className="text-[11px] font-bold tracking-wide text-(--color-ink-faint)">
            ID DE USUÁRIO
          </Label>
          <div className="flex gap-2">
            <Input id="account-username" value={username} onChange={(e) => setUsername(e.target.value.toLowerCase())} placeholder="joao.silva" />
            <Button
              onClick={handleSaveUsername}
              disabled={!usernameValid || usernameStatus === 'saving'}
              variant="secondary"
              className="h-auto shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold"
            >
              {usernameStatus === 'saving' ? 'Salvando…' : 'Salvar'}
            </Button>
          </div>
          {usernameTouched && !usernameValid && (
            <span className="text-[11px] text-(--color-danger)">3–24 caracteres: letras minúsculas, números, ponto ou underscore.</span>
          )}
          {pendingUsername ? (
            <span className="text-[11px] font-semibold text-(--color-warn)">Troca para "{pendingUsername}" enviada — aguardando aprovação de um admin.</span>
          ) : (
            <>
              {usernameStatus === 'saved' && <span className="text-[11px] font-semibold text-(--color-good)">Salvo — já dá pra entrar com esse ID.</span>}
              {usernameStatus === 'taken' && <span className="text-[11px] font-semibold text-(--color-danger)">Esse ID de usuário já está em uso.</span>}
              {usernameStatus === 'error' && <span className="text-[11px] font-semibold text-(--color-danger)">Não foi possível salvar. Tente novamente.</span>}
              {!usernameTouched && usernameStatus === 'idle' && (
                <span className="text-[11px] text-(--color-ink-faint)">Ainda não definido — alternativa ao e-mail para entrar.</span>
              )}
            </>
          )}
        </div>

        <div className="rounded-xl border border-(--color-line) p-3.5">
          <p className="mb-1 text-[11px] font-bold tracking-wide text-(--color-ink-faint)">EXPORTAR MEUS DADOS</p>
          <p className="mb-2 text-[11px] text-(--color-ink-faint)">
            Baixa um arquivo com todos os seus silos, leituras e histórico — seu direito de portabilidade (LGPD, art. 18).
          </p>
          <Button onClick={handleExport} disabled={exportStatus === 'exporting'} variant="secondary" className="h-auto rounded-lg px-3 py-1.5 text-xs font-semibold">
            {exportStatus === 'exporting' ? 'Exportando…' : 'Exportar meus dados (.json)'}
          </Button>
          {exportStatus === 'error' && <p className="mt-2 text-[11px] font-medium text-(--color-danger)">Não foi possível exportar. Tente novamente.</p>}
        </div>

        <div className="rounded-xl border border-(--color-danger) bg-(--color-danger-soft) p-3.5">
          <p className="mb-1 text-[11px] font-bold tracking-wide text-(--color-danger)">EXCLUIR MINHA CONTA</p>
          <p className="mb-2 text-[11px] text-(--color-ink-soft)">
            Apaga permanentemente sua conta, todos os silos e todo o histórico associado. Não pode ser desfeito.
          </p>
          <div className="mb-2 flex flex-col gap-1">
            <Label htmlFor="account-delete-confirm" className="text-[11px] text-(--color-ink-faint)">
              Digite EXCLUIR para confirmar
            </Label>
            <Input
              id="account-delete-confirm"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              className="bg-(--color-panel)"
              placeholder="EXCLUIR"
            />
          </div>
          <Button onClick={handleDelete} disabled={!canDelete || deleteStatus === 'deleting'} variant="destructive" className="h-auto rounded-lg px-3 py-1.5 text-xs font-bold">
            {deleteStatus === 'deleting' ? 'Excluindo…' : 'Excluir minha conta definitivamente'}
          </Button>
          {deleteStatus === 'error' && <p className="mt-2 text-[11px] font-medium text-(--color-danger)">Não foi possível excluir a conta. Tente novamente.</p>}
        </div>
      </div>
    </Modal>
  )
}
