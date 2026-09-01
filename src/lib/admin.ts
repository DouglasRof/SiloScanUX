import { supabase } from './supabaseClient'
import type { AdminUserRow, DeviceApiKeyRow } from '../types/silo'

/** Every function here relies on Postgres RLS/`is_admin()` (see supabase/roles_admin.sql)
 * to actually restrict access — a non-admin calling these gets an empty result, not an
 * error. There's no separate admin-only auth check on the frontend because the backend
 * already enforces it; the UI only *hides* these screens from non-admins for a cleaner
 * experience, it isn't the security boundary. */

export async function adminListUsers(): Promise<AdminUserRow[]> {
  const { data, error } = await supabase.rpc('admin_list_users')
  if (error) {
    console.error('Falha ao listar usuários:', error)
    return []
  }
  return (data ?? []).map((row: Record<string, unknown>) => ({
    id: row.id as string,
    fullName: (row.full_name as string | null) ?? null,
    username: (row.username as string | null) ?? null,
    pendingUsername: (row.pending_username as string | null) ?? null,
    email: (row.email as string | null) ?? null,
    role: row.role as AdminUserRow['role'],
    blocked: row.blocked as boolean,
    createdAt: row.created_at as string,
  }))
}

/** Aplica a troca de username pendente do usuário (ver set_my_username em
 * login_por_usuario.sql — troca só fica pendente quando já existia um username antes). */
export async function adminApproveUsername(userId: string): Promise<boolean> {
  const { error } = await supabase.rpc('admin_approve_username', { p_user_id: userId })
  if (error) console.error('Falha ao aprovar troca de ID de usuário:', error)
  return !error
}

export async function adminRejectUsername(userId: string): Promise<boolean> {
  const { error } = await supabase.rpc('admin_reject_username', { p_user_id: userId })
  if (error) console.error('Falha ao rejeitar troca de ID de usuário:', error)
  return !error
}

export async function adminSetUserRole(userId: string, role: 'user' | 'admin'): Promise<boolean> {
  const { error } = await supabase.from('profiles').update({ role }).eq('id', userId)
  if (error) console.error('Falha ao alterar papel do usuário:', error)
  return !error
}

export async function adminSetUserBlocked(userId: string, blocked: boolean): Promise<boolean> {
  const { error } = await supabase.from('profiles').update({ blocked }).eq('id', userId)
  if (error) console.error('Falha ao bloquear/desbloquear usuário:', error)
  return !error
}

/** Envia o e-mail padrão de redefinição de senha do Supabase — não existe "resetar
 * senha" direto pelo back office sem a service_role key (que não pode ir para o
 * frontend), então o fluxo é sempre "manda o link, a pessoa troca ela mesma". */
export async function adminSendPasswordReset(email: string): Promise<boolean> {
  const { error } = await supabase.auth.resetPasswordForEmail(email)
  if (error) console.error('Falha ao enviar redefinição de senha:', error)
  return !error
}

export interface AdminPropertyWithSilos {
  id: string
  nome: string
  userId: string
  silos: { id: string; nome: string }[]
}

/** Visão cross-tenant (todas as propriedades/silos de todo mundo) — só devolve algo
 * porque a policy de admin em propriedades/silos usa is_admin(), não porque essa
 * função faz algo especial. */
export async function adminListPropertiesWithSilos(): Promise<AdminPropertyWithSilos[]> {
  const [propsRes, silosRes] = await Promise.all([
    supabase.from('propriedades').select('id, nome, user_id').order('created_at', { ascending: true }),
    supabase.from('silos').select('id, nome, propriedade_id').order('created_at', { ascending: true }),
  ])

  if (propsRes.error || silosRes.error) {
    console.error('Falha ao listar propriedades/silos (admin):', propsRes.error, silosRes.error)
    return []
  }

  const silosByProperty = new Map<string, { id: string; nome: string }[]>()
  for (const silo of silosRes.data ?? []) {
    const list = silosByProperty.get(silo.propriedade_id) ?? []
    list.push({ id: silo.id, nome: silo.nome })
    silosByProperty.set(silo.propriedade_id, list)
  }

  return (propsRes.data ?? []).map((p) => ({
    id: p.id,
    nome: p.nome,
    userId: p.user_id,
    silos: silosByProperty.get(p.id) ?? [],
  }))
}

export async function adminListDeviceKeys(): Promise<DeviceApiKeyRow[]> {
  const { data, error } = await supabase.from('device_api_keys').select('id, label, created_at, revoked_at').order('created_at', { ascending: false })
  if (error) {
    console.error('Falha ao listar chaves de dispositivo:', error)
    return []
  }
  return (data ?? []).map((r) => ({ id: r.id, label: r.label, createdAt: r.created_at, revokedAt: r.revoked_at }))
}

/** Devolve a chave em texto puro — só nesta chamada, na criação. Ela não é lida de
 * volta depois (nem o back office guarda; se perder, revoga e cria outra). */
export async function adminCreateDeviceKey(label: string): Promise<DeviceApiKeyRow | null> {
  const apiKey = crypto.randomUUID()
  const { data, error } = await supabase.from('device_api_keys').insert({ label, api_key: apiKey }).select('id, label, created_at, revoked_at').single()
  if (error || !data) {
    console.error('Falha ao criar chave de dispositivo:', error)
    return null
  }
  return { id: data.id, label: data.label, apiKey, createdAt: data.created_at, revokedAt: data.revoked_at }
}

export async function adminRevokeDeviceKey(id: string): Promise<boolean> {
  const { error } = await supabase.from('device_api_keys').update({ revoked_at: new Date().toISOString() }).eq('id', id)
  if (error) console.error('Falha ao revogar chave de dispositivo:', error)
  return !error
}
