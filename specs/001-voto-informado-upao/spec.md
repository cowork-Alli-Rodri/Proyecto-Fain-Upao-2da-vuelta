# Feature Specification: Voto Informado UPAO — Webapp Segunda Vuelta 2026

**Feature Branch**: `001-voto-informado-upao`

**Created**: 2026-05-20

**Status**: Draft

**Input**: Webapp interactiva para estudiantes de pregrado de la Universidad Privada Antenor Orrego (UPAO, Trujillo) sobre la Segunda Vuelta Electoral 2026 entre Keiko Fujimori (Fuerza Popular) y Roberto Sánchez (Juntos por el Perú). Permite registro vía OAuth, completar un cuestionario estructurado sobre política nacional, usar un módulo comparador entre las propuestas oficiales del JNE de ambos candidatos, y capturar preferencias declaradas para análisis posterior por parte del docente a cargo vía subcarpeta `/dashboard` protegida por rol.

## Clarifications

### Session 2026-05-20

- **Q1**: ¿Cómo se otorga el rol `teacher`/`admin` (FR-024, FR-030) si por defecto cualquier registro nuevo cae como `student`?
  - **A**: Lista blanca de correos institucionales gestionada por el admin inicial (Rodrigo). Al hacer login, si el correo del usuario está en la tabla `allowed_teachers`, su rol se eleva automáticamente a `teacher`. Los roles `admin` se asignan vía SQL directo en Supabase (no hay UI de promoción a admin en v1).
- **Q2**: ¿Cómo se cierra la "fase de captura" mencionada en FR-021 y en el escenario AS-2 de la User Story 5?
  - **A**: No existe fase global cerrable en v1. La preferencia es **final por usuario** una vez declarada: el estudiante envía y queda inmutable para él. Esto elimina la necesidad de un mecanismo global de cierre. La User Story 5 ("Cambio de preferencia con auditoría") queda fuera de scope del MVP y se difiere a v2.
- **Q3**: ¿Cuál es la política de retención de datos personales post-cierre del ciclo académico, conforme a la Ley 29733?
  - **A**: Retención de 12 meses post-cierre del ciclo + anonimización irreversible después. Durante el consentimiento informado, el estudiante marca un opt-in explícito "permitir uso de mis datos personales para investigación académica del docente"; sin ese consentimiento no se permite continuar. A los 12 meses se desvincula `auth.users` de respuestas (correo, nombre, UUID se borran o reemplazan por hash opaco); el dataset agregado queda en forma anónima para análisis futuro. El alcance es interno (estudiantes de una facultad UPAO, tesis del docente), no publicación masiva.
- **Q4**: FR-014 exige tratamiento visual simétrico de candidatos pero no define cómo se decide el orden izquierda/derecha (Keiko vs Roberto). ¿Cómo se controla el sesgo de primacía?
  - **A**: Aleatorio por estudiante, persistente. En el primer acceso al comparador se sortea 50/50 quién va a la izquierda y quién a la derecha; el orden asignado se guarda en el perfil del estudiante y todas sus vistas posteriores lo mantienen para evitar confusión UX. La distribución global queda ~50/50 y el dashboard puede analizar si el orden asignado afectó la preferencia declarada.
- **Q5**: ¿Cuál es el tamaño y la estructura de dimensiones del banco inicial de preguntas? ¿Quién genera el contenido?
  - **A**: Banco inicial de **10-15 preguntas** distribuidas en las **4 dimensiones oficiales del JNE**: Social, Económica, Ambiental, Institucional. Tiempo objetivo de completitud del cuestionario: 5-7 minutos, consistente con SC-006 (15 min para el flujo completo). El borrador del contenido será **generado por el equipo técnico** (Claude + Rodrigo) con base en contexto peruano y fuentes verificables (IPE, BCRP, ENAHO, planes JNE oficiales, debates legislativos 2024-2026), entregado en `data/questions/draft_v1.md` con citación de fuentes, y **cargado directamente como seed inicial**. El docente puede editar, agregar o desactivar preguntas en cualquier momento desde `/admin/preguntas` (User Story 3) — no se requiere firma ni aprobación formal previa al despliegue. La generación del borrador es un entregable posterior al cierre del ciclo Spec Kit.

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Estudiante completa flujo principal (Priority: P1)

