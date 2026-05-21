# Contract — Cliente JNE (`lib/jne/`)

**Propósito**: encapsular el acceso a la API no documentada `https://web.jne.gob.pe/serviciovotoinformado` con tipos derivados de los JSONs reales auditados en `data/jne/raw/`.

---

## Endpoints consumidos

| Método | URL | Para qué sirve |
|---|---|---|
| `GET` | `/api/authentication/token` | Obtiene `X-Session-Token` (TTL ~24h, no documentado). |
| `GET` | `/api/PlanGobiernoP/getPlanGobiernoByIdProcesoElectoral?idProcesoElectoral=124&idTipoEleccion=1&idOrganizacionPolitica={ID}` | Header del plan por partido (Keiko: 1366, Roberto: 1264). |
| `GET` | `/api/PlanGobiernoP/getPlanGobiernoDetalleByIdPlanGobierno?idPlanGobierno={PLAN_ID}` | Detalle del plan con 4 dimensiones. |
| `GET` | `/api/ConsultaFormulasP/getFormulasByIdProcesoElectoral?idProcesoElectoral=124&idTipoEleccion=1&idOrganizacionPolitica={ID}` | Fórmula presidencial (candidato + vice). |

**Headers comunes**:

- `X-Session-Token: <token>` (obligatorio en endpoints de plan/fórmulas).
- `Accept: application/json`.
- `User-Agent: VotoInformadoUPAO/1.0 (academic; +https://github.com/MrWoffi)` (cortesía).

---

## TypeScript interface (resumen)

```typescript
// lib/jne/types.ts
export interface JneToken {
  token: string;
  issuedAt: string;          // ISO
  expiresAt: string;         // ISO calculado (+24h)
}

export interface JnePlanHeader {
  idPlanGobierno: number;
  idOrganizacionPolitica: number;
  nombreOrganizacionPolitica: string;
  nombreCandidato: string;
  estado: string;
  fechaPresentacion: string; // ISO
  urlDocumento: string | null;
}

export type JneDimensionId = 1 | 2 | 3 | 4; // Social | Económica | Ambiental | Institucional

export interface JnePlanDimension {
  idDimension: JneDimensionId;
  nombreDimension: string;   // tal cual viene del JNE
  problema: string | null;
  objetivo: string | null;
  indicador: string | null;
  meta: string | null;
}

export interface JnePlanDetalle {
  idPlanGobierno: number;
  dimensiones: JnePlanDimension[]; // exactly 4
}
```

---

## Cliente público

```typescript
// lib/jne/client.ts
export class JneClient {
  constructor(
    private readonly baseUrl: string = 'https://web.jne.gob.pe/serviciovotoinformado',
    private readonly tokenStore: JneTokenStore  // lee/escribe app_settings.jne_session_token
  ) {}

  async getToken(force?: boolean): Promise<string>;

  async getPlanHeader(idOrganizacionPolitica: number): Promise<JnePlanHeader>;

  async getPlanDetalle(idPlanGobierno: number): Promise<JnePlanDetalle>;

  async getFormula(idOrganizacionPolitica: number): Promise<JneFormula>;
}
```

**Manejo de errores**:

- 401 → renueva token vía `getToken(force=true)` y reintenta una sola vez. Si vuelve a fallar, registra incidente en `jne_refresh_log` (FR-035) y lanza `JneAuthError`.
- 5xx → tres reintentos con backoff exponencial (1s, 2s, 4s) antes de fallar.
- Schema mismatch → log a Sentry con payload crudo, lanza `JneSchemaError`. La copia válida previa en DB queda intacta.

**Timeouts**: 10 s por request. AbortController.

---

## Mapeo a esquema Postgres

`lib/jne/refresh.ts` toma el detalle del JNE y persiste en `candidates`, `plans`, `plan_dimensions`:

| JNE | Postgres |
|---|---|
| `idCandidato` (de fórmula) | `candidates.id` |
| `idOrganizacionPolitica` | `candidates.id_organizacion_politica` |
| `nombrePersona` | `candidates.nombre_completo` |
| `nombreOrganizacionPolitica` | `candidates.partido` |
| `idPlanGobierno` | `plans.id` |
| `urlDocumento` | `candidates.plan_pdf_url` |
| `dimensiones[i].idDimension → 'social'/'economica'/'ambiental'/'institucional'` | `plan_dimensions.dimension` |
| `dimensiones[i].problema/objetivo/indicador/meta` | `plan_dimensions.problema/...` |
| (objeto completo) | `plan_dimensions.raw_json` |

**Mapeo `idDimension → enum`**:

```
1 → 'social'
2 → 'economica'
3 → 'ambiental'
4 → 'institucional'
```

Si el JNE cambia los IDs (no esperado), el script falla explícitamente y no actualiza la tabla.

---

## Cron handlers

### `app/api/cron/jne-refresh/route.ts`

- Trigger: Vercel Cron `0 4 * * *` (04:00 UTC = 23:00 Lima).
- Auth: header `Authorization: Bearer ${CRON_SECRET}`.
- Lógica:
  1. Insert row en `jne_refresh_log` con `status='running'`.
  2. Llama `JneClient.getPlanHeader` + `getPlanDetalle` para Keiko (1366/29690) y Roberto (1264/29688).
  3. Upsert en tablas; cuenta filas actualizadas.
  4. Actualiza row del log con `status='success'`, `finished_at`, contadores.
  5. Si falla: `status='failed'` + `error_message` + Sentry.

### `app/api/jne/refresh/route.ts` (manual)

- Auth: middleware exige rol `admin` (FR-036).
- Mismo cuerpo que el cron, devuelve JSON con resultado para mostrar en `/admin/jne`.

---

## Validación con Zod

```typescript
// lib/jne/schemas.ts
import { z } from 'zod';

export const JnePlanDimensionSchema = z.object({
  idDimension: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4)]),
  nombreDimension: z.string().min(1),
  problema: z.string().nullable(),
  objetivo: z.string().nullable(),
  indicador: z.string().nullable(),
  meta: z.string().nullable(),
});

export const JnePlanDetalleSchema = z.object({
  idPlanGobierno: z.number().int().positive(),
  dimensiones: z.array(JnePlanDimensionSchema).length(4),
});
```

Toda respuesta del JNE pasa por `parse()` — si falla, el sistema NO escribe en DB y sirve la copia previa (FR-035).
