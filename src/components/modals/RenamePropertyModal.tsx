import { useEffect, useRef, useState, type FormEvent } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { useSiloStore } from '../../store/useSiloStore'
import { TEXT_INPUT_CLASS } from '../../lib/formStyles'
import { Modal } from './Modal'

const inputClass = `${TEXT_INPUT_CLASS} px-2.5 py-1.5`

interface RenamePropertyModalProps {
  propertyId: string
  currentName: string
  onClose: () => void
}

export function RenamePropertyModal({ propertyId, currentName, onClose }: RenamePropertyModalProps) {
  const renameProperty = useSiloStore((s) => s.renameProperty)
  const [nome, setNome] = useState(currentName)
  const [password, setPassword] = useState('')
  const [status, setStatus] = useState<'idle' | 'saving' | 'wrong-password' | 'error'>('idle')
  // `currentName` é um snapshot tirado quando o modal abriu (App.tsx). Se o nome
  // mudar em outra aba/dispositivo enquanto este modal segue aberto, acompanha —
  // mas só enquanto o usuário não tiver editado o campo, pra não sobrescrever o
  // que ele já está digitando.
  const syncedNameRef = useRef(currentName)
  useEffect(() => {
    if (currentName !== syncedNameRef.current) {
      setNome((prev) => (prev === syncedNameRef.current ? currentName : prev))
      syncedNameRef.current = currentName
    }
  }, [currentName])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const trimmed = nome.trim()
    if (!trimmed || !password) return
    setStatus('saving')

    // Não existe "verificar senha" direto na API do Supabase — logar de novo com o
    // e-mail da própria sessão é o jeito padrão de confirmar a senha atual antes de
    // uma ação sensível (o SDK só troca o token da sessão, não afeta nada além disso).
    const { data: userData } = await supabase.auth.getUser()
    const email = userData.user?.email
    if (!email) {
      setStatus('error')
      return
    }

    const { error: authError } = await supabase.auth.signInWithPassword({ email, password })
    if (authError) {
      setStatus('wrong-password')
      return
    }

    const ok = await renameProperty(propertyId, trimmed)
    setStatus(ok ? 'idle' : 'error')
    if (ok) onClose()
  }

  return (
    <Modal title="Renomear propriedade" onClose={onClose} width={400} closeOnBackdropClick={false}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1">
          <span className="text-[11px] font-bold tracking-wide text-(--color-ink-faint)">NOVO NOME</span>
          <input value={nome} onChange={(e) => setNome(e.target.value)} className={inputClass} />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-[11px] font-bold tracking-wide text-(--color-ink-faint)">CONFIRME SUA SENHA</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className={inputClass}
            autoComplete="current-password"
          />
          <span className="text-[11px] text-(--color-ink-faint)">Renomear uma propriedade é uma mudança sensível — confirme com sua senha atual.</span>
        </label>

        {status === 'wrong-password' && (
          <p className="text-[12px] font-medium text-(--color-danger)" role="alert">
            Senha incorreta.
          </p>
        )}
        {status === 'error' && (
          <p className="text-[12px] font-medium text-(--color-danger)" role="alert">
            Não foi possível renomear. Tente novamente.
          </p>
        )}

        <button
          type="submit"
          disabled={!nome.trim() || !password || status === 'saving'}
          className="rounded-xl bg-(--color-brand) py-2.5 text-[14px] font-bold text-white transition-colors hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {status === 'saving' ? 'Confirmando…' : 'Salvar novo nome'}
        </button>
      </form>
    </Modal>
  )
}
