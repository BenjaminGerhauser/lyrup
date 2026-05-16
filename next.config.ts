// Required env vars (set in Vercel / .env.local):
//   NEXT_PUBLIC_SENTRY_DSN  — public DSN from sentry.io project settings
//   SENTRY_AUTH_TOKEN       — build-time token for source map upload (CI/Vercel only)
//   SENTRY_ORG              — your Sentry organisation slug
//   SENTRY_PROJECT          — your Sentry project slug
import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: '/sw.js',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=0, must-revalidate' },
          { key: 'Service-Worker-Allowed', value: '/' },
          { key: 'Content-Type', value: 'application/javascript; charset=utf-8' },
        ],
      },
    ]
  },
};

export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,

  // Only show Sentry output in CI; silent on local dev.
  silent: !process.env.CI,

  // Upload a larger set of source maps to improve stack trace quality.
  widenClientFileUpload: true,

  // Remove Sentry logger statements from the production bundle.
  disableLogger: true,

  // Disable Vercel Cron Monitor auto-creation (not needed for Sprint 3).
  automaticVercelMonitors: false,
});
