# Prompt para `/speckit-specify`

Copiar todo el bloque después de los tres guiones y pegarlo justo después del slash command en la nueva sesión de Claude Code.

---

Construye una webapp interactiva llamada "UPAO Voto Informado" para estudiantes de pregrado de la Universidad Privada Antenor Orrego (Trujillo, Perú) durante la Segunda Vuelta Electoral 2026 entre Keiko Fujimori (Fuerza Popular) y Roberto Sánchez (Juntos por el Perú).

## Visión

El docente a cargo de un curso de política/realidad nacional necesita que sus estudiantes interactúen con material electoral oficial de forma estructurada, declaren sus preferencias después de revisar evidencia, y produzcan data agregada que el docente pueda analizar pedagógicamente al cierre del ciclo. La plataforma sustituye encuestas en papel y debates poco estructurados con un flujo digital trazable.

## Quiénes usan la plataforma

**1. Estudiante UPAO de pregrado (usuario primario):**
- Edad típica 17-25.
- Acceso desde móvil (60%) y laptop (40%).
- Posee correo institucional `@upao.edu.pe` (Google Workspace) o cuenta Google/Microsoft personal.
- Motivación: cumplir tarea del curso. Bonus: descubrir propuestas que no conocía.

**2. Docente del curso (usuario administrador):**
- Configura el cuestionario para su sección.
- Monitorea avance en tiempo real.
- Exporta resultados anonimizados para clase.
- No técnico — espera dashboard claro y export a Excel/CSV.

**3. Administrador del sistema (Rodrigo y equipo):**
- Onboarding inicial del docente.
- Refresca data del JNE si la API cambia.
- Mantenimiento y soporte.

## User journeys principales

### Journey A — Estudiante completa el flujo

1. Llega vía link compartido por el docente.
2. Ve landing con hero, explica qué es y qué le tomará (~10 min).
3. Hace login con Google o Microsoft (1 click) o registra con email.
4. Acepta consentimiento informado (Ley 29733, no revende datos, anonimizable en export, puede pedir borrado).
5. Completa perfil mínimo: facultad, carrera, ciclo, edad rango, género (opcional).
6. Inicia cuestionario de N preguntas (definido por docente) en múltiples pasos. Cada respuesta se autoguarda. Si cierra el navegador, retoma donde quedó.
7. Al terminar el cuestionario, accede al comparador.
8. Comparador presenta Keiko (izquierda) y Roberto (derecha) lado a lado, con pestañas para 4 dimensiones del plan de gobierno oficial JNE (Social, Económica, Ambiental, Institucional). Por dimensión ve Problema/Objetivo/Indicador/Meta de cada candidato.
9. Explora el comparador durante el tiempo que quiera. Puede descargar el PDF oficial del JNE de cada plan.
10. Al final declara su preferencia: candidato preferido (o "indeciso"), nivel de confianza 1-10, motivo en texto libre (opcional).
11. Ve pantalla de cierre: agradecimiento + resumen de sus propias respuestas + invitación a compartir el link con compañeros.

### Journey B — Docente analiza resultados

1. Inicia sesión con su cuenta (rol `teacher`).
2. Llega a dashboard `/dashboard` con KPIs: total inscritos, total completados, % avance, distribución por carrera, evolución temporal.
3. Filtra por carrera, ciclo, fecha.
4. Ve cruces: preferencia por carrera (heatmap), confianza promedio por género, top motivos textuales.
5. Pulsa "Export" → modal con toggles (anonimizar nombre/email, anonimizar carrera, formato CSV/XLSX).
6. Descarga archivo y lo lleva a clase para discusión grupal.

### Journey C — Admin actualiza preguntas

1. Inicia sesión con rol `admin`.
2. Va a `/admin/preguntas`.
3. Edita texto, opciones, orden y activación de cada pregunta.
4. Cambios se reflejan inmediatamente — estudiantes nuevos ven el cuestionario actualizado. Respuestas históricas conservan la pregunta original (snapshot).

## Reglas de negocio críticas

1. **Neutralidad obligatoria**: ningún candidato puede ser presentado con tratamiento visual asimétrico (tinte de fondo, tamaño, orden). El comparador siempre muestra ambos al mismo tiempo, en el mismo orden estable (definido por sorteo único, no por preferencia).
2. **Comparador bloqueado hasta completar cuestionario**: el estudiante no ve propuestas antes de declarar sus posturas — evita que el material electoral contamine las respuestas previas.
3. **Una preferencia final por usuario**: el estudiante puede cambiar su preferencia mientras siga la fase abierta, pero al cierre se congela. El cambio queda registrado (auditoría).
4. **Datos JNE únicos**: el contenido de los planes proviene 100% de la API oficial del JNE (https://web.jne.gob.pe/serviciovotoinformado). Se prohíbe parafrasear o reescribir propuestas.
5. **Sesión cierra a las 24h** de inactividad.
6. **Rate limit**: 5 submissions por minuto por usuario para prevenir scripting.
7. **Sin datos sensibles innecesarios**: no se pide DNI, dirección, teléfono. Solo lo justo para análisis pedagógico.

## Requerimientos no funcionales

- **Disponibilidad**: 99.5% durante el periodo activo (3 semanas previas al cierre del ciclo).
- **Carga esperada**: hasta 500 estudiantes simultáneos. 5000 sesiones totales.
- **Performance**: Time To Interactive < 3s en 4G simulado. Lighthouse ≥ 90 en las 4 categorías.
- **Accesibilidad**: WCAG 2.2 AA mínimo. Teclado-only navegable.
- **Privacidad**: Ley 29733 (Perú). Datos cifrados en reposo y tránsito. Export anonimizable.
- **Idioma**: español neutro latinoamericano.

## Edge cases que el spec debe contemplar

- Estudiante hace login pero abandona antes del consentimiento → cuenta queda sin registros, no contamina métricas.
- Estudiante completa cuestionario pero abandona en el comparador → preferencia queda nula.
- API JNE devuelve 401 → renovar token automáticamente, log de incidencia, pero no bloquear UI.
- Estudiante completa el flujo desde dos dispositivos → consolidar en cuenta única, mantener primera respuesta.
- Docente exporta con 0 respuestas → archivo válido con headers, mensaje "sin datos aún".
- Estudiante usa email no UPAO → permitido pero marcado `email_institucional=false`.
- Estudiante cambia preferencia 10 veces → contar como un usuario, registrar última + auditoría.
- Modo offline durante el cuestionario → indicador, progreso local, sincroniza al volver.

## Success metrics

- ≥ 80% de estudiantes que entran al landing completan el registro.
- ≥ 70% de registrados completan el cuestionario.
- ≥ 60% de los que completan cuestionario declaran preferencia final.
- Tiempo mediano en comparador ≥ 4 minutos (indica exploración real).
- Tasa de errores 5xx < 0.5%.
- NPS implícito del docente: voluntad de usarla en próximos ciclos ≥ 8/10.

## Lo que esta webapp NO hace

- No recomienda candidatos.
- No predice ganador.
- No interactúa con redes sociales del estudiante.
- No vende ni comparte datos con terceros.
- No actúa como medio de prensa — no publica análisis editoriales.

## Notas para el plan técnico (referencia)

Stack obligatorio ya definido en `.specify/memory/constitution.md` y `CLAUDE.md`. Identidad visual en `docs/design.md`. API JNE documentada en `data/jne/README.md` y memoria `reference-jne-api`. Cualquier desviación del stack requiere amend a la constitución.
