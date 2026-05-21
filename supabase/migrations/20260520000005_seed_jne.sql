-- ============================================================================
-- T017 — Seed JNE (Voto Informado UPAO)
-- ============================================================================
-- Carga inicial de candidatos, planes y dimensiones desde los JSONs auditados
-- en data/jne/raw/. Fuente de verdad: web.jne.gob.pe/serviciovotoinformado
-- Fecha de descarga: 2026-05-20 (ver data/jne/README.md).
--
-- candidates.id = idHojaVida del JNE (único por persona natural).
-- plans.id = idPlanGobierno del JNE.
-- foto_url se deja null acá; el cron jne-refresh lo poblará cuando descubra
-- el patrón estable del CDN del JNE.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Candidates (Segunda Vuelta 2026)
-- ----------------------------------------------------------------------------

INSERT INTO public.candidates (id, id_organizacion_politica, nombre_completo, partido, cargo, foto_url, plan_pdf_url, last_synced_at)
VALUES
  (
    245741,
    1366,
    'KEIKO SOFIA FUJIMORI HIGUCHI',
    'FUERZA POPULAR',
    'Presidente',
    NULL,
    'https://mpesije.jne.gob.pe/docs/da4b943d-4344-4743-9362-a11ccf3054cb.pdf',
    now()
  ),
  (
    246281,
    1264,
    'ROBERTO HELBERT SANCHEZ PALOMINO',
    'JUNTOS POR EL PERU',
    'Presidente',
    NULL,
    'https://mpesije.jne.gob.pe/docs/3dd0e649-061c-4f31-8c3f-7a0836b58bde.pdf',
    now()
  );

-- ----------------------------------------------------------------------------
-- Plans
-- ----------------------------------------------------------------------------

INSERT INTO public.plans (id, candidate_id, header_json, last_synced_at)
VALUES
  (
    29690,
    245741,
    jsonb_build_object(
      'idOrganizacionPolitica', 1366,
      'txOrganizacionPolitica', 'FUERZA POPULAR',
      'txTipoPlan', 'PLAN DE GOBIERNO',
      'txEstadoLista', 'PRESENTADA',
      'txRutaCompleto', 'https://mpesije.jne.gob.pe/docs/da4b943d-4344-4743-9362-a11ccf3054cb.pdf',
      'txRutaResumen', 'https://mpesije.jne.gob.pe/docs/54765cdc-b494-409a-a30c-9e6bb2833566.pdf',
      'idProcesoElectoral', 124,
      'idTipoEleccion', 1
    ),
    now()
  ),
  (
    29688,
    246281,
    jsonb_build_object(
      'idOrganizacionPolitica', 1264,
      'txOrganizacionPolitica', 'JUNTOS POR EL PERU',
      'txTipoPlan', 'PLAN DE GOBIERNO',
      'txEstadoLista', 'PRESENTADA',
      'txRutaCompleto', 'https://mpesije.jne.gob.pe/docs/3dd0e649-061c-4f31-8c3f-7a0836b58bde.pdf',
      'idProcesoElectoral', 124,
      'idTipoEleccion', 1
    ),
    now()
  );

-- ----------------------------------------------------------------------------
-- Plan dimensions — Keiko (idPlanGobierno = 29690)
-- ----------------------------------------------------------------------------

