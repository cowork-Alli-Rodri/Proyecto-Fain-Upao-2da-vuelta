# Banco inicial de preguntas — v1

**Voto Informado UPAO — Segunda Vuelta 2026**

Fecha: 2026-05-20
Autor: equipo técnico (Claude + Rodrigo)
Versión: v1 — sujeta a edición del docente desde `/admin/preguntas`

## Cobertura

12 preguntas distribuidas en las **4 dimensiones oficiales del JNE** (Social, Económica, Ambiental, Institucional), 3 por dimensión. Tiempo estimado de respuesta: 5-7 minutos (FR-007a, SC-006).

## Principios de redacción

- **Neutralidad política** (constitución II): ningún enunciado induce respuesta. Cero etiquetas valorativas tipo "mejor", "moderno", "anticuado".
- **Contexto peruano verificable**: todas las cifras provienen de fuentes públicas oficiales (INEI, BCRP, IPE, Defensoría del Pueblo, Proética, JNE, Ministerio de Salud, MINEDU).
- **Cuestionario mide preferencias declaradas, no las induce** (FR-023).
- **Sin parafraseo de propuestas de los candidatos**: las preguntas son sobre temas, no sobre planes.

## Formato técnico

Cada pregunta incluye un bloque YAML con: `orden`, `dimension_tematica`, `tipo`, `opciones` (cuando aplica), `fuente`. El script `pnpm run seed:questions` parsea este archivo y hace upsert en `public.questions`.

---

## SOCIAL

### Pregunta 1

```yaml
orden: 1
dimension_tematica: social
tipo: likert
fuente: "INEI — Estadísticas de Seguridad Ciudadana 2024 (76.8% de la población urbana se siente inseguro)"
```

**Enunciado**: ¿Qué tan prioritario consideras que el próximo gobierno destine recursos al fortalecimiento de la Policía Nacional para combatir el crimen organizado?

**Escala (1-5)**:
- 1: Nada prioritario
- 2: Poco prioritario
- 3: Medianamente prioritario
- 4: Prioritario
- 5: Muy prioritario

---

### Pregunta 2

```yaml
orden: 2
dimension_tematica: social
tipo: single
fuente: "MINSA / INEI — Encuesta Demográfica y de Salud Familiar (ENDES) 2024; 28% de hogares enfrentó gasto catastrófico en salud el último año"
```

**Enunciado**: Frente al sistema de salud pública peruano, ¿cuál de estos enfoques se acerca más a tu posición?

**Opciones (única)**:
- A: El Estado debe ampliar la red pública (más hospitales públicos, contratación de personal, abastecimiento de medicamentos)
- B: Se debe expandir la cobertura mediante alianzas público-privadas y aseguramiento universal
- C: Hay que priorizar la prevención y atención primaria sobre la construcción de nuevos hospitales
- D: El sistema actual funciona; lo que falta es mejorar la gestión, no aumentar el gasto
- E: No tengo una posición clara sobre este tema

---

### Pregunta 3

```yaml
orden: 3
dimension_tematica: social
tipo: ranking
fuente: "MINEDU — Evaluación Censal de Estudiantes ECE 2023 (11.3% de secundaria alcanza nivel satisfactorio en matemáticas) y Ley Universitaria N° 30220"
```

**Enunciado**: Ordena de mayor a menor prioridad estos retos del sistema educativo peruano (1 = mayor prioridad):

**Opciones (ranking — ordenar todas)**:
- Calidad de los aprendizajes en escuelas públicas (comprensión lectora y matemáticas)
- Cierre de la brecha de infraestructura escolar (agua, electricidad, conectividad)
- Acceso a la educación superior pública (universidad / institutos)
- Formación y condiciones laborales del profesorado
- Educación intercultural bilingüe en zonas rurales y amazónicas

---

## ECONÓMICA

### Pregunta 4

```yaml
orden: 4
dimension_tematica: economica
tipo: single
fuente: "INEI Encuesta Nacional de Hogares (ENAHO) 2024 — 71.7% de empleo informal a nivel nacional; IPE — Informe macro mensual 2025"
```

**Enunciado**: ¿Cuál estrategia consideras más efectiva para reducir la informalidad laboral en el Perú (que afecta a 7 de cada 10 trabajadores)?

