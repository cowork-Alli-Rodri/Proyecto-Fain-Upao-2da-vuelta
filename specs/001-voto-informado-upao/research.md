# Research — Phase 0

**Feature**: Voto Informado UPAO — Webapp Segunda Vuelta 2026
**Branch**: `001-voto-informado-upao`
**Fecha**: 2026-05-20

> Las 5 ambigüedades de spec quedaron resueltas en la sesión de `/speckit-clarify` del 2026-05-20 (ver `spec.md` § Clarifications). Este documento consolida las **decisiones técnicas** que el plan asume y deja por escrito el *por qué* y las *alternativas rechazadas*, para que cualquier revisor entienda el razonamiento sin tener que descubrirlo en el código.

---

## 1. Framework y arquitectura

### Decisión: Next.js 16.2 LTS App Router + RSC + Server Actions (sin BFF dedicado)
**Rationale**:

- React Server Components son la default mandada por la constitución (V) — `"use client"` debe justificarse en el PR.
- App Router con route groups (`(marketing)`, `(student)`, `(teacher)`, `(admin)`) permite layouts y middleware diferenciados sin URLs anidadas en el path público.
- Server Actions reemplazan a un BFF tradicional para mutaciones tipadas con Zod; el form post va directo a la action, que valida (cliente y servidor), persiste en Supabase y revalida la ruta.
- Turbopack en producción acorta el build (~30%) sin afectar runtime.
- Next 16.2 LTS recibe parches de seguridad por 18 meses post-release.

**Alternativas rechazadas**:

- *Remix/React Router 7*: ecosistema más pequeño en Perú, menos plantillas, integración con Supabase menos cubierta.
- *Astro + islands*: insuficiente para flujos interactivos pesados (cuestionario multi-paso, dashboard reactivo).
- *Pages Router de Next*: queda en mantenimiento, sin RSC nativos.

---

## 2. Backend: Supabase como BaaS único

### Decisión: Supabase Postgres 16 + Auth + RLS + Storage + Realtime
**Rationale**:

- Constitución (Stack obligatorio) lo manda. No se cuestiona, pero conviene documentar las implicaciones.
- Postgres permite `pgcrypto` para el hash opaco de anonimización (FR-041b) sin extensiones de pago.
- RLS expresivo: las políticas por rol (`student`, `teacher`, `admin`) se escriben en SQL y se verifican en cada query del client.
- Supabase Auth maneja OAuth Google + Microsoft + email/password con flujo PKCE, refresh tokens automáticos y JWT firmado por el proyecto. El SDK `@supabase/ssr` mantiene la sesión en cookies httpOnly para RSC + Server Actions.
- Realtime se usa solo para "live progress" en `/dashboard` (opcional v1). Si no se enciende, el dashboard se refresca cada 30 s por client-side polling.

**Alternativas rechazadas**:

- *Self-hosted Postgres + Auth.js + custom RLS*: 3-4 semanas extra de boilerplate. No aporta valor al MVP.
- *Firebase*: no Postgres, sin RLS expresivo, lock-in a Google.
- *PlanetScale + Clerk*: stack más caro, sin RLS nativo, Auth aislado de DB.

---

## 3. Autenticación: tres providers + whitelist de teachers

### Decisión: Supabase Auth con Google OAuth, Microsoft Azure AD y email/password. Rol `teacher` se eleva desde tabla `allowed_teachers` al hacer login.
**Rationale**:

- Google + Microsoft cubren cuentas institucionales `@upao.edu.pe` y personales (FR-001). Email/password es fallback obligatorio para estudiantes sin cuenta corporativa.
- Resolución Q1 (Clarifications): la promoción a `teacher` se hace automáticamente al login si el correo está en `allowed_teachers` (tabla mantenida por admin). Promoción a `admin` solo vía SQL directo.
- El rol se materializa en `profiles.role` (no se confía en custom claims del JWT — más simple de auditar).
- Trigger Postgres `on_auth_user_created` crea `profiles` con `role='student'` por defecto y consulta `allowed_teachers` para promover.

**Implementación clave**:

- `lib/auth/role.ts` expone `getCurrentRole()` que lee `profiles.role` con `cache()` de React por request.
- `middleware.ts` valida sesión + extrae rol + redirige `student` que toca `/dashboard` o `/admin/*`.

**Alternativas rechazadas**:

- *Rol en JWT app_metadata*: requiere editar el token desde service-role en cada cambio. Mayor superficie de error.
- *Self-declaración + aprobación admin*: descartada en Q1 por overhead operacional.
- *Dominio + sub-grupo Google Workspace*: requiere Directory API y permisos avanzados, sobre-ingeniería para un piloto.

---

