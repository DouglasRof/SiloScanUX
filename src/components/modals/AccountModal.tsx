import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { useSiloStore } from '../../store/useSiloStore'
import { Modal } from './Modal'

export function AccountModal({ onClose }: { onClose: () => void }) {
  const [email, setEmail] = useState<string | null>(null)
  const [exportStatus, setExportStatus] = useState<'idle' | 'exporting' | 'error'>('idle')
  const [confirmText, setConfirmText] = useState('')
  const [deleteStatus, setDeleteStatus] = useState<'idle' | 'deleting' | 'error'>('idle')

  const exportMyData = useSiloStore((s) => s.exportMyData)
  const deleteMyAccount = useSiloStore((s) => s.deleteMyAccount)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? null))
  }, [])

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

        <div className="rounded-xl border border-(--color-line) p-3.5">
          <p className="mb-1 text-[11px] font-bold tracking-wide text-(--color-ink-faint)">EXPORTAR MEUS DADOS</p>
          <p className="mb-2 text-[11px] text-(--color-ink-faint)">
            Baixa um arquivo com todos os seus silos, leituras e histórico — seu direito de portabilidade (LGPD, art. 18).
          </p>
          <button
            onClick={handleExport}
            disabled={exportStatus === 'exporting'}
            className="rounded-lg bg-(--color-brand-soft) px-3 py-1.5 text-xs font-semibold text-(--color-brand-dark) disabled:cursor-wait disabled:opacity-60"
          >
            {exportStatus === 'exporting' ? 'Exportando…' : 'Exportar meus dados (.json)'}
          </button>
          {exportStatus === 'error' && <p className="mt-2 text-[11px] font-medium text-(--color-danger)">Não foi possível exportar. Tente novamente.</p>}
        </div>

        <div className="rounded-xl border border-(--color-danger) bg-(--color-danger-soft) p-3.5">
          <p className="mb-1 text-[11px] font-bold tracking-wide text-(--color-danger)">EXCLUIR MINHA CONTA</p>
          <p className="mb-2 text-[11px] text-(--color-ink-soft)">
            Apaga permanentemente sua conta, todos os silos e todo o histórico associado. Não pode ser desfeito.
          </p>
          <label className="mb-2 flex flex-col gap-1">
            <span className="text-[11px] text-(--color-ink-faint)">Digite EXCLUIR para confirmar</span>
            <input
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              className="rounded-lg border border-(--color-line) bg-(--color-panel) px-2.5 py-1.5 text-sm"
              placeholder="EXCLUIR"
            />
          </label>
          <button
            onClick={handleDelete}
            disabled={!canDelete || deleteStatus === 'deleting'}
            className="rounded-lg bg-(--color-danger) px-3 py-1.5 text-xs font-bold text-white transition-colors hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {deleteStatus === 'deleting' ? 'Excluindo…' : 'Excluir minha conta definitivamente'}
          </button>
          {deleteStatus === 'error' && <p className="mt-2 text-[11px] font-medium text-(--color-danger)">Não foi possível excluir a conta. Tente novamente.</p>}
        </div>
      </div>
    </Modal>
  )
}