**Opciones (única)**:
- A: Reducir costos laborales (planilla, CTS, gratificaciones) para incentivar contratación formal
- B: Ampliar fiscalización (SUNAT, Sunafil) sobre empresas que evaden la formalización
- C: Crear regímenes especiales simplificados para microempresas y emprendedores
- D: Invertir en educación técnica y capacitación productiva para mejorar empleabilidad
- E: Combinación de las anteriores; el problema requiere reformas estructurales

---

### Pregunta 5

```yaml
orden: 5
dimension_tematica: economica
tipo: likert
fuente: "BCRP — Reporte de Inflación marzo 2025 (proyección PBI 2.8%); Ministerio de Economía — Marco Macroeconómico Multianual 2026-2029"
```

**Enunciado**: ¿En qué medida estás de acuerdo con que el Estado peruano debe asumir un rol más activo en sectores estratégicos (gas, minería, infraestructura), incluso si eso implica mayor inversión pública?

**Escala (1-5)**:
- 1: Totalmente en desacuerdo
- 2: En desacuerdo
- 3: Neutral
- 4: De acuerdo
- 5: Totalmente de acuerdo

---

### Pregunta 6

```yaml
orden: 6
dimension_tematica: economica
tipo: multiple
fuente: "SUNAT — Recaudación tributaria 2024 (presión tributaria 14.5% del PBI, inferior al promedio de OCDE 33.9%); IPE — Informe de Reforma Tributaria"
```

**Enunciado**: La presión tributaria del Perú (14.5% del PBI) está por debajo del promedio latinoamericano. ¿Quiénes deberían aportar más impuestos para cerrar esa brecha? (selecciona todas las que apliquen)

**Opciones (múltiple)**:
- A: Grandes empresas mineras y de hidrocarburos (mediante regalías o impuesto a sobreganancias)
- B: Empresas multinacionales que actualmente acceden a exoneraciones tributarias
- C: Personas naturales de altos ingresos (impuesto progresivo a fortunas o renta)
- D: Comercio digital y plataformas tecnológicas extranjeras
- E: Nadie más; el problema no es recaudar más sino gastar mejor

---

## AMBIENTAL

### Pregunta 7

```yaml
orden: 7
dimension_tematica: ambiental
tipo: single
fuente: "MINAM / SERFOR — Pérdida bosque amazónico 2023 (~190,000 hectáreas); MINEM — REINFO con ~86,000 mineros inscritos, solo 2,500 formalizados en 12 años"
```

**Enunciado**: ¿Cuál es el enfoque más apropiado para la minería ilegal e informal en la Amazonía y otras regiones?

**Opciones (única)**:
- A: Acelerar la formalización con simplificación administrativa y asistencia técnica
- B: Prohibirla completamente y reforzar el control militar/policial de áreas afectadas
- C: Crear cooperativas mineras con propiedad de las concesiones y control estatal del oro
- D: Reconvertir económicamente las zonas con alternativas productivas sostenibles (turismo, agroforestería)
- E: Combinar control, formalización selectiva y alternativas productivas según la región

---

### Pregunta 8

```yaml
orden: 8
dimension_tematica: ambiental
tipo: likert
fuente: "MINAM — Estrategia Nacional ante el Cambio Climático al 2050; SENAMHI — Reporte de eventos climáticos extremos 2024 (Perú entre los 10 países más vulnerables)"
```

**Enunciado**: ¿Qué tan urgente consideras que el próximo gobierno priorice una política agresiva de adaptación al cambio climático (gestión de glaciares, transición energética, protección de cabeceras de cuenca)?

**Escala (1-5)**:
- 1: Nada urgente
- 2: Poco urgente
- 3: Medianamente urgente
- 4: Urgente
- 5: Muy urgente

---

### Pregunta 9

```yaml
orden: 9
dimension_tematica: ambiental
tipo: single
fuente: "MVCS / SUNASS — Cobertura nacional de agua potable 91% y alcantarillado 78% (2024), con brechas críticas en zonas rurales"
```

**Enunciado**: Respecto al acceso a agua potable y saneamiento, ¿cuál debería ser la prioridad geográfica del próximo gobierno?

**Opciones (única)**:
- A: Zonas rurales andinas y amazónicas (mayor brecha de cobertura)
- B: Periferias urbanas de Lima, Callao y ciudades grandes (alta densidad sin servicio formal)
- C: Capitales regionales con sistemas antiguos en colapso (Iquitos, Piura, Huancayo)
- D: Distribución equitativa proporcional entre regiones, sin priorización
- E: Inversión universal según planificación técnica, sin componente político

