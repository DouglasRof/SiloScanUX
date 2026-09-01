import { useState, type FormEvent } from 'react'
import logoUrl from '../../assets/inovagrotec-logo.jpg'
import { supabase } from '../../lib/supabaseClient'
import { isValidUsername, resolveLoginEmail } from '../../lib/auth'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Checkbox } from '../ui/checkbox'

const labelClass = 'text-[11px] font-bold tracking-wide text-(--color-ink-faint)'
const submitButtonClass = 'mt-1.5 h-auto rounded-xl py-2.5 text-[14px] font-bold'

function authErrorMessage(message: string): string {
  if (message.includes('Invalid login credentials')) return 'E-mail (ou ID de usuário) e senha não coincidem.'
  if (message.includes('Email not confirmed')) return 'Confirme seu e-mail antes de entrar.'
  if (message.includes('User already registered')) return 'Já existe uma conta com esse e-mail.'
  if (message.includes('Password should be at least')) return 'A senha precisa de pelo menos 6 caracteres.'
  return 'Não foi possível concluir. Tente novamente em instantes.'
}

function LoginForm({ onSwitchToSignup }: { onSwitchToSignup: () => void }) {
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setIsSubmitting(true)

    const resolved = await resolveLoginEmail(identifier)
    if (!resolved.ok) {
      setIsSubmitting(false)
      setError(
        resolved.reason === 'error'
          ? 'Não foi possível verificar seu ID de usuário agora. Tente novamente em instantes.'
          : 'Não encontramos esse e-mail ou ID de usuário.',
      )
      return
    }

    const { error: signInError } = await supabase.auth.signInWithPassword({ email: resolved.email, password })
    setIsSubmitting(false)
    if (signInError) {
      console.error('Supabase signInWithPassword falhou:', signInError)
      setError(authErrorMessage(signInError.message))
    }
    // Em caso de sucesso, o App ouve onAuthStateChange e troca de tela sozinho.
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-3.5">
      <div className="flex flex-col gap-1">
        <Label htmlFor="login-identifier" className={labelClass}>
          E-MAIL OU ID DE USUÁRIO
        </Label>
        <Input
          id="login-identifier"
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
          placeholder="voce@cooperativa.com.br ou joao.silva"
          autoComplete="username"
        />
      </div>

      <div className="flex flex-col gap-1">
        <Label htmlFor="login-password" className={labelClass}>
          SENHA
        </Label>
        <Input
          id="login-password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          autoComplete="current-password"
        />
      </div>

      <div className="flex items-center justify-between text-[12px]">
        <Label htmlFor="remember-me" className="text-(--color-ink-soft)">
          <Checkbox id="remember-me" checked={rememberMe} onCheckedChange={(checked) => setRememberMe(checked === true)} />
          Lembrar de mim
        </Label>
        <Button type="button" variant="link" disabled aria-disabled="true" title="Ainda não disponível" className="h-auto p-0 text-(--color-ink-faint)">
          Esqueceu a senha?
        </Button>
      </div>

      {error && (
        <p className="text-[12px] font-medium text-(--color-danger)" role="alert">
          {error}
        </p>
      )}

      <Button type="submit" disabled={isSubmitting} className={submitButtonClass}>
        {isSubmitting ? 'Entrando…' : 'Entrar'}
      </Button>

      <p className="text-center text-[12px] text-(--color-ink-faint)">
        Não tem uma conta?{' '}
        <Button type="button" variant="link" onClick={onSwitchToSignup} className="h-auto p-0 text-[12px] font-semibold">
          Criar conta
        </Button>
      </p>
    </form>
  )
}

