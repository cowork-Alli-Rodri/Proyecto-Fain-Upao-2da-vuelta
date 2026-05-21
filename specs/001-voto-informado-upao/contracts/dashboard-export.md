# Contract — Exports del Dashboard del Docente

**Propósito**: definir los 4 formatos de export (FR-028), su esquema de datos, los toggles de anonimización y el comportamiento bajo dataset vacío (FR-029).

---

## Rutas HTTP

| Método | Ruta | Formato | Content-Type |
|---|---|---|---|
| `GET` | `/api/export/csv?anonymize={none\|pseudonym\|full}&filters=...` | CSV | `text/csv; charset=utf-8` |
| `GET` | `/api/export/xlsx?anonymize=...&filters=...` | XLSX | `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet` |
| `GET` | `/api/export/html?anonymize=...&filters=...` | HTML autocontenido | `text/html; charset=utf-8` |
| `GET` | `/api/export/powerbi?anonymize=...&filters=...` | ZIP con `.pbids` + `.csv` | `application/zip` |

**Auth**: middleware exige `role IN ('teacher','admin')` (FR-024).

**Filtros aceptados (query params)**:

- `facultad` (text, opcional)
- `carrera` (text, opcional)
- `ciclo` (smallint, opcional)
- `from`, `to` (ISO dates, opcional)

---

## Esquema de datos común

Cada export contiene tres "vistas":

### Vista 1 — `respuestas` (fila por respuesta)

| Columna | Tipo | Anonimizable | Notas |
|---|---|---|---|
| `student_pseudo_id` | string | — | Hash determinístico (no se borra) |
| `student_email` | string | sí | NULL si `anonymize ∈ {pseudonym, full}` |
| `student_nombre` | string | sí | NULL si `anonymize ≠ none` |
| `facultad` | string | no | |
| `carrera` | string | no | |
| `ciclo` | smallint | no | |
| `rango_edad` | string | no | |
| `genero` | string | no | |
| `compare_order` | string | no | Para cruce de sesgo |
| `pregunta_id` | uuid | no | |
| `pregunta_orden` | smallint | no | |
| `pregunta_enunciado` | text | no | Snapshot al momento de responder |
| `dimension_tematica` | string | no | |
| `tipo` | string | no | |
| `valor_raw` | jsonb-as-string | no | Estructura serializada |
| `valor_texto` | string | no | Versión legible para humanos (e.g. "Likert 4/5", "Opción B") |
| `responded_at` | timestamptz | no | |

### Vista 2 — `preferencias` (fila por preferencia)

| Columna | Tipo | Anonimizable | Notas |
|---|---|---|---|
| `student_pseudo_id` | string | — | |
| `student_email` | string | sí | |
| `student_nombre` | string | sí | |
| `facultad` | string | no | |
| `carrera` | string | no | |
| `ciclo` | smallint | no | |
| `compare_order_at_submit` | string | no | |
| `candidato_preferido` | string | no | `'keiko'\|'roberto'\|'indeciso'` |
| `confianza` | smallint | no | 1-10 |
| `motivo` | text | no | |
| `submitted_at` | timestamptz | no | |

### Vista 3 — `resumen_kpis` (una fila)

| Columna | Tipo |
|---|---|
| `total_inscritos` | int |
| `total_completaron_cuestionario` | int |
| `total_declararon_preferencia` | int |
| `pct_preferencia_keiko` | numeric(5,2) |
| `pct_preferencia_roberto` | numeric(5,2) |
| `pct_preferencia_indeciso` | numeric(5,2) |
| `confianza_promedio` | numeric(4,2) |
| `generated_at` | timestamptz |
| `filters_applied` | text (JSON serializado) |

---

## Anonimización (toggles)

| Toggle | Efecto |
|---|---|
| `none` | Datos completos (solo válido si el rol invocante es `admin`). Por defecto `teacher` recibe `pseudonym`. |
| `pseudonym` (default para teacher) | `student_email` y `student_nombre` = NULL; `student_pseudo_id` se mantiene para joins. |
| `full` | Todos los campos identificables = NULL, `student_pseudo_id` se randomiza por export (no es estable). |

`lib/export/anonymize.ts` centraliza la lógica.

---