## 4. Datos JNE: cliente tipado + Vercel Cron 24 h + fallback en cache

### Decisión: Cliente HTTP en `lib/jne/client.ts` que obtiene `X-Session-Token` y refresca cada 24h vía Vercel Cron. Seed inicial desde `data/jne/raw/`. Si la API falla, se sirve la última copia válida desde la DB.
**Rationale**:

- El portal `votoinformado.jne.gob.pe` no publica API documentada, pero el endpoint `https://web.jne.gob.pe/serviciovotoinformado` es el que consume su SPA. Ya se hizo ingeniería inversa y se guardaron los JSONs en `data/jne/raw/` (ver `data/jne/README.md`).
- Vercel Cron dispara `app/api/cron/jne-refresh/route.ts` cada 24 h (FR-034). El handler:
  1. Solicita token (`GET /api/authentication/token`).
  2. Llama plan-header + plan-detalle por candidato (Keiko 29690, Roberto 29688).
  3. Upsert en `candidates`, `plans`, `dimensions`. Marca `last_synced_at`.
  4. Si falla → log a `jne_refresh_log` + Sentry, NO sobrescribe la copia válida (FR-035).
- Admin puede disparar refresh manual desde `/admin/jne` que invoca el mismo handler (FR-036).
- Cliente expone Zod schemas derivados de los JSONs reales — type safety end-to-end.

**Alternativas rechazadas**:

- *Scraping del HTML del portal*: frágil ante cambios de UI, viola spirit de "API oficial". El endpoint REST es claramente la fuente.
- *Solo seed estático sin cron*: bloquea FR-034 y deja la data potencialmente obsoleta si el JNE publica actualizaciones.

---

## 5. Comparador: orden aleatorio persistente por estudiante

### Decisión: Al primer acceso a `/comparador`, se sortea 50/50 `compare_order ∈ {'keiko_left', 'roberto_left'}` y se guarda en `profiles.compare_order`. Todas las visitas posteriores leen ese campo.
**Rationale**:

- Resolución Q4 (Clarifications): control metodológico del sesgo de primacía sin confundir al usuario con cambios entre sesiones.
- Implementación trivial: server action `assignCompareOrderIfMissing()` se llama desde el RSC del comparador.
- El dashboard expone un gráfico cruzado "preferencia por orden asignado" para que el docente / Rodrigo evalúen si hubo influencia (validez del estudio).

**Alternativas rechazadas**:

- *Aleatorio en cada carga*: descartado en Q4 por UX confuso.
- *Orden alfabético o JNE*: descartado por sesgo sistemático.

---

## 6. Cuestionario: multi-paso con autosave y snapshot del enunciado

### Decisión: Cuestionario en pasos (1 pregunta por paso) con autosave por respuesta vía server action, snapshot del enunciado al momento de responder, y persistencia del puntero `currentStep` en `profiles` para retomar (FR-010).
**Rationale**:

- Mobile-first: 1 pregunta por pantalla rinde mejor que multi-pregunta por scroll (assumption: 60% móvil).
- Autosave por respuesta evita pérdida de datos si el dispositivo pierde conexión (edge case: modo offline parcial).
- Snapshot del enunciado (`answers.question_snapshot`) cumple FR-012: respuestas históricas conservan el texto original aunque el admin edite la pregunta después.
- Barra de progreso = `currentStep / totalActiveQuestions`.

**Alternativas rechazadas**:

- *Form único con scroll vertical*: peor UX móvil, dificulta autosave granular.
- *Sin snapshot del enunciado*: imposibilita auditoría histórica si la pregunta cambia.

---

## 7. Preferencia final: inmutable por usuario, sin fase global

### Decisión: La preferencia se inserta una sola vez en `preferences`. Si el estudiante intenta volver al formulario, el RSC detecta el registro existente y muestra modo solo lectura.
**Rationale**:

- Resolución Q2 (Clarifications): preferencia final por usuario, US-5 fuera de scope v1, no hay flag global de "fase cerrada".
- Simplifica el modelo: `preferences` tiene PK compuesta o `UNIQUE(student_id)` que impide doble inserción.
- El campo `motivo` es texto libre limitado a 500 chars con sanitización del lado servidor.

**Alternativas rechazadas**:

- *Permitir cambio mientras hay fase global abierta*: rechazado en Q2.
- *Permitir N cambios sin auditoría*: rompe semántica de "preferencia final".

---

## 8. Consentimiento + opt-in + retención Ley 29733

### Decisión: Pantalla `/consent` con texto legal + checkbox obligatorio aceptar términos + checkbox separado obligatorio "Autorizo uso de mis datos para investigación académica del docente". Retención 12 meses post-cierre del ciclo + anonimización irreversible mensual.
**Rationale**:

