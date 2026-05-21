# Implementation Plan: Voto Informado UPAO — Webapp Segunda Vuelta 2026

**Branch**: `001-voto-informado-upao` | **Date**: 2026-05-20 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/001-voto-informado-upao/spec.md`

## Summary

Webapp full-stack en Next.js 16.2 LTS (App Router + RSC + Turbopack) sobre Supabase (Postgres 16, Auth, RLS, Storage, Realtime) para que estudiantes de pregrado UPAO se registren vía OAuth (Google + Microsoft + email/password fallback), completen un cuestionario estructurado de 10-15 preguntas en 4 dimensiones JNE (Social, Económica, Ambiental, Institucional), exploren un comparador simétrico de los planes oficiales del JNE de Keiko Fujimori (FP) y Roberto Sánchez (JpP) con orden izquierda/derecha aleatorio persistente por usuario, y declaren una preferencia final inmutable. El docente accede a un dashboard analítico (Tremor 3.x + Recharts) con filtros reactivos y exports en CSV, XLSX, paquete HTML para Canva y dataset Power BI. Un admin gestiona el banco de preguntas con snapshotting histórico de enunciados. Cumple Ley 29733 con retención de 12 meses + anonimización irreversible y opt-in explícito en consentimiento. Hosting Vercel (Edge + Functions), Vercel Cron para refresh JNE 24h y heartbeat mensual del job de anonimización (que en la práctica se activa una sola vez al cruzar los 12 meses post-cierre), Upstash Redis para rate-limit, Cloudflare Turnstile para anti-bot invisible, Sentry + PostHog + Vercel Analytics para observabilidad, Vitest + Playwright para tests.

## Technical Context

**Language/Version**: TypeScript 5.7+ en strict mode (sin `any`, sin `// @ts-ignore`).

**Primary Dependencies**:

- Framework: Next.js 16.2 LTS (App Router, React Server Components, Server Actions, Turbopack producción), React 19.
- UI: Tailwind CSS v4 (OKLCH colors, container queries), shadcn/ui (Radix primitives, tokens custom), Lucide React iconos.
- Motion: Framer Motion (reveal stagger, AnimatePresence), Lenis (smooth scroll global), GSAP + ScrollTrigger (hero pinning/parallax), react-tilt (cards comparador).
- Datos y dashboard: Tremor 3.x, Recharts.
- Backend BaaS: Supabase JS SDK (`@supabase/ssr` + `@supabase/supabase-js`).
- Auth: Supabase Auth con providers Google OAuth, Microsoft Azure AD, email/password.
- Forms y validación: React Hook Form + Zod (esquemas compartidos cliente/servidor).
- Data fetching: TanStack Query v5 solo donde RSC no alcance (mutaciones optimistas en `/admin/preguntas` y `/dashboard` con filtros).
- Rate limit: Upstash Redis (`@upstash/ratelimit`).
- Anti-bot: Cloudflare Turnstile (invisible, integrado en login + submits sensibles).
- Observabilidad: Sentry (errores), PostHog (eventos de producto sin PII), Vercel Analytics (web vitals).
- Export: `papaparse` (CSV), `exceljs` (XLSX), generador HTML autocontenido custom (Canva), generador `.pbids` + dataset CSV plano (Power BI).
- Otros: `dayjs` (fechas), `nanoid` (IDs opacos), `zod-form-data` (parsing server actions).

**Storage**:

- Postgres 16 vía Supabase (RLS habilitado en TODA tabla que toca `auth.users`).
- Supabase Storage (PDFs de planes de gobierno espejo + assets del Ángel de Trujillo).
- Supabase Realtime (avance del dashboard del docente — opcional v1, requerido si se usa para `live progress`).

**Testing**:

- Vitest (unit + integration de validaciones Zod, helpers, lógica de export).
- Playwright (E2E de los flujos críticos: login → consentimiento → cuestionario → comparador → preferencia → dashboard).
- Supabase local con Docker para tests de integración (no se mockea DB, conforme constitución y CLAUDE.md).

**Target Platform**:

