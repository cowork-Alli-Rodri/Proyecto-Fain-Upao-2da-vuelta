# Identidad visual — UPAO Voto Informado

## Filosofía

Editorial, vivo y serio. Cero "default Tailwind / shadcn vanilla". El estudiante UPAO debe sentir que es una pieza diseñada para él, no un template. Tributo discreto a la identidad UPAO (navy + Ángel de Trujillo) pero con acentos modernos para conectar con Gen Z.

## Paleta de color (OKLCH tokens)

| Token | Hex | Uso |
|---|---|---|
| `--navy-upao` | `#002855` | Color institucional. Header, footer, CTAs primarios. |
| `--navy-deep` | `#001a3d` | Superficies oscuras, dark mode background. |
| `--cyan-electric` | `#00E5FF` | Acento brillante. Hover de links, focus rings, highlights. |
| `--mango-sun` | `#FFB400` | Highlights cálidos, CTAs secundarios, badges. |
| `--coral-pulse` | `#FF3D6E` | Errores, alertas, estados destructivos. |
| `--mint-success` | `#00C896` | Confirmaciones, estados positivos. |
| `--off-white` | `#FAFAFC` | Background light. |
| `--paper` | `#F2F0EC` | Tintes de papel para tarjetas. |
| `--charcoal` | `#1A1D23` | Dark mode background principal. |
| `--ink` | `#0E1014` | Texto principal sobre claro. |
| `--smoke` | `#5C6470` | Texto secundario. |
| `--candidate-keiko` | `#F26522` | Naranja Fuerza Popular (solo en /candidatos). |
| `--candidate-roberto` | `#2D8B47` | Verde Juntos por el Perú (solo en /candidatos). |

Reglas:
- Ratio de contraste WCAG AA mínimo (4.5:1 texto normal, 3:1 texto grande).
- Modo oscuro real (no auto-invert). Paleta dark ajustada manualmente.
- Los colores de partido se usan únicamente como tinte sutil (5-10% saturación) en `/candidatos` para mantener neutralidad visual entre candidatos.

## Tipografía

| Familia | Uso | Fuente |
|---|---|---|
| **Migra** o **Cormorant Garamond** | Display, titulares H1/H2 hero | Display serif editorial. Migra (gratis comercial) / Cormorant (Google Fonts) |
| **Geist Sans** | UI, body, navegación | Vercel font, moderna y técnica |
| **Geist Mono** | Números del dashboard, código, IDs | Mono geométrica |

Reglas:
- Display serif solo en H1/H2 grandes (≥ 40px). Nunca en botones ni labels.
- Body: Geist Sans 16px regular, 1.6 line-height.
- Números grandes en dashboard: Geist Mono con `font-feature-settings: 'tnum'` (tabular).
- Sin combinar 3 familias en una sola pantalla.

## Identidad anti-genérica

### Layout
- **Hero asimétrico**: H1 alineado izquierda, ilustración del Ángel de Trujillo estilizado a la derecha con parallax. Nada de "card centrada con CTA abajo".
- **Rejilla editorial 12 columnas** con ofsets deliberados (no todo a 8/4).
- **Sticky scroll storytelling** en página `como-funciona`.

### Movimiento
- **Lenis** scroll suave global (60-90% lerp).
- **Framer Motion** para reveal stagger (max 600ms total), page transitions tipo `AnimatePresence`, layout animations.
- **GSAP ScrollTrigger** solo en hero (pinning + parallax + text-mask reveal).
- **Microinteractions obligatorias**:
  - Ripple al click en botones primarios.
  - Magnetic buttons (cursor atrae el botón ~6px) en CTAs hero.
  - Tilt 3D suave en cards de `/candidatos` (`react-tilt`, max 8deg).
  - Skeleton shimmer con frase rotatoria contextual ("Consultando JNE…", "Cargando propuestas…").

### Cursor
Cursor custom (dot + ring delayed) que crece sobre clickeables, se transforma en flecha sobre links externos, en "+" sobre cards expandibles. Activable solo en `pointer: fine`.

### Símbolo UPAO
El Ángel de Trujillo aparece estilizado (single-line SVG, trazo navy + cyan eléctrico) en:
- Hero (decorativo, 40% opacidad).
- Footer (esquina inferior derecha, decorativo, 20% opacidad).
- Loading screen (silueta animada con stroke-dasharray).

## Componentes shadcn modificados