Un estudiante UPAO de pregrado recibe un link compartido por su docente, se registra rápidamente, responde un cuestionario estructurado sobre política nacional, compara los planes de gobierno oficiales de ambos finalistas y declara su preferencia final. Este es el flujo central de la plataforma y constituye por sí mismo el MVP entregable.

**Why this priority**: Sin este flujo, la plataforma no cumple su objetivo educativo ni genera la data que el docente necesita. Es el corazón funcional del producto. Cualquier otra funcionalidad solo agrega valor sobre este flujo.

**Independent Test**: Un estudiante invitado al sistema puede registrarse, completar las preguntas, ver el comparador con datos reales del JNE, declarar preferencia y recibir confirmación. Validable de extremo a extremo con un solo usuario sin que existan otras funcionalidades.

**Acceptance Scenarios**:

1. **Given** un estudiante llega al landing por primera vez, **When** hace login con su cuenta Google institucional `@upao.edu.pe`, **Then** la plataforma marca su perfil como institucional, le solicita aceptación del consentimiento informado y datos demográficos mínimos (facultad, carrera, ciclo, rango de edad, género opcional).
2. **Given** un estudiante ya registrado y con consentimiento aceptado, **When** ingresa al cuestionario, **Then** ve preguntas en pasos múltiples con autoguardado por respuesta y barra de progreso.
3. **Given** un estudiante en el cuestionario cierra el navegador a mitad, **When** retorna en la misma cuenta dentro de las 24 horas, **Then** retoma exactamente donde quedó sin perder respuestas.
4. **Given** un estudiante completa el cuestionario, **When** llega al comparador, **Then** ve los dos candidatos lado a lado con tratamiento visual simétrico y pestañas para las cuatro dimensiones del plan de gobierno (Social, Económica, Ambiental, Institucional), con Problema/Objetivo/Indicador/Meta por dimensión.
5. **Given** un estudiante explorando el comparador, **When** pulsa "Marcar mi preferencia", **Then** abre un formulario para seleccionar candidato preferido (o "indeciso"), confianza 1-10 y motivo opcional en texto libre.
6. **Given** un estudiante envía su preferencia, **When** se confirma el guardado, **Then** ve pantalla de cierre con resumen de sus respuestas y agradecimiento, sin posibilidad de ver datos agregados de otros estudiantes.

---

### User Story 2 — Docente analiza resultados en dashboard (Priority: P2)

El docente a cargo del curso accede a una sección privada `/dashboard` para revisar el avance del grupo, ver distribuciones agregadas, filtrar por facultad o ciclo, y exportar resultados anonimizables para llevarlos a clase.

**Why this priority**: El docente es el segundo usuario clave. Sin dashboard el cuestionario es ciego y la plataforma pierde la mitad de su propósito (análisis pedagógico). Sin embargo, los estudiantes pueden completar el flujo P1 aunque el dashboard no exista todavía — la data se guarda y se puede revisar manualmente. Por eso P2.

**Independent Test**: Con respuestas previas existentes en la base, un usuario con rol docente puede iniciar sesión, ver KPIs y gráficos, filtrar y exportar. Validable sin necesidad de que el dashboard esté integrado al flujo del estudiante.

**Acceptance Scenarios**:

1. **Given** un docente registrado con rol `teacher`, **When** ingresa a `/dashboard`, **Then** ve panel con KPIs (total inscritos, total completados, porcentaje de avance) y gráficos (distribución de preferencia, evolución temporal, cruces por carrera).
2. **Given** un docente en el dashboard, **When** aplica filtros por facultad, carrera, ciclo o rango de fechas, **Then** todos los KPIs y gráficos se actualizan reactivamente.
3. **Given** un docente quiere exportar resultados, **When** pulsa "Exportar", selecciona formato (CSV, XLSX, HTML editable para Canva, o dataset para Power BI) y toggles de anonimización, **Then** descarga el archivo o paquete correspondiente con la configuración solicitada.
4. **Given** un docente importa el HTML del export en Canva, **When** abre el diseño en el editor, **Then** puede modificar estilos, colores y layout sin perder los datos del dashboard.
5. **Given** un docente abre el export Power BI en Power BI Desktop, **When** carga el archivo, **Then** las tablas y columnas se reconocen automáticamente sin transformaciones adicionales.
6. **Given** un estudiante diferente al docente intenta acceder a `/dashboard`, **When** envía la petición, **Then** la plataforma le devuelve un mensaje de acceso denegado y lo redirige a su área de estudiante.