INSERT INTO public.plan_dimensions (plan_id, dimension, problema, objetivo, indicador, meta, raw_json, last_synced_at)
VALUES
  (
    29690,
    'social',
    '1. Los altos niveles de victimización y percepción de inseguridad ciudadana, producto del avance del crimen organizado y la delincuencia común, sumados a una débil capacidad de prevención y respuesta del Estado.
2. El acceso limitado y tardío a consultas y diagnósticos en el sistema de salud, que afecta la calidad de atención y el trato digno al paciente.
3. El déficit de vivienda digna y formal, con alta informalidad y dificultades de acceso, especialmente para jóvenes y familias vulnerables.',
    '1. Implementación rápida de Centros de Comando y Videovigilancia (C5i) interconectados a nivel nacional, con mapas del delito en tiempo real e inteligencia artificial para el análisis predictivo y la coordinación de emergencias, así con patrulleros y cámaras orientadas a reducir la inseguridad y recuperar los espacios tomados por el crimen.
2. Despliegue de  un sistema de telemedicina nacional para ampliar la cobertura de consultas y diagnósticos, así como el otorgamiento de citas prontas en ambientes cómodos y adecuados, como medida prioritaria, garantizando trato digno al paciente.
3. Desarrollo de un programa integral de vivienda digna que combine construcción masiva de viviendas, ampliación de Techo Propio, MiVivienda, Vivienda Rural que incluya la Compra de Vivienda para Jóvenes, así como la titulación digital masiva para garantizar seguridad jurídica y acceso a servicios básicos.',
    '1. Número de regiones con C5i operativo e interconectado al sistema nacional.
2. Porcentaje de centros del primer nivel con servicio de telemedicina activo.
3. Número de beneficiarios de programas Techo Propio, MiVivienda y Vivienda Rural.',
    '1. Implementar un Sistema Nacional Interconectado de Comando y Videovigilancia (C5i) en las 24 regiones del país.
2. Garantizar la telemedicina operativa en el 100% de centros del primer nivel y reducir en 30% los tiempos de espera hospitalaria.
3. Asegurar viviendas adecuadas para 1.25 millones de peruanos vulnerables, mediante programas habitacionales y reubicación de familias en zonas de riesgo.',
    jsonb_build_object('idPlanGobDimension', 238765, 'idPgDimension', 1, 'idEstado', 1, 'nuPorcentaje', 100),
    now()
  ),
  (
    29690,
    'economica',
    '1. La elevada informalidad y el limitado acceso al crédito y capital de trabajo de las MYPEs, que restringen su crecimiento y generación de empleo formal.
2. La congestión urbana y la falta de transporte masivo eficiente que encarecen la movilidad y reducen la competitividad urbana.
3. La baja productividad agrícola y la falta de acceso a financiamiento, mecanización e infraestructura eficiente de comercialización.',
    '1. Implementación de una política integral de formalización y financiamiento para las MYPEs, que incluya la ‘Licencia 0’ mediante una ventanilla única digital nacional interoperable, eliminando trámites y costos innecesarios; la creación de PROMPYME con rango viceministerial para articular programas de apoyo, capacitación e inteligencia de mercados; y el despliegue de instrumentos de crédito y capital de trabajo (Fondo para el Crecimiento MYPE, Factoring MYPE con garantía parcial del Estado, Crédito para Mujeres Emprendedoras y Capital Semilla Joven).
2. Desarrollo de sistemas de metro y transporte masivo urbano, que contemple la construcción y puesta en marcha de cuatro nuevas líneas de metro en Lima (Líneas 3, 4, 5 y 6), así como la ejecución de una línea de metro en Arequipa, Trujillo y Piura, orientadas al transporte de pasajeros y carga ligera, articuladas con zonas industriales, logísticas y turísticas, con el objetivo de mejorar la movilidad urbana y reducir los tiempos de traslado.
3. Fortalecimiento productivo agrario que amplíe su inclusión financiera mediante el Banco Agrario y COFIDE, con créditos, seguros y líneas verdes para la pequeña agricultura; promueva la mecanización con la entrega de 5,000 tractores; y modernice la cadena de comercialización a través de mercados de abasto, sistemas de acopio y cadenas de frío.',
    '1. Porcentaje de MYPE formales con acceso a crédito.
2. Número de líneas de metro en operación.
3. Índice de productividad agrícola nacional',
    '1. Asegurar que al menos el 40% de las MYPE formales accedan a crédito productivo, mediante programas de garantías, capital semilla y líneas especiales para mujeres y jóvenes.
2. Poner en operación 6 líneas de metro: 4 en Lima y 1 en Arequipa, Trujillo y Piura.
3. Aumentar en 30% la productividad agrícola nacional, impulsando asistencia técnica, financiamiento, mecanización e infraestructura productiva.',
    jsonb_build_object('idPlanGobDimension', 238767, 'idPgDimension', 2, 'idEstado', 1, 'nuPorcentaje', 100),
    now()
  ),
  (
    29690,
    'ambiental',
    '1. La deforestación ilegal en la Amazonía y la falta de alternativas productivas sostenibles.
2. La falta de acceso universal, continuo y seguro al agua potable, especialmente en zonas rurales.”
3. La desconexión territorial y la falta de infraestructura eficiente que limitan el desarrollo económico regional y aumentan los costos logísticos.',
    '1. Implementación de un Programa Nacional de Cero Deforestación Ilegal con drones y monitoreo satelital para combatir la deforestación ilegal y promover el desarrollo sostenible amazónico, así como el financiamiento verde a proyectos productivos alternativos.
2. Desarrollo del Programa ‘Agua que Cuida la Vida’ para garantizar el acceso universal y continuo al agua potable, priorizando zonas rurales mediante soluciones de purificación doméstica, cloración simplificada y energías renovables para bombeo; asegurando la continuidad del servicio; y fortaleciendo la gestión del agua con kits de purificación doméstica, cloración simplificada y energías renovables para bombeo.
3.. Integración territorial mediante la culminación de los principales proyectos viales estratégicos (como la Nueva Carretera Central, Oyón–Ambo, Canta–La Viuda–Unish, Puerto Ocopa–Atalaya, la Longitudinal de la Sierra Tramo 4, la Autopista del Sol y la Red Vial N.° 4) y la modernización de los aeropuertos concesionados a nivel nacional, con el fin de conectar regiones, reducir brechas territoriales y disminuir costos logísticos.',
    '1. Tasa de deforestación anual.
2. Cobertura nacional de agua potable y alcantarillado.
3. Proyectos viales estratégicos culminados y aeropuertos concesionados modernizados.',
    '1. Reducir en 50% la deforestación ilegal en la Amazonía, priorizando titulación comunal, vigilancia forestal y proyectos productivos sostenibles.
2. Alcanzar 100% de cobertura nacional de agua potable y alcantarillado, priorizando zonas rurales y periurbanas.
3. Culminar 7 proyectos viales estratégicos (carreteras) y modernizar 17 aeropuertos concesionados a nivel nacional.',
    jsonb_build_object('idPlanGobDimension', 238768, 'idPgDimension', 3, 'idEstado', 1, 'nuPorcentaje', 100),
    now()
  ),
  (
    29690,
    'institucional',
    '1. La corrupción y la parálisis de la gestión pública por controles ineficaces y falta de transparencia.
2. La tramitología excesiva y poco transparente que dificulta la formalización y el desarrollo empresarial.
3. La lentitud del sistema de justicia que retrasan la resolución de conflictos y afectan la seguridad jurídica.',
    '1. Fortalecimiento del sistema nacional de control y transparencia mediante la ampliación del control concurrente en todas las fases de la ejecución presupuestal, el fortalecimiento técnico y presupuestal de la Contraloría (incorporando inteligencia artificial para detectar riesgos) y el reforzamiento de la Autoridad Nacional de Transparencia, protegiendo al funcionario honesto y previniendo la parálisis por temor a sanciones.
2. Implementación de una Ventanilla Única Digital Nacional con IA y tercerización regulada, que permita realizar en línea al menos el 80% de los trámites empresariales, con operadores privados certificados, interoperabilidad entre entidades y supervisión algorítmica para asegurar transparencia, eficiencia y seguridad.
3. Modernización del sistema de justicia mediante la interoperabilidad digital obligatoria entre sus entidades, la implementación del Expediente Judicial Electrónico (EJE), el uso de inteligencia artificial para la gestión y análisis de casos, y la ampliación de procesos judiciales monitorios que permitan resolver con rapidez y simplicidad las deudas dinerarias y reclamaciones menores, reduciendo significativamente los tiempos procesales.',
    '1. Pérdidas anuales por corrupción e inconducta funcional (Contraloría).
2. Porcentaje de trámites empresariales digitalizados.
3. Porcentaje de expedientes judiciales gestionados a través del EJE.',
    '1. Reducir en 30% las pérdidas anuales por corrupción e inconducta funcional, mediante transparencia digital, control preventivo y supervisión automatizada.
2. Digitalizar al menos el 80% de los trámites empresariales con el fin de atraer 5,000 y 7,000 millones de dólares adicionales en inversiones privadas anuales, generando más de 500,000 nuevos empleos formales.
3. Alcanzar cobertura nacional del Expediente Judicial Electrónico (EJE) y reducir en 30% los tiempos procesales promedio.',
    jsonb_build_object('idPlanGobDimension', 238766, 'idPgDimension', 4, 'idEstado', 1, 'nuPorcentaje', 100),
    now()
  );

