# Pivote v2 — Cuestionario pre/post + dimensiones nuevas

**Status**: aprobado, en implementación
**Fecha decisión**: 2026-05-26
**Autor**: Rodrigo + revisión técnica

## Motivación

La v1 medía solamente postura final del estudiante después de ver los planes. Eso es metodológicamente débil para una tesis: no se puede afirmar que el cambio se debe a la exposición a los planes (no hay baseline).

V2 introduce **delta pre/post**: el estudiante declara su postura antes y después de revisar los planes oficiales del JNE. Esto da:
- Métrica directa de "cambio de opinión" por exposición a información oficial
- Heatmap de movimientos por pregunta
- Cobertura de 2 preguntas nuevas en post sobre comprensión específica del plan

## Flujo nuevo

```
1. /consent
2. /profile
3. /cuestionario-pre/[1..5]         ← 5 preguntas (1 por dimensión)
4. /candidatos                       ← obligatorio: ver las 4 dimensiones JNE
5. /cuestionario-post/[1..5]         ← 5 preguntas (3 mismas + 2 nuevas)
6. /preferencia                      ← Keiko / Roberto / Indeciso + slider confianza
7. /encuesta-final                   ← experiencia, sin cambios respecto v1
8. /cierre                           ← resumen + agradecimiento
```

**Diferencia con v1**: el comparador `/candidatos` pasa de página marketing pública a **paso obligatorio del flujo estudiante** con tracking de dimensiones vistas.

## Dimensiones del cuestionario

5 dimensiones propias, cada una mapeada a 1 dimensión JNE oficial (para reporting cruzado en dashboard):

| Dimensión cuestionario | Dimensión JNE asociada |
|---|---|
| `educacion` | `social` |
| `juventud` | `social` |
| `trabajo` | `economica` |
| `economia` | `economica` |
| `social_publicas` | `institucional` |

Las dimensiones JNE oficiales (`social`, `economica`, `ambiental`, `institucional`) se mantienen sin cambios — vienen del documento del candidato y no se pueden modificar.

**Nota**: `ambiental` queda sin pregunta del cuestionario en v2. Se ve en el comparador (porque está en el plan JNE) pero no se evalúa cambio de opinión sobre eso. Decisión deliberada: priorizar temas más cercanos a estudiantes universitarios.

## Modelo de datos

### Migration `20260526000010_pivote_v2_enums.sql`

```sql
-- Nuevo ENUM con dimensiones propias del cuestionario
CREATE TYPE dim_cuestionario_enum AS ENUM (
  'educacion', 'juventud', 'trabajo', 'economia', 'social_publicas'
);

-- ENUM para distinguir bloque pre vs post
CREATE TYPE momento_enum AS ENUM ('pre', 'post', 'both');

-- El ENUM viejo dim_tematica_enum se MANTIENE
-- (lo usa el comparador JNE, no se renombra ni se borra)
```

### Migration `20260526000011_pivote_v2_questions.sql`

```sql
ALTER TABLE public.questions
  ADD COLUMN momento momento_enum NOT NULL DEFAULT 'both',
  ADD COLUMN dimension_cuestionario dim_cuestionario_enum,
  ADD COLUMN dimension_jne_mapping dim_tematica_enum;

-- dimension_tematica original queda para compatibilidad con seed legacy.
-- En v2 se usa dimension_cuestionario + dimension_jne_mapping.

-- Index: filtrado eficiente por momento + activo
CREATE INDEX idx_questions_momento_activo ON public.questions(momento, activo)
  WHERE activo = TRUE;
```

### Migration `20260526000012_pivote_v2_answers.sql`

