# Guía de deploy — Voto Informado UPAO

Procedimiento end-to-end desde "cuentas creadas" hasta producción en Vercel. Va en orden: nada de pasos puede saltarse sin romper el siguiente. Tiempo total: 60–90 min con todas las cuentas ya creadas.

> **Prerequisito**: este documento asume que las cuentas externas ya fueron creadas (Supabase, Google Cloud, Upstash, Cloudflare, Sentry, PostHog, Vercel, dominio). Si todavía no, ver tabla de cuentas en `CLAUDE.md` o el resumen de chat. Microsoft/Azure OAuth fue descartado — los usuarios con correo institucional MS se registran por email-password.

---

## 0. Antes de empezar — credenciales a tener a mano

Tener abiertos los dashboards y copiar a un gestor (1Password / Bitwarden) los siguientes valores. **No pegar en chat ni en archivos versionados**:

| Origen | Valor |
|---|---|
| Supabase prod | URL del proyecto, anon key, service_role key |
| Supabase prod | DB password (para conectar el CLI) |
| Google Cloud | OAuth Client ID y Client Secret |
| Google Cloud | Fact Check API key |
| Upstash | REST URL y REST Token |
| Cloudflare | Turnstile Site Key y Secret Key |
| Sentry | DSN, Auth Token, Org slug, Project slug |
| PostHog | Project API Key |
| Generado por mí | `CRON_SECRET` (ver chat) |

---

## 1. Supabase — proyecto prod

### 1.1 Crear proyecto
1. https://supabase.com → New project. Región: **São Paulo (sa-east-1)**. Plan: Free al inicio, Pro cuando se confirme estabilidad.
2. Guardar DB password. Anotar la URL del proyecto (`https://xxxxx.supabase.co`).

### 1.2 Conectar CLI local al proyecto remoto
```powershell
pnpm exec supabase login          # browser-based auth
pnpm exec supabase link --project-ref xxxxx   # ref viene del URL del proyecto
```

### 1.3 Subir migraciones
```powershell
pnpm exec supabase db push
```
Esto aplica las ~15 migraciones de `supabase/migrations/` en orden contra prod. **Verificar en Supabase Studio que las tablas existan.**

### 1.4 Seeds en prod
```powershell
# .env.local debe apuntar a prod momentáneamente para los seeds
# (cambiar NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY a los valores prod, ejecutar, revertir)
pnpm run seed:questions
pnpm run jne:refresh
```

### 1.5 Configurar OAuth providers en Supabase
Supabase Dashboard → **Authentication → Providers**:
- **Google**: pegar Client ID + Secret. Copiar el callback que muestra Supabase (`https://xxxxx.supabase.co/auth/v1/callback`).
- **Email**: dejar habilitado (es el fallback para correos institucionales Microsoft y cualquier email manual).

### 1.6 Configurar URLs autorizadas
Supabase Dashboard → **Authentication → URL Configuration**:
- Site URL: `https://votoinformado-upao.com` (o tu dominio final)
- Redirect URLs: agregar `https://votoinformado-upao.com/auth/callback` y `https://*.vercel.app/auth/callback` (para previews)

---

## 2. Google Cloud — OAuth y Fact Check

### 2.1 OAuth
1. https://console.cloud.google.com → APIs & Services → Credentials → Create Credentials → OAuth client ID.
2. Type: **Web application**.
3. Authorized redirect URIs: pegar el callback de Supabase (`https://xxxxx.supabase.co/auth/v1/callback`).
4. Copiar Client ID y Secret. Llevar a Supabase (paso 1.5).

### 2.2 Fact Check Tools API
1. Mismo proyecto GCP → APIs & Services → Library → buscar "Fact Check Tools API" → Enable.
2. Credentials → Create Credentials → API Key. Restringir a la API anterior.

---

## 3. Microsoft OAuth — descartado

Decisión 2026-05-26: NO se implementa OAuth Microsoft/Azure AD. Razones:
- Crear app en Azure requiere un tenant Entra ID, que a su vez exige free trial de Azure con tarjeta de crédito (fricción innecesaria para un piloto)
- Google OAuth + email-password cubren el flujo: usuarios con correo institucional Microsoft (`@upao.edu.pe`) pueden registrarse manualmente vía email
- Si UPAO valida que necesita OAuth Microsoft nativo después, se puede añadir en ~30 min (registro Entra ID + pegar credenciales en Supabase Dashboard + restaurar botón en `LoginCard`)

---

## 4. Vercel — proyecto y dominio

### 4.1 Conectar repo
1. https://vercel.com → Add New → Project → Import repo `Proyecto-Upao-2da-vuelta`.
2. Framework preset: Next.js (detección automática). Build command: `pnpm build`. Install: `pnpm install`.

### 4.2 Environment variables (Production + Preview)
Pegar todas. **Distinguir Production de Preview** donde indique:

