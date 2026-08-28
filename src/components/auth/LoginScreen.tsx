import { useState, type FormEvent } from 'react'
import { BrandIcon, BrandWordmark } from '../brand/BrandMark'

const inputClass =
  'w-full rounded-lg border border-(--color-line) bg-(--color-panel-soft) px-3 py-2 text-sm text-(--color-ink) outline-none focus:border-(--color-brand)'

export function LoginScreen({ onLogin }: { onLogin: () => void }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    // No auth wired up yet — any input (or none) just moves past the gate for now.
    onLogin()
  }

  return (
    <div className="flex h-screen w-screen items-center justify-center bg-linear-to-b from-(--color-app-from) to-(--color-app-to) p-4">
      <div className="w-full max-w-[380px] rounded-2xl border border-(--color-line) bg-(--color-panel) p-8 shadow-[0_8px_30px_rgba(16,40,60,0.16)]">
        <div className="flex flex-col items-center gap-2">
          <BrandIcon className="h-16 w-16" />
          <BrandWordmark className="text-lg" />
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
              <input type="checkbox" className="accent-(--color-brand)" />
              Lembrar de mim
            </label>
            <button type="button" className="font-semibold text-(--color-brand)">
              Esqueceu a senha?
            </button>
          </div>

          <button type="submit" className="mt-1.5 rounded-xl bg-(--color-brand) py-2.5 text-[14px] font-bold text-white transition-colors hover:brightness-95">
            Entrar
          </button>
        </form>

        <p className="mt-6 text-center text-[11px] text-(--color-ink-faint)">SiloScanUX v{__APP_VERSION__} · © InovAgroTec</p>
      </div>
    </div>
  )
}
