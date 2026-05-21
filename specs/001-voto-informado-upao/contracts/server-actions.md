# Contract — Server Actions (mutaciones tipadas)

**Propósito**: catalogar las mutaciones que el cliente puede invocar, sus esquemas Zod, los roles habilitados y los efectos colaterales.

> Convención: cada server action vive en un módulo cercano a su ruta (`app/(student)/cuestionario/_actions.ts`, etc.) y se exporta como `async function actionName(formData: FormData): Promise<Result<T, AppError>>`. Validación con Zod ANTES de tocar DB (FR cliente y servidor).

---

## Auth y consentimiento

### `acceptConsent({ termsAccepted: true, dataUseAccepted: true, consentVersion: string })`

- **Roles**: `student` (auto).
- **Validación**: ambos booleans deben ser `true` (FR-005, FR-004a).
- **Efectos**: insert en `consent_events`, redirige a `/profile`.
- **Errores**: si falta `dataUseAccepted` devuelve `ConsentMissing`.

### `updateProfile({ facultad, carrera, ciclo, rangoEdad, genero? })`

- **Roles**: `student` (own).
- **Validación**: enums cerrados de facultad/carrera (lista UPAO) o `text` libre validado por longitud + caracteres permitidos.
- **Efectos**: UPDATE `profiles`. Si todos los campos quedaron llenos, redirige a `/cuestionario`.

### `requestDataDeletion()`

- **Roles**: `student` (own).
- **Efectos**: marca `profiles.is_anonymized = true`, dispara job inmediato (no espera al cron mensual). Cumple FR-041.
- **Respuesta**: éxito + email-out (futuro) confirmando borrado.

---

## Cuestionario

### `saveAnswer({ questionId, valor })`

- **Roles**: `student` (own).
- **Validación**: `questionId` debe estar en `questions` con `activo=true`. `valor` se valida según `questions.tipo`:
  - `likert` → integer 1–5.
  - `single` → string que matchea una `opciones[].id`.
  - `multiple` → array de strings que matchean opciones (min 1).
  - `text` → string 1-1000 chars, sanitizado server-side.
  - `ranking` → array completo de opciones, sin duplicados.
  - `comparison` → object `{ keiko: 1-5, roberto: 1-5 }`.
- **Efectos**:
  - Upsert en `answers` (PK lógica `(student_id, question_id)`).
  - Si es la primera vez, setea `question_snapshot`, `dimension_snapshot`, `tipo_snapshot` (trigger lo refuerza).
  - Actualiza `profiles.current_step = max(current_step, paso_actual)`.
- **Rate limit**: 5/min por user_id (FR-037).

### `submitQuestionnaire()`

- **Roles**: `student` (own).
- **Validación**: todas las `questions` con `activo=true` deben tener una `answers` del estudiante.
- **Efectos**: setea `profiles.questionnaire_completed_at = now()`. Devuelve `redirect: '/comparador'`.
- **Errores**: si faltan respuestas, devuelve `MissingAnswers(questionIds: uuid[])` con la lista para guiar al usuario al paso pendiente.

---

## Comparador y preferencia

### `assignCompareOrderIfMissing()`

- **Roles**: `student` (own).
- **Llamada**: desde el RSC de `/comparador` al cargar.
- **Lógica**: si `profiles.compare_order IS NULL`, asigna 50/50 (`'keiko_left' | 'roberto_left'`) y UPDATE.
- **Idempotente**: si ya hay valor, no hace nada.

### `submitPreference({ candidatoPreferido, confianza, motivo? })`

- **Roles**: `student` (own).
- **Validación**:
  - `candidatoPreferido ∈ {'keiko','roberto','indeciso'}`.
  - `confianza ∈ [1,10]` integer.
  - `motivo`: string opcional ≤ 500 chars, sanitizado.
  - Pre-requisito: `profiles.questionnaire_completed_at IS NOT NULL` (FR-013).
  - **Unicidad**: no debe existir row previa en `preferences` para este `student_id` (FR-021, inmutable v1).