---

### User Story 3 — Administrador gestiona preguntas del cuestionario (Priority: P3)

Un administrador (Rodrigo o el docente con permisos elevados) puede editar el texto, opciones, orden y activación de cada pregunta del cuestionario sin necesidad de desplegar código.

**Why this priority**: Permite que el docente afine el cuestionario por sección o ciclo sin depender del equipo técnico, pero no es bloqueante para lanzar el MVP. Para el primer ciclo, el cuestionario puede sembrarse manualmente en la base.

**Independent Test**: Con la base sembrada, un usuario con rol `admin` puede editar una pregunta y verificar que estudiantes nuevos vean el cambio, mientras que respuestas previas conservan el texto original.

**Acceptance Scenarios**:

1. **Given** un administrador en `/admin/preguntas`, **When** edita el texto de una pregunta y guarda, **Then** estudiantes que aún no la han respondido ven el nuevo texto; respuestas históricas conservan un snapshot del texto original.
2. **Given** un administrador, **When** desactiva una pregunta, **Then** los nuevos cuestionarios la omiten pero los datos históricos permanecen para análisis.
3. **Given** un administrador, **When** reordena las preguntas, **Then** los estudiantes nuevos ven el orden actualizado.

---

### User Story 4 — Mantenimiento automático de data JNE (Priority: P3)

El sistema mantiene actualizada la información de candidatos, planes de gobierno y dimensiones consultando la API oficial del JNE en un horario programado, sin intervención humana.

**Why this priority**: Asegura confiabilidad a mediano plazo, pero para el periodo electoral inmediato la data inicial sembrada al lanzamiento es suficiente. Si el JNE actualiza algo, puede regenerarse manualmente en el peor caso.

**Independent Test**: Ejecutar el proceso de refresh manualmente confirma que la base se actualiza con la última versión disponible del JNE y se registra cuándo ocurrió el refresh.

**Acceptance Scenarios**:

1. **Given** la última sincronización con el JNE fue hace más de 24 horas, **When** se ejecuta el job programado, **Then** la base actualiza candidatos, planes, dimensiones y se registra la marca temporal del refresh.
2. **Given** el JNE devuelve un error o cambia su estructura, **When** el job intenta sincronizar, **Then** se registra el incidente y se preserva la última copia válida sin romper el comparador para los estudiantes.
3. **Given** un administrador, **When** dispara un refresh manual desde el panel, **Then** la sincronización se ejecuta inmediatamente y muestra el resultado.

---

### Edge Cases

- **Estudiante abandona antes del consentimiento**: La cuenta queda sin registros vinculados y no contamina métricas de completitud. La sesión expira sin generar ruido.
- **Estudiante completa cuestionario pero abandona en el comparador**: Su preferencia queda nula. El dashboard lo cuenta como "completó cuestionario, sin preferencia".
- **API JNE devuelve 401 o timeout**: El sistema renueva token automáticamente, registra el incidente y, si persiste, sirve la última copia válida en caché desde la base.
- **Estudiante accede desde dos dispositivos con la misma cuenta**: Consolidar en la misma cuenta. Las respuestas se sincronizan; la última respuesta por pregunta gana.
- **Docente exporta sin respuestas todavía**: Genera un archivo válido con headers y filas vacías más un mensaje "sin datos aún" en la primera línea.
- **Estudiante usa correo no institucional**: Se permite el registro, se marca el perfil como `email_institucional=false`.
- **Estudiante intenta cambiar preferencia ya enviada**: La plataforma muestra mensaje informativo "Tu preferencia ya quedó registrada y es final" y la muestra en modo solo lectura.
- **Modo offline en mitad del cuestionario**: La plataforma muestra indicador de "sin conexión", conserva localmente la respuesta en progreso y sincroniza al recuperar conectividad.
- **Estudiante intenta acceder al comparador sin completar el cuestionario**: La plataforma bloquea el acceso y le indica qué preguntas le faltan.
- **Sesión expirada (24 h sin actividad)**: La plataforma solicita re-autenticación y restaura el contexto del estudiante donde quedó.
- **Pregunta editada después de tener respuestas**: Las respuestas previas conservan snapshot del texto original; respuestas nuevas usan la versión vigente.

