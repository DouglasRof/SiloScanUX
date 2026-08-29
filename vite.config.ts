/// <reference types="vitest/config" />
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import { defineConfig } from 'vite'
import pkg from './package.json' with { type: 'json' }

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg'],
      manifest: {
        name: 'SiloScanUX',
        short_name: 'SiloScanUX',
        description: 'Monitoramento inteligente de silos — InovAgroTec',
        theme_color: '#0b1621',
        background_color: '#0b1621',
        display: 'standalone',
        start_url: '/',
        icons: [
          {
            src: '/icons/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
          },
        ],
      },
    }),
  ],
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
  },
  test: {
    environment: 'node',
    // Exclude nested Claude Code worktrees — otherwise their copies of these same
    // test files get picked up too, double-counting (or worse, drifting) results.
    // Also exclude e2e/ — those .spec.ts files use Playwright's test runner, which
    // isn't compatible with Vitest's.
    exclude: ['**/node_modules/**', '**/dist/**', '.claude/**', 'e2e/**'],
  },
})
