# Proyecto UPAO — Voto Informado Segunda Vuelta 2026

<!-- SPECKIT START -->
For additional context about technologies to be used, project structure,
shell commands, and other important information, read the current plan
in `specs/001-voto-informado-upao/plan.md`.
<!-- SPECKIT END -->

## Qué es

Webapp interactiva para estudiantes de pregrado de la **Universidad Privada Antenor Orrego (UPAO, Trujillo, Perú)**. La plataforma (pivote v2):

1. Permite que cada estudiante se registre vía **OAuth Google + email-password fallback** (Microsoft OAuth fue descartado del piloto — quien tenga correo institucional MS se registra manualmente vía email).
2. Páginas marketing públicas: **`/inicio`** (hero con video), **`/candidatos`** (split view simétrico Keiko/Roberto con video oficial + plan de gobierno en 4 dimensiones + PDF JNE), **`/no-te-dejes-sorprender`** (verificador de afirmaciones contra Google Fact Check Tools).
3. Flujo del estudiante: **consent → profile → cuestionario-pre → preferencia → encuesta-final → cierre**. La encuesta final mide cambio de opinión tras la exposición a `/candidatos`.
4. Captura y agrega preferencias y respuestas pre/post para análisis posterior por el docente, vía **subcarpeta `/dashboard`** protegida por rol (heatmap pre/post + barras de cambio por dimensión + exports CSV/XLSX/Power BI/HTML).

Los datos del módulo `/candidatos` provienen de la API REST oficial del JNE (`https://votoinformadoia.jne.gob.pe/ServiciosWeb` + scrape complementario de `web.jne.gob.pe`). Detalle en `data/jne/README.md`. Toda la evolución del producto está documentada en `docs/pivote-v2.md`.

## Stack obligatorio

- **Next.js 16.2 LTS** + App Router + React Server Components + Turbopack producción
- **React 19** + **TypeScript 5.7+ strict mode**
- **Tailwind CSS v4** (OKLCH colors, container queries)
- **shadcn/ui** (Radix primitives) + **Framer Motion** + **Lenis** scroll + **GSAP** (hero)
- **Lucide React** (iconos)
- **Tremor 3.x** + **Recharts** (dashboard)
- **Supabase**: Postgres 16 + Auth + RLS + Storage + Realtime
- **Auth providers**: Google OAuth + Email-password (Microsoft OAuth descartado)
- **Upstash Redis** (rate limiting) + **Cloudflare Turnstile** (anti-bot invisible)
- **React Hook Form** + **Zod** (validación)
- **TanStack Query v5** (solo donde RSC no alcance)
- **Sentry** + **PostHog** + **Vercel Analytics** (observabilidad)
- **Vitest** + **Playwright** (tests)
- Hosting: **Vercel** (Edge + Functions) + GitHub Actions CI
- Cron: **Vercel Cron** (refresca cache JNE cada 24h)

## Reglas

- **pnpm v11 obligatorio** — NUNCA usar npm o yarn.
- **TypeScript strict** — sin `any`, sin `// @ts-ignore`.
- **Cero `console.log` en producción** — usar Sentry para errores.
- **Todos los textos en español neutro latinoamericano**.
- **Sin emojis** en UI ni en código.
- **Server Components por defecto**; `"use client"` solo donde sea estrictamente necesario.
- **Validación Zod** en cada submit (cliente Y servidor).
- **RLS habilitado** en TODAS las tablas que tocan `auth.users`.
- **Diseño no genérico** — sigue paleta y tipografía documentadas en `docs/design.md`.
- **No mockear DB en tests de integración** — usar Supabase local con Docker.
- **Avisar cuando un cambio pueda romper otras partes del proyecto**.
- **Avisar cuando se requiera acción manual** (rotar secret, configurar provider en Supabase, etc.).
- **No inventar datos** — solo cifras y URLs verificables. Si un dato del JNE falta, marcar `null` y registrar en log.

## Glosario

- **JNE**: Jurado Nacional de Elecciones (Perú).
- **Hoja de vida**: declaración pública del candidato (educación, experiencia, bienes, sentencias).
- **Plan de Gobierno**: documento estructurado del JNE en 4 dimensiones (Social, Económica, Ambiental, Institucional).
- **idOrganizacionPolitica**: ID estable del partido/alianza en el sistema JNE (Keiko/FP = 1366, Roberto/JpP = 1264).
- **idPlanGobierno**: ID del plan en el sistema JNE (Keiko = 29690, Roberto = 29688).
- **idProcesoElectoral**: 124 = Elecciones Generales 2026.
- **idTipoEleccion**: 1 = Presidencial.
- **UPAO**: Universidad Privada Antenor Orrego (Trujillo, La Libertad).
- **RSC**: React Server Components.
- **RLS**: Row Level Security (Postgres).

## Identidad UPAO

- **Color institucional**: navy `#002855`.
- **Símbolo**: el Ángel de Trujillo (incorporado como ornamento sutil).
- **Tipografía oficial**: Helvetica Neue.

Esta webapp combina identidad UPAO con paleta moderna documentada en `docs/design.md`.

## Constraints éticos

- La aplicación **NO emite recomendaciones de voto**. La página `/candidatos` muestra datos oficiales del JNE con tratamiento visual simétrico, sin filtros editoriales.
- **Consentimiento informado obligatorio** antes del cuestionario.
- **Anonimización del export** — no se cruzan respuestas individuales con identidad fuera del dashboard del docente.
- Cumplimiento de la **Ley 29733 (Protección de Datos Personales, Perú)**.

## Estructura del repositorio (estado objetivo)

```
.specify/                      Spec Kit (constitution, specs, plans, tasks)
.claude/                       Configuración Claude Code (en .gitignore)
data/jne/                      Seed JSONs oficiales JNE + README
docs/design.md                 Paleta, tipografía, identidad visual
app/                           Next.js App Router
components/                    React + shadcn primitives
lib/jne/                       Cliente tipado API JNE
lib/supabase/                  Clients (browser, server, middleware)
lib/validation/                Zod schemas
supabase/migrations/           Migraciones Postgres
supabase/functions/            Edge Functions
middleware.ts                  Auth + rate limit + rol-gating
```

## Workflow Spec Kit

1. `/speckit-constitution` — Principios (ya inicializado).
2. `/speckit-specify` — Especificación funcional del feature.
3. `/speckit-clarify` (opcional) — Resolver ambigüedades antes del plan.
4. `/speckit-plan` — Plan técnico de implementación.
5. `/speckit-tasks` — Backlog de tareas ejecutables.
6. `/speckit-analyze` (opcional) — Verificación de consistencia cross-artifact.
7. `/speckit-implement` — Ejecución guiada tarea por tarea.
