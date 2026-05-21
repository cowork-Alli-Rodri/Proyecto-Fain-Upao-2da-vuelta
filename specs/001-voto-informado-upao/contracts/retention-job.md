# Contract — Job de Retención y Anonimización (Ley 29733)

**Propósito**: definir el cron mensual que aplica la política de retención de 12 meses + anonimización irreversible (FR-041a, FR-041b, FR-041c, resolución Q3 de Clarifications).

---

## Disparador

| Tipo | Ruta | Schedule | Auth |
|---|---|---|---|
| Cron | `app/api/cron/anonymize/route.ts` | `0 5 1 * *` (día 1 de cada mes, 05:00 UTC = 00:00 Lima) — heartbeat | `Authorization: Bearer ${CRON_SECRET}` |
| Manual (admin) | Server action `runAnonymizationNow()` | — | rol `admin` |

**Importante sobre la frecuencia**: el cron corre mensualmente como **heartbeat**, no para anonimizar todos los meses. Mientras `ciclo_cierre_at + 12 meses > NOW()`, el handler termina sin tocar nada. Cuando ese umbral se cruza (una sola vez para un ciclo), el cron anonimiza todos los perfiles pendientes en esa ejecución. En ejecuciones posteriores `is_anonymized = true` impide doble procesamiento. Para un solo ciclo, el job efectivamente "se activa" una vez en toda la vida del proyecto. El heartbeat mensual existe para resiliencia (downtime, ciclos múltiples en v2, requests de borrado individuales).

---

## Lógica

```pseudocode
function anonymize_expired():
  cutoff = (SELECT ciclo_cierre_at FROM app_settings WHERE id = 1)
  if cutoff IS NULL:
    log('No ciclo_cierre_at set, skipping')
    return

  -- Verificar si ya pasaron 12 meses desde el cierre del ciclo
  if cutoff + INTERVAL '12 months' > NOW():
    log('Threshold not yet reached, skipping')
    return

  -- atomic en una sola transacción
  BEGIN

  affected = UPDATE profiles
    SET
      email     = NULL,
      nombres   = NULL,
      apellidos = NULL,
      is_anonymized = true,
      anonymized_at = now()
    WHERE is_anonymized = false
    RETURNING id;

  -- las tablas hijas (answers, preferences, consent_events) mantienen sus filas
  -- pero el join hacia profiles ya no contiene PII

  INSERT INTO anonymization_log (
    executed_at,
    affected_rows,
    cycle_close_date_cutoff,
    executor
  ) VALUES (
    now(),
    COUNT(affected),
    cutoff,
    'cron'  -- o 'admin_manual'
  );

  COMMIT
```

**Observación crítica**: el `auth.users` original NO se borra (lo gestiona Supabase Auth). Lo que se hace es limpiar las columnas espejo en `profiles` y marcar `is_anonymized`. RLS impide que cualquier rol no-admin vea estos rows después.

**Opcional v2**: invocar `supabase.auth.admin.deleteUser(id)` para borrar también el row de `auth.users`. En v1 se conserva por simplicidad (la PII relevante ya está nullificada).

---

## Borrado a pedido (FR-041)

Cuando el estudiante invoca `requestDataDeletion()`:

1. Marca `profiles.is_anonymized = true` con `anonymized_at = now()`.
2. Limpia PII de `profiles` inmediatamente.
3. Inserta log con `executor = 'user_request'`.
4. Devuelve confirmación al usuario.

A diferencia del cron mensual, este flujo no espera al cutoff de 12 meses — es self-service.

---

## Validación que el job preserva data agregada

Tests de integración deben verificar (Vitest + Supabase local):

**Caso 1 — Threshold no alcanzado**:

1. Setear `app_settings.ciclo_cierre_at = NOW() - INTERVAL '6 months'` (solo 6 meses pasaron).
2. Crear 10 profiles con PII.
3. Ejecutar el job manualmente.
4. Verificar: 0 perfiles anonimizados, `anonymization_log` no recibe entrada nueva con `affected_rows > 0`.

**Caso 2 — Threshold alcanzado**:

1. Setear `app_settings.ciclo_cierre_at = NOW() - INTERVAL '13 months'` (ya pasaron los 12).
2. Crear 15 profiles con PII (10 antiguos + 5 recién creados — todos elegibles porque el threshold es global por `ciclo_cierre_at`, no por `created_at` del perfil).
3. Cada profile tiene N answers y 1 preference.
4. Ejecutar el job manualmente.
5. Verificar:
   - Los 15 perfiles tienen `email/nombres/apellidos = NULL` y `is_anonymized = true`.
   - `answers` y `preferences` siguen contando los 15 estudiantes en queries agregadas.
   - `anonymization_log` tiene 1 row con `affected_rows = 15`.

**Caso 3 — Idempotencia**:

1. Tras Caso 2, ejecutar el job una segunda vez.
2. Verificar: 0 perfiles afectados (`is_anonymized = true` filtra todo), pero el job termina sin error.

---

## Pre-condiciones de seguridad

- El handler valida `Authorization` header contra `CRON_SECRET` (env var en Vercel). Si falla → 401, no ejecuta nada, log a Sentry.
- Service role key se usa solo dentro del handler (vía `lib/supabase/admin.ts`). Nunca expuesto al cliente.
- Idempotencia: la condición `is_anonymized = false` impide re-anonimizar.

---

## Observabilidad

- Cada ejecución emite:
  - `usage_events` con `event_type = 'anonymization_run'`, `payload = { affected_rows, cutoff }`.
  - Log estructurado JSON a stdout (Vercel lo captura).
  - Si `affected_rows > 0`: notificación a PostHog con tag `compliance.ley-29733`.
- Sentry recibe error si:
  - `cutoff` es NULL (admin no declaró cierre — alerta de configuración).
  - Falla la transacción.
  - Conteo final no cuadra con `affected.length`.

---

## Documentación visible al usuario

Texto del consentimiento informado (`/consent`) DEBE incluir literalmente:

> Tus datos personales (nombre, apellido, correo) se conservarán únicamente por un máximo de **12 meses** después del cierre del ciclo académico. Pasado ese plazo, serán **anonimizados de forma irreversible**: tus respuestas se mantendrán únicamente en forma agregada y sin posibilidad de vincularse a tu identidad. Puedes solicitar el borrado completo de tus datos en cualquier momento desde tu perfil, conforme a la Ley N° 29733 — Protección de Datos Personales del Perú.