- Producción: Vercel (Edge runtime para middleware y rutas estáticas; Node runtime para server actions, exports y cron handlers).
- Cliente: navegadores modernos (últimas 2 versiones de Chrome, Edge, Safari, Firefox), mobile-first (60% móvil, 40% laptop según assumption).
- Sin app móvil nativa (out of scope v1).

**Project Type**: Web application full-stack (single Next.js project, App Router monolítico con organización por route groups).

**Performance Goals**:

- Time To Interactive < 3s en 4G simulado (constitución V).
- Lighthouse Performance ≥ 90, Accessibility ≥ 90, Best Practices ≥ 90, SEO ≥ 90 (constitución V).
- Tiempos de respuesta interactivos < 2s con 500 estudiantes simultáneos (FR-043, SC-008).
- Cuestionario completable en 5-7 min, flujo completo < 15 min (SC-006).
- Export del dashboard < 30s (SC-007).
- Tasa de errores visibles < 0.5% (SC-005).

**Constraints**:

- 99.5% uptime durante las 3 semanas previas al cierre del ciclo académico (FR-042).
- WCAG 2.2 AA mínimo (constitución V).
- Toda interacción funcional con teclado solo (constitución V).
- Cero PII en logs operacionales (FR-039, constitución III) — solo `user_id` UUID opaco.
- RLS habilitado en toda tabla que toca `auth.users` (constitución III).
- Sesión expira a las 24 h de inactividad (FR-003, constitución III).
- Idioma único: español neutro latinoamericano (FR-044).
- Sin emojis ni textos editoriales en UI (constitución II, CLAUDE.md).
- Texto del JNE mostrado sin parafraseo, "No declarado por el JNE" si falta (constitución I, FR-017, FR-018).

**Scale/Scope**:

- 500 estudiantes activos simultáneos (FR-043). Total potencial: ~1500-3000 (varios ciclos académicos).
- 10-15 preguntas activas (FR-007a), 2 candidatos, 4 dimensiones × 2 candidatos = 8 secciones de plan en comparador.
- Aproximadamente 12 rutas user-facing: landing, login, consent, profile, cuestionario (multi-paso), comparador, preferencia, cierre, dashboard, dashboard/export, admin/preguntas, admin/jne.
- 6 tablas principales en Postgres + 3 vistas materializadas para el dashboard.
- 4 formatos de export del dashboard.

## Constitution Check

*GATE: debe pasar antes de Phase 0. Re-evaluado tras Phase 1.*