## Requirements *(mandatory)*

### Functional Requirements

**Autenticación y registro**

- **FR-001**: La plataforma DEBE permitir registro/login con cuenta Google (personal o institucional `@upao.edu.pe`), cuenta Microsoft (Azure AD), o email + contraseña como fallback.
- **FR-002**: La plataforma DEBE detectar si el correo corresponde al dominio institucional `@upao.edu.pe` y marcarlo en el perfil del usuario.
- **FR-003**: La plataforma DEBE expirar la sesión tras 24 horas de inactividad y solicitar re-autenticación.

**Consentimiento informado y perfil**

- **FR-004**: La plataforma DEBE presentar un texto de consentimiento informado conforme a la Ley 29733 (Protección de Datos Personales del Perú) antes de cualquier captura de datos del cuestionario. El texto DEBE declarar explícitamente la finalidad académica (investigación del docente), el alcance (estudiantes de la facultad participante), el plazo de retención de datos personales (12 meses post-cierre del ciclo), y la anonimización irreversible posterior.
- **FR-004a**: El consentimiento DEBE incluir un opt-in explícito separado con texto "Autorizo el uso de mis datos personales para la investigación académica del docente" que el estudiante debe marcar activamente (no pre-marcado). Sin este opt-in marcado, la plataforma no permite continuar.
- **FR-005**: La plataforma NO DEBE permitir continuar al cuestionario sin aceptación explícita del consentimiento ni del opt-in de uso de datos.
- **FR-006**: La plataforma DEBE solicitar datos demográficos mínimos al estudiante: facultad, carrera, ciclo, rango de edad. El género es opcional.
- **FR-007**: La plataforma NO DEBE solicitar al estudiante DNI, dirección, teléfono ni otros datos sensibles innecesarios para el análisis pedagógico.

**Cuestionario**

- **FR-007a**: El banco inicial de preguntas DEBE contener entre **10 y 15 preguntas activas** distribuidas en las cuatro dimensiones oficiales del JNE: Social, Económica, Ambiental, Institucional. Cada pregunta tiene un atributo `dimension_tematica` con uno de estos cuatro valores.
- **FR-007b**: El borrador inicial del banco de preguntas DEBE entregarse en `data/questions/draft_v1.md` con citación de fuentes peruanas verificables (IPE, BCRP, ENAHO, planes JNE oficiales, debates legislativos recientes) y se cargará directamente como seed. El docente puede editar o desactivar preguntas en cualquier momento desde `/admin/preguntas`; no se requiere aprobación formal previa al despliegue.
- **FR-008**: El sistema DEBE presentar el cuestionario en múltiples pasos con barra de progreso visible.
- **FR-009**: El sistema DEBE autoguardar cada respuesta inmediatamente al avanzar.
- **FR-010**: El sistema DEBE permitir al estudiante retomar el cuestionario donde lo dejó, dentro de la misma cuenta.
- **FR-011**: El sistema DEBE permitir al estudiante editar respuestas anteriores hasta que envíe el cuestionario completo.
- **FR-012**: El sistema DEBE registrar un snapshot del texto exacto de cada pregunta al momento de responderla, para auditoría de cambios futuros en el banco de preguntas.

**Comparador**

