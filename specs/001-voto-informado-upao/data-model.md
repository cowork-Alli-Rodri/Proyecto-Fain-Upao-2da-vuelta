# Data Model — Phase 1

**Feature**: Voto Informado UPAO
**Branch**: `001-voto-informado-upao`
**Fecha**: 2026-05-20

> Modelo conceptual + esquema Postgres + políticas RLS + transiciones de estado. Las migraciones reales viven en `supabase/migrations/0001_init_schema.sql`, `0002_rls_policies.sql`, etc. Este documento es la fuente de verdad de diseño; el SQL final puede afinar tipos/índices pero respeta la semántica acá descrita.

---

## Diagrama lógico (alto nivel)

```text
                           ┌─────────────────────┐
                           │   auth.users        │  (gestionado por Supabase)
                           │   id (uuid)         │
                           └──────────┬──────────┘
                                      │ 1:1
                           ┌──────────▼──────────┐
                           │  profiles           │  rol, demografía, compare_order
                           └──────────┬──────────┘
                                      │ 1:N
            ┌──────────────┬──────────┴──────────┬──────────────┐
            │              │                     │              │
   ┌────────▼────┐ ┌───────▼────────┐ ┌──────────▼─────┐ ┌──────▼────────┐
   │ consent_    │ │ answers        │ │ preferences    │ │ usage_events  │
   │ events      │ │  (snapshot enu)│ │  (inmutable)   │ │  (anónimo)    │
   └─────────────┘ └────────┬───────┘ └────────────────┘ └───────────────┘
                            │ N:1
                  ┌─────────▼─────────┐
                  │ questions         │  banco editable por admin
                  └───────────────────┘

   ┌──────────────────┐       ┌────────────────────┐
   │ candidates       │ 1:1   │ plans              │  espejo del JNE
   └────────┬─────────┘       └────────┬───────────┘
            │ 1:N                      │ 1:4
            ▼                          ▼
   ┌──────────────────┐       ┌────────────────────┐
   │ plan_dimensions  │ ◄─────│ social/economica/  │
   │ (4 por candidato)│       │ ambiental/instit.  │
   └──────────────────┘       └────────────────────┘

   ┌──────────────────┐   ┌──────────────────────┐   ┌────────────────────┐
   │ allowed_teachers │   │ jne_refresh_log      │   │ anonymization_log  │
   │  (whitelist)     │   │  (cron audit)        │   │  (Ley 29733 audit) │
   └──────────────────┘   └──────────────────────┘   └────────────────────┘

   ┌──────────────────┐
   │ app_settings     │   ciclo_cierre_at, consent_version, capture_active...
   └──────────────────┘
```

---

## Tablas

### 1. `profiles`

| Columna | Tipo | Nulable | Default | Notas |
|---|---|---|---|---|
| `id` | `uuid` | NO | — | PK, FK → `auth.users(id)` ON DELETE CASCADE |
| `role` | `user_role` ENUM | NO | `'student'` | `'student' \| 'teacher' \| 'admin'` |
| `email_institucional` | `boolean` | NO | `false` | `true` si correo termina en `@upao.edu.pe` |
| `nombres` | `text` | YES | — | Anonimizable |
| `apellidos` | `text` | YES | — | Anonimizable |
| `email` | `citext` | YES | — | Replicado de `auth.users.email` para filtros (anonimizable) |
| `facultad` | `text` | YES | — | FR-006 |
| `carrera` | `text` | YES | — | FR-006 |
| `ciclo` | `smallint` | YES | — | 1–14 |
| `rango_edad` | `text` | YES | — | `'17-19'`, `'20-22'`, `'23-25'`, `'26+'` |
| `genero` | `text` | YES | — | Opcional (FR-006). Valores libres validados Zod. |
| `compare_order` | `compare_order_enum` | YES | — | `'keiko_left' \| 'roberto_left'`. Asignado al primer acceso al comparador (FR-014a). |
| `current_step` | `smallint` | YES | `0` | Puntero al paso del cuestionario para retomar (FR-010) |
| `questionnaire_completed_at` | `timestamptz` | YES | — | Marca de finalización |
| `created_at` | `timestamptz` | NO | `now()` | |
| `updated_at` | `timestamptz` | NO | `now()` | trigger |
| `is_anonymized` | `boolean` | NO | `false` | Marca tras job de anonimización |
| `anonymized_at` | `timestamptz` | YES | — | |

