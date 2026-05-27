# ONBOARDING — Voto Informado UPAO (para Claude Code)

> **Lee este archivo completo antes de hacer cualquier otra cosa.**
> Esta guía está dirigida a ti (Claude Code), no al humano. Asume que llegas frío al proyecto y necesitas reconstruir el contexto. Tu humana (Allison, socia de Rodrigo) te dará tareas específicas; tu trabajo es ejecutar dentro de las convenciones ya establecidas.

---

## 1. Qué es este proyecto

Webapp interactiva que el equipo (Rodrigo + Allison) **vende como servicio** a un docente de la **Universidad Privada Antenor Orrego (UPAO, Trujillo, Perú)** para su curso sobre la **Segunda Vuelta Electoral 2026 (Perú)** entre **Keiko Fujimori (Fuerza Popular)** y **Roberto Sánchez (Juntos por el Perú)**.

**Flujo del estudiante (pivote v2)**:

1. Login OAuth (Google + email/password fallback — Microsoft descartado del piloto).
2. Consentimiento informado (Ley 29733) + opt-in explícito.
3. Datos demográficos: facultad, carrera, ciclo, rango de edad.
4. **Cuestionario pre** (`/cuestionario-pre`): 10-15 preguntas en 4 dimensiones JNE (Social, Económica, Ambiental, Institucional).
5. Declaración de preferencia (candidato + confianza 1-10 + motivo).
6. **Encuesta final** (`/encuesta-final`): mide cambio de opinión y utilidad percibida tras la exposición a los planes de gobierno.
7. `/cierre` agradece y libera.

**Páginas marketing públicas** (no parte del flujo obligatorio): `/inicio` (hero con video), `/candidatos` (split view simétrico Keiko/Roberto con video + plan JNE + PDF), `/no-te-dejes-sorprender` (verificador contra Google Fact Check Tools), `/como-funciona`.

**Flujo del docente**: dashboard `/dashboard` con KPIs, filtros reactivos y exports en 4 formatos (CSV, XLSX, HTML para Canva, ZIP Power BI).

**No es tesis** — es un producto que se entrega funcional al docente. Calidad de datos importa.

---

## 2. Antes de tocar código — lee estos archivos en este orden

```text
1. CLAUDE.md                                       # Instrucciones globales del proyecto (Rodrigo's standards)
2. .specify/memory/constitution.md                 # 7 principios no negociables — léelos como leyes
3. specs/001-voto-informado-upao/spec.md           # Qué construir (FRs + acceptance scenarios + clarifications)
4. specs/001-voto-informado-upao/plan.md           # Cómo construir (stack + structure + constitution check)
5. specs/001-voto-informado-upao/tasks.md          # Backlog ejecutable de 159 tareas
6. specs/001-voto-informado-upao/research.md       # Decisiones técnicas con rationale
7. specs/001-voto-informado-upao/data-model.md     # Esquema Postgres + RLS + triggers
8. specs/001-voto-informado-upao/contracts/        # Contratos JNE, server actions, exports, retention job
9. specs/001-voto-informado-upao/quickstart.md     # Cómo levantar el proyecto en local
10. docs/design.md                                 # Identidad visual UPAO + paleta + tipografía
11. data/jne/README.md                             # Cómo se obtienen los datos del JNE
```

Si la humana te pide algo y no has leído estos, **pídele permiso para leerlos primero**. No improvises.

---

## 3. Estado actual del proyecto

**Branch activo**: `001-voto-informado-upao`

**Phase 1 (Setup) — COMPLETA** ✓
Las tareas T001–T012 ya están hechas. Resultado:

- Next.js 16.2.6 + React 19.2.6 + TypeScript 6 strict + Tailwind v4 + Turbopack inicializados manualmente (no se usó `create-next-app` porque el dir no estaba vacío).
- Dependencias completas instaladas (Supabase, Zod, RHF, Framer, Lenis, GSAP, Tremor, Recharts, etc.).
- Tooling configurado: ESLint v9 (flat config nativo de eslint-config-next), Prettier, Vitest, Playwright, Supabase CLI.
- `app/globals.css` con tokens OKLCH espejando `docs/design.md`.
- `components.json` (shadcn) + `lib/utils.ts` con `cn()`. **Primitives shadcn aún no instaladas — añadir on-demand durante Phase 3.**
- `vercel.json` con dos crons (`/api/cron/jne-refresh` y `/api/cron/anonymize`).
- `.github/workflows/ci.yml` con jobs `quality` y `e2e`.
- `pnpm-lock.yaml` versionado (NO está en `.gitignore`).
- `pnpm build` verde, `pnpm lint` verde, `pnpm tsc` verde, sanity test pasa.