```sql
ALTER TABLE public.answers
  ADD COLUMN momento_snapshot momento_enum;

-- Backfill: las answers existentes (v1) son consideradas 'pre' por convención
UPDATE public.answers SET momento_snapshot = 'pre' WHERE momento_snapshot IS NULL;

ALTER TABLE public.answers
  ALTER COLUMN momento_snapshot SET NOT NULL;

-- Constraint: solo una answer por (student, question, momento)
ALTER TABLE public.answers
  DROP CONSTRAINT IF EXISTS answers_student_question_unique,
  ADD CONSTRAINT answers_student_question_momento_unique
    UNIQUE (student_id, question_id, momento_snapshot);

CREATE INDEX idx_answers_student_momento ON public.answers(student_id, momento_snapshot);
```

### Migration `20260526000013_pivote_v2_profiles.sql`

```sql
ALTER TABLE public.profiles
  -- Tracking de dimensiones JNE vistas en /candidatos
  ADD COLUMN candidatos_dimensions_viewed TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN candidatos_completed_at TIMESTAMPTZ,

  -- current_step se desdobla: pre + post tienen sus propios punteros
  ADD COLUMN current_step_pre INT2 NOT NULL DEFAULT 0,
  ADD COLUMN current_step_post INT2 NOT NULL DEFAULT 0,

  -- Flags de cierre por bloque
  ADD COLUMN questionnaire_pre_completed_at TIMESTAMPTZ,
  ADD COLUMN questionnaire_post_completed_at TIMESTAMPTZ;

-- Backfill: usuarios v1 con questionnaire_completed_at quedan como pre completo
UPDATE public.profiles
SET questionnaire_pre_completed_at = questionnaire_completed_at
WHERE questionnaire_completed_at IS NOT NULL;

-- La columna vieja current_step y questionnaire_completed_at se MANTIENEN para
-- compatibilidad de exports/dashboard de transición. Se removerán en v3.
```

### Migration `20260526000014_pivote_v2_views.sql`

Reescribe las 4 materialized views del dashboard para reflejar pre/post:
- `mv_kpis_curso`: añade `total_completaron_pre`, `total_completaron_post`, `total_cambiaron_opinion`
- `mv_preferencia_por_carrera`: sin cambios (sigue siendo sobre preference final)
- `mv_evolucion_temporal`: añade serie de "completaron pre", "completaron post"
- **Nueva**: `mv_delta_pre_post`: por cada pregunta `momento='both'`, matriz 5x5 (valor_pre × valor_post) con count de estudiantes en cada celda

## Banco nuevo de preguntas

**TODO** (requiere input del docente o de Rodrigo):

- **5 preguntas para `momento='both'`**: aparecen en pre Y en post, idénticas. Sirven para medir cambio.
- **2 preguntas `momento='post'` solamente**: nuevas, evalúan comprensión específica del plan de algún candidato.

Total únicas en DB: 7 preguntas.
Preguntas que ve el estudiante: 5 pre + 5 post = 10 visualizaciones.

Plantilla sugerida (a redactar):
```yaml
- orden: 1
  momento: both
  dimension_cuestionario: educacion
  dimension_jne_mapping: social
  tipo: likert
  enunciado: "¿Qué tan prioritario consideras que el próximo gobierno..."
  fuente: "INEI 2024"

# ... 4 más con dimensiones: juventud, trabajo, economia, social_publicas

- orden: 6
  momento: post
  dimension_cuestionario: economia
  dimension_jne_mapping: economica
  tipo: single
  enunciado: "Después de revisar el plan, ¿qué propuesta sobre [tema X] te parece más viable?"
  opciones:
    - "Propuesta A del candidato 1"
    - "Propuesta B del candidato 2"
    - "Ninguna me parece viable"

# ... 1 más con la dimensión faltante
```

**Decisión deliberada**: las 2 preguntas post-only NO mencionan candidato por nombre (tratamiento simétrico, constitución del proyecto). Citan "el plan que revisaste" o similar.

## Refactor de código

### Middleware (`proxy.ts`)

`resolveStudentResumePath` cambia. Nueva lógica:
1. Si no hay profile completo → `/profile`
2. Si pre no completo → `/cuestionario-pre/{current_step_pre + 1}`
3. Si pre completo pero candidatos no completos → `/candidatos`
4. Si candidatos completos pero post no completo → `/cuestionario-post/{current_step_post + 1}`
5. Si post completo pero sin preferencia → `/preferencia`
6. Si preferencia ok pero sin encuesta-final → `/encuesta-final`
7. Else → `/cierre`

