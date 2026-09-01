import { useState } from 'react'
import { useSiloStore } from '../../store/useSiloStore'
import { Modal } from './Modal'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'

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
        <div className="flex flex-col gap-1">
          <Label htmlFor="property-name" className="text-[11px] font-bold tracking-wide text-(--color-ink-faint)">
            NOME DA PROPRIEDADE
          </Label>
          <Input
            id="property-name"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            placeholder="Fazenda Santa Rita"
            onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
          />
        </div>
        <p className="text-[11px] text-(--color-ink-faint)">Já vem com um silo padrão — dá pra editar ou trocar o modelo depois.</p>

        <div className="flex items-center gap-3">
          <Button onClick={handleCreate} disabled={!nome.trim() || status === 'saving'} className="h-auto rounded-lg px-4 py-2 text-xs font-bold">
            {status === 'saving' ? 'Criando…' : 'Criar propriedade'}
          </Button>
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
