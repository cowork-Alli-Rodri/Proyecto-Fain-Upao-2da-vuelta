---

description: "Task list — Voto Informado UPAO Segunda Vuelta 2026"
---

# Tasks: Voto Informado UPAO — Webapp Segunda Vuelta 2026

**Input**: Design documents from `/specs/001-voto-informado-upao/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/*, quickstart.md (todos presentes)

**Tests**: Incluidos. La constitución (principio IV) manda TDD en flujos críticos — auth, persistencia de respuestas, cálculos del dashboard, export al docente — y E2E Playwright en happy-paths.

**Organization**: agrupado por user story (US1=P1 MVP, US2=P2, US3=P3, US4=P3) para entregar incrementos independientemente testables y desplegables.

## Cambios de producto post-spec (registro)

Decisiones tomadas después de la spec original. El spec.md y data-model.md no fueron reescritos por costo/beneficio, pero quedan documentadas aquí y reflejadas en el código:

- **Comparador removido del flow estudiante**. Las rutas `app/(student)/comparador/*` fueron eliminadas. El contenido equivalente vive como página marketing pública en `app/(marketing)/candidatos/`. Impacto: T071-T076 quedan como "implementado y luego movido"; el flow estudiante ahora es `consent → profile → cuestionario → preferencia → cierre`. La encuesta post-flow se añadió en `app/(student)/encuesta-final/`.
- **`compare_order` removido del modelo**. Migration `20260525000001_remove_compare_order.sql` elimina la columna y el ENUM. Los charts/queries de "efecto orden" (T095) quedan obsoletos como artefacto histórico.
- **Fact-check público añadido**. Nueva sección `app/(marketing)/no-te-dejes-sorprender/` + admin en `app/(admin)/admin/fact-checks/` + migration `20260522000003_fact_checks.sql`. Integra Google Fact Check Tools API.
- **Encuesta post-flow añadida** (`app/(student)/encuesta-final/` + migration `20260522000002_post_survey.sql`).
- **Resumen JNE en cache** (migration `20260525000002_jne_resumen.sql`).
- **Drop de tablas obsoletas** (migration `20260526000001_drop_obsolete_tables.sql`).

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

- [X] T041 [P] [US1] `tests/unit/actions/consent.test.ts` — 6 specs sobre `acceptConsent`: ConsentMissing (3 variantes: termsAccepted false / dataUseAccepted false / input vacío), Unauthenticated, happy path con timestamps + ip/ua hasheados + redirect `/profile`, redirect `/cuestionario` cuando profile ya tiene facultad. Mocks de next/headers, next/navigation, supabase server y turnstile vía helper `tests/unit/helpers/supabase-mock.ts`.
- [X] T042 [P] [US1] `tests/unit/actions/answers.test.ts` — 8 specs sobre `saveAnswer`: ValidationError(questionId no-uuid), Unauthenticated, RateLimited (mock 5/min), NotFound (pregunta inactiva), ValidationError(valor incompatible con likert), AlreadySubmitted (questionnaire_completed_at no nulo), primer insert setea question_snapshot/dimension_snapshot/tipo_snapshot, update existente NO toca snapshot.
- [X] T043 [P] [US1] `tests/unit/actions/preference.test.ts` — 8 specs sobre `submitPreference`: ValidationError (candidato fuera de enum, confianza >10, motivo >500), Unauthenticated, RateLimited, QuestionnaireIncomplete, AlreadySubmitted (existe row), happy path inserta `compare_order_at_submit` copiado del profile + redirect `/cierre`.
- [X] T044 [P] [US1] `tests/integration/compare-order.test.ts` con auto-skip sin Supabase local. 2 specs: distribución `assign_compare_order_random()` ~50/50 en 1000 iteraciones (ratio 0.45-0.55), persistencia + idempotencia del valor en `profiles.compare_order`.
- [X] T045 [P] [US1] `tests/integration/questionnaire-submit.test.ts` con auto-skip. 2 specs: con respuestas incompletas `questionnaire_completed_at` debe quedar null; con todas las preguntas activas respondidas, el campo se persiste correctamente.
- [X] T046 [P] [US1] `tests/e2e/student-flow.spec.ts` con auto-skip — happy-path completo login email/password → consent (incluye caso de error contextual sin checkboxes, constitución VI) → profile → cuestionario iterativo → comparador (verifica nombres Keiko + Roberto + tab económica) → preferencia → cierre. Setup vía service role para crear user con email_confirm: true; cleanup borra preferences/answers/consent/auth.
- [X] T046a [P] [US1] `tests/e2e/session-expiration.spec.ts` con 4 specs: 3 públicos (no requieren Supabase: `/cuestionario`, `/comparador`, `/preferencia` redirigen a `/login` con `?next=...` sin sesión) + 1 con Supabase local (estudiante completa profile + 2 respuestas → `clearCookies()` → reintenta `/cuestionario` → redirect a login con next → re-login → respuestas previas siguen en DB).

### Validation schemas

- [X] T047 [P] [US1] `lib/validation/consent.schema.ts` con Zod (termsAccepted: literal(true), dataUseAccepted: literal(true), consentVersion: string).
- [X] T048 [P] [US1] `lib/validation/profile.schema.ts` con Zod (facultad/carrera: string min 2, ciclo: int 1-14, rangoEdad: enum, genero: opcional).
- [X] T049 [P] [US1] `lib/validation/answer.schema.ts` con discriminated union Zod por `tipo` (likert int 1-5, single string, multiple array, text 1-1000, ranking array sin duplicados, comparison object {keiko, roberto}).
- [X] T050 [P] [US1] `lib/validation/preference.schema.ts` con Zod (candidatoPreferido enum keiko/roberto/indeciso, confianza int 1-10, motivo opcional ≤500).

### Server actions

- [X] T051 [US1] `app/(auth)/consent/_actions.ts` con `acceptConsent({ termsAccepted, dataUseAccepted, consentVersion })` que valida con Zod, inserta en `consent_events`, retorna `Result`.
- [X] T052 [US1] `app/(auth)/profile/_actions.ts` con `updateProfile(data)` que valida y hace UPDATE en `profiles`. Incluye `requestDataDeletion()` delegando a `lib/retention/delete-request.ts` (FR-041, refactor de T135).
- [X] T053 [US1] `app/(student)/cuestionario/_actions.ts` con `saveAnswer({ questionId, valor })` (upsert con snapshot, rate-limit 5/min) y `submitQuestionnaire()` (valida completitud, setea `questionnaire_completed_at`).
- [X] T054 [US1] `app/(student)/comparador/_actions.ts` con `assignCompareOrderIfMissing()` idempotente usando función `assign_compare_order_random()` de DB.
- [X] T055 [US1] `app/(student)/preferencia/_actions.ts` con `submitPreference({ candidatoPreferido, confianza, motivo? })` que verifica Turnstile, inserta una sola vez, copia `compare_order_at_submit` desde `profiles.compare_order`.

### UI: Auth & consent

- [X] T056 [US1] `app/(auth)/login/page.tsx` + `_components/LoginCard.tsx` con botones Google + Microsoft + formulario email/password + Turnstile invisible.
- [X] T057 [US1] `app/auth/callback/route.ts` intercambia OAuth code → session, verifica `allowed_teachers`, redirige según rol (renamed del path `app/(auth)/auth/callback` por requerimientos de App Router para rutas API).
- [X] T058 [US1] `app/(auth)/consent/page.tsx` + `_components/ConsentForm.tsx` con texto legal y dos checkboxes obligatorios. Versión `'v1'`.
- [X] T059 [US1] `app/(auth)/profile/page.tsx` + `_components/` con React Hook Form + zodResolver, campos facultad/carrera/ciclo/rangoEdad/genero.
- [X] T060 [P] [US1] `lib/constants/upao.ts` con listas oficiales de facultades y carreras de UPAO, enums de rangos de edad y géneros.

### UI: Cuestionario

- [X] T061 [US1] `app/(student)/cuestionario/page.tsx` RSC redirige a `/cuestionario/[step]`. Bloquea acceso si consent o profile incompletos.
- [X] T062 [US1] `app/(student)/cuestionario/[step]/page.tsx` RSC fetcha la pregunta correspondiente y respuesta previa, renderiza el componente por tipo.
- [X] T063 [US1] `components/questionnaire/MultiStepForm.tsx` (client component) con autosave debounced, avance/retroceso, persistencia de `current_step`. Despacha eventos PostHog `QUESTIONNAIRE_STARTED/STEP_ADVANCED/COMPLETED` (T150).
- [X] T064 [P] [US1] `components/questionnaire/types/LikertInput.tsx` (escala 1-5 con etiquetas neutrales).
- [X] T065 [P] [US1] `components/questionnaire/types/SingleChoice.tsx`.
- [X] T066 [P] [US1] `components/questionnaire/types/MultipleChoice.tsx`.
- [X] T067 [P] [US1] `components/questionnaire/types/TextInput.tsx` con contador 0/1000 y sanitización XSS.
- [X] T068 [P] [US1] `components/questionnaire/types/RankingInput.tsx` con dnd-kit.
- [X] T069 [P] [US1] `components/questionnaire/types/ComparisonInput.tsx` (Keiko vs Roberto, sliders por dimensión).
- [X] T070 [P] [US1] `components/questionnaire/ProgressBar.tsx` + `OfflineIndicator.tsx` + `QuestionRenderer.tsx`.

### UI: Comparador

- [X] T071 [US1] `app/(student)/comparador/page.tsx` RSC verifica `questionnaire_completed_at`, invoca `assignCompareOrderIfMissing`, fetcha `candidates` + `plan_dimensions`.
- [X] T072 [US1] `components/compare/SplitView.tsx` aplica `profiles.compare_order` y maneja el tab bar editorial (4 dimensiones). Despacha `COMPARATOR_VIEWED/DIMENSION_VIEWED/TIME_SPENT` (T150).
- [X] T073 [P] [US1] `components/compare/CandidateColumn.tsx` con foto, nombre completo, partido, tinte de partido sutil, link de descarga PDF (FR-019). Render "No declarado por el JNE" si campo `null` (FR-018).
- [X] T074 [P] [US1] DimensionTabs inline en `SplitView.tsx` (tab bar editorial Social/Económica/Ambiental/Institucional) — no se extrajo a archivo separado por reuso 1-1 con SplitView.
- [X] T075 [P] [US1] CERRADO COMO NO-OP. La ruta `/comparador` fue removida del flow del estudiante; el comparador vive ahora como página de marketing `/candidatos` (`app/(marketing)/candidatos/_components/CandidatosSplitView.tsx`). Las micro-interacciones (tilt/ripple) se evaluarán en esa superficie si métricas lo justifican.
- [X] T076 [P] [US1] Skeleton shimmer integrado vía `Suspense` + `loading.tsx` de Next 16 (RSC streaming). No se creó archivo separado.

### UI: Preferencia y cierre

- [X] T077 [US1] `app/(student)/preferencia/page.tsx` RSC: si ya existe row en `preferences` redirige a `/cierre`; si no, renderiza formulario.
- [X] T078 [US1] `app/(student)/preferencia/_components/PreferenceForm.tsx` con select candidato, confidence slider 1-10 inline, textarea motivo ≤500. Turnstile invisible. (PreferenceForm consolidado, no se extrajo ConfidenceSlider a archivo separado.)
- [X] T079 [US1] `app/(student)/cierre/page.tsx` muestra resumen de respuestas del estudiante + agradecimiento. Sin agregados de otros (FR-022).

**Checkpoint**: US1 funcional end-to-end. **MVP entregable**. Validar acceptance scenarios 1-6 de la spec.

---

## Phase 4: User Story 2 — Docente analiza resultados en dashboard (Priority: P2)

**Goal**: el docente con rol `teacher` accede a `/dashboard`, ve KPIs y gráficos, aplica filtros reactivos, y exporta en 4 formatos (CSV, XLSX, HTML para Canva, ZIP Power BI) con toggles de anonimización.

**Independent Test**: con respuestas seedeadas en DB (pueden ser sintéticas o de US1), un usuario con rol `teacher` ingresa al dashboard, ve KPIs y gráficos, filtra y exporta. No requiere que US1 esté completo a nivel UI (solo data).

### Tests para User Story 2

- [X] T080 [P] [US2] `tests/unit/dashboard/queries.test.ts` — 7 specs sobre `lib/dashboard/queries.ts` (donde quedaron los aggregations consolidados): getKpiSummary con dataset 3 inscritos/2 completados/1 preferencia, dataset vacío (todo en 0 + confianza null), confianza_promedio con redondeo 2 decimales, getPreferenceDistribution (counts + percentages suman 100), getCareerCrosstab ordenado desc por total, getOrderEffect agrupado por (orden, candidato), getTimeSeries bucketizado por día.
- [X] T081 [P] [US2] `tests/integration/dashboard-views.test.ts` con auto-skip sin Supabase local. Inserta 5 estudiantes (1 sin preferencia, 4 con — cubre edge case "completó sin preferencia"), refresca las 4 MVs y verifica `mv_kpis_curso`, `mv_preferencia_por_carrera`, `mv_orden_vs_preferencia`, `mv_evolucion_temporal`.
- [X] T082 [P] [US2] 4 archivos unit en `tests/unit/export/` (`csv.test.ts` 6 specs, `xlsx.test.ts` 6 specs, `html-canva.test.ts` 6 specs, `powerbi.test.ts` 5 specs) + fixtures compartidas en `tests/unit/export/fixtures.ts`. Cada formato verifica: esquema (headers/columnas), anonimización (modos `none` / `pseudonym` / `full`), dataset vacío con "sin datos aún" (FR-029) y escape de caracteres peligrosos donde aplica.
- [X] T083 [P] [US2] `tests/e2e/teacher-dashboard.spec.ts` con auto-skip — 6 specs: setup teacher vía allowed_teachers + service role, sembra 3 estudiantes con preferencias, valida KPIs visibles (Inscritos/Completaron/Preferencias) + nombres Keiko/Roberto, sync de filtros con querystring, descarga CSV/XLSX/HTML/ZIP.
- [X] T084 [P] [US2] `tests/e2e/dashboard-access-denied.spec.ts` — 3 specs: 2 públicos (`/dashboard` y `/dashboard/export` sin sesión → `/login` con `?next=...`) + 1 con Supabase local (student logueado intenta `/dashboard` → redirect, no ve KPIs del docente).

### Dashboard core

- [X] T085 [US2] `app/(teacher)/dashboard/layout.tsx` con guard de rol (redirect a `/cierre` si student, a `/login` si no autenticado).
- [X] T086 [US2] `app/(teacher)/dashboard/page.tsx` RSC parsea filtros desde searchParams, llama `lib/dashboard/queries.ts`, renderiza sections de KPIs y charts.
- [X] T087 [P] [US2] Cálculos de KPIs consolidados en `lib/dashboard/queries.ts` (no se extrajo `aggregations.ts` por dependencias muy fuertes con las queries: `total_inscritos`, `total_completaron_cuestionario`, `total_declararon_preferencia`, `total_completaron_sin_preferencia`, `pct_avance`, `confianza_promedio`).
- [X] T088 [P] [US2] `lib/dashboard/filters.ts` parser tipado de SearchParams a `DashboardFilters`.
- [X] T089 [P] [US2] `lib/dashboard/queries.ts` con queries Postgres parametrizadas usando service-role solo en el server.
- [X] T090 [US2] `components/dashboard/FiltersBar.tsx` (renamed de `Filters.tsx`) client component con `Select` de facultad/carrera/ciclo + DatePickerRange. Sync con query params via `router.replace`.
- [X] T091 [P] [US2] `components/dashboard/KpiGrid.tsx` (renamed de `KpiCards.tsx`) con Tremor Card grid de los 6 KPIs.
- [X] T092 [P] [US2] `components/dashboard/PreferenceDonut.tsx` (Recharts donut keiko/roberto/indeciso) con colores de candidato.
- [X] T093 [P] [US2] `components/dashboard/TimeEvolution.tsx` (Recharts line chart por día/semana).
- [X] T094 [P] [US2] `components/dashboard/CareerCrosstab.tsx` (renamed de `CrossByCareer.tsx`) Tremor stacked bar preferencia × carrera.
- [X] T095 [P] [US2] `components/dashboard/OrderEffectChart.tsx` (control de sesgo Q4) preferencia × `compare_order_at_submit`.
- [X] T096 [P] [US2] CERRADO COMO NO-OP. `MotiveCloud` no se implementa: con dataset chico (<200 motivos) la nube agrega ruido sin insight. Reabrir post-lanzamiento solo si el docente lo pide explícitamente.
- [X] T097 [US2] CERRADO COMO NO-OP. `refreshDashboardViews()` server action no se necesita: las MVs se refrescan vía triggers en write paths. Reabrir solo si el docente reporta data desfasada.

### Exports

- [X] T098 [P] [US2] Anonimización consolidada en `lib/export/dataset.ts` con type `AnonymizeMode = "none" | "pseudonym" | "full"` aplicado a cualquier dataset. No se extrajo `lib/export/anonymize.ts` separado.
- [X] T099 [P] [US2] `lib/export/csv.ts` con `papaparse`, UTF-8 BOM, headers válidos + mensaje "sin datos aún" si vacío (FR-029).
- [X] T100 [P] [US2] `lib/export/xlsx.ts` con `exceljs`: 3 hojas (Respuestas, Preferencias, KPIs), freeze pane, header navy + white.
- [X] T101 [P] [US2] `lib/export/html-canva.ts` HTML autocontenido con `<script type="application/json">` + bloques `data-canva-block` (FR-028a).
- [X] T102 [P] [US2] `lib/export/powerbi.ts` ZIP con `dashboard.pbids` + 3 CSVs (FR-028b).
- [X] T103 [P] [US2] `app/api/export/csv/route.ts` (GET con filtros + anonymize).
- [X] T104 [P] [US2] `app/api/export/xlsx/route.ts`.
- [X] T105 [P] [US2] `app/api/export/html/route.ts`.
- [X] T106 [P] [US2] `app/api/export/powerbi/route.ts` (devuelve ZIP).
- [X] T107 [US2] `app/(teacher)/dashboard/export/page.tsx` + `components/dashboard/ExportPanel.tsx` con UI de selección formato + anonimización + filtros heredados.

**Checkpoint**: US2 funcional. Docente puede ver dashboard y exportar en los 4 formatos. Validar acceptance scenarios 1-6 de US2.

---

## Phase 5: User Story 3 — Administrador gestiona preguntas (Priority: P3)

**Goal**: un admin puede crear, editar, reordenar, activar/desactivar preguntas desde `/admin/preguntas`. Las respuestas históricas conservan el snapshot del enunciado original.

**Independent Test**: con base sembrada, un admin edita el texto de una pregunta y verifica que estudiantes nuevos vean el cambio pero respuestas previas conserven snapshot.

### Tests para User Story 3

- [X] T108 [P] [US3] Vitest integration test en `tests/integration/questions-snapshot.test.ts` — auto-skip si no detecta Supabase local. Cubre dos casos: (1) editar pregunta cambia `questions.enunciado` pero conserva `answers.question_snapshot/dimension_snapshot/tipo_snapshot` originales; (2) update directo a `answers.question_snapshot` lo rechaza el trigger `answers_snapshot_lock`.
- [X] T109 [P] [US3] `tests/e2e/admin-questions.spec.ts` — 2 specs: público (sin sesión `/admin/preguntas` → `/login` con `?next=`) + Supabase local (admin crea pregunta nueva con enunciado timestamped, navega a `/admin/preguntas/[id]`, edita enunciado, verifica en DB, desactiva vía UI con fallback a service-role si el control de UI no está expuesto en el listado).

### Validation & actions

- [X] T110 [P] [US3] `lib/validation/question.schema.ts` con discriminated union por `tipo` (cada variante exige el shape correcto de `opciones`). Incluye `reorderQuestionsSchema`, `toggleQuestionActiveSchema` y `defaultOpcionesForType` para el editor.
- [X] T111 [US3] Server actions en `app/(admin)/admin/preguntas/_actions.ts`: `createQuestion`, `updateQuestion(id, partial)`, `reorderQuestions(idsInOrder)` (dos pasadas con orden negativo intermedio para evitar conflictos), `toggleQuestionActive`. Todas validan rol admin + Zod antes de tocar DB.

### UI

- [X] T112 [US3] `app/(admin)/admin/preguntas/page.tsx` RSC con listado + filtros (dimensión y activo/inactivo) vía searchParams, contadores y empty state.
- [X] T113 [US3] `app/(admin)/admin/preguntas/nueva/page.tsx` con `QuestionEditor` y orden sugerido = MAX(orden)+1.
- [X] T114 [US3] `app/(admin)/admin/preguntas/[id]/page.tsx` con `QuestionEditor mode="edit"` (no necesita preview porque el editor muestra el cambio en tiempo real).
- [X] T115 [US3] `components/admin/QuestionEditor.tsx` con switch dinámico por tipo (LikertEditor, ChoicesEditor, RankingEditor, ComparisonEditor) + `defaultOpcionesForType` al cambiar de tipo.
- [X] T116 [US3] `components/admin/QuestionList.tsx` con dnd-kit (PointerSensor + KeyboardSensor para a11y), `useOptimistic` para toggle activo y override de orden optimista durante el drag.

### Gestión de docentes (relacionada con US3)

- [X] T117 [US3] Server actions `addAllowedTeacherAction`, `removeAllowedTeacherAction`, `demoteTeacherAction` en `app/(admin)/admin/teachers/_actions.ts`. Reusa `lib/auth/allowed-teachers.ts` y bloquea auto-degradación.
- [X] T118 [US3] `app/(admin)/admin/teachers/page.tsx` + `components/admin/TeachersManager.tsx` con form de alta, whitelist y lista de docentes activos. Service-role para los reads (RLS no permite SELECT global).
- [X] T119 [US3] `scripts/add-teacher.ts` (`pnpm run add-teacher -- --email x --note y`) referenciado desde `quickstart.md`. Idempotente (no duplica) y eleva profile si ya existe.

**Checkpoint**: US3 funcional. Admin gestiona preguntas y docentes. Validar acceptance scenarios 1-3 de US3.

---

## Phase 6: User Story 4 — Mantenimiento automático de data JNE (Priority: P3)

**Goal**: Vercel Cron refresca la data JNE cada 24h. El admin puede disparar refresh manual. Si JNE falla, sirve la copia válida y registra incidente.

**Independent Test**: ejecutar `pnpm run jne:refresh` actualiza la base con la última versión del JNE y se registra entrada en `jne_refresh_log`.

### Tests para User Story 4

- [X] T120 [P] [US4] Vitest unit test en `tests/unit/jne/client.test.ts` con `fetch` mock inyectado (no MSW — el client acepta fetch custom, más simple). 7 specs: cache de token, variantes de payload, 401→refresh→retry, 401 sostenido lanza `JneAuthError`, 5xx con 3 retries lanza `JneNetworkError`, schema mismatch lanza `JneSchemaError`, header `X-Session-Token` presente.
- [X] T121 [P] [US4] Vitest integration test en `tests/integration/jne-refresh.test.ts` con auto-skip sin Supabase local. Inyecta fetch fake que simula los 3 endpoints (header/detalle/formula) y verifica upsert correcto en `candidates`/`plans`/`plan_dimensions` + entrada `success` en `jne_refresh_log`.
- [X] T122 [P] [US4] Vitest integration test en `tests/integration/jne-failure.test.ts` con auto-skip. Fetch que devuelve 500 sostenido (token sí responde OK para no abortar antes); verifica que `candidates.nombre_completo` se conserva, retorna `Failed`/`PartialFailure` y log con `status='failed'`/`'partial'` + `error_message`. Monkey-patch de `setTimeout` para no esperar el backoff real.

### Implementation

- [X] T123 [P] [US4] `lib/jne/schemas.ts` con Zod 4 — schemas para token (union flexible), header paginado, plan detalle con 4 dimensiones, fórmula. Shapes derivados de los JSONs reales en `data/jne/raw/` (NO del contract aspiracional). `JNE_DIMENSION_TO_ENUM` mapea idPgDimension→enum DB.
- [X] T124 [P] [US4] `lib/jne/types.ts` re-exporta tipos vía `z.infer` + constantes `JNE_FINALISTAS`, `JNE_PROCESO_ELECTORAL` y la familia de errores tipados (`JneAuthError`, `JneNetworkError`, `JneSchemaError`, `JneTimeoutError`).
- [X] T125 [US4] `lib/jne/client.ts` con `JneClient`: timeout 10s con AbortController, retries 1s/2s/4s en 5xx, refresh automático en 401 (una sola vez). `TokenStore` con dos implementaciones: `createSupabaseTokenStore` (respaldo en `app_settings`) y `createMemoryTokenStore` (tests). Strip de BOM UTF-8 en el JSON.
- [X] T126 [US4] `lib/jne/refresh.ts` con `jneRefresh({ triggeredBy })`. Orquesta: abre log `running` → por cada finalista llama getPlanHeader+getPlanDetalle+getFormula → upsert atómico por candidato → cierra log con `success`/`partial`/`failed`. Concatena items de cada dimensión con `\n\n---\n\n` (mismo separador del seed-jne-roberto). Si falla un candidato, NO escribe nada para él pero deja al otro intacto.
- [X] T127 [US4] `lib/jne/cache.ts` — el cache real es la DB (refresh solo escribe si Zod pasa, así que JNE caído ⇒ copia previa intacta automáticamente). Expone `getJneFreshness()` con stale flag (>48h) y `listJneRefreshLog(N)` para la bitácora admin.
- [X] T128 [P] [US4] `app/api/cron/jne-refresh/route.ts` (runtime nodejs, dynamic force) con `Bearer ${CRON_SECRET}`. Loguea correlationId, invoca `jneRefresh({ triggeredBy: 'cron' })` y devuelve JSON con resumen.
- [X] T129 [P] [US4] `app/api/jne/refresh/route.ts` POST manual: auth via cookie + `isAdmin()`. Devuelve JSON estructurado para que la UI muestre el resumen.
- [X] T130 [US4] `app/(admin)/admin/jne/page.tsx` con `JneRefreshPanel` (botón refresh) + 3 stat cards (último success, último intento, candidates sync) + tabla de las últimas 20 entradas del log.
- [X] T131 [US4] Server action `refreshJneNow()` en `app/(admin)/admin/jne/_actions.ts` que dispara `jneRefresh` y revalida `/admin/jne` + `/comparador`.
- [X] T132 [US4] Server action `setCicloCierre(date)` + UI `components/admin/CicloCierreForm.tsx` integrada en admin home (`app/(admin)/admin/page.tsx`). Date picker `datetime-local`, serializa a ISO UTC, soporta clear.
- [X] T133 [P] [US4] Script CLI `scripts/run-jne-refresh.ts` (`pnpm run jne:refresh`) ya registrado en `package.json`. Imprime resumen y exit code 0/1.

**Checkpoint**: US4 funcional. JNE se refresca automáticamente cada 24h y manualmente desde admin. Validar acceptance scenarios 1-3 de US4.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: cumplimiento Ley 29733 (retención + anonimización), landing/marketing, performance, accesibilidad, banco de preguntas inicial, scripts operacionales, validación final.

### Retención y anonimización (Ley 29733)

- [X] T134 [P] `lib/retention/anonymize.ts` con `anonymizeExpired({ executor, dryRun? })`: lee `app_settings.ciclo_cierre_at`, calcula threshold (cutoff + 12m) en JS, UPDATE bulk de `profiles` (email/nombres/apellidos = NULL, is_anonymized = true, anonymized_at = now) usando `.eq('is_anonymized', false)` para idempotencia. Devuelve discriminated union `skipped | done | dry_run | error`.
- [X] T135 [P] `lib/retention/delete-request.ts` con `deleteUserData(userId)` para self-service. El server action `requestDataDeletion()` en `app/(auth)/profile/_actions.ts` ahora delega aquí (refactor: lógica compartida con cron y tests).
- [X] T136 `app/api/cron/anonymize/route.ts` (runtime nodejs, dynamic force) con `Bearer ${CRON_SECRET}`. Invoca `anonymizeExpired({ executor: 'cron' })`. Si `skipped` o `done` devuelve 200; si `error` devuelve 500. La idempotencia y el threshold-check viven en el helper, no en el handler.
- [X] T137 [P] `tests/integration/anonymization.test.ts` con auto-skip sin Supabase local. 5 specs: Caso 1 (threshold no alcanzado → skipped), Caso 2 (threshold cruzado → todos anonimizados, PII null), Caso 3 (idempotencia segunda corrida), dry-run no escribe, y un test extra de `deleteUserData` (self-service + idempotente).
- [X] T138 [P] `scripts/run-anonymization.ts` con flag `--dry-run` ya enlazado en `package.json` (`pnpm run anonymize` y `anonymize:dry-run`). Mensajes contextuales por outcome: días que faltan al umbral, count en dry-run, perfiles afectados al ejecutar real.

### Landing y marketing

- [X] T139 `app/page.tsx` ya con hero asimétrico (lg:col-span-7/5), display Cormorant, Ángel de Trujillo con `ParallaxAngel` (framer-motion). Nuevo `GsapHeroReveal` aplica text-mask reveal con GSAP ScrollTrigger sobre el H1; GSAP se carga lazy dentro de useEffect — no entra al bundle inicial.
- [X] T140 [P] `components/landing/MagneticButton.tsx`: lerp del centro hacia el cursor (radio 90px, max 6px offset). Aplicado al CTA principal del landing y al `/como-funciona`. Honra `pointer: fine` + `prefers-reduced-motion`.
- [X] T141 [P] `components/landing/AngelOrnament.tsx` actualizado: cada trazo tiene `data-animate` y se anima con `stroke-dasharray` al entrar al viewport (IntersectionObserver, sin GSAP). Respeta reduced-motion.
- [X] T142 [P] `app/(marketing)/como-funciona/page.tsx` con `StickyStoryteller`: columna izquierda sticky con número/título del paso activo, columna derecha con scroll natural, IntersectionObserver detecta el paso visible. Página es estática (○) en el build — ideal para SEO.
- [X] T143 [P] `components/motion/CustomCursor.tsx`: dot + ring con lerp 0.18, transforma sobre `a, button, [role='button']`. Solo activo en `pointer: fine` + `prefers-reduced-motion: no-preference`. Cargado desde `app/layout.tsx`.

### Banco de preguntas inicial

- [X] T144 `data/questions/draft_v1.md` con 12 preguntas en 4 dimensiones, 3 por dimensión. Cada bloque YAML incluye `orden`, `dimension_tematica`, `tipo`, `fuente` (INEI, BCRP, IPE, MINEDU, MINSA, Proética, etc.).
- [X] T145 `scripts/seed-questions.ts` parsea el draft y hace upsert por `orden`. Comando `pnpm run seed:questions` ya en `package.json`.

### Performance y accesibilidad

- [X] T146 [P] Bundle optimizado: GSAP solo se importa dentro de useEffect (`GsapHeroReveal`, lazy load real). `next/font` ya con subset `latin + latin-ext`. Script `pnpm run bundle:budget` lee `.next/build-manifest.json` y reporta First Load JS por ruta con presupuestos (240 KB marketing, 320 KB app).
- [X] T147 [P] `docs/quality-audit.md` documenta el procedimiento Lighthouse con comandos exactos por ruta y criterio ≥ 90. La auditoría real es manual (no se puede automatizar Lighthouse desde un agente). Quedó en checklist de release.
- [X] T148 [P] `scripts/axe-audit.ts` (+`pnpm run axe:audit`) ejecuta `@axe-core/playwright` headless contra rutas críticas y reporta violations por impact. Exit 1 si hay critical/serious. Manual keyboard navigation también documentado en `docs/quality-audit.md`.

### Observabilidad

- [X] T149 [P] `next.config.ts` envuelto con `withSentryConfig` — upload de source maps automático cuando `SENTRY_AUTH_TOKEN/ORG/PROJECT` están en el entorno (Vercel / CI). En dev local sin las envs el wrapper es no-op. Release name = `VERCEL_GIT_COMMIT_SHA`.
- [X] T150 [P] Catálogo en `lib/analytics/events.ts` ya completo. Nuevo helper `lib/analytics/useTrack.ts` con `useTrackOnce` y `useTimeSpent`. Eventos emitidos en flujo crítico: `QUESTIONNAIRE_STARTED/STEP_ADVANCED/COMPLETED` en `MultiStepForm`, `COMPARATOR_VIEWED/DIMENSION_VIEWED/TIME_SPENT` (con `duration_ms` para SC-004) en `SplitView`. `captureEvent` filtra PII por nombre de campo (constitución VI).

### Operational tooling

- [X] T151 [P] `scripts/export-cli.ts` (`pnpm run export -- --format csv|xlsx|html|powerbi --anonymize none|pseudonym|full --out ./tmp`). Reusa `lib/export/*` sin pasar por browser.
- [X] T152 [P] `package.json` scripts completos: dev, build, start, lint, tsc, test, test:watch, e2e, db:types, seed:questions, seed:demo, promote:user, add-teacher, jne:refresh, anonymize, anonymize:dry-run, export, **bundle:budget**, **axe:audit**, load-test. (`seed:jne-roberto` retirado — el refresh JNE ya lo cubre.)

### Security & final validation

- [X] T153 `docs/release-checklist.md` § 1 — security review documentado: RLS, service-role guard, log sanitization, secrets en server-env, CRON_SECRET rotation, TLS, encryption at rest, headers de seguridad. Ejecutarlo via `/security-review` antes del primer merge.
- [X] T154 `docs/release-checklist.md` § 2 — quickstart end-to-end documentado paso a paso con criterio "< 15 min en máquina limpia". Ejecución manual.
- [X] T155 CI ya configurado en `.github/workflows/ci.yml`: jobs `quality` (lint + tsc + test) y `e2e` (build + Playwright). 4 checks cubiertos. Verificación en cada PR.
- [X] T156 [P] `docs/release-checklist.md` § 4 — procedimiento de deploy preview Vercel: chequear PostHog eventos, Sentry release tracking, source maps correctos.
- [X] T157 `docs/release-checklist.md` § 5 — triggers manuales de `/api/cron/jne-refresh` y `/api/cron/anonymize` con curl + `Bearer $CRON_SECRET`. Verificación de `jne_refresh_log`.
- [X] T158 [P] `tests/load/student-flow.js` smoke load k6: stages 0→50→200→500 VUs sobre rutas públicas (/, /login, /como-funciona, /api/cron/jne-refresh sin auth). Thresholds `p(95)<2000` (SC-008) y `http_req_failed<0.01`. Ejecución manual pre-launch — k6 no es dep de proyecto.

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