### Nuevas rutas

- `app/(student)/cuestionario-pre/page.tsx` (índice → redirige al step actual)
- `app/(student)/cuestionario-pre/[step]/page.tsx`
- `app/(student)/cuestionario-post/page.tsx`
- `app/(student)/cuestionario-post/[step]/page.tsx`

Las rutas viejas `/cuestionario` y `/cuestionario/[step]` se mantienen como redirect 301 al equivalente pre/post.

### Tracking dimensiones en `/candidatos`

- Server action `markDimensionViewed(dimension: 'social'|'economica'|'ambiental'|'institucional')` que appendea al array `candidatos_dimensions_viewed`
- Client: dispara el action al expandir/scrollear cada tab de dimensión
- UI: botón "Continuar al cuestionario" se desbloquea solo cuando `candidatos_dimensions_viewed.length === 4`
- Cuando completa, settea `candidatos_completed_at = now()`

### Dashboard — refactor detallado

**`lib/dashboard/queries.ts`**:

Funciones nuevas:
```typescript
// Métrica principal: % cambió opinión (sobre answers momento='pre' AND momento='post' del mismo question_id)
export async function getOpinionChangeRate(filters): Promise<{
  rate: number;          // 0..1 = fracción que cambió en al menos 1 pregunta
  n_with_both: number;   // estudiantes que completaron pre Y post
}>;

// Por dimensión cuestionario: cambio promedio (Likert)
export async function getOpinionChangeByDimension(filters): Promise<Array<{
  dimension: DimensionCuestionario;
  avg_delta: number;   // negativo = más en desacuerdo, positivo = más de acuerdo
  n_changed: number;
  n_total: number;
}>>;

// Heatmap 5x5 (valor_pre × valor_post) por pregunta
export async function getPrePostHeatmap(questionId): Promise<Array<{
  valor_pre: number;     // 1..5
  valor_post: number;    // 1..5
  count: number;
}>>;
```

`getKpiSummary` (refactor):
```typescript
interface KpiSummary {
  total_inscritos: number;
  total_completaron_pre: number;       // NUEVO
  total_completaron_candidatos: number; // NUEVO (vio las 4 dimensiones JNE)
  total_completaron_post: number;       // NUEVO
  total_preferencias: number;
  total_sin_preferencia: number;
  opinion_change_rate: number;          // NUEVO (alias de getOpinionChangeRate.rate)
  confianza_promedio: number | null;
  pct_avance: number;                   // ahora basado en post_completado / inscritos
}
```

**Componentes nuevos en `components/dashboard/`**:
- `OpinionChangeKpi.tsx`: card grande con % cambió opinión + N de estudiantes con pre y post
- `DimensionChangeBar.tsx`: bar chart horizontal por dimensión, longitud = avg_delta (eje 0 al centro, izq = - = más en desacuerdo, der = + = más de acuerdo)
- `PrePostHeatmap.tsx`: matriz 5x5 con celdas coloreadas según count. Las celdas en diagonal = no cambió. Por encima de diagonal = subió, por debajo = bajó

**Componente modificado**:
- `KpiGrid.tsx`: incluir los 3 KPIs nuevos. Layout grid de 3x3 en vez de 3x2

### Export — refactor detallado

**`lib/export/dataset.ts`** (base de todos los formatos):
- `ExportAnswer`: agregar `momento_snapshot: 'pre' | 'post'`
- `ExportProfile`: agregar `questionnaire_pre_completed_at`, `questionnaire_post_completed_at`, `candidatos_completed_at`
- La query a `answers` trae `momento_snapshot` además de los snapshots existentes
- Nueva función `pivotAnswersByStudent(answers)`: devuelve `Map<student_id, Map<question_id, {pre, post, delta}>>` — alimenta la vista wide

