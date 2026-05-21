# Quickstart — Voto Informado UPAO

**Para**: cualquier persona que clone el repo y necesite el entorno corriendo en local en menos de 15 minutos.

---

## 1. Requisitos del sistema

| Herramienta | Versión mínima | Notas |
|---|---|---|
| Node.js | 22 LTS | obligatorio por `pnpm@11` |
| pnpm | 11.x | **NUNCA usar npm o yarn** (constitución, CLAUDE.md) |
| Git | 2.40+ | |
| Docker Desktop | 24+ | para Supabase local |
| Supabase CLI | 1.190+ | `npm i -g supabase` (única excepción a la regla de pnpm — la CLI se instala global con npm) |
| Vercel CLI | 33+ | opcional, para previews |

Verifica:

```powershell
node --version    # >= 22
pnpm --version    # >= 11
docker --version
supabase --version
```

---

## 2. Clonar y configurar variables

```powershell
git clone https://github.com/MrWoffi/voto-informado-upao.git
cd voto-informado-upao
pnpm install
```

Copia las plantillas de env:

```powershell
Copy-Item .env.example .env.local
Copy-Item .env.example .env.test
```

Variables mínimas para desarrollo:

```dotenv
# Supabase local (auto-llenado por `supabase start`)
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...

# OAuth (usar credenciales de dev del proyecto Supabase)
SUPABASE_AUTH_GOOGLE_CLIENT_ID=...
SUPABASE_AUTH_GOOGLE_SECRET=...
SUPABASE_AUTH_MICROSOFT_CLIENT_ID=...
SUPABASE_AUTH_MICROSOFT_SECRET=...

# Upstash Redis (rate limit)
UPSTASH_REDIS_REST_URL=...
UPSTASH_REDIS_REST_TOKEN=...

# Cloudflare Turnstile
NEXT_PUBLIC_TURNSTILE_SITE_KEY=...
TURNSTILE_SECRET_KEY=...

# JNE
JNE_API_BASE=https://web.jne.gob.pe/serviciovotoinformado

# Cron y observabilidad
CRON_SECRET=local-dev-secret
SENTRY_DSN=...
NEXT_PUBLIC_POSTHOG_KEY=...
NEXT_PUBLIC_POSTHOG_HOST=https://app.posthog.com
```

> **Aviso manual**: para producción Vercel, Rodrigo debe configurar OAuth providers en el dashboard de Supabase (Google + Microsoft) y rotar `CRON_SECRET`. No quedan en este repo.

---

## 3. Levantar Supabase local

```powershell
supabase start
```

Esto arranca Postgres 16, GoTrue (Auth), Storage, Realtime y Studio en `http://127.0.0.1:54323`. La CLI muestra las URLs y keys al terminar — pegarlas en `.env.local`.

Aplicar migraciones y seeds:

```powershell
supabase db reset
```

Esto corre todas las migraciones en orden + `supabase/seed.sql` (si existe). El seed JNE carga los JSONs de `data/jne/raw/` en `candidates`, `plans`, `plan_dimensions`.

---

## 4. Banco de preguntas

El borrador del banco vive en `data/questions/draft_v1.md` (generado por el equipo técnico post-spec). Para cargarlo en local:

```powershell
pnpm run seed:questions
```

Esto parsea el draft y hace upsert en `questions` con `activo=true` y `orden` secuencial.

El seed se ejecuta directamente al desplegar. El docente puede editar, agregar o desactivar preguntas desde `/admin/preguntas` cuando quiera — sin proceso de aprobación formal.

---

## 5. Lista blanca de docentes

Para promover un correo a `teacher`:

```powershell
pnpm run add-teacher -- --email docente@upao.edu.pe --note "Tesis 2026"
```

Internamente: insert en `allowed_teachers`. Al próximo login del usuario, su `profiles.role` se eleva.

---

## 6. Run dev

```powershell
pnpm dev
```

App en `http://localhost:3000`. Turbopack on por default en `next dev`.

---

## 7. Flujos para probar manualmente

### Flujo estudiante (P1)