-- ----------------------------------------------------------------------------
-- Plan dimensions — Roberto (idPlanGobierno = 29688)
-- Las 4 dimensiones se cargan desde data/jne/raw/roberto-jpp-plan-detalle.json
-- en un script de seed Node (scripts/seed-jne-roberto.ts) que se ejecuta tras
-- aplicar las migraciones, porque el contenido completo del JSON no cabe
-- legiblemente inline acá. La fila placeholder garantiza que el comparador
-- nunca rompa por falta del registro.
-- ----------------------------------------------------------------------------

INSERT INTO public.plan_dimensions (plan_id, dimension, problema, objetivo, indicador, meta, raw_json, last_synced_at)
VALUES
  (29688, 'social', NULL, NULL, NULL, NULL, '{}'::jsonb, now()),
  (29688, 'economica', NULL, NULL, NULL, NULL, '{}'::jsonb, now()),
  (29688, 'ambiental', NULL, NULL, NULL, NULL, '{}'::jsonb, now()),
  (29688, 'institucional', NULL, NULL, NULL, NULL, '{}'::jsonb, now());

COMMENT ON TABLE public.plan_dimensions IS
  'Las dimensiones de Roberto Sánchez se llenan vía script de seed Node tras aplicar migraciones, ejecutando: pnpm run seed:jne (T017 completion). Mientras tanto el comparador renderiza "No declarado por el JNE" (FR-018).';
