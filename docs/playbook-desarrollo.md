# Playbook de desarrollo — Plataforma web para cliente (Next + Supabase)

Documento de proceso destilado del Proyecto UPAO "Voto Informado". Objetivo:
**que un proyecto similar se haga más rápido y con menos errores**. No es un
manual del framework; es el conjunto de decisiones, patrones y trampas reales
que ya pagamos una vez.

Aplica cuando el proyecto es: webapp para un cliente, con registro de usuarios,
captura de datos de usuarios, un dashboard analítico para el cliente, contenido
sensible (político / datos personales) y deploy en Vercel.

---

## 1. Stack y por qué

| Capa | Elección | Razón |
|---|---|---|
| Framework | Next.js (App Router) + React Server Components | Render server-side por defecto, menos JS al cliente, server actions para mutaciones |
| Estilos | Tailwind v4 + shadcn/ui | Rápido, consistente, accesible (Radix) |
| Backend/DB/Auth | Supabase (Postgres + Auth + RLS + Storage) | Un solo proveedor; RLS = seguridad en la DB, no solo en la app |
| Hosting | Vercel + Vercel Cron | Deploy por push a `main`; cron para refrescos de datos |
| Validación | Zod (cliente Y servidor) | Mismo schema en ambos lados |
| Tests | Vitest (unit/integración) + Playwright (e2e) | Integración contra Supabase local con Docker |
| Workflow | Spec Kit (`.specify/`) | constitution → specify → plan → tasks → implement |

Reglas duras del proyecto: pnpm v11 (nunca npm/yarn), TypeScript strict (sin
`any`), cero `console.log` en prod (usar logger/Sentry), todo en español neutro,
sin emojis.

---

## 2. Flujo de trabajo

1. **Spec Kit**: constitution (principios) → specify (qué) → plan (cómo) → tasks
   (backlog) → implement. Evita construir sin spec.
2. **Migraciones primero**: el esquema + RLS antes que la UI. La DB es la fuente
   de verdad y de seguridad.
3. **Server Components por defecto**; `"use client"` solo donde haga falta
   (forms, interactividad). Mutaciones vía **server actions** con guard de rol.
4. **Deploy**: push a `main` → Vercel build de producción. Las migraciones NO se
   aplican en el deploy de Vercel; se aplican aparte con `supabase db push`.

---

## 3. Arquitectura y patrones clave (reusables)

- **Seguridad en capas**: RLS en TODAS las tablas que tocan `auth.users` +
  middleware (`proxy.ts`) para role-gating de rutas + guard de rol en cada server
  action. No confiar en una sola capa.
- **Role-gating en middleware**: rutas por rol (`student` / `teacher` / `admin`).
  El middleware es tolerante a fallos de DB (si no resuelve el rol, deja pasar y
  la página valida de nuevo server-side).
- **Resolución de destino post-login centralizada**: una sola función
  (`resolveStudentResumePath`) decide a dónde va cada usuario tras login. La usan
  el callback de auth Y el header. Así el botón nunca contradice al login.
- **Snapshots inmutables para datos de captura**: cada respuesta guarda una copia
  congelada de la pregunta (texto, tipo, dimensión) al momento de responder, con
  un trigger que impide editarlas. Permite cambiar el banco de preguntas sin
  corromper respuestas históricas. **Pero la analítica del dashboard lee la tabla
  viva** — ver lección #1.