**Índices**: `(role)`, `(facultad, carrera)`, `(questionnaire_completed_at)`, `(is_anonymized)`.

**Trigger**: `on_auth_user_created` (after insert en `auth.users`) crea profile con `role='student'` y consulta `allowed_teachers` para promover si aplica.

---

### 2. `consent_events`

| Columna | Tipo | Nulable | Default | Notas |
|---|---|---|---|---|
| `id` | `uuid` | NO | `gen_random_uuid()` | PK |
| `user_id` | `uuid` | NO | — | FK → `profiles(id)` |
| `accepted_terms_at` | `timestamptz` | NO | — | |
| `accepted_data_use_at` | `timestamptz` | NO | — | Opt-in explícito FR-004a |
| `consent_version` | `text` | NO | — | Versión del texto legal mostrado |
| `ip_hash` | `text` | YES | — | Hash SHA-256 de IP (auditoría, sin PII directa) |
| `user_agent_hash` | `text` | YES | — | |

**Índices**: `(user_id, accepted_terms_at)`.

**Regla**: si `accepted_data_use_at IS NULL`, el sistema bloquea acceso al cuestionario (FR-005).

---

### 3. `questions`

| Columna | Tipo | Nulable | Default | Notas |
|---|---|---|---|---|
| `id` | `uuid` | NO | `gen_random_uuid()` | PK |
| `orden` | `smallint` | NO | — | UNIQUE entre `activo=true` |
| `dimension_tematica` | `dim_tematica_enum` | NO | — | `'social' \| 'economica' \| 'ambiental' \| 'institucional'` |
| `tipo` | `question_type_enum` | NO | — | `'likert' \| 'single' \| 'multiple' \| 'text' \| 'ranking' \| 'comparison'` |
| `enunciado` | `text` | NO | — | El texto mostrado |
| `opciones` | `jsonb` | YES | — | Sólo para tipos no-text (estructura validada Zod) |
| `activo` | `boolean` | NO | `true` | FR-031 |
| `fuente` | `text` | YES | — | Cita opcional (IPE, BCRP, etc.) — visible en hover info |
| `created_at` | `timestamptz` | NO | `now()` | |
| `updated_at` | `timestamptz` | NO | `now()` | trigger |
| `created_by` | `uuid` | YES | — | FK → `profiles(id)` (admin que la creó) |

**Índices**: `(activo, orden)`.

**Validación cross-row**: `CHECK ((tipo = 'text' AND opciones IS NULL) OR (tipo <> 'text' AND opciones IS NOT NULL))`.

---

### 4. `answers`

| Columna | Tipo | Nulable | Default | Notas |
|---|---|---|---|---|
| `id` | `uuid` | NO | `gen_random_uuid()` | PK |
| `student_id` | `uuid` | NO | — | FK → `profiles(id)` |
| `question_id` | `uuid` | NO | — | FK → `questions(id)` |
| `valor` | `jsonb` | NO | — | Estructura depende de `tipo` (validado Zod) |
| `question_snapshot` | `text` | NO | — | Snapshot del enunciado (FR-012) |
| `dimension_snapshot` | `dim_tematica_enum` | NO | — | |
| `tipo_snapshot` | `question_type_enum` | NO | — | |
| `responded_at` | `timestamptz` | NO | `now()` | |
| `updated_at` | `timestamptz` | NO | `now()` | trigger; última edición permitida antes del envío final |

**Índices**: `UNIQUE (student_id, question_id)`, `(student_id, responded_at)`.

**Regla**: Una respuesta por estudiante por pregunta (upsert en autosave). El snapshot se setea en el primer insert y NO se actualiza si el estudiante edita la respuesta (la edición sólo cambia `valor`).

---

### 5. `candidates`

| Columna | Tipo | Nulable | Default | Notas |
|---|---|---|---|---|
| `id` | `integer` | NO | — | PK = `idCandidato` del JNE |
| `id_organizacion_politica` | `integer` | NO | — | 1366 (Keiko), 1264 (Roberto) |
| `nombre_completo` | `text` | NO | — | |
| `partido` | `text` | NO | — | `'FUERZA POPULAR'`, `'JUNTOS POR EL PERU'` |
| `cargo` | `text` | NO | `'Presidente'` | |
| `foto_url` | `text` | YES | — | Supabase Storage o JNE |
| `plan_pdf_url` | `text` | YES | — | URL del PDF oficial |
| `last_synced_at` | `timestamptz` | NO | — | |