## CSV (`/api/export/csv`)

- Una sola hoja virtual (CSV no soporta tabs). Devuelve la **vista 1** (`respuestas`) por defecto.
- Variantes: `?view=preferencias` o `?view=kpis`.
- Separador: `,` (estándar). Encoding UTF-8 con BOM para que Excel español lo abra correctamente.
- **Dataset vacío** (FR-029): devuelve el header completo + primera fila `# sin datos aún — generado {ISO}` como comentario.

---

## XLSX (`/api/export/xlsx`)

- Tres hojas: `Respuestas`, `Preferencias`, `KPIs`.
- Primera fila freeze pane.
- Anchos auto-calculados.
- Header con negrita + background `#002855` (navy UPAO) + texto blanco.
- Si vacío: hojas con solo headers y celda A2 = `"Sin datos aún"`.

---

## HTML para Canva (`/api/export/html`)

### Estructura del archivo

```html
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <title>Dashboard — {curso} — {ISO}</title>
  <style>/* CSS inline, autocontenido */</style>
</head>
<body>
  <header data-canva-block="title">
    <h1>{curso}</h1>
    <p>{rango_fechas} — generado {ISO}</p>
  </header>

  <section data-canva-block="kpis">
    <div class="kpi"><span class="label">Inscritos</span><span class="value">{n}</span></div>
    <!-- ... -->
  </section>

  <section data-canva-block="preferencia-distribution">
    <h2>Distribución de preferencia</h2>
    <!-- SVG inline con barras -->
  </section>

  <section data-canva-block="por-carrera">
    <h2>Preferencia por carrera</h2>
    <!-- tabla -->
  </section>

  <!-- Datos crudos embebidos para que Canva no los pierda -->
  <script type="application/json" id="dataset">{ "respuestas": [...], "preferencias": [...] }</script>
</body>
</html>
```

**Reglas**:

- Sin enlaces externos a CSS, JS o fuentes. Todo embebido.
- SVGs en vez de `<img>` (Canva los importa como editables).
- Cada bloque tiene `data-canva-block` para que el docente pueda mover/reestilizar manteniendo identidad.
- Paleta del design system UPAO (navy + cyan + paleta del comparador).

**Validación en CI**: test que abre el HTML con jsdom y verifica que el `<script type="application/json">` deserializa al esquema esperado.

---

## Power BI (`/api/export/powerbi`)

### Contenido del ZIP

```
voto-informado-{ISO}.zip
├── dashboard.pbids
├── respuestas.csv
├── preferencias.csv
└── kpis.csv
```

### `dashboard.pbids`

```json
{
  "version": "0.1",
  "connections": [
    {
      "details": {
        "protocol": "file",
        "address": {
          "path": "respuestas.csv"
        }
      },
      "options": {
        "EncodingType": 65001,
        "Delimiter": ","
      },
      "mode": "Import"
    },
    {
      "details": {
        "protocol": "file",
        "address": {
          "path": "preferencias.csv"
        }
      },
      "options": { "EncodingType": 65001, "Delimiter": "," },
      "mode": "Import"
    }
  ]
}
```

**Workflow del docente**: descarga ZIP → descomprime → abre `dashboard.pbids` con Power BI Desktop → el conector detecta los CSV y los carga como tablas. Sin transformaciones manuales (FR-028b).

### CSV de Power BI

- Mismo esquema que `/api/export/csv` pero **siempre con header**, sin BOM (Power BI maneja UTF-8 explícito vía `pbids`).
- Tipos: timestamps en ISO 8601, decimales con `.`, enums como string.

---

## Cabeceras HTTP

Todos los endpoints devuelven:

```
Content-Disposition: attachment; filename="voto-informado-{tipo}-{ISO}.{ext}"
Cache-Control: no-store
X-Generated-At: {ISO}
X-Filters: {JSON serializado de los filtros aplicados}
```

---

## Performance

- Generación < 30 s con dataset máximo de v1 (1500 estudiantes × 15 preguntas ≈ 22k filas) — cumple SC-007.
- Stream para CSV/XLSX si el dataset crece (no necesario v1).
- Para HTML/Canva, dataset embebido se trunca a 5000 respuestas con nota visible si excede (no esperado v1).
