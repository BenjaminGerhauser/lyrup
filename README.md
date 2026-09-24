# Lyrup

Cotizador inteligente para emprendedores de impresión 3D — subís el G-code de una pieza y obtenés el costo real de material y tiempo de impresión, listo para armar un presupuesto.

## Qué hace

- Sube un archivo G-code (soporta PrusaSlicer, OrcaSlicer, Cura, Bambu Studio y Simplify3D)
- Detecta automáticamente el slicer usado y extrae tiempo de impresión + gramaje de filamento
- Matchea la impresora/filamento detectado contra el catálogo cargado por el usuario
- Calcula el costo (material + tiempo + margen) y genera un PDF de presupuesto
- Gestión de clientes, impresoras y materiales por cuenta, con aislamiento multi-tenant real vía Row Level Security de Postgres

## Stack

- Next.js 16 (App Router) + React 19 + TypeScript
- Supabase (Postgres, Auth, Row Level Security)
- Tailwind CSS v4 + shadcn/ui
- Vitest + Testing Library + axe-core (accesibilidad)
- Sentry (monitoreo), Resend (emails transaccionales), react-pdf (generación de PDFs), Serwist (PWA)

## El núcleo: parser multi-slicer

La parte más sólida del proyecto es el motor de parsing (`src/lib/gcode-parser.ts`, `gcode-matcher.ts`, `cost-calculator.ts`): funciones puras, sin dependencias externas, cubiertas con tests contra fixtures reales de G-code de los 5 slicers soportados (`src/lib/__tests__/fixtures/`).

## Getting started

```bash
pnpm install
cp .env.example .env.local   # completar con un proyecto de Supabase propio
pnpm dev
```

Requiere un proyecto de Supabase (hay plan gratuito) con las migraciones de `supabase/migrations` aplicadas — ver la [guía de deployment](docs/DEPLOYMENT.md).

## Tests

```bash
pnpm test
```

## Docs

- [Deployment guide (Vercel + env vars + dominio)](docs/DEPLOYMENT.md)
- [RLS smoke test runbook (aislamiento multi-tenant)](docs/RLS_SMOKE_TEST.md)
- [Environment variables template](.env.example)

## Estado actual y pendientes

Proyecto personal en desarrollo activo, no es un producto cerrado:

- El home del dashboard todavía es un placeholder ("Próximamente") — el flujo funcional completo es Cotizador → Materiales → Impresoras → Configuración → Clientes.
- Los tests cubren la lógica de negocio (server actions, parser, cálculo de costos, generación de PDF) pero no las páginas/rutas en sí.
- Depende de un proyecto de Supabase activo (Postgres + Auth + RLS) — no hay todavía un modo local/offline.