- **FR-013**: El sistema NO DEBE permitir acceso al comparador sin haber completado el cuestionario.
- **FR-014**: El comparador DEBE presentar a ambos candidatos (Keiko Fujimori y Roberto Sánchez) simultáneamente, con tratamiento visual simétrico (mismo orden de campos, misma extensión visual, misma jerarquía).
- **FR-014a**: El orden izquierda/derecha de los candidatos DEBE asignarse **aleatoriamente (50/50)** en el primer acceso del estudiante al comparador y **persistirse** en su perfil (`compare_order: 'keiko_left' | 'roberto_left'`). En todas las visitas posteriores del mismo estudiante el orden DEBE mantenerse estable para no introducir confusión UX.
- **FR-014b**: El sistema DEBE registrar el orden asignado a cada estudiante para permitir al dashboard del docente analizar si la posición visual influyó en la preferencia declarada (control metodológico del sesgo de primacía).
- **FR-015**: El comparador DEBE organizar el contenido del plan de gobierno en cuatro dimensiones (Social, Económica, Ambiental, Institucional) navegables por pestañas o tabs.
- **FR-016**: El comparador DEBE mostrar, para cada dimensión y candidato, los cuatro componentes provistos por el JNE: Problema, Objetivo, Indicador y Meta.
- **FR-017**: El comparador DEBE mostrar el texto exacto provisto por el JNE, sin parafraseo ni edición.
- **FR-018**: Cuando el JNE no provea un dato, el comparador DEBE mostrar explícitamente "No declarado por el JNE" y no inventar contenido.
- **FR-019**: El comparador DEBE ofrecer enlace de descarga al PDF oficial del plan de gobierno de cada candidato.

**Preferencia final**

- **FR-020**: La plataforma DEBE permitir al estudiante declarar su preferencia con tres campos: candidato preferido (o "indeciso"), nivel de confianza de 1 a 10, motivo opcional en texto libre.
- **FR-021**: La plataforma DEBE tratar la preferencia como **final por usuario** una vez declarada: tras enviar, el estudiante no puede modificarla en v1. (El cambio de preferencia con auditoría se difiere a v2.)
- **FR-022**: La plataforma NO DEBE mostrar al estudiante datos agregados de otros estudiantes en ningún momento.
- **FR-023**: La plataforma NO DEBE emitir recomendaciones de voto, predicciones de resultados, ni textos editoriales sobre los candidatos.

**Dashboard del docente**

- **FR-024**: La plataforma DEBE restringir el acceso a `/dashboard` a usuarios con rol `teacher` o `admin`.
- **FR-024a**: La plataforma DEBE mantener una lista blanca `allowed_teachers` de correos institucionales. Al hacer login, si el correo del usuario está en esa lista, su rol DEBE elevarse automáticamente de `student` a `teacher`. Los registros nuevos sin coincidencia DEBEN caer como `student` por defecto.
- **FR-024b**: Los usuarios con rol `admin` DEBEN asignarse manualmente vía SQL directo en la base de datos (no hay UI de promoción a admin en v1).
- **FR-025**: El dashboard DEBE presentar KPIs: total inscritos, total completados, porcentaje de avance, distribución por facultad/carrera, evolución temporal.
- **FR-026**: El dashboard DEBE ofrecer filtros por facultad, carrera, ciclo y rango de fechas que actualicen reactivamente todos los gráficos.
- **FR-027**: El dashboard DEBE mostrar gráficos de cruce: preferencia por carrera, confianza promedio por género (cuando declarado), motivos textuales frecuentes.
- **FR-028**: El dashboard DEBE permitir exportar en cuatro formatos: CSV, XLSX, paquete HTML editable compatible con la importación de diseños de Canva, y dataset compatible con Power BI (formato tabular plano o conector directo).
- **FR-028a**: El export HTML para Canva DEBE entregar un archivo o paquete con el dashboard del docente como código HTML/CSS válido y autocontenido, importable directamente en el editor de Canva mediante su función de importación de código, permitiendo al docente reestilizar el dashboard sin perder los datos.
- **FR-028b**: El export Power BI DEBE entregar los datos del docente en una estructura tabular plana (CSV/XLSX con columnas estables, o archivo `.pbids`/dataset) que pueda cargarse directamente en Power BI Desktop sin transformaciones adicionales.
- **FR-028c**: Cada formato de export DEBE aplicar los toggles de anonimización seleccionados (ocultar nombre, ocultar correo, conservar identificador anónimo) consistentemente.
- **FR-029**: Cuando no haya respuestas todavía, el export DEBE generarse con headers válidos y un mensaje "sin datos aún" en la primera fila (aplica a CSV, XLSX y Power BI; el export HTML/Canva muestra estado "sin datos" en el dashboard).