---

### 6. `plans`

| Columna | Tipo | Nulable | Default | Notas |
|---|---|---|---|---|
| `id` | `integer` | NO | — | PK = `idPlanGobierno` del JNE (Keiko 29690, Roberto 29688) |
| `candidate_id` | `integer` | NO | — | FK → `candidates(id)` UNIQUE |
| `header_json` | `jsonb` | NO | — | Header crudo del JNE |
| `last_synced_at` | `timestamptz` | NO | — | |

---

### 7. `plan_dimensions`

| Columna | Tipo | Nulable | Default | Notas |
|---|---|---|---|---|
| `id` | `uuid` | NO | `gen_random_uuid()` | PK |
| `plan_id` | `integer` | NO | — | FK → `plans(id)` |
| `dimension` | `dim_tematica_enum` | NO | — | |
| `problema` | `text` | YES | — | Si falta, UI muestra "No declarado por el JNE" (FR-018) |
| `objetivo` | `text` | YES | — | |
| `indicador` | `text` | YES | — | |
| `meta` | `text` | YES | — | |
| `raw_json` | `jsonb` | NO | — | Audit trail del JNE |
| `last_synced_at` | `timestamptz` | NO | — | |

**Índice**: `UNIQUE (plan_id, dimension)`.

---

### 8. `preferences`

| Columna | Tipo | Nulable | Default | Notas |
|---|---|---|---|---|
| `id` | `uuid` | NO | `gen_random_uuid()` | PK |
| `student_id` | `uuid` | NO | — | FK → `profiles(id)` UNIQUE — **inmutable v1** (FR-021) |
| `candidato_preferido` | `text` | NO | — | `'keiko' \| 'roberto' \| 'indeciso'` (texto opaco, no FK para preservar valor histórico si el candidato cambia) |
| `confianza` | `smallint` | NO | — | CHECK 1–10 |
| `motivo` | `text` | YES | — | Texto libre máx 500 chars |
| `compare_order_at_submit` | `compare_order_enum` | NO | — | Snapshot del orden que vio el estudiante (control de sesgo) |
| `submitted_at` | `timestamptz` | NO | `now()` | |

**Índices**: `UNIQUE (student_id)`, `(candidato_preferido)`, `(submitted_at)`.

---

### 9. `allowed_teachers`

| Columna | Tipo | Nulable | Default | Notas |
|---|---|---|---|---|
| `email` | `citext` | NO | — | PK |
| `added_by` | `uuid` | YES | — | FK → `profiles(id)` admin |
| `added_at` | `timestamptz` | NO | `now()` | |
| `note` | `text` | YES | — | Razón / curso |

**Uso**: trigger `on_auth_user_created` consulta esta tabla y eleva `profiles.role = 'teacher'` si hay match.

---

### 10. `usage_events`

| Columna | Tipo | Nulable | Default | Notas |
|---|---|---|---|---|
| `id` | `bigserial` | NO | — | PK |
| `opaque_user_id` | `text` | NO | — | Hash determinístico de `auth.users.id` (no FK directo) |
| `event_type` | `text` | NO | — | `'questionnaire_started'`, `'comparator_viewed'`, `'preference_submitted'`, etc. |
| `payload` | `jsonb` | YES | — | Sin PII |
| `occurred_at` | `timestamptz` | NO | `now()` | |

**Índices**: `(event_type, occurred_at)`, `(opaque_user_id, occurred_at)`.

**Regla**: NO FK a `profiles` — los eventos sobreviven a la anonimización.

---

### 11. `jne_refresh_log`

| Columna | Tipo | Nulable | Default | Notas |
|---|---|---|---|---|
| `id` | `bigserial` | NO | — | PK |
| `triggered_by` | `text` | NO | — | `'cron' \| 'admin'` |
| `started_at` | `timestamptz` | NO | — | |
| `finished_at` | `timestamptz` | YES | — | |
| `status` | `text` | NO | — | `'success' \| 'partial' \| 'failed'` |
| `candidates_updated` | `smallint` | NO | `0` | |
| `dimensions_updated` | `smallint` | NO | `0` | |
| `error_message` | `text` | YES | — | |

