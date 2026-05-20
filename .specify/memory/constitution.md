# UPAO Voto Informado — Constitution

Principios no negociables del proyecto. Esta constitución supersede cualquier otra práctica. Toda PR debe verificar cumplimiento.

## Core Principles

### I. Datos oficiales como única fuente de verdad
Todo dato relativo a candidatos, partidos y planes de gobierno debe provenir de la API oficial del JNE (`https://web.jne.gob.pe/serviciovotoinformado`). Se prohíbe reescribir, parafrasear o filtrar editorialmente las propuestas. Se permite normalizar formato (acentos, espacios) y traducir nombres de campos, pero no contenido. Si un dato falta en la API, se muestra explícitamente como "No declarado por el JNE" — nunca se inventa ni se completa con otras fuentes.

### II. Neutralidad política (NO NEGOCIABLE)
La aplicación NO emite recomendaciones de voto. El comparador muestra ambos candidatos con tratamiento visual simétrico (mismo orden de campos, misma cantidad de texto, mismas affordances). Se prohíben gradientes asimétricos, etiquetas valorativas ("mejor", "más sólido"), o iconografía que sugiera juicio. El cuestionario mide preferencias declaradas, no las induce.

### III. Privacidad y consentimiento (NO NEGOCIABLE)
- Consentimiento informado obligatorio antes de cualquier captura de datos del cuestionario.
- Cumplimiento Ley 29733 (Protección de Datos Personales, Perú).
- RLS habilitado en TODA tabla que toque `auth.users`.
- Export al docente solo en formato anonimizable (configurable).
- Logs no contienen PII (email, nombre completo, DNI). Solo `user_id` UUID.
- Sesiones expiran a las 24h.

### IV. Test-first en flujos críticos
TDD obligatorio en: autenticación, persistencia de respuestas, cálculos del dashboard, export al docente. Para UI marketing y animaciones, tests E2E con Playwright (al menos 1 happy-path por feature). Sin tests, no se mergea.

### V. Server-first, accesible y rápido
- React Server Components por defecto. `"use client"` requiere justificación en el PR.
- Lighthouse Performance, Accessibility, Best Practices, SEO ≥ 90 en producción.
- WCAG 2.2 AA mínimo.
- Time To Interactive < 3s en 4G simulado.
- Toda interacción funciona con teclado solo.

### VI. Observabilidad y honestidad operacional
- Sentry obligatorio en producción.
- PostHog para eventos de producto (no PII).
- Logs estructurados (JSON) en server actions y route handlers.
- Si algo falla, se muestra error contextual al usuario — nunca "Error 500" genérico.

### VII. Simplicidad antes que sofisticación
YAGNI. Una capa de abstracción solo se introduce cuando hay 3+ usos concretos. Se prefiere código repetido legible sobre abstracción prematura. Sin feature flags ni compat shims preventivos.

## Stack obligatorio

- Next.js 16.2 LTS + React 19 + TypeScript 5.7 strict
- Tailwind v4 + shadcn/ui + Framer Motion + Lenis + GSAP
- Supabase (Postgres 16, Auth, RLS, Storage, Realtime)
- Upstash Redis (rate limit) + Cloudflare Turnstile (anti-bot)
- pnpm v11 (NUNCA npm/yarn)
- Vitest + Playwright
- Vercel (hosting + Cron) + GitHub Actions (CI)

Sustituir cualquier componente del stack requiere amend explícito a esta constitución.

## Workflow obligatorio

1. Toda feature pasa por Spec Kit: `/speckit-specify` → `/speckit-plan` → `/speckit-tasks` → `/speckit-implement`.
2. Cada PR ejecuta: lint (`pnpm lint`), typecheck (`pnpm tsc`), unit (`pnpm test`), e2e (`pnpm e2e`).
3. Cambios en RLS, auth, o esquema DB requieren `/security-review` antes del merge.
4. Cambios en el comparador o cuestionario requieren revisión humana (no autoaprobación).
5. Despliegues a producción solo desde `main` con tag semver.

## Governance

- Esta constitución supersede cualquier convención implícita. Si un PR rompe un principio, se rechaza salvo que se amende explícitamente este documento.
- Las enmiendas requieren:
  1. Issue describiendo motivación y trade-offs.
  2. Plan de migración para código existente.
  3. Aprobación del owner del proyecto (Rodrigo).
- Complejidad debe justificarse en el PR description.
- Esta constitución se relee al inicio de cada `/speckit-plan`.

---

**Version**: 1.0.0 | **Ratified**: 2026-05-20 | **Last Amended**: 2026-05-20