**`lib/export/csv.ts`**:
- Modificar `exportRespuestasCsv`: agregar columna `momento` al final
- **Nueva** `exportDeltaCsv(ds)`: formato wide, una fila por estudiante, columnas dinámicas `q1_pre|q1_post|q1_delta|q2_pre|q2_post|q2_delta|...`. Para preguntas post-only solo hay `q{n}_post`. Crítico para que el docente lo abra en Excel/SPSS y haga regresiones

**`lib/export/xlsx.ts`** (5 hojas):
- `Respuestas-Pre`: filtra answers donde `momento_snapshot='pre'`
- `Respuestas-Post`: filtra answers donde `momento_snapshot='post'`
- `Delta`: tabla pivotada usando `pivotAnswersByStudent`. Columnas: `student_pseudo|q1_pre|q1_post|q1_delta|q2_pre|q2_post|q2_delta|...`. Solo incluye preguntas `momento='both'`
- `Preferencias`: igual que v1
- `KPIs`: agregar `total_completaron_pre`, `total_completaron_post`, `total_completaron_candidatos`, `opinion_change_rate`

**`lib/export/html-canva.ts`**:
- Agregar sección "Cambio de opinión" con tabla de los deltas por pregunta y dimensión
- Mantener layout estilo Canva para que el docente lo use en presentaciones

**`lib/export/powerbi.ts`** (ZIP con CSVs):
- Agregar `respuestas_pre.csv`, `respuestas_post.csv`, `delta.csv` (el wide)
- Mantener `preferencias.csv` igual
- Actualizar el modelo de relaciones en el README del ZIP para que el docente conecte correctamente las tablas en Power BI

## Tests

Mínimo:
- E2E `tests/e2e/student-flow-v2.spec.ts`: cubre el flow nuevo completo
- E2E `tests/e2e/candidatos-gating.spec.ts`: confirma que no se puede saltar /candidatos
- Unit `tests/unit/dashboard/opinion-change.test.ts`: cálculo del delta
- Unit `tests/unit/middleware/resume-path-v2.test.ts`: la nueva lógica de resume

## Riesgos y mitigaciones

| Riesgo | Impacto | Mitigación |
|---|---|---|
| Drop-off en post (alumnos no terminan) | Métrica de cambio incompleta | Email recordatorio + UI muy clara del progreso |
| Alumnos saltan /candidatos | Falsifica medida pre/post | Gating server-side estricto en middleware |
| Las 2 preguntas post-only no se alinean con plan real | Datos sin sentido | Redactar después de leer planes JNE, no antes |
| Migración rompe data v1 si hay usuarios | Pérdida de respuestas | Backfill explícito (momento='pre'); test en local primero |
| Dashboard del docente con dos cohortes (v1 + v2) confunde | Análisis erróneo | Filtro por fecha de creación del questionnaire para separar cohortes |

## Estimación

| Bloque | Tiempo |
|---|---|
| Migrations (4 archivos) + apply local | 0.5 día |
| Refactor rutas + middleware | 1 día |
| Tracking /candidatos | 0.5 día |
| Banco de preguntas (con tu input) | 0.5 día |
| Dashboard nuevo (3 componentes + queries) | 1 día |
| Export refactor | 0.5 día |
| Tests | 0.5 día |
| Deploy v2 + validación | 0.5 día |
| **Total** | **4-5 días** |

## Próximos pasos inmediatos

1. **Vos**: revisar este spec, levantar dudas o cambios
2. **Yo**: si aprobás, arranco con migrations en este orden:
   - `20260526000010_pivote_v2_enums.sql`
   - `20260526000011_pivote_v2_questions.sql`
   - `20260526000012_pivote_v2_answers.sql`
   - `20260526000013_pivote_v2_profiles.sql`
   - `20260526000014_pivote_v2_views.sql`
3. **Vos**: empezar a pensar las 7 preguntas (5 both + 2 post-only). Si querés, te propongo borrador y refinás.
