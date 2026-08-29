import { test, expect } from '@playwright/test'

// Cobre o fluxo mais crítico do app: sem sessão, o usuário sempre cai na tela de
// login, nunca no dashboard. Roda contra `VITE_SUPABASE_URL`/`VITE_SUPABASE_ANON_KEY`
// de `.env.local` (dev) ou os placeholders definidos no CI — não precisa de um
// projeto Supabase real pra este teste passar, só que o app não quebre ao subir.

test('mostra a tela de login quando não há sessão', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByPlaceholder('voce@cooperativa.com.br')).toBeVisible()
  await expect(page.getByPlaceholder('••••••••')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Entrar' })).toBeVisible()
})

test('mostra uma mensagem de erro ao tentar entrar e falhar', async ({ page }) => {
  await page.goto('/')
  await page.getByPlaceholder('voce@cooperativa.com.br').fill('teste-e2e-invalido@example.com')
  await page.getByPlaceholder('••••••••').fill('senha-errada-123')
  await page.getByRole('button', { name: 'Entrar' }).click()
  // Timeout generoso: contra um Supabase real isso é rápido (credenciais inválidas);
  // contra a URL placeholder do CI, a falha de rede pode demorar um pouco mais.
  await expect(page.getByRole('alert')).toBeVisible({ timeout: 15_000 })
})
