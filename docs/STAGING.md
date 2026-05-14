# Staging Environment — Supabase + Vercel

This project runs two Supabase projects:

| Environment | Project ref            | Purpose                                      |
| ----------- | ---------------------- | -------------------------------------------- |
| Prod        | `wcyzknrhsdqkqmqheged` | Live data — connected to `master` deploys.   |
| Staging     | `wxlgbcakgzqntvuyerij` | Safe to break — connected to all previews.   |

Both projects live in the same Supabase org (`lyrup Org`) and are in `sa-east-1`.

## Why staging exists

Before staging, every Vercel preview deploy pointed at prod. A bad migration or
a destructive query in a feature branch would wipe real user data. With staging,
preview deploys hit a parallel database that mirrors prod's schema but holds
only test data.

## Day-to-day workflow

### Adding a new migration

1. Write `supabase/migrations/0NN_*.sql` locally.
2. Apply it to **staging first** so you can validate the schema and RLS:

   ```bash
   # via Supabase CLI (recommended for migrations checked into git)
   pnpm db:link:staging         # one-time link
   pnpm db:push:staging
   ```

   Or via Claude Code MCP: `mcp__plugin_supabase_supabase__apply_migration`
   with `project_id=wxlgbcakgzqntvuyerij`.

3. Smoke-test in staging (open a preview deploy or run locally with staging
   env vars).
4. Once green, apply the same migration to prod:

   ```bash
   pnpm db:link:prod
   pnpm db:push:prod
   ```

   Or via MCP with `project_id=wcyzknrhsdqkqmqheged`.

5. Run `mcp__plugin_supabase_supabase__get_advisors` for both projects after
   each migration to catch new RLS or security regressions.

### Running locally against staging

Copy `.env.example` to `.env.local`. The example file already points at staging
so local dev is safe out of the box.

```bash
cp .env.example .env.local
pnpm dev
```

If you need to hit prod locally (rare — only for a real-data bug repro), swap
the env vars temporarily. Never commit a `.env.local` pointing at prod.

## Vercel configuration

Vercel uses two environments:

| Vercel environment | Supabase env vars |
| ------------------ | ----------------- |
| Production         | Point at prod project `wcyzknrhsdqkqmqheged`. |
| Preview            | Point at staging project `wxlgbcakgzqntvuyerij`. |
| Development        | Not used (Vercel `vercel dev` only). |

Env vars to set in each environment (Vercel dashboard → Settings → Environment Variables):

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `RESEND_API_KEY` (only in Production)

After updating env vars, redeploy the affected branch for the change to take effect.

## Keeping prod and staging in sync

The two projects must share the same schema (same migration set). If staging
drifts, run the linter:

```bash
# diff between local migrations and the linked remote
pnpm db:diff:linked
```

Seed data may differ — staging can have test rows, prod has real customer data.

## Recovery: rebuild staging from scratch

If staging schema gets corrupted or drifts irrecoverably:

1. Delete the staging project (Supabase dashboard).
2. Re-create via `mcp__plugin_supabase_supabase__create_project`
   (free tier, region `sa-east-1`).
3. Re-apply all migrations 001-NNN in order.
4. Update the project ref in this doc + in `package.json` scripts +
   in Vercel preview env vars + in `.env.example`.

## Project refs reference

These never appear in source — only in tooling:

- **Prod**: `wcyzknrhsdqkqmqheged`
- **Staging**: `wxlgbcakgzqntvuyerij`

The publishable keys ARE checked into `.env.example` (intentional — they are
the public anon keys, not the service-role key). The service-role key must
never be committed.