- Resolución Q3 (Clarifications): el opt-in separado (no pre-marcado) es la salvaguarda explícita ante Ley 29733.
- Tabla `consent_events` registra: `user_id`, `accepted_terms_at`, `accepted_data_use_at`, `consent_version` (versionable si el texto cambia).
- `app/api/cron/anonymize/route.ts` corre el día 1 de cada mes como **heartbeat** (no anonimiza mensualmente — solo verifica si pasó el umbral):
  1. Lee `ciclo_cierre_at` desde `app_settings`. Si NULL, termina.
  2. Verifica: `ciclo_cierre_at + INTERVAL '12 months' > NOW()`. Si todavía no se cruzó el umbral → termina sin tocar nada.
  3. Cuando se cruza (una sola vez para un ciclo): anonimiza TODOS los `profiles` con `is_anonymized = false` — reemplaza `email`, `nombres`, `apellidos` por NULL; marca `is_anonymized = true`, `anonymized_at = now()`.
  4. Inserta log en `anonymization_log` con `affected_rows`, `executed_at`, `cycle_close_date_cutoff`.
  5. En ejecuciones posteriores: como ya están anonimizados, el filtro `is_anonymized = false` no devuelve filas. El job termina sin error.
- Cierre del ciclo lo declara el admin en `/admin` con un date picker (campo `ciclo_cierre_at` global en `app_settings`).

**Alternativas rechazadas**:

- *Borrado total a los 12 meses* (Q3 opción A): pierde dataset agregado anonimizable que sí tiene valor para el docente.
- *Anonimización inmediata al cierre* (Q3 opción D): muy estricto, dificulta soporte post-cierre.
- *Opt-in pre-marcado*: viola "consentimiento explícito" de la Ley 29733.

---

## 9. Banco de preguntas: 10-15 ítems en 4 dimensiones JNE, snapshot, edición admin

### Decisión: Tabla `questions` con `dimension_tematica ∈ {'social','economica','ambiental','institucional'}`, `tipo ∈ {'likert','single','multiple','text','ranking','comparison'}`, `orden`, `activo`. Edición desde `/admin/preguntas` invalida sólo respuestas nuevas; respuestas existentes conservan `question_snapshot`.
**Rationale**:

- Resolución Q5 (Clarifications): 10-15 preguntas, 4 dimensiones oficiales JNE.
- Tipos enumerados (no `TEXT` libre) para validar UI components.
- `orden` es integer; reordenar es `UPDATE` por filas. No se usa lista enlazada — overkill para ≤ 15 items.
- El borrador del contenido (`data/questions/draft_v1.md`) lo genera Claude + Rodrigo post-spec con fuentes peruanas y se carga como seed directamente. El docente edita después desde `/admin/preguntas` sin proceso formal de aprobación.

**Alternativas rechazadas**:

- *Diferir definición y dejar `dimension_tematica` libre* (Q5 opción D): rechazado por el usuario para tener seed inicial listo al lanzamiento.
- *Más de 6 dimensiones* (Q5 opción C): riesgo de abandono y exceso de complejidad para piloto.

---

## 10. Dashboard del docente: Tremor 3.x + Recharts con filtros reactivos

### Decisión: Server component como shell, client components para filtros (`useSearchParams` + Server Actions para hidratar datos), Tremor para KPI cards y barras, Recharts para visualizaciones específicas (sankey de cambios — diferido a v2, donuts, líneas temporales).
**Rationale**:

- Tremor entrega componentes de dashboard listos con estilos componibles vía Tailwind, ideal para iterar rápido y consistente con el design system.
- Recharts cubre los casos que Tremor no resuelve nativamente (cruces multivariados).
- Filtros (facultad, carrera, ciclo, rango de fechas) viven en query params, lo que permite shareable URLs y respeto a back/forward del browser.
- Server side queries en `lib/dashboard/queries.ts` usan vistas materializadas con índices por `facultad`, `carrera`, `created_at` para latencia < 2 s con 500 estudiantes (SC-008).

**Alternativas rechazadas**:

- *AG Grid + Highcharts*: más caro, no necesario para volumen de datos del MVP.
- *Recompilar dashboard en client component completo*: pierde RSC, peor TTI.

---

## 11. Exports: CSV, XLSX, HTML para Canva, dataset Power BI

### Decisión: 4 route handlers en `app/api/export/`. Cada uno acepta `?anonymize=...` y devuelve archivo descargable. La lógica de aggregación es compartida (`lib/export/anonymize.ts`).
**Rationale**:

