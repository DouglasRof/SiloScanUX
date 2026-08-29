import { useState, type FormEvent } from 'react'
import logoUrl from '../../assets/inovagrotec-logo.jpg'
import { TEXT_INPUT_CLASS } from '../../lib/formStyles'
import { supabase } from '../../lib/supabaseClient'

const inputClass = `${TEXT_INPUT_CLASS} px-3 py-2`

function authErrorMessage(message: string): string {
  if (message.includes('Invalid login credentials')) return 'E-mail ou senha incorretos.'
  if (message.includes('Email not confirmed')) return 'Confirme seu e-mail antes de entrar.'
  return 'Não foi possível entrar. Tente novamente em instantes.'
}

// A sessão do Supabase já persiste em localStorage por padrão — "Lembrar de mim"
// ainda não altera esse comportamento, é só a UI por enquanto.
export function LoginScreen() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setIsSubmitting(true)
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })
    setIsSubmitting(false)
    if (signInError) {
      console.error('Supabase signInWithPassword falhou:', signInError)
      setError(authErrorMessage(signInError.message))
    }
    // Em caso de sucesso, o App ouve onAuthStateChange e troca de tela sozinho.
  }

  return (
    <div className="flex h-screen w-screen items-center justify-center bg-linear-to-b from-(--color-app-from) to-(--color-app-to) p-4">
      <div className="w-full max-w-[380px] rounded-2xl border border-(--color-line) bg-(--color-panel) p-8 shadow-[0_8px_30px_rgba(16,40,60,0.16)]">
        <div className="flex flex-col items-center gap-2">
          {/* Zoomed slightly past 100% to crop the stray 1-2px border on the source file's
              right/bottom edges (a leftover from however the original was captured). */}
          <div
            role="img"
            aria-label="InovAgroTec"
            className="h-24 w-24 rounded-xl"
            style={{ backgroundImage: `url(${logoUrl})`, backgroundSize: '106% 106%', backgroundPosition: 'center', backgroundRepeat: 'no-repeat' }}
          />
          <p className="text-center text-[13px] text-(--color-ink-faint)">Monitoramento inteligente de silos</p>
        </div>

        <form onSubmit={handleSubmit} className="mt-7 flex flex-col gap-3.5">
          <label className="flex flex-col gap-1">
            <span className="text-[11px] font-bold tracking-wide text-(--color-ink-faint)">E-MAIL</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="voce@cooperativa.com.br"
              className={inputClass}
              autoComplete="username"
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-[11px] font-bold tracking-wide text-(--color-ink-faint)">SENHA</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className={inputClass}
              autoComplete="current-password"
            />
          </label>

          <div className="flex items-center justify-between text-[12px]">
            <label className="flex items-center gap-1.5 text-(--color-ink-soft)">
              <input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} className="accent-(--color-brand)" />
              Lembrar de mim
            </label>
            <button type="button" disabled aria-disabled="true" title="Ainda não disponível" className="cursor-not-allowed font-semibold text-(--color-ink-faint)">
              Esqueceu a senha?
            </button>
          </div>

          {error && <p className="text-[12px] font-medium text-(--color-danger)" role="alert">{error}</p>}

          <button
            type="submit"
            disabled={isSubmitting}
            className="mt-1.5 rounded-xl bg-(--color-brand) py-2.5 text-[14px] font-bold text-white transition-colors hover:brightness-95 disabled:cursor-wait disabled:opacity-70"
          >
            {isSubmitting ? 'Entrando…' : 'Entrar'}
          </button>
        </form>

        <p className="mt-6 text-center text-[11px] text-(--color-ink-faint)">SiloScanUX v{__APP_VERSION__} · © InovAgroTec</p>
      </div>
    </div>
  )
}