- **Vistas para analítica, NO materialized views** salvo que tengas un mecanismo
  de refresh real. Una VIEW normal siempre está al día; una MV sin refresh queda
  vacía/stale (ver lección #2).
- **Cron para datos externos**: Vercel Cron refresca cache de APIs externas
  (cada 24h). En plan Hobby hay **máximo 2 cron jobs** → si necesitas más,
  haz piggyback (un cron que dispara varias tareas).
- **Anonimización por retención**: job que borra PII pasado X tiempo del cierre,
  manteniendo cifras agregadas (cumplimiento de ley de datos personales).
- **Borrado en cascada**: FK `ON DELETE CASCADE` de `auth.users` → `profiles` →
  `answers`/`preferences`/`consent`. Borrar el usuario limpia todo solo.

---

## 4. Lecciones y trampas (el oro para ir más rápido)

Cada una nos costó tiempo de debug. Revisarlas al inicio del próximo proyecto.

1. **Forma del dato vs cómo lo lee la analítica.** Las respuestas se guardaban
   como `{"value": 5}` (JSONB) pero la vista de analítica esperaba un número
   plano → el cálculo daba NULL/0 silenciosamente. **Define la forma del `valor`
   una vez y úsala consistente en storage, vista y export.**
2. **Materialized views necesitan refresh.** Una MV sin `REFRESH` agendado queda
   vacía. Si el dataset es chico, usa VIEW normal (siempre viva). Si usas MV,
   crea el RPC/cron de refresh desde el día 1.
3. **Migraciones deben aplicar desde cero (idempotentes).** Un `REVOKE`/`DROP`
   sobre un objeto que no existe rompe `db reset` y el rebuild de prod. Envuelve
   en `DO $$ IF EXISTS ... $$`. Verifica con `supabase db reset` periódicamente,
   no solo con `db push` incremental (push no re-aplica lo ya aplicado y oculta
   el bug).
4. **Aislamiento de tests de integración.** Si comparten una DB local y mutan
   estado global (settings, anonimización masiva), DEBEN correr en serie
   (`fileParallelism: false` en Vitest). En paralelo se corrompen entre sí.
5. **No parchear `globalThis.setTimeout` en tests.** Desestabiliza timers
   internos de Node (errores `deref` en teardown). Haz el backoff/retry
   **inyectable** por opción del cliente.
6. **CSP debe permitir Supabase local en dev/build local.** Si la CSP solo
   permite `*.supabase.co`, el login contra `127.0.0.1:54321` falla con "Failed
   to fetch". Gatea por la URL de Supabase (no por NODE_ENV) para que sirva a dev
   y a un build de prod apuntado a local (e2e).
7. **`allowedOrigins` de Server Actions sin wildcard.** `*.vercel.app` acepta
   cualquier subdominio ajeno → debilita CSRF. Usa hosts concretos + las env vars
   que Vercel inyecta (`VERCEL_URL`, `VERCEL_BRANCH_URL`, etc.).
8. **URLs de terceros = valida el esquema antes de renderizar en `href`.** Una
   URL `javascript:`/`data:` de una API externa pasa `z.url()` y, en un `href`,
   es XSS al click. Permite solo `http(s)`.
9. **Rate limit por IP, no balde global.** Una key constante (`"anon"`) deja que
   un solo cliente agote la cuota de todos. Keyea por `x-forwarded-for`.
10. **Logout necesita navegación completa.** Con `<Link>` (client-side), el
    router de Next reusa el RSC cacheado y la UI sigue mostrando al usuario
    logueado. Usa `<a>` nativo para forzar recarga tras el signout server-side.
11. **Página dinámica al leer sesión/cookies.** Un header sensible a sesión
    convierte la ruta en dinámica (`ƒ`). Esperado; tenerlo presente para
    performance.
12. **Contenido sensible (político).** Si el producto debe ser neutral: nada de
    parafraseo editorial, tratamiento simétrico de las partes, mostrar fuentes
    oficiales tal cual, citar la fuente. No inventar datos. Es requisito de
    producto/legal, decisión del cliente — no improvisar.

---

## 5. Checklists reusables

### Antes de abrir el piloto (con usuarios reales)
- [ ] **Congelar el contenido configurable** (ej. banco de preguntas). Cambiarlo
      a mitad rompe la comparabilidad de la analítica.
- [ ] Whitelist/roles de staff (docente/admin) cargados ANTES de que se registren.
- [ ] Cron de datos externos verificado (corrió al menos una vez con éxito).
- [ ] Política de retención/anonimización configurada (fecha de cierre).

### Antes de cada deploy a prod
- [ ] `pnpm tsc` (sin errores), `pnpm lint --max-warnings=0`, `pnpm build` con
      env de producción (limpio).
- [ ] `pnpm audit` = 0 vulnerabilidades (override en `pnpm-workspace.yaml` para
      CVEs transitorios).
- [ ] Tests verdes: e2e (Playwright contra build local) + integración (Vitest +
      Supabase local).
- [ ] Migraciones pendientes aplicadas a prod con `supabase db push` (el deploy
      de Vercel NO las corre).

### Verificar en prod SIN ensuciar datos del cliente
- [ ] Crear usuarios de prueba con email `*@example.test` vía admin API.
- [ ] Roles **admin/teacher** son seguros (no cuentan en datos de estudiantes).
- [ ] Usuario **student** SÍ contamina (cuenta en el dashboard) → borrar con
      `deleteUser` (cascade) inmediatamente y confirmar 0 residuo.
- [ ] Para probar el redirect post-login de staff: insertar un registro de
      consentimiento (el callback exige consent para todos).
- [ ] Smoke test de rutas: públicas → 200; protegidas sin sesión → 307 a /login.

---

## 6. Estado del proyecto UPAO (referencia)

Verificado en producción (mayo 2026): flujos de estudiante, docente y admin;
guardado bajo RLS; cambio de opinión pre/post; verificador (Google Fact Check);
galería de fact-checks; exportaciones (CSV/XLSX/HTML/PowerBI); resumen oficial de
planes. QA de rutas limpio (favicon, viewport móvil, error/not-found, robots/
sitemap OK; 0 console.log).

Pendientes menores / decisiones del cliente (no son bugs):
- Estados de carga (`loading.tsx`) — polish opcional.
- Ruta inexistente para anónimo → /login en vez de 404 (comportamiento típico de
  middleware de Next).
- SEO: el sitio está `noindex` global (apropiado para piloto privado). Si el
  cliente quiere indexar las páginas públicas en Google, hay que quitar
  `robots: { index: false }` del layout en esas rutas.