---

### 12. `anonymization_log`

| Columna | Tipo | Nulable | Default | Notas |
|---|---|---|---|---|
| `id` | `bigserial` | NO | — | PK |
| `executed_at` | `timestamptz` | NO | `now()` | |
| `affected_rows` | `integer` | NO | `0` | |
| `cycle_close_date_cutoff` | `timestamptz` | NO | — | `ciclo_cierre_at < executed_at - 12 months` |
| `executor` | `text` | NO | — | `'cron' \| 'admin_manual'` |

---

### 13. `app_settings`

Tabla key-value para configuración global (un solo row).

| Columna | Tipo | Nulable | Default | Notas |
|---|---|---|---|---|
| `id` | `smallint` | NO | `1` | PK CHECK `(id = 1)` |
| `ciclo_cierre_at` | `timestamptz` | YES | — | Fecha declarada por admin al cerrar el ciclo |
| `consent_version` | `text` | NO | `'v1'` | Versión del texto de consentimiento vigente |
| `jne_session_token` | `text` | YES | — | Token actual (rotable cada 24h) |
| `jne_token_expires_at` | `timestamptz` | YES | — | |

---

## Tipos ENUM

```sql
CREATE TYPE user_role AS ENUM ('student', 'teacher', 'admin');
CREATE TYPE compare_order_enum AS ENUM ('keiko_left', 'roberto_left');
CREATE TYPE dim_tematica_enum AS ENUM ('social', 'economica', 'ambiental', 'institucional');
CREATE TYPE question_type_enum AS ENUM ('likert', 'single', 'multiple', 'text', 'ranking', 'comparison');
```

---

## Vistas materializadas para dashboard

### `mv_kpis_curso`

```sql
SELECT
  COUNT(*) FILTER (WHERE role = 'student') AS total_inscritos,
  COUNT(*) FILTER (WHERE role = 'student' AND questionnaire_completed_at IS NOT NULL) AS total_completados,
  COUNT(p.*) AS total_preferencias
FROM profiles
LEFT JOIN preferences p ON p.student_id = profiles.id;
```

### `mv_preferencia_por_carrera`

```sql
SELECT
  pr.carrera,
  p.candidato_preferido,
  COUNT(*) AS n,
  AVG(p.confianza)::numeric(4,2) AS confianza_promedio
FROM preferences p
JOIN profiles pr ON pr.id = p.student_id
GROUP BY pr.carrera, p.candidato_preferido;
```

### `mv_orden_vs_preferencia`

(Control de sesgo de primacía — Q4.)

```sql
SELECT
  p.compare_order_at_submit AS orden_asignado,
  p.candidato_preferido,
  COUNT(*) AS n
FROM preferences p
GROUP BY p.compare_order_at_submit, p.candidato_preferido;
```

**Refresh**: `REFRESH MATERIALIZED VIEW CONCURRENTLY` disparado por server action tras cada inserción de respuesta/preferencia (debounced 30 s) o manualmente desde `/admin/jne`.

---

## Políticas RLS (resumen)

| Tabla | SELECT | INSERT | UPDATE | DELETE |
|---|---|---|---|---|
| `profiles` | Sí own, teacher/admin todos | `auth_user_id = auth.uid()` (trigger lo crea) | own (excepto `role`), admin todos | admin only |
| `consent_events` | own, admin | own | nunca (inmutable) | admin only |
| `questions` | todos autenticados ven activos | admin | admin | admin (soft delete preferido) |
| `answers` | own, teacher en dashboard (agregado), admin | own (pre-completion) | own (pre-completion) | nunca |
| `candidates` | todos autenticados | service-role (cron) | service-role | nunca |
| `plans`, `plan_dimensions` | todos autenticados | service-role | service-role | nunca |
| `preferences` | own, teacher en dashboard, admin | own (1 vez) | nunca | admin only |
| `allowed_teachers` | admin | admin | admin | admin |
| `usage_events` | service-role only | service-role | nunca | service-role (anonimización) |
| `jne_refresh_log` | admin | service-role | nunca | nunca |
| `anonymization_log` | admin | service-role | nunca | nunca |
| `app_settings` | admin lee/escribe | admin | admin | nunca |

**Función helper**:

```sql
CREATE FUNCTION current_role() RETURNS user_role
LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT role FROM profiles WHERE id = auth.uid();
$$;
```

