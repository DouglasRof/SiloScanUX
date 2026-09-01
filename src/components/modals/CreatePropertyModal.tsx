import { useState } from 'react'
import { useSiloStore } from '../../store/useSiloStore'
import { TEXT_INPUT_CLASS } from '../../lib/formStyles'
import { Modal } from './Modal'

const inputClass = `${TEXT_INPUT_CLASS} px-2.5 py-1.5`

export function CreatePropertyModal({ onClose }: { onClose: () => void }) {
  const createProperty = useSiloStore((s) => s.createProperty)
  const [nome, setNome] = useState('')
  const [status, setStatus] = useState<'idle' | 'saving' | 'error'>('idle')

  async function handleCreate() {
    const trimmed = nome.trim()
    if (!trimmed) return
    setStatus('saving')
    const ok = await createProperty(trimmed)
    if (ok) {
      onClose()
      return
    }
    setStatus('error')
  }

  return (
    <Modal title="Nova propriedade" onClose={onClose} width={400} closeOnBackdropClick={false}>
      <div className="flex flex-col gap-4">
        <label className="flex flex-col gap-1">
          <span className="text-[11px] font-bold tracking-wide text-(--color-ink-faint)">NOME DA PROPRIEDADE</span>
          <input
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            placeholder="Fazenda Santa Rita"
            className={inputClass}
            onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
          />
        </label>
        <p className="text-[11px] text-(--color-ink-faint)">Já vem com um silo padrão — dá pra editar ou trocar o modelo depois.</p>

        <div className="flex items-center gap-3">
          <button
            onClick={handleCreate}
            disabled={!nome.trim() || status === 'saving'}
            className="rounded-lg bg-(--color-brand) px-4 py-2 text-xs font-bold text-white transition-colors hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {status === 'saving' ? 'Criando…' : 'Criar propriedade'}
          </button>
          {status === 'error' && (
            <span className="text-xs font-semibold text-(--color-danger)" role="alert">
              Não foi possível criar. Tente novamente.
            </span>
          )}
        </div>
      </div>
    </Modal>
  )
}