function SignupForm({ onDone, onSwitchToLogin }: { onDone: (message: string) => void; onSwitchToLogin: () => void }) {
  const [fullName, setFullName] = useState('')
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const usernameTouched = username.length > 0
  const usernameValid = isValidUsername(username)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)

    if (!usernameValid) {
      setError('ID de usuário inválido — use 3 a 24 letras minúsculas, números, ponto ou underscore.')
      return
    }
    if (password.length < 6) {
      setError('A senha precisa de pelo menos 6 caracteres.')
      return
    }
    if (password !== confirmPassword) {
      setError('As senhas não coincidem.')
      return
    }

    setIsSubmitting(true)
    const { data, error: signUpError } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: { data: { full_name: fullName.trim(), username } },
    })
    setIsSubmitting(false)

    if (signUpError) {
      console.error('Supabase signUp falhou:', signUpError)
      setError(authErrorMessage(signUpError.message))
      return
    }

    if (data.session) {
      // Sessão já veio ativa (confirmação de e-mail desligada no projeto) — o App
      // troca de tela sozinho via onAuthStateChange, nada a fazer aqui.
      return
    }

    // Confirmação de e-mail ainda ligada no projeto Supabase (deveria estar
    // desligada — ver supabase/login_por_usuario.sql) — avisa em vez de travar.
    onDone('Conta criada. Verifique seu e-mail para confirmar antes de entrar.')
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-3.5">
      <div className="flex flex-col gap-1">
        <Label htmlFor="signup-fullname" className={labelClass}>
          NOME COMPLETO
        </Label>
        <Input id="signup-fullname" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Seu nome" autoComplete="name" required />
      </div>

      <div className="flex flex-col gap-1">
        <Label htmlFor="signup-username" className={labelClass}>
          ID DE USUÁRIO
        </Label>
        <Input
          id="signup-username"
          value={username}
          onChange={(e) => setUsername(e.target.value.toLowerCase())}
          placeholder="joao.silva"
          autoComplete="username"
          required
        />
        <span className={`text-[11px] ${usernameTouched && !usernameValid ? 'text-(--color-danger)' : 'text-(--color-ink-faint)'}`}>
          3–24 caracteres: letras minúsculas, números, ponto ou underscore. Usado como alternativa ao e-mail para entrar.
        </span>
      </div>

      <div className="flex flex-col gap-1">
        <Label htmlFor="signup-email" className={labelClass}>
          E-MAIL
        </Label>
        <Input
          id="signup-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="voce@cooperativa.com.br"
          autoComplete="email"
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1">
          <Label htmlFor="signup-password" className={labelClass}>
            SENHA
          </Label>
          <Input
            id="signup-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            autoComplete="new-password"
            required
          />
        </div>
        <div className="flex flex-col gap-1">
          <Label htmlFor="signup-confirm-password" className={labelClass}>
            CONFIRMAR
          </Label>
          <Input
            id="signup-confirm-password"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="••••••••"
            autoComplete="new-password"
            required
          />
        </div>
      </div>

      {error && (
        <p className="text-[12px] font-medium text-(--color-danger)" role="alert">
          {error}
        </p>
      )}

      <Button type="submit" disabled={isSubmitting} className={submitButtonClass}>
        {isSubmitting ? 'Criando conta…' : 'Criar conta'}
      </Button>

      <p className="text-center text-[12px] text-(--color-ink-faint)">
        Já tem uma conta?{' '}
        <Button type="button" variant="link" onClick={onSwitchToLogin} className="h-auto p-0 text-[12px] font-semibold">
          Entrar
        </Button>
      </p>
    </form>
  )
}

export function LoginScreen() {
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [signupMessage, setSignupMessage] = useState<string | null>(null)

  function switchMode(next: 'login' | 'signup') {
    setMode(next)
    setSignupMessage(null)
  }

  return (
    <div className="flex h-screen w-screen items-center justify-center bg-linear-to-b from-(--color-app-from) to-(--color-app-to) p-4">
      <div className="glass-panel w-full max-w-[380px] rounded-3xl p-8">
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

        {signupMessage ? (
          <div className="mt-6 flex flex-col items-center gap-3 text-center">
            <p className="text-[13px] font-medium text-(--color-ink)">{signupMessage}</p>
            <Button variant="link" onClick={() => switchMode('login')} className="h-auto p-0 text-[13px] font-semibold">
              Voltar para o login
            </Button>
          </div>
        ) : mode === 'login' ? (
          <LoginForm onSwitchToSignup={() => switchMode('signup')} />
        ) : (
          <SignupForm onDone={setSignupMessage} onSwitchToLogin={() => switchMode('login')} />
        )}

        <p className="mt-6 text-center text-[11px] text-(--color-ink-faint)">SiloScanUX v{__APP_VERSION__} · © InovAgroTec</p>
      </div>
    </div>
  )
}
