import { supabase } from './supabaseClient'

export type ResolveLoginEmailResult = { ok: true; email: string } | { ok: false; reason: 'not-found' | 'error' }

/** Um campo só aceita e-mail OU ID de usuário — decide pela presença de "@", como a
 * maioria dos apps faz, em vez de expor um seletor de modo pro usuário escolher.
 * signInWithPassword só aceita e-mail (ou telefone), então um ID de usuário precisa
 * ser resolvido pra e-mail primeiro (RPC get_email_for_username, ver
 * supabase/login_por_usuario.sql) antes de autenticar.
 *
 * Devolve `reason` distinguindo "não existe esse ID" de "falha ao consultar o
 * backend" — as duas viravam a mesma mensagem de "credenciais incorretas" antes,
 * o que confundia uma falha de rede/backend com senha errada. */
export async function resolveLoginEmail(identifier: string): Promise<ResolveLoginEmailResult> {
  const trimmed = identifier.trim()
  if (!trimmed) return { ok: false, reason: 'not-found' }
  if (trimmed.includes('@')) return { ok: true, email: trimmed }

  const { data, error } = await supabase.rpc('get_email_for_username', { p_username: trimmed })
  if (error) {
    console.error('Falha ao resolver ID de usuário:', error)
    return { ok: false, reason: 'error' }
  }
  if (!data) return { ok: false, reason: 'not-found' }
  return { ok: true, email: data as string }
}

/** Regra simples e previsível: letras minúsculas, números, ponto e underscore, sem
 * espaço, 3–24 caracteres — cabe em "joao.silva" ou "granja_02" sem surpresa. */
const USERNAME_PATTERN = /^[a-z0-9._]{3,24}$/

export function isValidUsername(value: string): boolean {
  return USERNAME_PATTERN.test(value)
}
