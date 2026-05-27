# Banco de preguntas v2 — Pivote pre/post

**Status**: aprobado por Rodrigo el 2026-05-27
**Total**: 7 preguntas únicas en DB (5 `momento='both'` + 2 `momento='post'`)
**Vista por el estudiante**: 5 en bloque pre + 5 en bloque post = 10 visualizaciones

Dimensiones cuestionario (v2): `educacion`, `juventud`, `trabajo`, `economia`, `social_publicas`.
Dimensiones JNE (mapping): `social`, `economica`, `ambiental`, `institucional`.

Reglas:
- Las 5 preguntas `momento='both'` NO mencionan candidatos (sesgo en pre + simetría).
- Las 2 preguntas `momento='post'` sí mencionan a ambos candidatos simétricamente (FR-018, constitución).
- Cada pregunta tiene fuente verificable (INEI, BCRP, MEF, Proética, etc.).
- Las opciones de las 2 post-only son **placeholder**: deben afinarse leyendo los PDFs JNE de Keiko Fujimori y Roberto Sánchez antes del primer ciclo real.

---

### Pregunta 1

```yaml
orden: 1
momento: both
dimension_cuestionario: educacion
dimension_jne_mapping: social
tipo: likert
fuente: "INEI 2024 — Gasto público en educación como % del PBI"
```

**Enunciado**: ¿Qué tan prioritario consideras que el próximo gobierno invierta más del 4% del PBI en educación pública, aunque eso implique recortar otros sectores?

**Escala (1-5)**
- 1: Nada prioritario
- 2: Poco prioritario
- 3: Neutral
- 4: Bastante prioritario
- 5: Muy prioritario

---

### Pregunta 2

```yaml
orden: 2
momento: both
dimension_cuestionario: juventud
dimension_jne_mapping: social
tipo: likert
fuente: "INEI — ENAHO 2024, jóvenes 18-29 años que no estudian ni trabajan (~20%)"
```

**Enunciado**: ¿Qué tan necesario crees que el Estado destine programas específicos de empleo y formación para jóvenes entre 18 y 29 años?

**Escala (1-5)**
- 1: Nada necesario
- 2: Poco necesario
- 3: Neutral
- 4: Bastante necesario
- 5: Muy necesario

---

### Pregunta 3

```yaml
orden: 3
momento: both
dimension_cuestionario: trabajo
dimension_jne_mapping: economica
tipo: likert
fuente: "INEI 2024 — Tasa de informalidad laboral (71%)"
```

**Enunciado**: ¿Qué tan de acuerdo estás con flexibilizar el régimen laboral (eliminar CTS y gratificaciones obligatorias) si eso ayuda a reducir la informalidad del 71%?

**Escala (1-5)**
- 1: Muy en desacuerdo
- 2: En desacuerdo
- 3: Neutral
- 4: De acuerdo
- 5: Muy de acuerdo

---

### Pregunta 4

```yaml
orden: 4
momento: both
dimension_cuestionario: economia
dimension_jne_mapping: economica
tipo: likert
fuente: "BCRP — Reporte de Inflación marzo 2026; MEF — Marco Macroeconómico Multianual 2026-2029"
```

**Enunciado**: ¿Qué tan importante consideras que el Estado peruano asuma un rol activo en sectores estratégicos (gas, minería, infraestructura), incluso si eso implica mayor inversión pública?

**Escala (1-5)**
- 1: Nada importante
- 2: Poco importante
- 3: Neutral
- 4: Bastante importante
- 5: Muy importante

---

### Pregunta 5

```yaml
orden: 5
momento: both
dimension_cuestionario: social_publicas
dimension_jne_mapping: institucional
tipo: likert
fuente: "Proética — Encuesta de Corrupción 2024; CAJ"
```

**Enunciado**: ¿Qué tan necesario crees fortalecer la Defensoría del Pueblo y la Junta Nacional de Justicia frente al poder político, aunque eso limite la capacidad del Ejecutivo?

**Escala (1-5)**
- 1: Nada necesario
- 2: Poco necesario
- 3: Neutral
- 4: Bastante necesario
- 5: Muy necesario

---

### Pregunta 6

```yaml
orden: 6
momento: post
dimension_cuestionario: economia
dimension_jne_mapping: economica
tipo: single
fuente: "Planes de gobierno oficiales JNE 2026 — análisis comparado"
```

**Enunciado**: Tras revisar los planes de Keiko Fujimori (Fuerza Popular) y Roberto Sánchez (Juntos por el Perú), ¿qué propuesta para reducir la informalidad laboral te parece más viable?

**Opciones (single)**
- A: La propuesta de Fuerza Popular (formalización con incentivos tributarios)
- B: La propuesta de Juntos por el Perú (inversión pública en empleo formal)
- C: Una combinación de ambas
- D: Ninguna de las dos me parece viable

---

### Pregunta 7

```yaml
orden: 7
momento: post
dimension_cuestionario: social_publicas
dimension_jne_mapping: institucional
tipo: single
fuente: "Planes de gobierno oficiales JNE 2026 — análisis comparado"
```

**Enunciado**: Tras revisar los planes de Keiko Fujimori (Fuerza Popular) y Roberto Sánchez (Juntos por el Perú), ¿cuál presenta la propuesta más concreta sobre fortalecimiento institucional?

**Opciones (single)**
- A: Fuerza Popular (reforma del sistema de justicia)
- B: Juntos por el Perú (mayor autonomía a organismos de control)
- C: Ambos plantean medidas equivalentes
- D: Ninguno es lo suficientemente concreto

---

## Pendiente antes del primer ciclo real

1. **Descargar planes oficiales JNE** de Keiko (plan 29690) y Roberto (plan 29688) en PDF.
2. **Leer las secciones de "economía/empleo"** de cada uno y reescribir las opciones de la pregunta 6 con redacción precisa del plan (no descripción genérica).
3. **Leer las secciones de "institucional"** de cada uno y reescribir las opciones de la pregunta 7.
4. **Validar con docente UPAO** que las preguntas y opciones son académicamente neutras.