Tokens custom en `app/globals.css`. Nunca usar shadcn vanilla. Cada primitive debe tener al menos una modificación:
- Bordes: `border-radius` mixto (no todo 0.5rem). Cards principales `0.75rem`, botones `0.5rem`, badges `2rem` (pill).
- Sombras: tipo "fluffy" suave en light (`shadow-lg = 0 25px 50px -12px rgba(0,40,85,0.15)`), tipo "neon glow" sutil en dark con cyan eléctrico (`0 0 40px rgba(0,229,255,0.10)`).
- Focus visible: ring 3px cyan eléctrico con offset 2px.

## Diseño de /candidatos (split view del producto)

**Layout**: split horizontal 50/50.
- **Izquierda**: Keiko Fujimori, tinte naranja sutil (`--candidate-keiko` al 5% en background).
- **Derecha**: Roberto Sánchez, tinte verde sutil.

**Cabecera** por candidato:
- Foto circular 96px con ring 2px partido-color.
- Nombre en display serif.
- Partido + logo en Geist Sans uppercase tracking-wide.
- Link al PDF oficial del JNE (botón ghost).

**Navegación de dimensiones**: tabs horizontales (Social / Económica / Ambiental / Institucional). Estado activo subrayado animado (layoutId Framer Motion).

**Contenido por dimensión**: cuatro cards apiladas verticalmente:
1. **Problema** — fondo crema (`--paper`), texto serif.
2. **Objetivo** — fondo claro, ring navy.
3. **Indicador** — fondo charcoal, texto blanco, número Geist Mono.
4. **Meta** — fondo del color del candidato (5%), texto bold.

**Cambio de dimensión**: animación flip 3D suave en ambos lados simultáneamente (mismo `transition` para mantener simetría visual).

**Acción del estudiante**: en v2 `/candidatos` es página marketing pública (sin CTA obligatorio). La declaración de preferencia vive en `/preferencia` dentro del flow del cuestionario.

## Dashboard del docente

**Filosofía**: pasar de "datos crudos" a "narrativa accionable". Inspiración: Vercel Analytics, Posthog Insights, FT Visual Data.

**Layout**:
- Sidebar fija izquierda con secciones (Resumen / Respuestas / Analítica / Export).
- Header con filtros globales (carrera, ciclo, género, fecha).
- Main: KPIs grandes arriba, charts editoriales debajo.

**KPIs**: tarjetas con número grande Geist Mono + delta vs día anterior. Cero charts en estas tarjetas.

**Charts**:
- Distribución de preferencia: donut grueso con segmentos naranja/verde/gris (indecisos).
- Cruce carrera × preferencia: heatmap.
- Evolución temporal: línea suave con anotaciones manuales del docente.
- Top motivos: lista vertical estilo "ranking" con barras horizontales mini.

**Export**: CSV/XLSX con toggles para anonimizar (quita nombre, email, conserva user_id hash).

## Modo oscuro

Toggle en header. No es auto-invert. Paleta ajustada:
- Background: `--charcoal`.
- Surface: navy un tono más claro que background.
- Cyan acento intensificado en dark.
- Imágenes del Ángel cambian a stroke cyan en dark.

## Mobile-first

- Mobile ≤ 640px: stack vertical en `/candidatos` (no split horizontal). Swipe horizontal para cambiar de candidato.
- Touch targets ≥ 48px.
- Sin hover-only interactions (todo accesible con tap).
- Cursor custom desactivado en `pointer: coarse`.

## Sounds (opcional, off por defecto)

Toggle en footer ("Modo inmersivo"). Sonidos cortos UI (≤ 80ms) en:
- Click en CTA primario.
- Cambio de dimensión en `/candidatos`.
- Submit de cuestionario.

Volume default -24dB. Respeta `prefers-reduced-motion`.

## Loading & Estados

- **Loading**: skeleton shimmer + frase rotatoria contextual.
- **Vacío**: ilustración del Ángel + mensaje editorial ("Aún no hay respuestas. Sé el primero.").
- **Error**: mensaje específico + acción concreta ("Reintentar" o "Reportar al docente"). Sin "Error 500".
- **Offline**: banner sticky superior + cache local del progreso del cuestionario.

## Accesibilidad (WCAG 2.2 AA mínimo)

- Contraste 4.5:1 (texto normal), 3:1 (texto grande, UI components).
- Foco visible en todos los elementos interactivos.
- Skip-to-content link al inicio.
- ARIA landmarks en cada página.
- `prefers-reduced-motion` desactiva GSAP/Framer Motion (mantiene transitions instant).
- Lectores de pantalla: aria-labels en iconos sin texto, live regions en respuestas del cuestionario.
- Sin información transmitida solo por color (siempre acompañar de texto o icono).