**Notas críticas**:

- Toda política se documenta en migración `0002_rls_policies.sql`.
- Cambios en RLS gatillan `/security-review` antes del merge (constitución, workflow).
- `service-role` se usa SOLO desde cron handlers y server actions con `lib/supabase/admin.ts`. Nunca expuesto al cliente.

---

## Transiciones de estado clave

### Estudiante

```text
[anónimo] ──login──> [autenticado, profile creado, role=student]
   │
   ├── consent: NULL ──/consent──> [terms y data_use aceptados] (FR-005)
   │       │
   │       └── falta opt-in ────────────────────────────► bloquea continuar
   │
   ├── profile: incompleto ──/profile──> [facultad/carrera/ciclo/rango_edad llenos]
   │
   ├── cuestionario: current_step < N ──/cuestionario/[step]──> autosave + avance
   │       │
   │       └── current_step == N ──submit──> questionnaire_completed_at = now()
   │
   ├── compare_order: NULL ──/comparador (RSC)──> assign 50/50 + persist
   │
   └── preferences: 0 rows ──/preferencia submit──> 1 row INMUTABLE (FR-021)
              │
              └── intento de reenviar ──> RSC detecta row existente, modo readonly
```

### Pregunta (admin)

```text
[draft] ──admin create──> [activo=true, visible para estudiantes nuevos]
   │
   ├── admin edit ──> respuestas históricas conservan snapshot; nuevas usan v2
   │
   ├── admin reorder ──> UPDATE orden masivo (transacción)
   │
   └── admin deactivate ──> activo=false; queda en histórico, no en nuevos cuestionarios
```

### Anonimización

```text
[profile con PII]
    │
    └── cron mensual (heartbeat) ──> verifica: ¿ya pasó (ciclo_cierre_at + 12 months)?
                                         │
                                         ├── NO → no hace nada, termina
                                         │
                                         └── SÍ → anonimiza TODOS los profiles
                                                  con is_anonymized = false:
                                                  email     = NULL
                                                  nombres   = NULL
                                                  apellidos = NULL
                                                  is_anonymized = true
                                                  anonymized_at = now()

   Tablas dependientes (answers, preferences, consent_events, usage_events):
     mantienen sus filas y siguen apuntando al mismo profile_id.
     Lo que cambia es que ese profile ya no tiene PII visible.

   Para un solo ciclo, este job efectivamente "se dispara" una vez en toda la vida
   del proyecto — cuando se cruza el umbral de 12 meses post-cierre.
```

---

## Reglas de integridad y triggers

1. **`on_auth_user_created`**: crea `profiles` con rol según `allowed_teachers`.
2. **`profiles_set_email_institucional`**: BEFORE INSERT/UPDATE OF `email` → `email_institucional = (email ILIKE '%@upao.edu.pe')`.
3. **`answers_snapshot_lock`**: BEFORE UPDATE → impide cambiar `question_snapshot`, `dimension_snapshot`, `tipo_snapshot`.
4. **`preferences_immutable`**: BEFORE UPDATE → RAISE EXCEPTION (v1).
5. **`questions_no_delete`**: BEFORE DELETE → RAISE NOTICE 'use soft delete (activo=false)' y aborta para no-admin.
6. **`refresh_mv_after_*`**: NOTIFY a un canal que un worker en server-side escucha para refresh debounced de las vistas materializadas.
7. **`updated_at_trigger`**: genérico que actualiza `updated_at` en cada UPDATE.

---

## Volumetría esperada (orden de magnitud)

| Tabla | Filas v1 (pico) | Crecimiento por ciclo |
|---|---|---|
| `profiles` | ~1500 | +500-1000 |
| `questions` | 10-15 | mínimo |
| `answers` | ~22k (1500 × 15) | +7-15k |
| `preferences` | ~1500 | +500-1000 |
| `consent_events` | ~1500 | +500-1000 |
| `candidates` | 2 | fijo |
| `plans` | 2 | fijo |
| `plan_dimensions` | 8 | fijo |
| `usage_events` | ~150k | +50-100k |
| `jne_refresh_log` | ~22/mes | mínimo |
| `anonymization_log` | 1/mes | mínimo |

Postgres 16 escala holgadamente. Sin necesidad de particionado para el MVP.