| Variable | Production | Preview | Notas |
|---|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | `https://votoinformado-upao.com` | dejar vacío (Vercel inyecta `VERCEL_URL`) | |
| `NEXT_PUBLIC_SUPABASE_URL` | URL Supabase prod | mismo | |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | anon key prod | mismo | |
| `SUPABASE_SERVICE_ROLE_KEY` | service_role prod | mismo | server-only — Vercel lo marca automático |
| `SUPABASE_AUTH_GOOGLE_CLIENT_ID` | Google client ID | mismo | |
| `SUPABASE_AUTH_GOOGLE_SECRET` | Google secret | mismo | |
| `UPSTASH_REDIS_REST_URL` | Upstash URL | mismo | |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash token | mismo | |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | Site key prod | site key prod (o key dummy de test si quieres bypass) | |
| `TURNSTILE_SECRET_KEY` | secret prod | secret prod | |
| `JNE_API_BASE` | `https://votoinformadoia.jne.gob.pe/ServiciosWeb` | mismo | |
| `GOOGLE_FACT_CHECK_API_KEY` | API key | mismo | |
| `CRON_SECRET` | el valor generado en el chat | mismo | |
| `SENTRY_DSN` | DSN | DSN | |
| `NEXT_PUBLIC_SENTRY_DSN` | DSN | DSN | |
| `SENTRY_AUTH_TOKEN` | auth token | auth token | |
| `SENTRY_ORG` | org slug | org slug | |
| `SENTRY_PROJECT` | project slug | project slug | |
| `NEXT_PUBLIC_POSTHOG_KEY` | project key | project key | |
| `NEXT_PUBLIC_POSTHOG_HOST` | `https://us.i.posthog.com` | mismo | |

### 4.3 Primer deploy
Click **Deploy**. Esperar build. Si falla por env faltante, revisar la columna anterior.

### 4.4 Dominio
1. Vercel → Project → Settings → Domains → Add `votoinformado-upao.com` y `www.votoinformado-upao.com`.
2. En el proveedor del dominio (Namecheap / Cloudflare / etc.) crear los registros DNS que Vercel indica (CNAME para www, A para apex).
3. Esperar propagación (5–30 min). Vercel emite cert TLS automático.

### 4.5 Cron jobs
Vercel detecta `vercel.json` y registra los 2 crons automáticamente. Verificar en **Settings → Cron Jobs** que aparezcan:
- `/api/cron/jne-refresh` — `0 4 * * *`
- `/api/cron/anonymize` — `0 5 1 * *`

---

## 5. Validación post-deploy

### 5.1 Smoke test manual
- `https://votoinformado-upao.com/` → carga, hero visible.
- `/login` → carga, botón Google + form email/password visibles.
- Loguearse con Google → debe redirigir a `/consent`.
- Aceptar consent → `/profile` → completar → `/cuestionario` → completar → `/preferencia` → `/cierre`.
- `/candidatos` → carga sin error.
- `/no-te-dejes-sorprender` → carga, lista fact-checks.

### 5.2 Promover usuario docente
Después de que el docente se loguee al menos una vez:
```powershell
pnpm run add-teacher -- --email docente@upao.edu.pe
pnpm run promote:user -- --email docente@upao.edu.pe --role teacher
```
Idem para tu cuenta admin:
```powershell
pnpm run promote:user -- --email rodrigo@correo.com --role admin
```

### 5.3 Trigger crons manualmente
```powershell
$secret = "<CRON_SECRET>"
curl -X GET "https://votoinformado-upao.com/api/cron/jne-refresh" -H "Authorization: Bearer $secret"
curl -X GET "https://votoinformado-upao.com/api/cron/anonymize" -H "Authorization: Bearer $secret"
```
Esperado: HTTP 200 + JSON con `status`. La tabla `jne_refresh_log` debe tener una fila nueva con `status='success'`.

### 5.4 Sentry + PostHog
- Sentry: forzar un error temporal (`throw new Error('test')` en una page) → push → verificar que aparece en Sentry con release SHA correcto y stacktrace en TypeScript original (source maps OK).
- PostHog: navegar el flow → ver eventos en Activity > Live → confirmar que aparecen `QUESTIONNAIRE_STARTED`, `STEP_ADVANCED`, etc.

### 5.5 Lighthouse
Correr Lighthouse desde Chrome DevTools en:
- `/` (marketing)
- `/cuestionario`
- `/candidatos`
- `/dashboard` (autenticado como teacher)

Target: ≥ 90 en Performance / Accessibility / Best Practices / SEO.

---

## 6. Post-launch (semana 1)

- [ ] Monitorear Sentry diariamente. Cero errores no esperados.
- [ ] PostHog: confirmar que el flow completa-rate > 60%.
- [ ] Confirmar que el cron `/api/cron/jne-refresh` corrió las 7 noches y dejó logs OK.
- [ ] Si todo estable: iniciar transferencia del proyecto Supabase al docente UPAO (Opción 1 — `Settings → General → Transfer project`).

---

## Anexo — qué hacer si algo falla

| Síntoma | Causa probable | Acción |
|---|---|---|
| Build de Vercel falla con `Cannot find module @/...` | env vars no cargadas en build time | revisar que `NEXT_PUBLIC_*` estén marcadas como tales |
| Login OAuth devuelve `redirect_uri_mismatch` | callback URL mal configurada en Google | comparar el callback exacto con el de Supabase Dashboard |
| Cron retorna 401 | `CRON_SECRET` distinto entre Vercel y `vercel.json` | rotar y volver a pegar |
| Dashboard `/dashboard` redirige a `/cierre` | usuario no fue promovido a teacher | correr `add-teacher` + `promote:user` |
| Plan de Roberto sigue vacío | `jne:refresh` no se ejecutó | correr manual contra prod |
| Charts vacíos en dashboard | MVs no se refrescan | inspeccionar trigger en migration `0006_views_dashboard.sql` |