**Phase 2 (Foundational) — SIGUIENTE** (T013–T040)
- Migraciones SQL (esquema + RLS + triggers + seed JNE + vistas).
- Clientes Supabase (browser/server/middleware/admin).
- `middleware.ts` con auth + rate limit.
- Helpers: errors, role, turnstile, rate-limit, observability (Sentry + PostHog).
- Layout root con providers (Lenis, theme, Sentry, PostHog).
- Requiere **Docker Desktop corriendo** para `supabase start`.

**Phase 3 (US1 — Estudiante MVP)** y posteriores: ver `tasks.md`.

---

## 4. Reglas críticas que NO puedes romper

**De la constitución** (`.specify/memory/constitution.md`):

1. **Datos del JNE sin parafraseo** — `/candidatos` muestra texto exacto. Si falta dato → "No declarado por el JNE".
2. **Neutralidad política absoluta** — tratamiento visual simétrico (Keiko izq / Roberto der estable), sin etiquetas valorativas, cero gradientes asimétricos.
3. **Privacidad** — RLS en TODA tabla con `auth.users`. Cero PII en logs. Sesión 24h. Consentimiento + opt-in obligatorio.
4. **TDD en flujos críticos** — auth, persistencia de respuestas, dashboard, export. Sin tests no se mergea.
5. **Server-first** — RSC por defecto, `"use client"` requiere justificación en PR. Lighthouse ≥ 90 en 4 categorías. WCAG 2.2 AA.
6. **Observabilidad** — Sentry obligatorio. PostHog para eventos (sin PII). Logs estructurados JSON.
7. **Simplicidad** — YAGNI. Sin abstracciones prematuras (3+ usos antes). Sin feature flags preventivos.

**De CLAUDE.md global**:

- **pnpm v11 obligatorio** — NUNCA `npm` ni `yarn`. Si docs externos dicen `npm <x>`, traduce a `pnpm <x>`.
- **TypeScript strict** — sin `any`, sin `// @ts-ignore`.
- **Cero `console.log` en producción** (ya hay regla ESLint que lo bloquea — solo `warn`/`error` permitidos).
- **Sin emojis en UI ni en código**.
- **Español neutro latinoamericano** en todos los textos visibles.
- **Sin frases de cumplido** (no "Excelente pregunta", no "Por supuesto").
- **Avisar cuando un cambio pueda romper otras partes** del proyecto.
- **Avisar cuando se requiera acción manual** (rotar secret, configurar provider, etc.).

**Decisiones de spec.md § Clarifications** (resueltas el 2026-05-20, no las revivas):

- **Q1**: rol `teacher` se eleva automáticamente al login si el correo está en `allowed_teachers`. Admin solo vía SQL directo.
- **Q2**: preferencia es **final por usuario** una vez declarada (inmutable v1). No existe "fase global cerrable". User Story 5 (cambio con auditoría) está fuera de scope.
- **Q3**: retención 12 meses post-cierre del ciclo + anonimización irreversible. Cron mensual es heartbeat — solo anonimiza cuando se cruza el umbral (una vez por ciclo). Opt-in explícito separado en consentimiento.
- **Q4**: en v1 había sorteo 50/50 con `profiles.compare_order`. **Removido en pivote v2** (migration `20260525000001_remove_compare_order.sql`) — el split view en `/candidatos` ya no es un paso obligatorio del flow, así que el control de sesgo por orden dejó de aplicar.
- **Q5**: banco final 10-15 preguntas en 4 dimensiones JNE. Vive en `data/questions/draft_v2.md` y se carga vía `pnpm seed:questions`.

---

## 5. Workflow Spec Kit que se está usando

Comandos `/speckit-*` ya ejecutados en orden:

1. `/speckit-constitution` ✓
2. `/speckit-specify` ✓
3. `/speckit-clarify` ✓ (5 ambigüedades resueltas)
4. `/speckit-plan` ✓
5. `/speckit-tasks` ✓ (159 tareas)
6. `/speckit-analyze` ✓ (sin issues CRITICAL/HIGH, 9 remediaciones LOW/MEDIUM aplicadas)
7. `/speckit-implement` ⚙ EN PROGRESO — Phase 1 completa, Phase 2 pendiente.

Para continuar implementando: usa el TodoWrite tool para trackear tareas y completa una phase a la vez. Marca `[X]` en `tasks.md` al terminar cada tarea. Lee `tasks.md` antes de empezar para entender dependencias.

---

## 6. Cómo levantar el proyecto en local