---

## INSTITUCIONAL

### Pregunta 10

```yaml
orden: 10
dimension_tematica: institucional
tipo: multiple
fuente: "Proética — Barómetro de las Américas 2024 (89% percibe corrupción extendida); Contraloría — Pérdidas por corrupción 2023 (S/ 24,400 millones)"
```

**Enunciado**: ¿Qué mecanismos institucionales priorizarías para combatir la corrupción en el Estado peruano? (selecciona todas las que apliquen)

**Opciones (múltiple)**:
- A: Reforzar la Contraloría con presupuesto e independencia para control concurrente
- B: Levantar el secreto bancario y tributario en casos de funcionarios públicos
- C: Reforma de la Fiscalía de la Nación para garantizar autonomía e investigación efectiva
- D: Transparencia digital obligatoria (datos abiertos de obras públicas, compras estatales)
- E: Penalización más dura (más años de cárcel, imprescriptibilidad)
- F: Reforma de los partidos políticos (financiamiento, democracia interna)

---

### Pregunta 11

```yaml
orden: 11
dimension_tematica: institucional
tipo: single
fuente: "JNE — Debate constitucional 2023-2025 sobre Asamblea Constituyente; Defensoría del Pueblo — Conflictos sociales 2024 (más de 200 activos)"
```

**Enunciado**: Frente al debate sobre reformas constitucionales en el Perú, ¿cuál posición se acerca más a la tuya?

**Opciones (única)**:
- A: Convocar a una Asamblea Constituyente para redactar una nueva Constitución desde cero
- B: Mantener la Constitución de 1993 pero hacer reformas puntuales por el Congreso
- C: Mantener la Constitución actual sin cambios significativos
- D: Plantear un referéndum para que la población decida si hay o no nueva Constitución
- E: No tengo una posición definida sobre este tema

---

### Pregunta 12

```yaml
orden: 12
dimension_tematica: institucional
tipo: ranking
fuente: "IDL — Reformas al sistema de justicia 2024; Encuesta Nacional Urbana INEI 2024 (solo 18% confía en el Poder Judicial)"
```

**Enunciado**: Ordena de mayor a menor gravedad estos problemas del sistema de justicia peruano (1 = más grave):

**Opciones (ranking — ordenar todas)**:
- Lentitud en la resolución de casos (causas penales y civiles pendientes por años)
- Corrupción en jueces, fiscales y personal judicial
- Acceso limitado para personas de bajos ingresos (costos de abogados, distancia)
- Falta de independencia del Poder Judicial frente al Ejecutivo y el Congreso
- Carencia de tecnología (expediente físico, no digital, comunicaciones lentas)

---

## Anexo — Catálogo de fuentes citadas

| Sigla | Nombre | Tipo |
|---|---|---|
| INEI | Instituto Nacional de Estadística e Informática | Organismo oficial |
| BCRP | Banco Central de Reserva del Perú | Organismo oficial |
| IPE | Instituto Peruano de Economía | Think tank |
| MINEDU | Ministerio de Educación | Organismo oficial |
| MINSA | Ministerio de Salud | Organismo oficial |
| MINAM | Ministerio del Ambiente | Organismo oficial |
| MINEM | Ministerio de Energía y Minas | Organismo oficial |
| MVCS | Ministerio de Vivienda, Construcción y Saneamiento | Organismo oficial |
| SUNAT | Superintendencia Nacional de Aduanas y Administración Tributaria | Organismo oficial |
| SUNASS | Superintendencia Nacional de Servicios de Saneamiento | Organismo oficial |
| SERFOR | Servicio Nacional Forestal y de Fauna Silvestre | Organismo oficial |
| SENAMHI | Servicio Nacional de Meteorología e Hidrología | Organismo oficial |
| Defensoría | Defensoría del Pueblo | Organismo autónomo |
| Contraloría | Contraloría General de la República | Organismo autónomo |
| JNE | Jurado Nacional de Elecciones | Organismo electoral |
| Proética | Proética — Capítulo Peruano de Transparencia Internacional | Sociedad civil |
| IDL | Instituto de Defensa Legal | Sociedad civil |
| IEP | Instituto de Estudios Peruanos | Think tank |

## Edición posterior

El docente puede editar, agregar o desactivar preguntas desde `/admin/preguntas` (User Story 3 / FR-031). Cualquier respuesta histórica conserva el snapshot del enunciado original (FR-012, `answers.question_snapshot`).