**Gestión de preguntas (admin)**

- **FR-030**: La plataforma DEBE restringir `/admin/preguntas` a usuarios con rol `admin`.
- **FR-031**: Un admin DEBE poder editar texto, opciones, orden y estado activo/inactivo de cada pregunta.
- **FR-032**: Cambios en preguntas DEBEN reflejarse inmediatamente para estudiantes nuevos, sin afectar snapshots de respuestas históricas.

**Datos JNE**

- **FR-033**: El sistema DEBE consultar la API oficial del JNE para obtener candidatos, planes de gobierno y dimensiones.
- **FR-034**: El sistema DEBE refrescar la cache local de data JNE al menos una vez cada 24 horas.
- **FR-035**: Si la API JNE falla, el sistema DEBE servir la última copia válida en caché y registrar el incidente.
- **FR-036**: Un admin DEBE poder disparar un refresh manual de la data JNE.

**Seguridad y privacidad**

- **FR-037**: El sistema DEBE aplicar rate limiting de máximo 5 envíos por minuto por usuario en endpoints de submit del cuestionario.
- **FR-038**: El sistema DEBE proteger el formulario de registro y submits sensibles contra bots con un mecanismo anti-bot invisible.
- **FR-039**: El sistema NO DEBE incluir información personal identificable en logs operacionales (correo, nombre, DNI). Solo identificadores opacos.
- **FR-040**: El sistema DEBE cifrar datos personales en tránsito y en reposo.
- **FR-041**: El sistema DEBE permitir al estudiante solicitar borrado de sus datos en cualquier momento, conforme a la Ley 29733.
- **FR-041a**: El sistema DEBE conservar datos personales identificables (correo, nombre, UUID de `auth.users`) por un máximo de **12 meses** contados desde la fecha de cierre del ciclo académico declarada por el admin.
- **FR-041b**: Transcurridos los 12 meses, el sistema DEBE ejecutar un proceso de **anonimización irreversible**: desvincular o eliminar correo, nombre y UUID de `auth.users`, reemplazándolos por un hash opaco no reversible. Las respuestas y preferencias agregadas se conservan en forma anónima para análisis posterior.
- **FR-041c**: El proceso de anonimización DEBE registrarse en una bitácora interna con marca temporal y conteo de registros anonimizados, para auditoría de cumplimiento Ley 29733.

**Operación**

- **FR-042**: La plataforma DEBE estar disponible al menos el 99.5% del tiempo durante las tres semanas previas al cierre del ciclo académico.
- **FR-043**: La plataforma DEBE soportar al menos 500 estudiantes activos simultáneos.
- **FR-044**: Todos los textos visibles al usuario DEBEN estar en español neutro latinoamericano.

### Key Entities

