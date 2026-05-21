---

description: "Task list — Voto Informado UPAO Segunda Vuelta 2026"
---

# Tasks: Voto Informado UPAO — Webapp Segunda Vuelta 2026

**Input**: Design documents from `/specs/001-voto-informado-upao/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/*, quickstart.md (todos presentes)

**Tests**: Incluidos. La constitución (principio IV) manda TDD en flujos críticos — auth, persistencia de respuestas, cálculos del dashboard, export al docente — y E2E Playwright en happy-paths.

**Organization**: agrupado por user story (US1=P1 MVP, US2=P2, US3=P3, US4=P3) para entregar incrementos independientemente testables y desplegables.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: ejecutable en paralelo (archivos distintos, sin dependencias incompletas).
- **[Story]**: a qué user story pertenece (US1, US2, US3, US4). Setup, Foundational y Polish no llevan etiqueta.
- Cada task incluye ruta de archivo concreta.

## Path Conventions

Single-project Next.js 16 App Router. Rutas relativas a la raíz del repo. Estructura completa en `plan.md` § Project Structure.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: inicializar el proyecto, instalar dependencias, configurar tooling, sin lógica de negocio.

- [X] T001 Inicializar proyecto Next.js 16.2 LTS — **completado** vía `pnpm init` + scaffolding manual (el dir no estaba vacío, así que se evitó `create-next-app`). Resultado: `package.json`, `tsconfig.json` (strict, noUncheckedIndexedAccess, noImplicitAny, noUnusedLocals), `next.config.ts`, `next-env.d.ts`, `app/layout.tsx`, `app/page.tsx`, `.npmrc`. Build verde con Next 16.2.6 + React 19.2.6 + Turbopack.
- [X] T002 [P] Instalar dependencias core — **completado**. Versiones reales: `next 16.2.6`, `react 19.2.6`, `@supabase/ssr 0.10.3`, `@supabase/supabase-js 2.106.0`, `zod 4.4.3`, `react-hook-form 7.76.0`, `@hookform/resolvers 5.2.2`, `framer-motion 12.39.0`, `lenis 1.3.23` (sustituye `@studio-freight/lenis` que renombró), `gsap 3.15.0`, `lucide-react 1.16.0`, `@tremor/react 3.18.7`, `recharts 3.8.1`, `@tanstack/react-query 5.100.11`, `@upstash/ratelimit 2.0.8`, `@upstash/redis 1.38.0`, `@sentry/nextjs 10.53.1`, `posthog-js 1.374.2`, `dayjs 1.11.20`, `nanoid 5.1.11`, `papaparse 5.5.3`, `exceljs 4.4.0`, `react-tilt 1.0.2`. Adicional: `tailwindcss 4.3.0` + `@tailwindcss/postcss 4.3.0` + `sharp 0.34.5` + `clsx` + `tailwind-merge` + `class-variance-authority`.
- [X] T003 [P] Instalar dev dependencies — **completado**. Versiones reales: `typescript 6.0.3`, `eslint 9.39.4` (downgrade desde v10 por compat de plugins react/jsx-a11y), `vitest 4.1.6`, `@vitest/ui 4.1.6`, `@testing-library/react 16.3.2`, `@testing-library/jest-dom 6.9.1`, `jsdom 29.1.1`, `@playwright/test 1.60.0`, `supabase 2.100.1`, `prettier 3.8.3`, `eslint-config-next 16.2.6`, `eslint-config-prettier 10.1.8`, `eslint-plugin-tailwindcss 3.18.3`, `msw 2.14.6`, `tsx 4.22.3`, `@dnd-kit/core 6.3.1`, `@dnd-kit/sortable 10.0.0`, `@eslint/eslintrc 3.3.5`, `prettier-plugin-tailwindcss 0.8.0`.
- [X] T004 [P] Configurar Tailwind v4 + tokens OKLCH — **completado**. `app/globals.css` con `@import "tailwindcss"` + bloque `@theme` con tokens espejando `docs/design.md` (navy-upao, navy-deep, cyan-electric, mango-sun, coral-pulse, mint-success, off-white, paper, charcoal, ink, smoke, candidate-keiko, candidate-roberto). Tailwind v4 usa CSS-based config (no `tailwind.config.ts`). `postcss.config.mjs` configurado.
- [X] T005 [P] Inicializar shadcn/ui — **completado vía init manual** (CLI prompts interactivos). `components.json` con style "new-york", RSC true, alias `@/components`, `@/lib`, base color slate, css variables. `lib/utils.ts` con `cn()` (clsx + twMerge). Primitives (button/card/input/etc.) se añadirán on-demand en Phase 3 (US1) — más eficiente que sembrar todas sin uso.
- [X] T006 [P] Configurar ESLint + Prettier — **completado**. `eslint.config.mjs` con flat config nativo de `eslint-config-next` 16 (sin FlatCompat) + `eslint-config-prettier` + regla `no-console: error` (excepto warn/error) cubriendo constitución VI. Override para tests. `.prettierrc.json` + `.prettierignore` con plugin de Tailwind. `pnpm lint` verde.
- [X] T007 [P] Configurar Vitest — **completado**. `vitest.config.ts` env `jsdom`, alias `@/`, include `tests/unit + tests/integration`, exclude `tests/e2e` y `tests/load`, coverage v8. `tests/setup.ts` con `@testing-library/jest-dom/vitest` + `cleanup` automático. Sanity test `tests/unit/sanity.test.ts` pasa.
- [X] T008 [P] Configurar Playwright — **completado**. `playwright.config.ts` con chromium, baseURL desde env, webServer `pnpm dev`, locale `es-PE`, timezone `America/Lima`, retries 1 en CI, GitHub reporter. `tests/e2e/` placeholder. (Browsers se instalan en CI; localmente con `pnpm exec playwright install` cuando se ejecuten tests E2E.)
- [X] T009 Inicializar Supabase CLI — **completado**. `supabase init` ejecutado; `supabase/config.toml` con `project_id = "voto-informado-upao"`, db major_version 17. Carpetas `supabase/migrations/`, `supabase/functions/`, `lib/supabase/`, `scripts/`, `data/questions/`, `.github/workflows/` creadas.
- [X] T010 [P] Crear `.env.example` — **completado** con secciones organizadas: Site URL, Supabase (local + service role), Auth providers (Google + Microsoft), Upstash Redis, Cloudflare Turnstile, JNE API, CRON_SECRET, Sentry, PostHog. Cada bloque con comentarios explicativos.
- [X] T011 [P] Configurar Vercel Cron — **completado**. `vercel.json` con dos crons: `/api/cron/jne-refresh` a `0 4 * * *` y `/api/cron/anonymize` a `0 5 1 * *`. Headers `Cache-Control: no-store` para todas las rutas `/api/*`.
- [X] T012 [P] Configurar CI — **completado**. `.github/workflows/ci.yml` con 2 jobs: (1) `quality` corre lint + tsc + test con env dummies; (2) `e2e` depende de quality, instala browsers Playwright, build con env, ejecuta `pnpm e2e`, sube reporte en failure. pnpm 11 + Node 22 con cache.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: schema de DB, RLS, clientes Supabase, middleware, helpers de auth/rate-limit/observabilidad. Sin esto, ninguna user story funciona.

**⚠️ CRÍTICO**: bloquea todas las user stories.

### Database schema y RLS

- [X] T013 0001_init_schema.sql — ENUMs (user_role, compare_order_enum, dim_tematica_enum, question_type_enum) + 13 tablas + índices + CHECK constraints. Extensions: pgcrypto, citext, pg_trgm.
- [X] T014 0003_rls_policies.sql — RLS habilitado en 11 tablas con `auth.users`. Policies por rol según matriz de data-model.md. RLS de answers chequea questionnaire_completed_at para bloquear edición post-envío.
- [X] T015 0004_triggers.sql — on_auth_user_created (crea profile + eleva rol si está en allowed_teachers), profiles_set_email_institucional, answers_snapshot_lock, preferences_immutable, questions_no_delete (soft delete), updated_at triggers.
- [X] T016 0002_helper_functions.sql — `current_role()` SECURITY DEFINER (usada por RLS), `assign_compare_order_random()` 50/50, `hash_opaque_user_id()` SHA-256, `set_updated_at()` genérico.
- [X] T017 0005_seed_jne.sql — Inserta Keiko (id 245741, plan 29690) y Roberto (id 246281, plan 29688) en candidates + plans. 4 dimensiones completas de Keiko. Placeholders NULL de las 4 dimensiones de Roberto (UI muestra "No declarado por el JNE" — FR-018 — hasta que el cron jne-refresh las pueble o un script las cargue desde el JSON).
- [X] T018 0006_views_dashboard.sql — 4 materialized views: mv_kpis_curso, mv_preferencia_por_carrera, mv_orden_vs_preferencia (control Q4), mv_evolucion_temporal (TZ Lima). Índices únicos para `REFRESH CONCURRENTLY`.
- [X] T019 0007_seed_allowed_teachers.sql — Tabla vacía con comentario. Admin puebla vía script `add-teacher` o SQL.

### Supabase clients

- [X] T020 [P] `lib/supabase/browser.ts` — createBrowserClient para Client Components.
- [X] T021 [P] `lib/supabase/server.ts` — createServerClient para RSC + Server Actions con cookie handler tolerante a contextos read-only.
- [X] T022 [P] `lib/supabase/middleware.ts` — createMiddlewareClient para refresh de sesión en Edge runtime.
- [X] T023 [P] `lib/supabase/admin.ts` — createAdminClient service-role con guard `typeof window !== "undefined"` para falla en caliente si se importa mal.
- [X] T024 `pnpm run db:types` — Script configurado y ejecutado. `lib/supabase/database.types.ts` regenerado con esquema real (placeholder reemplazado).

### Core infra

- [X] T025 [P] `lib/errors.ts` — Discriminated union AppError + Result<T, E> + helpers `ok()`/`err()` + `ERROR_MESSAGES` legibles en español (constitución VI).
- [X] T026 [P] `lib/rate-limit/upstash.ts` — Ratelimit.slidingWindow(5, "1 m") con fallback no-op si Upstash no está configurado (dev/CI sin cuenta).
- [X] T027 [P] `lib/auth/turnstile.ts` — verifyTurnstileToken con timeout 5s y modo permisivo en dev/CI sin secret.
- [X] T028 [P] `lib/auth/role.ts` — getCurrentRole (React `cache()`), isStudent/isTeacher/isAdmin, assertRole.
- [X] T029 [P] `lib/auth/allowed-teachers.ts` — listAllowedTeachers, addAllowedTeacher (eleva rol si profile existe), removeAllowedTeacher.
- [X] T030 [P] `lib/auth/session.ts` — requireUser (redirect /login), getOptionalUser, resolveStudentResumePath (edge case "sesión expirada").
- [X] T031 [P] Sentry inicializado en sentry.server.config.ts, sentry.client.config.ts, sentry.edge.config.ts + instrumentation.ts con onRequestError. beforeSend sanitiza `user` a solo `id`.
- [X] T032 [P] PostHog en `app/providers.tsx` (init client-only con autocapture off, captureleave on). Wrapper `lib/analytics/posthog.ts` filtra PII por nombre de campo. Catálogo en `lib/analytics/events.ts`.
- [X] T033 [P] `lib/utils/opaque-id.ts` — hashUserId, hashIp, generateOpaqueId, generateCorrelationId.
- [X] T034 [P] `lib/utils/logger.ts` — JSON estructurado por línea, filtra PII (email, password, token, etc.), niveles debug/info/warn/error.
- [X] T035 [P] `lib/utils/tz.ts` — dayjs con plugin tz + locale es. Helpers toLima, formatLimaShort, isoLima, fromNowLima.

### Middleware y layouts globales

- [X] T036 `proxy.ts` en raíz (renamed desde `middleware.ts` por convención Next 16). Edge runtime. Refresh sesión Supabase + role-gating (student/teacher/admin paths) + redirect a /login con `?next=`.
- [X] T037 `app/layout.tsx` con fonts Geist Sans + Geist Mono (next/font/google), Providers (PostHog + LenisProvider), themeColor light/dark, locale es-PE.
- [X] T038 `components/motion/LenisProvider.tsx` con lerp 0.1, smoothWheel, syncTouch. Honra `prefers-reduced-motion`.
- [X] T039 `app/error.tsx` con Sentry.captureException + mensaje contextual + botón Reintentar. `app/not-found.tsx` con 404 editorial.
- [X] T040 Configuración manual OAuth documentada en `quickstart.md` § 2 (Google + Microsoft + email + rotación CRON_SECRET con `openssl rand -hex 32`). `app/(auth)/auth/callback/route.ts` implementado (intercambia code → resolveStudentResumePath).

**Checkpoint**: Foundation lista. User stories pueden comenzar en paralelo.

---

## Phase 3: User Story 1 — Estudiante completa flujo principal (Priority: P1) 🎯 MVP

**Goal**: un estudiante UPAO se registra, da consentimiento + opt-in, llena perfil, responde el cuestionario en pasos múltiples con autosave, ve el comparador simétrico (Keiko vs Roberto en orden aleatorio persistente) y declara su preferencia final inmutable.

**Independent Test**: un solo estudiante invitado completa todo el flujo (login → consent → profile → cuestionario → comparador → preferencia → cierre) sin depender de US2/US3/US4. Validable con seed de preguntas mínimas + seed JNE ya cargado.

### Tests para User Story 1 (TDD obligatorio en auth + persistencia + flujo crítico)

- [ ] T041 [P] [US1] Vitest contract test para `acceptConsent` en `tests/unit/actions/consent.test.ts`: verifica que falta de `dataUseAccepted` devuelve `ConsentMissing`; que la inserción registra `accepted_terms_at` y `accepted_data_use_at`.
- [ ] T042 [P] [US1] Vitest contract test para `saveAnswer` en `tests/unit/actions/answers.test.ts`: snapshot se setea en primer insert; rate limit 5/min; upsert por (student_id, question_id).
- [ ] T043 [P] [US1] Vitest contract test para `submitPreference` en `tests/unit/actions/preference.test.ts`: rechaza con `QuestionnaireIncomplete` si falta cuestionario; rechaza con `AlreadySubmitted` en segundo intento; valida confianza 1-10 y motivo ≤500.
- [ ] T044 [P] [US1] Vitest integration test para `assignCompareOrderIfMissing` en `tests/integration/compare-order.test.ts` (Supabase local Docker): verifica persistencia y distribución ~50/50 en 1000 iteraciones.
- [ ] T045 [P] [US1] Vitest integration test para `submitQuestionnaire` en `tests/integration/questionnaire-submit.test.ts`: rechaza si faltan respuestas activas; setea `questionnaire_completed_at`.
- [ ] T046 [P] [US1] Playwright E2E happy-path en `tests/e2e/student-flow.spec.ts`: login mockeado → consent (con opt-in marcado) → profile → cuestionario completo → comparador (verifica orden persistente) → preferencia → cierre. Acceptance Scenarios 1-6 de US1. Incluir al menos un caso de error contextual (constitución VI: nunca "Error 500" genérico) verificando que un fallo de server action devuelve mensaje legible al usuario.
- [ ] T046a [P] [US1] Playwright E2E en `tests/e2e/session-expiration.spec.ts` (cubre edge case "Sesión expirada 24h"): estudiante completa profile + 2 preguntas → fuerza expiración de sesión (cookies removed) → vuelve → re-autentica → verifica que `/cuestionario` redirige al step donde quedó sin perder respuestas previas.

### Validation schemas

- [ ] T047 [P] [US1] Crear `lib/validation/consent.schema.ts` con Zod (termsAccepted: literal(true), dataUseAccepted: literal(true), consentVersion: string).
- [ ] T048 [P] [US1] Crear `lib/validation/profile.schema.ts` con Zod (facultad/carrera: string min 2, ciclo: int 1-14, rangoEdad: enum, genero: opcional).
- [ ] T049 [P] [US1] Crear `lib/validation/answer.schema.ts` con discriminated union Zod por `tipo` (likert int 1-5, single string, multiple array, text 1-1000, ranking array sin duplicados, comparison object {keiko, roberto}).
- [ ] T050 [P] [US1] Crear `lib/validation/preference.schema.ts` con Zod (candidatoPreferido enum keiko/roberto/indeciso, confianza int 1-10, motivo opcional ≤500).

### Server actions

- [ ] T051 [US1] Implementar `app/(auth)/consent/_actions.ts` con `acceptConsent({ termsAccepted, dataUseAccepted, consentVersion })` que valida con Zod, inserta en `consent_events`, retorna `Result`.
- [ ] T052 [US1] Implementar `app/(auth)/profile/_actions.ts` con `updateProfile(data)` que valida y hace UPDATE en `profiles`. Incluye `requestDataDeletion()` para self-service Ley 29733 (FR-041).
- [ ] T053 [US1] Implementar `app/(student)/cuestionario/_actions.ts` con `saveAnswer({ questionId, valor })` (upsert con snapshot, rate-limit 5/min) y `submitQuestionnaire()` (valida completitud, setea `questionnaire_completed_at`).
- [ ] T054 [US1] Implementar `app/(student)/comparador/_actions.ts` con `assignCompareOrderIfMissing()` idempotente usando función `assign_compare_order_random()` de DB.
- [ ] T055 [US1] Implementar `app/(student)/preferencia/_actions.ts` con `submitPreference({ candidatoPreferido, confianza, motivo? })` que verifica Turnstile, inserta una sola vez, copia `compare_order_at_submit` desde `profiles.compare_order`.

### UI: Auth & consent

- [ ] T056 [US1] Implementar `app/(auth)/login/page.tsx` con botones Google + Microsoft + formulario email/password. Integrar Turnstile invisible. Diseño per `docs/design.md`.
- [ ] T057 [US1] Implementar `app/(auth)/auth/callback/route.ts` que intercambia OAuth code → session, verifica `allowed_teachers`, redirige a `/consent` o `/dashboard` según rol.
- [ ] T058 [US1] Implementar `app/(auth)/consent/page.tsx` con texto legal completo (Ley 29733 + finalidad + retención 12m + anonimización) y dos checkboxes obligatorios (no pre-marcados). Versión `'v1'`.
- [ ] T059 [US1] Implementar `app/(auth)/profile/page.tsx` con React Hook Form + zodResolver, campos facultad/carrera/ciclo/rangoEdad/genero. Listas de facultades/carreras UPAO desde `lib/constants/upao.ts`.
- [ ] T060 [P] [US1] Crear `lib/constants/upao.ts` con listas oficiales de facultades y carreras de UPAO (Trujillo), enum de rangos de edad y géneros.

### UI: Cuestionario

- [ ] T061 [US1] Implementar `app/(student)/cuestionario/page.tsx` RSC que lee `profiles.current_step` y redirige a `/cuestionario/[step]`. Bloquea acceso si consent o profile incompletos.
- [ ] T062 [US1] Implementar `app/(student)/cuestionario/[step]/page.tsx` RSC que fetcha la pregunta correspondiente y respuesta previa (si hay), renderiza el componente por tipo.
- [ ] T063 [US1] Implementar `components/questionnaire/MultiStepForm.tsx` (client component) con autosave debounced (700ms), avance/retroceso, persistencia de `current_step`.
- [ ] T064 [P] [US1] Implementar `components/questionnaire/types/LikertInput.tsx` (escala 1-5 con etiquetas neutrales).
- [ ] T065 [P] [US1] Implementar `components/questionnaire/types/SingleChoice.tsx`.
- [ ] T066 [P] [US1] Implementar `components/questionnaire/types/MultipleChoice.tsx`.
- [ ] T067 [P] [US1] Implementar `components/questionnaire/types/TextInput.tsx` con contador 0/1000 y sanitización XSS.
- [ ] T068 [P] [US1] Implementar `components/questionnaire/types/RankingInput.tsx` con dnd-kit.
- [ ] T069 [P] [US1] Implementar `components/questionnaire/types/ComparisonInput.tsx` (Keiko vs Roberto, sliders por dimensión).
- [ ] T070 [P] [US1] Implementar `components/questionnaire/ProgressBar.tsx` y `components/questionnaire/OfflineIndicator.tsx` (escucha `window.online/offline`).

### UI: Comparador

- [ ] T071 [US1] Implementar `app/(student)/comparador/page.tsx` RSC que: verifica `questionnaire_completed_at`, invoca `assignCompareOrderIfMissing`, fetcha `candidates` + `plan_dimensions`. Bloquea con mensaje contextual si cuestionario incompleto (FR-013, edge case).
- [ ] T072 [US1] Implementar `components/compare/SplitView.tsx` que aplica `profiles.compare_order` para decidir columna izquierda/derecha.
- [ ] T073 [P] [US1] Implementar `components/compare/CandidateColumn.tsx` con foto, nombre completo, partido, tinte de partido sutil (5-10%), link de descarga PDF (FR-019).
- [ ] T074 [P] [US1] Implementar `components/compare/DimensionTabs.tsx` con 4 tabs (Social/Económica/Ambiental/Institucional), cada tab muestra Problema/Objetivo/Indicador/Meta del candidato. Si campo `null` → render "No declarado por el JNE" (FR-018).
- [ ] T075 [P] [US1] Aplicar tilt 3D suave en cards (`react-tilt` max 8deg) y microinteractions (ripple, magnetic buttons) según `docs/design.md`.
- [ ] T076 [P] [US1] Implementar skeleton shimmer con frases rotatorias contextuales ("Consultando JNE...", "Cargando propuestas...") en `components/compare/Skeleton.tsx`.

### UI: Preferencia y cierre

- [ ] T077 [US1] Implementar `app/(student)/preferencia/page.tsx` RSC: si ya existe row en `preferences` para el estudiante, redirige a `/cierre` (edge case "intenta cambiar preferencia ya enviada"); si no, renderiza formulario.
- [ ] T078 [US1] Implementar `components/preference/PreferenceForm.tsx` con select candidato (keiko/roberto/indeciso), `components/preference/ConfidenceSlider.tsx` (1-10), textarea motivo opcional ≤500 chars con contador. Turnstile invisible.
- [ ] T079 [US1] Implementar `app/(student)/cierre/page.tsx` que muestra resumen de las respuestas del estudiante + agradecimiento. Sin agregados de otros (FR-022).

**Checkpoint**: US1 funcional end-to-end. **MVP entregable**. Validar acceptance scenarios 1-6 de la spec.

---

## Phase 4: User Story 2 — Docente analiza resultados en dashboard (Priority: P2)

**Goal**: el docente con rol `teacher` accede a `/dashboard`, ve KPIs y gráficos, aplica filtros reactivos, y exporta en 4 formatos (CSV, XLSX, HTML para Canva, ZIP Power BI) con toggles de anonimización.

**Independent Test**: con respuestas seedeadas en DB (pueden ser sintéticas o de US1), un usuario con rol `teacher` ingresa al dashboard, ve KPIs y gráficos, filtra y exporta. No requiere que US1 esté completo a nivel UI (solo data).

### Tests para User Story 2

- [ ] T080 [P] [US2] Vitest unit tests para `lib/dashboard/aggregations.ts` en `tests/unit/dashboard/aggregations.test.ts`: KPIs correctos con fixtures.
- [ ] T081 [P] [US2] Vitest integration test en `tests/integration/dashboard-views.test.ts` (Supabase local): inserta 50 estudiantes con respuestas y preferencias, refresca vistas materializadas, verifica resultados.
- [ ] T082 [P] [US2] Vitest unit tests para los 4 generadores de export en `tests/unit/export/csv.test.ts`, `xlsx.test.ts`, `html-canva.test.ts`, `powerbi.test.ts`. Cada uno verifica esquema, anonimización y dataset vacío.
- [ ] T083 [P] [US2] Playwright E2E en `tests/e2e/teacher-dashboard.spec.ts`: login teacher → `/dashboard` → aplica filtros → exporta 4 formatos → verifica archivos descargados y contenido.
- [ ] T084 [P] [US2] Playwright E2E en `tests/e2e/dashboard-access-denied.spec.ts`: estudiante intenta acceder a `/dashboard` → recibe mensaje de acceso denegado y redirect (acceptance 6 de US2).

### Dashboard core

- [ ] T085 [US2] Implementar `app/(teacher)/dashboard/layout.tsx` con guard de rol (redirect a `/cierre` si student, a `/login` si no autenticado).
- [ ] T086 [US2] Implementar `app/(teacher)/dashboard/page.tsx` RSC que parsea filtros desde searchParams, llama `lib/dashboard/queries.ts`, renderiza sections de KPIs y charts.
- [ ] T087 [P] [US2] Implementar `lib/dashboard/aggregations.ts` con cálculos de KPIs (inscritos, completados, % avance, distribución preferencia, confianza promedio).
- [ ] T088 [P] [US2] Implementar `lib/dashboard/filters.ts` parser tipado de SearchParams a `DashboardFilters`.
- [ ] T089 [P] [US2] Implementar `lib/dashboard/queries.ts` con queries Postgres parametrizadas usando service-role solo en el server.
- [ ] T090 [US2] Implementar `components/dashboard/Filters.tsx` (client component) con `Select` de facultad/carrera/ciclo + DatePickerRange. Sync con query params via `router.replace`.
- [ ] T091 [P] [US2] Implementar `components/dashboard/KpiCards.tsx` con Tremor Card grid (4-6 KPIs principales). KPIs obligatorios: `total_inscritos`, `total_completaron_cuestionario`, `total_declararon_preferencia`, `total_completaron_sin_preferencia` (= completados − preferencias, cubre edge case "completó cuestionario sin preferencia"), `pct_avance`, `confianza_promedio`.
- [ ] T092 [P] [US2] Implementar `components/dashboard/PreferenceDonut.tsx` (Recharts donut keiko/roberto/indeciso) con colores `--candidate-keiko`, `--candidate-roberto`, gris para indeciso.
- [ ] T093 [P] [US2] Implementar `components/dashboard/TimeEvolution.tsx` (Recharts line chart por día/semana).
- [ ] T094 [P] [US2] Implementar `components/dashboard/CrossByCareer.tsx` (Tremor stacked bar — preferencia × carrera).
- [ ] T095 [P] [US2] Implementar `components/dashboard/OrderEffectChart.tsx` (control de sesgo Q4): muestra preferencia × `compare_order_at_submit`.
- [ ] T096 [P] [US2] Implementar `components/dashboard/MotiveCloud.tsx`: tokeniza `preferences.motivo` por espacios, filtra stopwords en español (lista en `lib/dashboard/stopwords-es.ts`), excluye tokens < 4 chars, agrupa por lema simple (lowercase + sin acentos), muestra top 20 por frecuencia como badges con tamaño proporcional. Sin NLP semántico (queda para v2).
- [ ] T097 [US2] Implementar server action `refreshDashboardViews()` en `app/(teacher)/dashboard/_actions.ts` que ejecuta `REFRESH MATERIALIZED VIEW CONCURRENTLY`. Rate-limit 1/min global.

### Exports

- [ ] T098 [P] [US2] Implementar `lib/export/anonymize.ts` con toggles `none`/`pseudonym`/`full` aplicables a cualquier dataset.
- [ ] T099 [P] [US2] Implementar `lib/export/csv.ts` con `papaparse`, UTF-8 BOM, headers válidos + mensaje "sin datos aún" si vacío (FR-029).
- [ ] T100 [P] [US2] Implementar `lib/export/xlsx.ts` con `exceljs`: 3 hojas (Respuestas, Preferencias, KPIs), freeze pane, header navy + white, anchos auto.
- [ ] T101 [P] [US2] Implementar `lib/export/html-canva.ts` que genera HTML autocontenido (CSS inline, SVG embebido, `<script type="application/json">` con dataset), bloques con `data-canva-block` (FR-028a).
- [ ] T102 [P] [US2] Implementar `lib/export/powerbi.ts` que genera ZIP con `dashboard.pbids` + 3 CSVs (respuestas, preferencias, kpis) (FR-028b).
- [ ] T103 [P] [US2] Implementar `app/api/export/csv/route.ts` (GET con query params para filtros + anonymize).
- [ ] T104 [P] [US2] Implementar `app/api/export/xlsx/route.ts`.
- [ ] T105 [P] [US2] Implementar `app/api/export/html/route.ts`.
- [ ] T106 [P] [US2] Implementar `app/api/export/powerbi/route.ts` (devuelve ZIP).
- [ ] T107 [US2] Implementar `app/(teacher)/dashboard/export/page.tsx` con UI de selección: formato (radio 4 opciones), anonimización (radio 3 opciones), filtros heredados de la página actual.

**Checkpoint**: US2 funcional. Docente puede ver dashboard y exportar en los 4 formatos. Validar acceptance scenarios 1-6 de US2.

---

## Phase 5: User Story 3 — Administrador gestiona preguntas (Priority: P3)

**Goal**: un admin puede crear, editar, reordenar, activar/desactivar preguntas desde `/admin/preguntas`. Las respuestas históricas conservan el snapshot del enunciado original.

**Independent Test**: con base sembrada, un admin edita el texto de una pregunta y verifica que estudiantes nuevos vean el cambio pero respuestas previas conserven snapshot.

### Tests para User Story 3

- [ ] T108 [P] [US3] Vitest integration test en `tests/integration/questions-snapshot.test.ts`: crea estudiante con respuesta a pregunta X, admin edita pregunta X, verifica que `answers.question_snapshot` conserva el texto original (FR-032).
- [ ] T109 [P] [US3] Playwright E2E en `tests/e2e/admin-questions.spec.ts`: admin crea pregunta nueva, edita texto, reordena, desactiva. Verifica acceptance scenarios 1-3 de US3.

### Validation & actions

- [ ] T110 [P] [US3] Crear `lib/validation/question.schema.ts` con Zod (orden, dimension_tematica enum, tipo enum, enunciado 1-500, opciones JSON según tipo con `superRefine` cross-row).
- [ ] T111 [US3] Implementar server actions en `app/(admin)/admin/preguntas/_actions.ts`: `createQuestion`, `updateQuestion(id, partial)`, `reorderQuestions(idsInOrder)` en transacción, `toggleQuestionActive(id, active)`.

### UI

- [ ] T112 [US3] Implementar `app/(admin)/admin/preguntas/page.tsx` RSC con listado de preguntas + filtros (activo/inactivo, dimensión).
- [ ] T113 [US3] Implementar `app/(admin)/admin/preguntas/nueva/page.tsx` con formulario `QuestionEditor`.
- [ ] T114 [US3] Implementar `app/(admin)/admin/preguntas/[id]/page.tsx` (edit) con preview del cambio antes de guardar.
- [ ] T115 [US3] Implementar `components/admin/QuestionEditor.tsx` con switch dinámico por tipo: para `likert`/`single`/`multiple`/`ranking`/`comparison` muestra editor JSON estructurado de opciones; para `text` solo enunciado.
- [ ] T116 [US3] Implementar `components/admin/QuestionList.tsx` con dnd-kit para drag-and-drop reordenado + toggle activo.

### Gestión de docentes (relacionada con US3)

- [ ] T117 [US3] Implementar server actions `addAllowedTeacher`, `removeAllowedTeacher`, `demoteTeacher(userId)` en `app/(admin)/admin/teachers/_actions.ts`.
- [ ] T118 [US3] Implementar `app/(admin)/admin/teachers/page.tsx` con CRUD UI sobre `allowed_teachers`.
- [ ] T119 [US3] Implementar script CLI `scripts/add-teacher.ts` (`pnpm run add-teacher -- --email x --note y`) referenciado en quickstart.md.

**Checkpoint**: US3 funcional. Admin gestiona preguntas y docentes. Validar acceptance scenarios 1-3 de US3.

---

## Phase 6: User Story 4 — Mantenimiento automático de data JNE (Priority: P3)

**Goal**: Vercel Cron refresca la data JNE cada 24h. El admin puede disparar refresh manual. Si JNE falla, sirve la copia válida y registra incidente.

**Independent Test**: ejecutar `pnpm run jne:refresh` actualiza la base con la última versión del JNE y se registra entrada en `jne_refresh_log`.

### Tests para User Story 4

- [ ] T120 [P] [US4] Vitest unit test en `tests/unit/jne/client.test.ts` con `msw` mockeando JNE: 401 → reintenta con token nuevo; 5xx → 3 retries con backoff; schema mismatch → no escribe DB y lanza `JneSchemaError`.
- [ ] T121 [P] [US4] Vitest integration test en `tests/integration/jne-refresh.test.ts`: simula API JNE con MSW, ejecuta `jneRefresh()`, verifica upsert correcto en `candidates`, `plans`, `plan_dimensions` + entrada en `jne_refresh_log`.
- [ ] T122 [P] [US4] Vitest integration test en `tests/integration/jne-failure.test.ts`: API JNE devuelve 500 sostenido, verifica que copia previa en DB queda intacta y log registra incident con `status='failed'`.

### Implementation

- [ ] T123 [P] [US4] Implementar Zod schemas en `lib/jne/schemas.ts` (`JnePlanHeaderSchema`, `JnePlanDimensionSchema` length 4, `JnePlanDetalleSchema`, `JneFormulaSchema`).
- [ ] T124 [P] [US4] Implementar TypeScript types en `lib/jne/types.ts` derivados de los Zod schemas con `z.infer`.
- [ ] T125 [US4] Implementar `lib/jne/client.ts` con `JneClient` class: `getToken(force?)`, `getPlanHeader(idOrgPol)`, `getPlanDetalle(idPlan)`, `getFormula(idOrgPol)`. Retry exponencial (1s/2s/4s), timeout 10s con AbortController, refresh automático en 401.
- [ ] T126 [US4] Implementar `lib/jne/refresh.ts` con `jneRefresh({ triggeredBy })` que orquesta: getToken → getPlanDetalle(Keiko) → getPlanDetalle(Roberto) → upsert tablas → escribe log.
- [ ] T127 [US4] Implementar `lib/jne/cache.ts` con fallback: si refresh falla, lee última copia válida de DB y la devuelve al comparador sin error (FR-035).
- [ ] T128 [P] [US4] Implementar `app/api/cron/jne-refresh/route.ts` (Vercel Cron handler) con auth header `Bearer ${CRON_SECRET}`. Invoca `jneRefresh({ triggeredBy: 'cron' })`.
- [ ] T129 [P] [US4] Implementar `app/api/jne/refresh/route.ts` (manual admin handler) con middleware role `admin`. Invoca `jneRefresh({ triggeredBy: 'admin' })` y devuelve JSON con resultado.
- [ ] T130 [US4] Implementar `app/(admin)/admin/jne/page.tsx` con botón "Refrescar ahora" + tabla con últimas N entradas de `jne_refresh_log` + estado actual.
- [ ] T131 [US4] Implementar server action `refreshJneNow()` en `app/(admin)/admin/jne/_actions.ts` que dispara el handler.
- [ ] T132 [US4] Implementar server action `setCicloCierre(date)` + UI en `app/(admin)/admin/page.tsx` con date picker para configurar `app_settings.ciclo_cierre_at`.
- [ ] T133 [P] [US4] Implementar script CLI `scripts/run-jne-refresh.ts` (`pnpm run jne:refresh`) que invoca `jneRefresh()` desde terminal para diagnóstico.

**Checkpoint**: US4 funcional. JNE se refresca automáticamente cada 24h y manualmente desde admin. Validar acceptance scenarios 1-3 de US4.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: cumplimiento Ley 29733 (retención + anonimización), landing/marketing, performance, accesibilidad, banco de preguntas inicial, scripts operacionales, validación final.

### Retención y anonimización (Ley 29733)

- [ ] T134 [P] Implementar `lib/retention/anonymize.ts` con función `anonymizeExpired()`: lee `app_settings.ciclo_cierre_at`, calcula threshold (cutoff - 12m), UPDATE `profiles` (email/nombres/apellidos = NULL, is_anonymized = true), insert en `anonymization_log`. Atómico en una transacción.
- [ ] T135 [P] Implementar `lib/retention/delete-request.ts` para self-service inmediato del estudiante (FR-041).
- [ ] T136 Implementar `app/api/cron/anonymize/route.ts` con auth header `Bearer ${CRON_SECRET}`. Funciona como heartbeat mensual: verifica si `ciclo_cierre_at + 12 meses < NOW()`; si todavía no, termina sin tocar nada. Si ya pasó, invoca `anonymizeExpired({ executor: 'cron' })` que anonimiza todos los perfiles pendientes en una sola pasada.
- [ ] T137 [P] Vitest integration test en `tests/integration/anonymization.test.ts` con 3 casos: (1) threshold no alcanzado → 0 perfiles anonimizados; (2) threshold alcanzado → todos los perfiles con `is_anonymized=false` se anonimizan en una pasada y queries agregadas siguen contando los registros; (3) idempotencia → segunda ejecución no afecta nada.
- [ ] T138 [P] Script CLI `scripts/run-anonymization.ts` con flags `--dry-run` para preview (`pnpm run anonymize:dry-run`) y ejecución real (`pnpm run anonymize`).

### Landing y marketing

- [ ] T139 Implementar `app/(marketing)/page.tsx` con hero asimétrico per `docs/design.md`: H1 izquierda con display serif (Migra/Cormorant), Ángel de Trujillo SVG estilizado derecha con GSAP ScrollTrigger (pinning + parallax + text-mask reveal).
- [ ] T140 [P] Implementar `components/landing/Hero.tsx` con magnetic buttons (cursor atrae el botón ~6px).
- [ ] T141 [P] Implementar `components/landing/AngelOrnament.tsx` (SVG single-line, trazo navy + cyan eléctrico, animado con `stroke-dasharray`).
- [ ] T142 [P] Implementar `app/(marketing)/como-funciona/page.tsx` con sticky scroll storytelling explicando el flujo de 4 pasos.
- [ ] T143 [P] Implementar `components/motion/CustomCursor.tsx` (dot + ring delayed, transforma sobre clickeables/links/cards, solo activado en `pointer: fine`).

### Banco de preguntas inicial

- [ ] T144 Generar `data/questions/draft_v1.md` con 12 preguntas distribuidas en las 4 dimensiones JNE (3 por dimensión: Social, Económica, Ambiental, Institucional). Cada pregunta incluye: enunciado neutral, tipo apropiado, opciones si aplica, y fuente verificable inline (IPE, BCRP, ENAHO, planes JNE oficiales, debates legislativos 2024-2026). Tiempo estimado de respuesta 5-7 min.
- [ ] T145 Implementar `scripts/seed-questions.ts` que parsea `data/questions/draft_v1.md` y hace upsert en `questions`. Comando `pnpm run seed:questions`.

### Performance y accesibilidad

- [ ] T146 [P] Optimizar bundle: `next/dynamic` para GSAP solo en hero, font subset latin-extended (Migra/Geist), `next/image` para fotos candidatos desde Supabase Storage.
- [ ] T147 [P] Correr Lighthouse audit en `/`, `/comparador`, `/dashboard`. Ajustar hasta llegar a ≥90 en Performance, Accessibility, Best Practices, SEO (constitución V).
- [ ] T148 [P] Correr axe-core accessibility audit + check manual de keyboard navigation completo. Corregir issues hasta WCAG 2.2 AA mínimo.

### Observabilidad

- [ ] T149 [P] Configurar Sentry release tracking en CI con `@sentry/cli` y upload de source maps tras build.
- [ ] T150 [P] Completar catálogo PostHog en `lib/analytics/events.ts` y emitir eventos en puntos clave: `questionnaire_started`, `questionnaire_step_advanced`, `questionnaire_completed`, `comparator_viewed` (timestamp on mount), `comparator_time_spent` (en `beforeunload` o al `submitPreference`, con `duration_ms` calculado desde `comparator_viewed` — soporta SC-004 mediana ≥4 min), `compare_order_assigned`, `preference_submitted`, `dashboard_export`. Confirmar que ninguno incluye PII.

### Operational tooling

- [ ] T151 [P] Implementar `scripts/export-cli.ts` (`pnpm run export -- --format csv --anonymize pseudonym --out ./tmp`) que invoca los exports sin pasar por el browser.
- [ ] T152 [P] Completar todos los scripts en `package.json`: `dev`, `build`, `start`, `lint`, `tsc`, `test`, `test:watch`, `e2e`, `db:types`, `seed:questions`, `add-teacher`, `jne:refresh`, `anonymize`, `anonymize:dry-run`, `export`.

### Security & final validation

- [ ] T153 Correr `/security-review` antes del primer merge a main per constitución (revisar RLS policies, sanitización, exposición de service-role, secrets en logs). Comando manual. Checks adicionales para FR-040 (cifrado): verificar TLS 1.2+ en producción Vercel, RLS habilitado en todas las tablas que tocan `auth.users`, encryption at rest activado en Supabase Dashboard (default en plan paid; documentar si se usa free tier).
- [ ] T154 Validar `quickstart.md` end-to-end: clonar repo en máquina limpia, seguir pasos, confirmar que dev tiene app corriendo en < 15 min.
- [ ] T155 Verificar que CI corre los 4 checks (`lint`, `tsc`, `test`, `e2e`) en verde en PR.
- [ ] T156 [P] Deploy preview a Vercel y verificar que Sentry/PostHog capturan eventos en staging.
- [ ] T157 Verificar que el deploy de producción honra Vercel Cron (`/api/cron/jne-refresh` y `/api/cron/anonymize`) — al menos un trigger manual con secret antes del primer ciclo programado.
- [ ] T158 [P] Crear smoke load test con k6 en `tests/load/student-flow.js` que simula 500 estudiantes concurrentes ejecutando: login → consent → 3 respuestas → comparador → preferencia. Objetivo: validar SC-008 (< 2s p95) y FR-043. Ejecución manual previa al lanzamiento. Documentar en `quickstart.md` cómo correrlo (`pnpm run load-test`).

---

## Dependencies & Execution Order

### Phase dependencies

- **Setup (Phase 1)**: sin dependencias — puede comenzar de inmediato.
- **Foundational (Phase 2)**: depende de Setup completo. **Bloquea todas las user stories.**
- **User Stories (Phase 3-6)**: dependen de Foundational completo.
  - Pueden ejecutarse en paralelo si hay equipo, o secuencialmente por prioridad (US1 → US2 → US3 → US4).
- **Polish (Phase 7)**: depende de US1 (consent + retención requiere flujo estudiante), US2 (export validation requiere dashboard), US3 (seed questions usable desde admin), US4 (JNE estable). Algunas tareas P aisladas pueden adelantarse.

### User story dependencies

- **US1 (P1)**: solo Foundational. Independiente de US2/US3/US4. **MVP entregable solo con US1.**
- **US2 (P2)**: solo Foundational. Para validación end-to-end del dashboard conviene tener data; puede usar seeds sintéticos para no esperar US1.
- **US3 (P3)**: solo Foundational. Independiente.
- **US4 (P3)**: solo Foundational. Independiente. La seed inicial de migración (`0005_seed_jne.sql`) cubre el caso "sin US4" para que US1 y US2 funcionen.

### Within each user story

- Tests (TDD) PRIMERO — deben fallar antes de implementar.
- Validation schemas (Zod) antes que server actions.
- Server actions antes que UI consumers.
- RSC pages antes que client components que reciben props.
- Story completa antes de avanzar a la siguiente en delivery secuencial.

### Parallel opportunities

- **Setup**: T002-T012 todos paralelizables (archivos distintos).
- **Foundational**: T020-T035 (clients + helpers) todos paralelizables. T013-T019 secuenciales por dependencias SQL.
- **US1 tests** (T041-T046): paralelos entre sí.
- **US1 schemas** (T047-T050): paralelos.
- **US1 question type components** (T064-T069): paralelos.
- **US1 compare children** (T073-T076): paralelos.
- **US2 export libs** (T098-T102): paralelos.
- **US2 dashboard chart components** (T091-T096): paralelos.
- **US2 export route handlers** (T103-T106): paralelos.
- **US4 client + types + schemas** (T123-T124): paralelos.
- **Polish landing components** (T140-T143): paralelos.

---

## Parallel Example: User Story 1

```bash
# Test phase (TDD): lanzar todos los tests US1 en paralelo
Task: "Vitest contract test acceptConsent in tests/unit/actions/consent.test.ts"
Task: "Vitest contract test saveAnswer in tests/unit/actions/answers.test.ts"
Task: "Vitest contract test submitPreference in tests/unit/actions/preference.test.ts"
Task: "Vitest integration test compare-order in tests/integration/compare-order.test.ts"
Task: "Playwright E2E student-flow in tests/e2e/student-flow.spec.ts"

# Validation phase: schemas Zod en paralelo
Task: "Zod schema consent in lib/validation/consent.schema.ts"
Task: "Zod schema profile in lib/validation/profile.schema.ts"
Task: "Zod schema answer in lib/validation/answer.schema.ts"
Task: "Zod schema preference in lib/validation/preference.schema.ts"

# UI question types: 6 componentes en paralelo
Task: "LikertInput in components/questionnaire/types/LikertInput.tsx"
Task: "SingleChoice in components/questionnaire/types/SingleChoice.tsx"
Task: "MultipleChoice in components/questionnaire/types/MultipleChoice.tsx"
Task: "TextInput in components/questionnaire/types/TextInput.tsx"
Task: "RankingInput in components/questionnaire/types/RankingInput.tsx"
Task: "ComparisonInput in components/questionnaire/types/ComparisonInput.tsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Completar Phase 1: Setup (T001-T012).
2. Completar Phase 2: Foundational (T013-T040). **Bloquea todo.**
3. Completar Phase 3: User Story 1 (T041-T079).
4. **PARAR Y VALIDAR**: correr E2E + acceptance scenarios 1-6 de US1. Deploy preview a Vercel.
5. Generar seed de preguntas (T144-T145) si no se hizo todavía — necesario para US1 funcional.
6. Demo: estudiante completa flujo entero.

**Resultado**: MVP funcional. El docente puede revisar respuestas en Supabase Studio si el dashboard aún no existe.

### Incremental Delivery

1. **MVP**: Setup + Foundational + US1 + seed questions + retención básica → Demo a Rodrigo.
2. **+ Dashboard**: añadir US2 → Demo al docente con sus exports.
3. **+ Admin**: añadir US3 → docente puede editar preguntas sin pedirle a Rodrigo.
4. **+ JNE auto**: añadir US4 → producción autónoma 3 semanas.
5. **+ Polish**: landing pulida + Lighthouse + accesibilidad + security review.

### Parallel Team Strategy

Con 2-3 desarrolladores tras Foundational completo:

- Dev A: US1 (corazón del producto, P1, mayor superficie).
- Dev B: US2 (dashboard + exports) o US3 (admin) en paralelo.
- Dev C: US4 (JNE refresh) + Polish (retención, landing) en paralelo si hay capacidad.

Las stories son lo suficientemente independientes para evitar conflictos en archivos críticos. Coordinación principal: schemas DB (`supabase/migrations/`) y middleware.

---

## Notas

- **[P] = archivos distintos, sin dependencia incompleta**. Verifique antes de paralelizar.
- **[Story]** mapea task → user story para traceability.
- **TDD obligatorio en auth, persistencia, dashboard, export** (constitución IV). Tests deben fallar antes de implementar.
- **No mockear DB en integration**: usar Supabase local con Docker (CLAUDE.md regla, constitución III implícita).
- **Avisar al usuario cuando se requiera acción manual**: rotar `CRON_SECRET`, configurar OAuth providers en Supabase Dashboard, ajustar `app_settings.ciclo_cierre_at` antes del primer cron de anonimización.
- **Conmit después de cada task o grupo lógico**. Aprovechar hooks `after_implement` para auto-commit.
- **Stop en checkpoints**: tras US1 completo, validar acceptance scenarios antes de seguir.
- **Evitar**: vague tasks, conflictos en mismo archivo entre tareas [P], dependencias cross-story que rompan independencia.

---

## Resumen del backlog

| Phase | Tasks | Story label |
|---|---|---|
| Phase 1 — Setup | T001–T012 (12 tareas) | — |
| Phase 2 — Foundational | T013–T040 (28 tareas) | — |
| Phase 3 — US1 (P1 MVP) | T041–T079 + T046a (40 tareas) | US1 |
| Phase 4 — US2 (P2) | T080–T107 (28 tareas) | US2 |
| Phase 5 — US3 (P3) | T108–T119 (12 tareas) | US3 |
| Phase 6 — US4 (P3) | T120–T133 (14 tareas) | US4 |
| Phase 7 — Polish | T134–T158 (25 tareas) | — |
| **Total** | **159 tareas** | |

**MVP (Setup + Foundational + US1 + seed questions + retention basics)**: aproximadamente 86 tareas, entregable independiente.