- **Efectos**: insert en `preferences` con `compare_order_at_submit = profiles.compare_order`. Devuelve redirect `/cierre`.
- **Errores**:
  - `QuestionnaireIncomplete` si falta cuestionario.
  - `AlreadySubmitted` si intenta segundo envío.
- **Rate limit**: 5/min por user_id (FR-037).
- **Turnstile**: requerido en este submit (FR-038).

---

## Dashboard (teacher)

> Los reads del dashboard se hacen desde RSC con `lib/dashboard/queries.ts` (no son server actions). Las mutaciones del docente son mínimas:

### `refreshDashboardViews()`

- **Roles**: `teacher`, `admin`.
- **Efectos**: `REFRESH MATERIALIZED VIEW CONCURRENTLY` de las 3 vistas. Útil tras cambios masivos.
- **Rate limit**: 1/min global.

---

## Admin: gestión de preguntas

### `createQuestion({ orden, dimensionTematica, tipo, enunciado, opciones?, fuente? })`

- **Roles**: `admin`.
- **Validación**: combinación `tipo`/`opciones` consistente (CHECK constraint también en DB).
- **Efectos**: insert en `questions` con `activo=true`, `created_by=auth.uid()`.

### `updateQuestion(id, { ...partial })`

- **Roles**: `admin`.
- **Validación**: misma que create.
- **Efectos**: UPDATE `questions`. Las `answers` históricas conservan snapshot (FR-032).

### `reorderQuestions(idsInOrder: uuid[])`

- **Roles**: `admin`.
- **Validación**: array sin duplicados, todos los IDs existen.
- **Efectos**: UPDATE masivo en transacción.

### `toggleQuestionActive(id, active: boolean)`

- **Roles**: `admin`.
- **Efectos**: UPDATE `activo`. Las respuestas históricas permanecen.

---

## Admin: gestión de docentes y ciclo

### `addAllowedTeacher({ email, note? })`

- **Roles**: `admin`.
- **Validación**: email válido, no duplicado en `allowed_teachers`.
- **Efectos**: insert. Si el correo ya tiene un `profiles` row, UPDATE su `role='teacher'`.

### `removeAllowedTeacher(email)`

- **Roles**: `admin`.
- **Efectos**: delete de `allowed_teachers`. Si quieres bajar a `student` un teacher existente, lo decide el admin con un toggle aparte (`demoteTeacher(userId)`).

### `setCicloCierre(date: timestamptz)`

- **Roles**: `admin`.
- **Efectos**: UPSERT en `app_settings.ciclo_cierre_at`. Esta fecha es la que el cron de anonimización usa.

---

## Admin: JNE manual

### `refreshJneNow()`

- **Roles**: `admin`.
- **Efectos**: invoca la misma lógica que `app/api/cron/jne-refresh/route.ts`, devuelve JSON con resumen.

---

## Errores tipados

```typescript
// lib/errors.ts
export type AppError =
  | { code: 'ValidationError'; field: string; message: string }
  | { code: 'ConsentMissing' }
  | { code: 'MissingAnswers'; questionIds: string[] }
  | { code: 'QuestionnaireIncomplete' }
  | { code: 'AlreadySubmitted' }
  | { code: 'RateLimited'; retryAfterSec: number }
  | { code: 'TurnstileFailed' }
  | { code: 'ForbiddenRole'; required: UserRole }
  | { code: 'NotFound'; entity: string }
  | { code: 'Unexpected'; correlationId: string };

export type Result<T, E = AppError> =
  | { ok: true; value: T }
  | { ok: false; error: E };
```

Toda server action devuelve `Result<T, AppError>`. El cliente decide cómo presentar (toast, inline error, redirect). Sentry captura `Unexpected` con `correlationId` para trazabilidad.