- **Estudiante**: Persona registrada con rol `student`. Atributos: identificador opaco, nombres, apellidos, correo, dominio institucional sí/no, facultad, carrera, ciclo, rango de edad, género (opcional), consentimiento aceptado sí/no, fecha de consentimiento, opt-in uso de datos sí/no, orden asignado del comparador (`keiko_left` o `roberto_left`).
- **Docente**: Persona registrada con rol `teacher`. Acceso al dashboard. Mismos campos básicos que estudiante más permisos extendidos.
- **Administrador**: Persona registrada con rol `admin`. Acceso al dashboard, gestión de preguntas y refresh manual JNE.
- **Pregunta**: Item del cuestionario. Atributos: orden, dimensión temática, tipo (escala likert, opción única, opción múltiple, texto abierto, ranking, comparación), enunciado, opciones (si aplica), estado activo/inactivo.
- **Respuesta**: Declaración del estudiante a una pregunta. Atributos: estudiante, pregunta, valor (estructura depende del tipo de pregunta), snapshot del enunciado al momento de responder, marca temporal.
- **Candidato**: Postulante de la Segunda Vuelta. Atributos: identificador estable del JNE, nombre completo, partido, cargo, foto, URLs de PDFs del plan, marca de última actualización.
- **Plan de gobierno**: Documento oficial del JNE asociado a un candidato. Atributos: identificador estable del JNE, candidato, dimensiones.
- **Dimensión del plan**: Sección del plan en cuatro categorías oficiales. Atributos: candidato, dimensión (social/económica/ambiental/institucional), problema, objetivo, indicador, meta.
- **Preferencia final**: Declaración terminal del estudiante. Atributos: estudiante, candidato preferido o "indeciso", confianza 1-10, motivo opcional, marca temporal.
- **Evento de uso**: Registro anónimo de acción relevante en la plataforma. Atributos: estudiante (opaco), tipo de evento, marca temporal.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Al menos el 80% de los estudiantes que llegan al landing completan el registro.
- **SC-002**: Al menos el 70% de los estudiantes registrados completan el cuestionario.
- **SC-003**: Al menos el 60% de los estudiantes que completan el cuestionario declaran preferencia final.
- **SC-004**: El tiempo mediano que un estudiante pasa explorando el comparador es de al menos 4 minutos, indicando exploración real.
- **SC-005**: La tasa de errores visibles al usuario es menor al 0.5% del total de interacciones.
- **SC-006**: Un estudiante puede completar todo el flujo (login → consentimiento → perfil → cuestionario → comparador → preferencia) en menos de 15 minutos en condiciones promedio.
- **SC-007**: El docente puede generar un export anonimizado del estado actual del curso en menos de 30 segundos desde la apertura del dashboard.
- **SC-008**: La plataforma sostiene 500 estudiantes simultáneos sin degradación perceptible (tiempos de respuesta interactivos en menos de 2 segundos).
- **SC-009**: El docente expresa intención de reutilizar la plataforma en al menos uno de los siguientes ciclos académicos (encuesta cualitativa al cierre).
- **SC-010**: Cero incidentes de fuga o uso indebido de datos personales durante la operación.

## Assumptions

- Los estudiantes UPAO disponen de cuenta Google institucional `@upao.edu.pe` y/o cuenta Google personal; se asume cobertura mayoritaria. El fallback email/contraseña cubre el resto.
- Los estudiantes acceden mayormente desde dispositivo móvil (estimado 60%) y secundariamente desde laptop (40%). El diseño es mobile-first.
- La conexión típica es 4G estable. El soporte offline es parcial (continuidad del cuestionario), no completo.
- El periodo de captura activo es de aproximadamente tres semanas previas al cierre del ciclo académico.
- El docente del curso administra una única sección por ciclo. El soporte multi-sección queda fuera del alcance del MVP.
- El cuestionario inicial v1.0 contiene **10-15 preguntas en 4 dimensiones JNE (Social, Económica, Ambiental, Institucional)**. El borrador inicial lo genera el equipo técnico con base en contexto peruano y fuentes verificables y se carga directamente como seed. El docente edita o desactiva preguntas en cualquier momento desde `/admin/preguntas` (User Story 3) sin proceso de aprobación formal.
- La data del JNE permanece accesible vía API durante todo el periodo electoral. Se mantiene una copia inicial sembrada como respaldo.
- La universidad como institución no se ve representada como entidad política ni promotora; la plataforma se identifica explícitamente como herramienta académica del docente.
- El export al docente es para uso pedagógico; no se publica abiertamente ni se comparte con terceros sin reanonimización.

## Out of Scope (v1)

- Soporte multi-sección o multi-docente con permisos granulares por sección.
- Integración con plataformas LMS de UPAO (Blackboard, Moodle).
- Notificaciones por correo o WhatsApp a estudiantes.
- Comparador para elecciones diferentes a la presidencial de Segunda Vuelta 2026.
- Análisis NLP automatizado de los motivos textuales (queda para revisión manual del docente).
- Aplicación móvil nativa.
- Modo invitado sin registro.
- Cambio de preferencia con auditoría (era User Story 5): se difiere a v2. En v1 la preferencia es final por usuario tras el primer envío.
- Mecanismo de cierre de fase de captura global controlado por docente o admin (no necesario al ser la preferencia final por usuario).