- **CSV** con `papaparse`: estándar, abre en Excel/Sheets sin transformación (FR-029 incluye headers válidos con mensaje "sin datos aún" en fila 1 si está vacío).
- **XLSX** con `exceljs`: hojas separadas (Resumen, Respuestas, Preferencias, Cruces). Formato con anchos auto + freeze pane primera fila.
- **HTML para Canva** (FR-028a): genera un HTML autocontenido (CSS inline + datos embebidos en `<script type="application/json">`), importable directamente via "Importar diseño desde código" de Canva. Estructura modular con `<section data-canva-block>` para que Canva detecte bloques editables.
- **Power BI** (FR-028b): combo de archivos. (1) `dashboard.csv` con esquema tabular plano (una fila por respuesta + columnas de pregunta como `q_001`, `q_002`, ...). (2) `dashboard.pbids` que apunta al CSV con tipos declarados. Power BI Desktop importa el `.pbids` y carga el dataset sin transformaciones manuales.
- Anonimización: si `anonymize=true`, se reemplaza `email`, `nombres`, `apellidos` por `'student-' || row_number()`. Si `anonymize=keep-pseudonym`, se mantiene un `student_pseudo_id` estable para joins entre exports.

**Alternativas rechazadas**:

- *Solo CSV* (más simple): incumple FR-028, FR-028a, FR-028b.
- *Power BI Service connector*: requiere licencia + setup AAD, sobre-ingeniería para piloto.

---

## 12. Rate limit + anti-bot

### Decisión: Upstash Redis con `@upstash/ratelimit` para 5 req/min por user_id en submits del cuestionario y preferencia (FR-037). Cloudflare Turnstile invisible en login y submits sensibles (FR-038).
**Rationale**:

- Upstash Redis serverless calza con Vercel Edge runtime, sin cold starts.
- Turnstile es gratis hasta 1M challenges/mes, invisible para el 90% de usuarios (mejor que reCAPTCHA v3).
- Implementación: middleware verifica `cf-turnstile-response` en submits sensibles antes de dejar pasar.

**Alternativas rechazadas**:

- *Solo rate limit por IP*: ineficaz contra alumnos detrás de NAT universitario.
- *reCAPTCHA v2 con casillas*: fricción innecesaria.

---

## 13. Observabilidad

### Decisión: Sentry para errores (cliente + servidor) + PostHog para eventos de producto (sin PII) + Vercel Analytics para web vitals.
**Rationale**:

- Sentry es el estándar de la industria y la constitución lo manda.
- PostHog OSS o cloud (decidir en task de setup) — eventos como `questionnaire_started`, `comparator_viewed`, `preference_submitted`. PII excluido por filtro en `lib/analytics/posthog.ts`.
- Vercel Analytics es free tier por proyecto Vercel — captura CWV reales del campo.

**Alternativas rechazadas**:

- *Solo Sentry*: pierde funnel analytics que el docente / Rodrigo valoran.
- *Logflare/Datadog*: caro, overkill.

---

## 14. Testing

### Decisión: Vitest para unit/integration (Supabase local Docker), Playwright para E2E del happy-path del estudiante.
**Rationale**:

- Constitución (IV) manda test-first en flujos críticos. Sin tests no se mergea.
- Supabase local con Docker da una DB real para integration — sin mocks (CLAUDE.md regla explícita).
- Playwright en CI con browsers locked en versión.

**Cobertura mínima por flujo (a expandir en `/speckit-tasks`)**:

- Auth: login Google mock, login email/password, redirección por rol, expiración de sesión.
- Cuestionario: autosave, retomar, snapshot del enunciado, edición pre-envío.
- Comparador: orden aleatorio persistente, acceso bloqueado sin cuestionario completo.
- Preferencia: inmutable, validación Zod.
- Dashboard: filtros, exports correctos en los 4 formatos.
- Anonimización: job mensual reduce PII a hash.

---

## 15. Performance & Lighthouse

### Decisión: RSC + image optimization + font subset + Lenis throttling + dynamic import de GSAP solo en hero.
**Rationale**:

- TTI < 3 s en 4G (constitución V) exige minimizar JS de cliente. RSC ayuda; GSAP / Lenis / Framer se cargan dinámicamente con `next/dynamic` donde sea posible.
- Migra / Geist Sans con `font-display: swap` + subset latin extended (para ñ y acentos).
- `next/image` para fotos de candidatos (Supabase Storage como source).

**Métricas objetivo**:

- LCP < 2.5 s, INP < 200 ms, CLS < 0.1.
- Lighthouse 90+ en cuatro categorías en `/`, `/comparador`, `/dashboard`.

---

## NEEDS CLARIFICATION

Ninguno. Las 5 ambigüedades de spec quedaron resueltas en la sesión de `/speckit-clarify` del 2026-05-20.