1. Visita `/` → click "Ingresar".
2. Login con Google (o email/password si no tienes OAuth local).
3. Aceptar consentimiento + opt-in de uso de datos.
4. Llenar perfil: facultad, carrera, ciclo, rango edad.
5. Responder cuestionario paso a paso.
6. Comparador: el orden Keiko/Roberto se asigna 50/50 y persiste.
7. Marcar preferencia + confianza + motivo.
8. Pantalla de cierre.

### Flujo docente (P2)

1. Asegúrate que tu correo está en `allowed_teachers`.
2. Login.
3. Visita `/dashboard`.
4. Aplica filtros (facultad, ciclo, rango fechas).
5. Click "Exportar" → prueba los 4 formatos (CSV, XLSX, HTML para Canva, ZIP Power BI).

### Flujo admin (P3)

1. Promueve tu user vía SQL directo:

   ```sql
   UPDATE profiles SET role = 'admin' WHERE id = 'tu-uuid';
   ```

2. Visita `/admin/preguntas` → crear, editar, reordenar, desactivar.
3. Visita `/admin/jne` → dispara refresh manual; verifica `jne_refresh_log`.
4. Configura `app_settings.ciclo_cierre_at` desde `/admin`.

---

## 8. Tests

```powershell
pnpm lint        # ESLint + Prettier check
pnpm tsc         # TypeScript strict, sin errores
pnpm test        # Vitest unit + integration (requiere supabase local arriba)
pnpm e2e         # Playwright (requiere `pnpm dev` corriendo en otra terminal)
```

CI corre los 4 en cada PR (constitución, workflow).

---

## 9. Comandos útiles

```powershell
# Reset full de DB local con migraciones y seeds
supabase db reset

# Generar tipos TS desde Supabase (después de cambios en migraciones)
pnpm run db:types

# Refrescar JNE manualmente sin pasar por la UI
pnpm run jne:refresh

# Ejecutar el job de anonimización en local (para tests)
pnpm run anonymize:dry-run    # imprime qué borraría
pnpm run anonymize            # ejecuta de verdad

# Generar export del dashboard sin pasar por el browser
pnpm run export -- --format csv --anonymize pseudonym --out ./tmp
```

---

## 10. Deploy a Vercel

### Primera vez

1. `vercel link` desde la raíz.
2. Configurar variables de entorno en el dashboard de Vercel (mismas keys que `.env.local`, valores de producción).
3. Configurar Vercel Cron en `vercel.json` (ya commiteado).
4. `vercel --prod`.

### Crons configurados

| Path | Schedule | Función |
|---|---|---|
| `/api/cron/jne-refresh` | `0 4 * * *` | Refresh datos JNE (24h) |
| `/api/cron/anonymize` | `0 5 1 * *` | Anonimización mensual Ley 29733 |

---

## 11. Troubleshooting

| Síntoma | Causa probable | Fix |
|---|---|---|
| `supabase start` falla con "port 54321 already in use" | Otra instancia de Supabase corriendo | `supabase stop --backup-only=false` |
| `pnpm install` instala lento | minimumReleaseAge bloquea | Esperar 1440 min o usar `pnpm install --ignore-publish-config` (NO en producción) |
| OAuth devuelve "redirect_uri_mismatch" | Callback URL no configurada en provider | Agregar `http://localhost:3000/auth/callback` en Google/Microsoft console |
| Cron handler responde 401 | `CRON_SECRET` no coincide | Verificar var en Vercel o `.env.local` |
| JNE devuelve 401 reiterado | `X-Session-Token` vencido y refresh falló | Inspeccionar `jne_refresh_log`, forzar `pnpm run jne:refresh` |
| Lighthouse < 90 en CI | Componentes client-side bloqueando TTI | Convertir a RSC o `dynamic import` |
| Test E2E falla en `/comparador` con orden inverso | `compare_order` no persistió | Verificar trigger + RSC `assignCompareOrderIfMissing` |

---

## 12. Antes de pushear

```powershell
pnpm lint && pnpm tsc && pnpm test && pnpm e2e
```

Si todo verde → commit y push. CI re-corre los 4. PRs sin tests verdes no se mergean (constitución).
