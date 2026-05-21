# Release checklist — Voto Informado UPAO

Procedimiento manual antes de cada deploy a producción. Las verificaciones automatizadas (lint, tsc, test, e2e) corren en CI; este documento cubre las que requieren un humano o entornos externos.

## 1. Pre-merge — Security review (T153)

Antes del primer merge a `main`, ejecutar el skill `/security-review` (Claude Code) sobre el diff acumulado de la rama. Revisar:

- [ ] **RLS policies** activas en todas las tablas que tocan `auth.users` (`profiles`, `answers`, `preferences`, `consent_events`, `allowed_teachers`, `anonymization_log`, `jne_refresh_log`, `app_settings`).
- [ ] **Service-role key** nunca expuesta a cliente. `lib/supabase/admin.ts` lanza si se importa desde browser.
- [ ] **Sanitización de logs** — `lib/utils/logger.ts` filtra `email`, `nombres`, `apellidos`, `token`, `password`, `dni`, `phone`.
- [ ] **Secrets en env** — `SUPABASE_SERVICE_ROLE_KEY`, `CRON_SECRET`, `SENTRY_AUTH_TOKEN`, `TURNSTILE_SECRET_KEY`, `UPSTASH_REDIS_REST_TOKEN`, `SUPABASE_AUTH_*_SECRET` solo en Vercel server env vars (no `NEXT_PUBLIC_`).
- [ ] **CRON_SECRET** rotado al menos una vez antes del primer deploy a producción (`openssl rand -hex 32`).
- [ ] **TLS** — Vercel impone HTTPS por defecto. Verificar redirect de `http://` a `https://`.
- [ ] **Encryption at rest** — habilitado en Supabase Dashboard (default en plan Pro+).
- [ ] **Headers de seguridad** — `next.config.ts` ya define `X-Frame-Options DENY`, `X-Content-Type-Options nosniff`, `Referrer-Policy`, `Permissions-Policy`. Confirmar que se aplican con `curl -I` contra la URL de producción.

## 2. Quickstart end-to-end (T154)

Probar `quickstart.md` en una máquina limpia (o `git clean -xfd` + reinstalación):

```powershell
git clone https://github.com/cowork-Alli-Rodri/Proyecto-Upao-2da-vuelta
cd Proyecto-Upao-2da-vuelta
git checkout 001-voto-informado-upao
pnpm install
Copy-Item .env.example .env.local
pnpm exec supabase start
# copiar las keys que imprime a .env.local
pnpm exec supabase db reset
pnpm run seed:questions
pnpm run seed:jne-roberto
pnpm dev
```

- [ ] `pnpm dev` levanta en < 60s y responde 200 en `http://localhost:3000/`.
- [ ] Tiempo total desde clone hasta dev server corriendo: **< 15 min**.
- [ ] El flujo `/login → /consent → /profile → /cuestionario → /comparador → /preferencia → /cierre` funciona end-to-end con un usuario nuevo (email-password).

## 3. CI verde en PR (T155)

- [ ] Job `quality` (lint + tsc + test) en verde.
- [ ] Job `e2e` (Playwright) en verde.
- [ ] No hay artefactos `playwright-report` indicando fallos.

## 4. Deploy preview Vercel (T156)

- [ ] Push a la rama → Vercel genera preview URL automáticamente.
- [ ] Preview URL responde 200 en `/`, `/como-funciona`, `/login`.
- [ ] Eventos de prueba aparecen en PostHog (filtrar por entorno preview).
- [ ] Un error forzado (`throw new Error('test')` temporal) aparece en Sentry con el release SHA correcto.
- [ ] Source maps cargados en Sentry (verificable en el detalle del issue: stacktrace debe mostrar TypeScript original, no minificado).

## 5. Vercel Cron triggers (T157)

Después del deploy a producción, al menos un trigger manual antes del primer ciclo programado:

```bash
# JNE refresh
curl -X GET "https://votoinformado-upao.com/api/cron/jne-refresh" \
  -H "Authorization: Bearer $CRON_SECRET"

# Anonymize (heartbeat — debería responder skipped a menos que el cutoff esté cruzado)
curl -X GET "https://votoinformado-upao.com/api/cron/anonymize" \
  -H "Authorization: Bearer $CRON_SECRET"
```

- [ ] Ambos endpoints devuelven 200 con JSON estructurado.
- [ ] `jne_refresh_log` recibe una entrada nueva con `status='success'`.
- [ ] Vercel Dashboard muestra los dos crons activos con su schedule.

## 6. Load test smoke (T158)

```powershell
# Localmente:
pnpm dev
pnpm run load-test

# Contra preview:
k6 run -e BASE_URL=https://preview-xxx.vercel.app tests/load/student-flow.js
```

- [ ] **p95 < 2000 ms** (SC-008).
- [ ] **Rate de errores < 1%**.
- [ ] Rate de checks pasados > 99%.

Si falla, inspeccionar la traza en Vercel Analytics — usualmente es cold-start de funciones o Lenis bloqueando en pages con mucho JS. Optimizar con `next/dynamic` antes de retentar.

## 7. Aprobación final

- [ ] Owner del proyecto (Rodrigo) revisa la check list completa.
- [ ] Tag semver en `main` (`v1.0.0` para el primer release).
- [ ] Anuncio interno al docente con la URL de producción.
