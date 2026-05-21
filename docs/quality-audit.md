# Quality audit — Voto Informado UPAO

Procedimiento para validar **Performance ≥ 90, Accessibility ≥ 90, Best Practices ≥ 90, SEO ≥ 90 (Lighthouse)** y **WCAG 2.2 AA mínimo (axe-core)** en las rutas críticas. Estos audits son manuales: la constitución § V los exige antes de cada release a producción.

## 1. Lighthouse

```powershell
# Una sola ejecución contra dev (rápido, no representativo de prod):
pnpm dev
# en otra terminal:
pnpm exec lighthouse http://localhost:3000 --view --preset=desktop --only-categories=performance,accessibility,best-practices,seo

# Más representativo: build + start
pnpm build
pnpm start
# en otra terminal:
pnpm exec lighthouse http://localhost:3000/ --view --preset=desktop
pnpm exec lighthouse http://localhost:3000/como-funciona --view --preset=desktop
pnpm exec lighthouse http://localhost:3000/comparador --view --preset=desktop
pnpm exec lighthouse http://localhost:3000/dashboard --view --preset=desktop
```

Si `lighthouse` no está instalado globalmente: `pnpm dlx lighthouse`.

**Criterio de aceptación**: Performance, Accessibility, Best Practices, SEO **≥ 90** en cada ruta. Time To Interactive < 3s en perfil "Slow 4G".

**Si una ruta falla** (orden de mayor a menor impacto típico):

1. Bundle por ruta — corre `pnpm tsx scripts/bundle-budget.ts` y revisa rutas sobre presupuesto.
2. LCP — verifica que `next/image` se use en imágenes hero, con `priority` cuando aplique.
3. CLS — fija dimensiones en imágenes y charts; evita inserciones tardías de fuentes.
4. Fonts — confirma que el preload + `display: swap` esté activo (next/font lo hace por defecto).

## 2. Accessibility — axe-core

```powershell
pnpm dev
# en otra terminal:
pnpm exec playwright install chromium   # solo la primera vez
pnpm tsx scripts/axe-audit.ts
```

El script abre cada ruta crítica en Chromium headless, ejecuta `@axe-core/playwright` y reporta violations agrupadas por impact. Exit code 1 si hay violations de impact `critical` o `serious`.

## 3. Manual keyboard navigation check

Para WCAG 2.2 AA mínimo (constitución V), navegar el flujo completo solo con teclado:

- [ ] `/login` — Tab cicla en orden visual, Enter envía, Escape no rompe nada.
- [ ] `/consent` — Tab llega a ambos checkboxes y al CTA. Submit con Enter.
- [ ] `/profile` — Tab llega a cada Select; Space/Arrows operan los dropdowns.
- [ ] `/cuestionario/N` — Tab entre opciones; Space marca radio/checkbox; Enter avanza paso.
- [ ] `/comparador` — Tab cicla entre las pestañas de dimensión; Arrows izq/der entre tabs.
- [ ] `/preferencia` — Tab llega al slider de confianza; Arrows lo mueven.
- [ ] `/dashboard` — Tab llega a los filtros; Enter aplica.

Tras navegar todo el flujo: verificar que el foco siempre es visible (anillo navy) y que ningún elemento robe el foco sin acción del usuario.

## 4. Resultado esperado

| Ruta              | Performance | A11y | Best Practices | SEO  | axe critical | axe serious |
| ----------------- | ----------- | ---- | -------------- | ---- | ------------ | ----------- |
| `/`               | ≥ 90        | ≥ 90 | ≥ 90           | ≥ 90 | 0            | 0           |
| `/como-funciona`  | ≥ 90        | ≥ 90 | ≥ 90           | ≥ 90 | 0            | 0           |
| `/comparador`     | ≥ 90        | ≥ 90 | ≥ 90           | ≥ 90 | 0            | 0           |
| `/cuestionario/1` | ≥ 90        | ≥ 90 | ≥ 90           | ≥ 90 | 0            | 0           |
| `/dashboard`      | ≥ 85*       | ≥ 90 | ≥ 90           | ≥ 90 | 0            | 0           |

\* Dashboard puede bajar de 90 por el peso de visx + recharts. Si pasa, justificarlo en el PR.

## 5. Cuándo correr

- Antes de cada deploy a producción.
- Después de cualquier cambio que toque rutas críticas, fuentes, dependencias pesadas o el bundle.
- Mensualmente como parte del mantenimiento.