```powershell
# Clonar
git clone https://github.com/cowork-Alli-Rodri/Proyecto-Upao-2da-vuelta.git
cd Proyecto-Upao-2da-vuelta
git checkout 001-voto-informado-upao

# Instalar (pnpm v11 obligatorio)
pnpm install

# Copiar env (llenar después con valores reales)
Copy-Item .env.example .env.local

# Verificar tooling
pnpm lint    # debe estar verde
pnpm tsc     # debe estar verde
pnpm test    # 1 sanity test debe pasar
pnpm build   # debe compilar sin errores

# Dev server (cuando haya UI real)
pnpm dev     # http://localhost:3000
```

**Para Phase 2 necesitarás Docker Desktop corriendo** para `supabase start`. Sin Docker no puedes aplicar migraciones ni correr tests de integración (la regla de no mockear DB es estricta — CLAUDE.md).

Detalle completo en [specs/001-voto-informado-upao/quickstart.md](specs/001-voto-informado-upao/quickstart.md).

---

## 7. Convenciones de archivos y comandos

| Convención | Regla |
|---|---|
| Alias TS | `@/*` apunta a la raíz del repo (ver `tsconfig.json`) |
| Paths VSCode | Usa `[archivo.ts](ruta/al/archivo.ts)` o `[archivo.ts:42](ruta/al/archivo.ts#L42)` para referencias clickeables |
| Migraciones | `supabase/migrations/000N_descripcion.sql` numeradas secuencialmente |
| Server actions | `app/(grupo)/ruta/_actions.ts`, devuelven `Result<T, AppError>` |
| Validación | Zod schemas en `lib/validation/*.schema.ts`, compartidos cliente/servidor |
| Tests unit | `tests/unit/**/*.test.ts(x)` con Vitest |
| Tests integration | `tests/integration/**/*.test.ts` con Supabase local Docker (no mocks) |
| Tests E2E | `tests/e2e/**/*.spec.ts` con Playwright |
| RSC vs client | RSC por default. `"use client"` solo si hay estado/efectos/event handlers |

Comandos útiles ya en `package.json`:

```text
pnpm dev / build / lint / tsc / test / e2e
pnpm format / format:check
pnpm db:types       # genera lib/supabase/database.types.ts
pnpm db:reset       # reset + seed DB local
pnpm seed:questions # carga data/questions/draft_v2.md
pnpm jne:refresh    # refresh manual JNE
pnpm anonymize:dry-run / anonymize
```

---

## 8. Qué hacer cuando recibas una tarea

1. **Lee la tarea exacta en `tasks.md`** — el ID y la descripción.
2. **Verifica las dependencias** — ¿requiere que otras tareas estén hechas? Mira la sección "Dependencies & Execution Order".
3. **Si es TDD** (tarea de US1/US2/US3/US4 marcada como test): escribe el test PRIMERO, ejecuta, confirma que falla, luego implementa.
4. **Usa Edit antes que Write** para archivos existentes; usa Write para archivos nuevos.
5. **Marca `[X]` en `tasks.md`** al terminar.
6. **Reporta al humano** qué hiciste y qué viene después.
7. **NO uses commit/push sin que te lo pidan explícitamente**.

---

## 9. Cosas que aún están pendientes y son tu responsabilidad recordar

- **`data/questions/draft_v2.md`** — banco final del pivote v2 (12 preguntas en 4 dimensiones JNE) ya generado y cargado vía `pnpm seed:questions`.
- **Configurar OAuth providers en Supabase Dashboard** — manual, fuera del código. Documentado en quickstart.
- **`CRON_SECRET`** — rotar antes de producción.
- **Promover admin** — `UPDATE profiles SET role = 'admin' WHERE id = 'tu-uuid';` (no hay UI).
- **`app_settings.ciclo_cierre_at`** — el admin lo setea cuando cierra el ciclo. Sin esto, el cron de anonimización no se activa.

---

## 10. Si algo no te queda claro

- **Antes de adivinar**, pregunta a la humana. El proyecto tiene constraints éticos (Ley 29733, neutralidad política) donde equivocarse cuesta.
- **Antes de cambiar el spec**, recuerda que ya pasó por `/speckit-clarify` y `/speckit-analyze`. Si propones un cambio, justifícalo contra alguno de los principios constitucionales.
- **Antes de añadir una dependencia nueva**, verifica que no exista una equivalente ya instalada. La constitución exige simplicidad.

---

**Última actualización del estado**: 2026-05-20 — Phase 1 Setup completa, Phase 2 Foundational es lo siguiente.

Bienvenida al proyecto. Tu humana es Allison; la mía (la del Claude original que setupeó esto) es Rodrigo. Trabajan en el mismo repo. Cuando termines algo significativo, propón commit con mensaje descriptivo y deja que ella decida pushear.
