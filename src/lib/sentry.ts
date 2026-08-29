import * as Sentry from '@sentry/react'

/** No-op without a DSN — local dev and CI don't need a Sentry project configured. */
export function initSentry() {
  const dsn = import.meta.env.VITE_SENTRY_DSN
  if (!dsn) return

  Sentry.init({
    dsn,
    environment: import.meta.env.MODE,
    release: __APP_VERSION__,
    tracesSampleRate: 0.1,
  })
}

export { Sentry }
