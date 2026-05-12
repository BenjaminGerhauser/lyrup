# Lyrup -- Deployment Guide

This document covers Vercel environment variable configuration, the lyrup.com
custom-domain wiring procedure, and the DNS records required for Sprint 0
production deployment.

---

## Table of Contents

1. [Pre-requisites](#1-pre-requisites)
2. [Environment Variables -- Reference Table](#2-environment-variables--reference-table)
3. [Vercel Env Var Configuration](#3-vercel-env-var-configuration)
   - 3.1 Which variables go in which environment
   - 3.2 Step-by-step: adding vars in the Vercel dashboard
4. [Custom Domain -- lyrup.com](#4-custom-domain--lyrupcom)
   - 4.1 Add domain in Vercel
   - 4.2 DNS records
   - 4.3 www vs apex canonicalization
   - 4.4 SSL / HTTPS
5. [Deploy Checklist](#5-deploy-checklist)
6. [Rollback Procedure](#6-rollback-procedure)

---

## 1. Pre-requisites

Before deploying to Vercel you need:

- A Vercel project linked to the `lyrup` repository (GitHub / GitLab / Bitbucket).
- A Supabase project with all migrations applied (`001_waitlist.sql` through
  `007_sprint1_schema.sql`). Sprint 1 adds `005_rls_policies.sql`,
  `006_ref_data.sql`, and `007_sprint1_schema.sql`.
- A Resend account with a verified sending domain (`lyrup.com`).
- An Umami instance (self-hosted or Umami Cloud) -- optional but recommended.
- Access to the DNS registrar for `lyrup.com`.

---

## 2. Environment Variables -- Reference Table

| Variable | Visibility | Required | Description |
|---|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Public (client + server) | Yes | Supabase project URL. Found in Dashboard > Project Settings > API. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public (client + server) | Yes | Supabase anon/public key. Safe to expose -- enforces RLS. |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only | Yes | Supabase service role key. Bypasses RLS. NEVER expose to the browser. |
| `RESEND_API_KEY` | Server-only | Yes | Resend API key for the waitlist welcome email. |
| `NEXT_PUBLIC_UMAMI_URL` | Public | No | URL of the Umami script (e.g. `https://cloud.umami.is/script.js`). If omitted, no analytics script loads. |
| `NEXT_PUBLIC_UMAMI_WEBSITE_ID` | Public | No | Umami website UUID. Required together with `NEXT_PUBLIC_UMAMI_URL`. |
| `NEXT_PUBLIC_SITE_URL` | Public | Recommended | Full origin (e.g. `https://lyrup.com`). Used for OG metadata and password-reset redirect URLs. |

> **Security rule**: Any variable prefixed `NEXT_PUBLIC_` is bundled into the
> browser JavaScript bundle. Put secrets (`SERVICE_ROLE_KEY`, `RESEND_API_KEY`)
> in plain unprefixed variables -- Vercel serves them server-side only.

---

## 3. Vercel Env Var Configuration

### 3.1 Which Variables Go in Which Environment

Vercel has three target environments: **Production**, **Preview**, and **Development**.

| Variable | Production | Preview | Development |
|---|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Production project URL | Staging URL (or same as prod if no staging) | `http://localhost:54321` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Production anon key | Staging anon key | Local anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Production service role key | Staging service role key | Local service role key |
| `RESEND_API_KEY` | Production Resend key | Test Resend key (or same) | Test Resend key |
| `NEXT_PUBLIC_UMAMI_URL` | Production Umami script URL | Same or omit | Omit (no tracking in dev) |
| `NEXT_PUBLIC_UMAMI_WEBSITE_ID` | Production website ID | Staging ID or omit | Omit |
| `NEXT_PUBLIC_SITE_URL` | `https://lyrup.com` | Preview URL (e.g. `https://lyrup-git-feat.vercel.app`) | `http://localhost:3000` |

> **Sprint 0 note**: if you do not have a separate staging Supabase project, it is
> acceptable to point Preview deployments at the production project. Create a
> dedicated staging project before Sprint 2 enters beta.
> **Sprint 1 update**: migrations 005-007 were applied to the production project
> directly. No new environment variables were introduced in Sprint 1.

### 3.2 Step-by-Step: Adding Vars in the Vercel Dashboard

1. Open **vercel.com** > your Lyrup project > **Settings** > **Environment Variables**.
2. For each variable in the table above:
   - Click **Add New**.
   - Enter the **Key** exactly as shown (case-sensitive).
   - Enter the **Value** (get real values from Supabase Dashboard / Resend / Umami).
   - Under **Environments**, tick the relevant checkboxes (Production / Preview / Development).
   - Click **Save**.
3. After all vars are saved, trigger a new deployment:
   - Push a commit, OR
   - Go to **Deployments** > select the latest deployment > **Redeploy**.
4. Verify the deployment logs show no `undefined` warnings for the env vars.

**Tip -- Vercel CLI alternative:**

```bash
vercel env add NEXT_PUBLIC_SUPABASE_URL production
vercel env ls   # audit what is currently set
```

---

## 4. Custom Domain -- lyrup.com

### 4.1 Add Domain in Vercel

1. Go to your Lyrup Vercel project > **Settings** > **Domains**.
2. Click **Add Domain**.
3. Enter `lyrup.com` and click **Add**.
4. Vercel shows you the DNS records to create -- copy them (see 4.2 below).
5. Repeat for `www.lyrup.com` (see 4.3 for canonicalization decision).

### 4.2 DNS Records

Create the following records at your DNS registrar (e.g. Namecheap, Cloudflare, GoDaddy):

| Type | Name | Value | TTL |
|---|---|---|---|
| `A` | `@` (apex) | `76.76.21.21` | 3600 (or Auto) |
| `CNAME` | `www` | `cname.vercel-dns.com.` | 3600 (or Auto) |

> **Important**: The IP `76.76.21.21` is Vercel Anycast. Always confirm the exact
> value shown in the Vercel Domains dashboard at setup time -- Vercel may update it.

> **Cloudflare users**: set the `A` record proxy status to **DNS only** (grey cloud),
> NOT proxied. Vercel manages SSL termination; Cloudflare proxying can break
> certificate provisioning.

**Verification**: DNS propagation typically takes 5-30 minutes for TTL-300 records
and up to 48 hours for TTL-86400. Use `dig lyrup.com A` or
`https://dnschecker.org` to monitor propagation.

### 4.3 www vs Apex Canonicalization

**Decision: TBD -- choose one before going to production and before setting
OG / sitemap URLs (they must match the canonical).**

| Option | Primary domain | Redirect |
|---|---|---|
| **Apex canonical** (recommended) | `lyrup.com` | `www.lyrup.com` -> 301 -> `lyrup.com` |
| **www canonical** | `www.lyrup.com` | `lyrup.com` -> 301 -> `www.lyrup.com` |

Vercel handles the redirect automatically once you:

1. Add BOTH `lyrup.com` and `www.lyrup.com` as domains on the project.
2. Set one as **primary** (three-dot menu next to the domain > **Set as Primary**).
3. On the secondary domain, enable **Redirect to primary domain**.

**Recommendation for Sprint 0**: use `lyrup.com` as the apex canonical. Simpler
to share in social media and avoids typing `www`.

### 4.4 SSL / HTTPS

Vercel provisions a free Let Encrypt certificate automatically once the DNS
records resolve. No manual action is needed.

- HTTPS is enforced by default -- HTTP requests are redirected to HTTPS.
- The certificate covers both `lyrup.com` and `www.lyrup.com` (as a SAN).
- Certificate auto-renews before expiry.

---

## 5. Deploy Checklist

Run through this list before promoting a Preview deployment to Production.

- [ ] All env vars set in Vercel (Production environment)
- [ ] `pnpm build` completes without errors locally
- [ ] All Vitest tests pass (`pnpm test`)
- [ ] Supabase migrations applied to the production project
  - [ ] `001_waitlist.sql`
  - [ ] `002_cotizador_schema.sql`
  - [ ] `003_storage.sql`
  - [ ] `004_onboarding_function.sql`
  - [ ] `005_rls_policies.sql` (Sprint 1)
  - [ ] `006_ref_data.sql` (Sprint 1 — reference catalog seed)
  - [ ] `007_sprint1_schema.sql` (Sprint 1 — schema columns + user config)
- [ ] Storage buckets `gcode-uploads` and `pdf-quotes` created (private)
- [ ] DNS records created and propagated for `lyrup.com` and `www.lyrup.com`
- [ ] Vercel SSL certificate issued (green padlock in browser)
- [ ] Landing page visual smoke test (Hero, Pricing, FAQ, Waitlist form)
- [ ] Waitlist form submits successfully (check Supabase `waitlist` table)
- [ ] Welcome email arrives from `hola@lyrup.com` (check Resend dashboard logs)
- [ ] Register > Onboarding > Dashboard flow works end-to-end on a fresh user
- [ ] Manual RLS smoke test passed (see `docs/RLS_SMOKE_TEST.md`)
- [ ] Sprint 1 acceptance walkthrough passed (see `docs/SPRINT_1_ACCEPTANCE.md`)
- [ ] Umami analytics script loading (check Network tab for the script URL)
- [ ] PWA manifest validates in Chrome DevTools > Application > Manifest
- [ ] Service worker registers without errors (DevTools > Application > Service Workers)

---

## 6. Rollback Procedure

If a production deployment introduces a regression:

1. **Vercel instant rollback**: Deployments tab > previous deployment > **Promote to
   Production**. Takes effect in seconds with zero downtime.

2. **Kill switch for middleware bugs**: rename `src/proxy.ts` to `src/proxy.ts.bak`
   and redeploy. This disables all auth routing; the landing page remains accessible.

3. **Database rollback**: Sprint 0 migrations are additive (`001_waitlist.sql` is
   never modified). In an emergency, drop only the new tables in the Supabase SQL
   Editor:

   ```sql
   -- DESTRUCTIVE -- only in emergency
   DROP TABLE IF EXISTS quote_items, quotes, materials, printers, users CASCADE;
   DROP TABLE IF EXISTS ref_printer_models, ref_filament_catalog, ref_electricity_rates CASCADE;
   DROP FUNCTION IF EXISTS handle_new_user CASCADE;
   DROP FUNCTION IF EXISTS complete_onboarding CASCADE;
   ```

   The `waitlist` table and `001_waitlist.sql` are NOT affected.
