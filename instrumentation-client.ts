import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Performance tracing disabled for Sprint 3.
  tracesSampleRate: 0,

  // Never send default PII (IP, user-agent, etc.) — privacy by default.
  sendDefaultPii: false,
})