| Principio | Cumple | Justificación |
|---|---|---|
| **I. Datos oficiales JNE como única fuente de verdad** | Sí | Toda la data del comparador viene de la API `https://web.jne.gob.pe/serviciovotoinformado` (FR-033). Seed inicial en `data/jne/raw/` con auditoría. Refresh Vercel Cron 24h (FR-034). Texto del JNE se muestra sin parafraseo (FR-017). Datos faltantes se marcan como "No declarado por el JNE" (FR-018). |
| **II. Neutralidad política (NO NEGOCIABLE)** | Sí | Comparador simétrico (FR-014). Orden izquierda/derecha aleatorio persistente por estudiante con distribución global ~50/50 (FR-014a, Q4). Sin etiquetas valorativas, sin gradientes asimétricos. Cuestionario mide, no induce (FR-023). |
| **III. Privacidad y consentimiento (NO NEGOCIABLE)** | Sí | Consentimiento obligatorio antes de captura (FR-004, FR-005). Opt-in explícito separado en consentimiento (FR-004a, Q3). RLS en todas las tablas con `auth.users` (FR-040). Retención 12 meses + anonimización irreversible (FR-041a/b/c, Q3). Logs sin PII (FR-039). Sesiones 24 h (FR-003). |
| **IV. Test-first en flujos críticos** | Sí | TDD en autenticación (Supabase Auth + middleware), persistencia de respuestas (server actions), cálculos del dashboard (lib/dashboard/aggregations), export al docente (lib/export/*). Playwright E2E en happy-path del estudiante. Supabase local Docker para integration (sin mocks de DB). |
| **V. Server-first, accesible, rápido** | Sí | RSC por defecto. `"use client"` solo en componentes con estado interactivo (formularios multi-paso, comparador animado, dashboard con filtros reactivos). Lighthouse ≥ 90 todas las categorías. TTI < 3s en 4G. WCAG 2.2 AA. Navegación con teclado completa. |
| **VI. Observabilidad y honestidad operacional** | Sí | Sentry obligatorio. PostHog para eventos de producto (Evento de uso, sin PII). Logs estructurados JSON en server actions y route handlers. Errores contextuales al usuario (no "Error 500"). |
| **VII. Simplicidad antes que sofisticación** | Sí | Una sola app Next.js (no monorepo). Sin feature flags ni compat shims. Sin abstracciones prematuras (capas se introducen al tercer uso concreto). Se prefiere RSC + server actions sobre BFF dedicado. |

**Stack obligatorio**: todo el stack listado en Technical Context coincide 1:1 con la sección "Stack obligatorio" de la constitución. Sin sustituciones.

**Workflow obligatorio**: feature pasa por `/speckit-specify` (hecho) → `/speckit-clarify` (hecho, 5 Q resueltas) → `/speckit-plan` (este documento) → `/speckit-tasks` → `/speckit-implement`. CI corre `pnpm lint`, `pnpm tsc`, `pnpm test`, `pnpm e2e`. Cambios en RLS/auth/esquema requieren `/security-review` antes del merge.

**Resultado**: PASS. Sin violaciones que justificar. La sección "Complexity Tracking" queda vacía.

## Project Structure

### Documentation (this feature)

```text
specs/001-voto-informado-upao/
├── spec.md                # Especificación funcional + Clarifications
├── plan.md                # Este archivo
├── research.md            # Phase 0 — decisiones técnicas con rationale
├── data-model.md          # Phase 1 — esquema Postgres + RLS
├── quickstart.md          # Phase 1 — setup local + comandos diarios
├── contracts/             # Phase 1 — contratos JNE, Supabase, exports
│   ├── jne-client.md
│   ├── server-actions.md
│   ├── dashboard-export.md
│   └── retention-job.md
├── checklists/            # Checklists generados con /speckit-checklist
└── tasks.md               # Generado por /speckit-tasks (NO por este comando)
```

### Source Code (repository root)

```text
app/
├── (marketing)/                      # Landing, como-funciona, sobre-el-curso
│   ├── page.tsx
│   ├── como-funciona/page.tsx
│   └── layout.tsx
├── (auth)/                           # Login, callback, consent, profile
│   ├── login/page.tsx
│   ├── auth/callback/route.ts
│   ├── consent/page.tsx
│   └── profile/page.tsx
├── (student)/                        # Cuestionario, comparador, preferencia, cierre
│   ├── cuestionario/
│   │   ├── page.tsx
│   │   └── [step]/page.tsx
│   ├── comparador/page.tsx
│   ├── preferencia/page.tsx
│   └── cierre/page.tsx
├── (teacher)/                        # Dashboard
│   └── dashboard/
│       ├── page.tsx
│       ├── export/page.tsx
│       └── layout.tsx
├── (admin)/                          # Gestión de preguntas y refresh JNE
│   └── admin/
│       ├── preguntas/page.tsx
│       ├── preguntas/nueva/page.tsx
│       ├── preguntas/[id]/page.tsx
│       └── jne/page.tsx
├── api/
│   ├── jne/refresh/route.ts          # POST: refresh manual (admin)
│   ├── export/
│   │   ├── csv/route.ts
│   │   ├── xlsx/route.ts
│   │   ├── html/route.ts
│   │   └── powerbi/route.ts
│   ├── cron/
│   │   ├── jne-refresh/route.ts      # GET: Vercel Cron 24h
│   │   └── anonymize/route.ts        # GET: Vercel Cron mensual (Ley 29733)
│   └── health/route.ts
├── globals.css                       # Tokens OKLCH del design.md
├── layout.tsx                        # Root layout (Geist + Migra + Lenis provider)
└── error.tsx                         # Boundary global con Sentry

components/
├── ui/                               # shadcn primitives con tokens custom
├── landing/                          # Hero asimétrico + Ángel de Trujillo
├── auth/                             # OAuth buttons, consent form, Turnstile
├── questionnaire/                    # MultiStepForm, ProgressBar, autosave
├── compare/                          # SplitView, CandidateColumn, DimensionTabs
├── preference/                       # PreferenceForm, ConfidenceSlider
├── dashboard/                        # KPIs, charts (Tremor + Recharts), filters
├── admin/                            # QuestionEditor, JneRefreshPanel
└── motion/                           # LenisProvider, FramerWrappers, GsapHero

lib/
├── jne/
│   ├── client.ts                     # Cliente tipado con X-Session-Token + retry
│   ├── types.ts                      # Types generados de JSONs reales
│   ├── refresh.ts                    # Lógica de sincronización a Postgres
│   └── cache.ts                      # Fallback a copia válida
├── supabase/
│   ├── browser.ts                    # Client component
│   ├── server.ts                     # RSC + server actions
│   ├── middleware.ts                 # Refresh cookies
│   └── admin.ts                      # Service role (solo cron + admin actions)
├── validation/
│   ├── consent.schema.ts
│   ├── profile.schema.ts
│   ├── answer.schema.ts
│   ├── preference.schema.ts
│   └── question.schema.ts            # Para /admin/preguntas
├── auth/
│   ├── role.ts                       # Resolución de rol student/teacher/admin
│   ├── allowed-teachers.ts           # Check contra whitelist
│   └── session.ts                    # Helpers de sesión 24h
├── dashboard/
│   ├── aggregations.ts               # KPIs y cruces
│   ├── filters.ts                    # Parser de query params reactivos
│   └── queries.ts                    # Server-side Postgres queries
├── export/
│   ├── csv.ts                        # papaparse
│   ├── xlsx.ts                       # exceljs
│   ├── html-canva.ts                 # Generador HTML autocontenido
│   ├── powerbi.ts                    # .pbids + CSV plano
│   └── anonymize.ts                  # Toggles de anonimización
├── analytics/
│   ├── posthog.ts                    # Init + helper sin PII
│   ├── sentry.ts                     # Init server/client
│   └── events.ts                     # Catálogo de eventos de uso
├── rate-limit/
│   └── upstash.ts                    # 5/min en submits (FR-037)
├── retention/
│   ├── anonymize.ts                  # Job mensual Ley 29733
│   └── delete-request.ts             # Self-service del estudiante
└── utils/
    ├── opaque-id.ts                  # nanoid wrappers
    └── tz.ts                         # America/Lima

supabase/
├── migrations/
│   ├── 0001_init_schema.sql          # profiles, questions, answers, candidates, plans, dimensions, preferences, allowed_teachers, jne_refresh_log, anonymization_log
│   ├── 0002_rls_policies.sql         # Policies por rol
│   ├── 0003_seed_jne.sql             # Carga JSONs de data/jne/raw/
│   ├── 0004_seed_allowed_teachers.sql
│   └── 0005_views_dashboard.sql      # Vistas materializadas para KPIs
└── functions/                        # Edge functions opcionales (cron alterno)

data/
├── jne/
│   ├── README.md                     # Ya existe
│   └── raw/                          # Ya existe (JSONs auditoría)
└── questions/
    └── draft_v1.md                   # Generado post-spec por equipo técnico

docs/
└── design.md                         # Ya existe (paleta + tipografía + identidad)

tests/
├── unit/                             # Vitest: validaciones Zod, helpers, export
├── integration/                      # Vitest + Supabase local Docker
└── e2e/                              # Playwright

middleware.ts                         # Auth + role-gating + rate limit (Edge)
playwright.config.ts
vitest.config.ts
next.config.ts
tailwind.config.ts
tsconfig.json
package.json
```

**Structure Decision**: monorepo no, una sola app Next.js 16 App Router con organización por **route groups** (`(marketing)`, `(auth)`, `(student)`, `(teacher)`, `(admin)`) para separar layouts y middlewares por audiencia sin afectar URLs públicas. Toda la lógica de negocio vive en `lib/`. Toda la DB en `supabase/migrations/`. Mantengo `data/jne/` como seed inicial auditable y carpeta nueva `data/questions/` para el draft del banco de preguntas (generado post-spec).

## Complexity Tracking

> Sin violaciones a la constitución. Esta sección queda vacía.

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|--------------------------------------|
| — | — | — |
