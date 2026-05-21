# Brand Style — Roycon Glucofood

**brand:** Roycon Glucofood
**slug:** roycon-glucofood
**website:** roycon.store/glucofood
**extracted_via:** manual — paleta extraída de CODIGOS-DE-COLOR.txt (activos oficiales Roycon)

---

## Colors

| Role | Hex | Usage |
|---|---|---|
| Background (deep navy) | #203061 | Hero bg, dark sections |
| Surface (dark slate) | #535e86 | Cards sobre fondo navy |
| Accent primary (naranja) | #ea7b0b | CTAs, highlights, precio, badges |
| Accent bright (naranja vivo) | #fd6c08 | Hover, urgencia, contador |
| Accent warm (arena) | #eebd83 | Subtítulos sobre navy, ingredientes |
| Accent gold (naranja medio) | #e69645 | Estrellas, trust badges, secundario |
| Text on dark (blanco) | #FFFFFF | Headlines y body sobre navy |
| Text muted (gris azulado) | #929cb6 | Captions, meta, footnotes |
| Accent teal | #7fb0a7 | Elemento de contraste fresco, DIGESA badge |
| Accent brown | #8a603c | Tierra, natural, cacao — uso decorativo |

## CSS Variables (ready to drop in)

```css
:root {
  --bg:           #203061;
  --surface:      #535e86;
  --accent:       #ea7b0b;
  --accent-vivid: #fd6c08;
  --accent-warm:  #eebd83;
  --accent-gold:  #e69645;
  --text:         #ffffff;
  --text-muted:   #929cb6;
  --teal:         #7fb0a7;
  --brown:        #8a603c;
}
```

## 60-30-10 distribution for slides

- **60% (dominant):** `#203061` navy — backgrounds
- **30% (secondary):** `#ffffff` + `#929cb6` — text and surfaces
- **10% (accent):** `#ea7b0b` naranja — CTAs, badges, emphasis

---

## Typography

**Display font:** Plus Jakarta Sans — https://fonts.google.com/specimen/Plus+Jakarta+Sans
**Body font:** Plus Jakarta Sans (same family — weight variation)

**Type scale (ratio 1.333, base 20px — rounded to 8pt):**
| Level | Size | Weight | Letter-spacing | Use |
|---|---|---|---|---|
| Hero | 80px | 900 | -0.02em | Hero headline |
| H1 | 64px | 800 | -0.02em | Slide headline |
| H2 | 48px | 700 | -0.01em | Section title |
| H3 | 36px | 600 | 0 | Card title |
| Body | 24px | 400 | 0 | Body copy |
| Caption | 18px | 400 | 0 | Ingredientes, meta |
| Badge | 11px | 800 | +0.12em | UPPERCASE badges, labels |
| Footer | 14px | 400 | 0 | Source, footnotes — 60% opacity |

---

## Spacing & Shape

**Grid:** 8pt base. Slide outer margin: 96px. Gutter: 32px.
**Border radius:** 4px — estilo limpio, semi-sharp (no pill, no zero)
**Card padding:** 40px
**Card border:** 1px solid rgba(255,255,255,0.12) sobre navy

---

## Buttons

**Primary CTA:** bg `#ea7b0b`, text `#ffffff`, radius 4px, uppercase, tracking +0.10em, font-weight 800
**Secondary:** border 1.5px `#ea7b0b`, text `#ea7b0b`, bg transparent, radius 4px

---

## Product

**Formato:** Lata 1kg (cilíndrica, naranja y azul navy)
**Imagen:** `/products/glucofood.png` (PNG con fondo transparente)
**Presentación:** "Lata 1 kg · 30 porciones"

**Para slides con producto:** mostrar la lata con `transform: perspective(800px) rotateY(15deg) rotateX(5deg)` para efecto 3D. Glow naranja `#ea7b0b` detrás con blur 80px.

---

## Voice & Tone

**Samples (compliance DIGESA — solo ingredientes, nunca el producto):**
- "Proteína completa. Sin rellenos. Sin mentiras."
- "14g de proteína real por porción — verificable en la etiqueta."
- "Zinc para el metabolismo de carbohidratos. Magnesio contra la fatiga postprandial."
- "Sin maltodextrina. Sin azúcar añadida. Endulzado con stevia."
- "Tres fuentes proteicas: suero, arveja, colágeno hidrolizado."
- "Registro DIGESA vigente."

**Tone:** directo, honesto, basado en ciencia de ingredientes, premium sin hype
**Avoid:** "baja el azúcar", "para diabéticos", "tratamiento", "protocolo", "cura", promesas de resultados en X semanas, lenguaje médico sobre el producto terminado

---

## Trust elements (obligatorios en las slides de landing)

- Badge: "Registro DIGESA Vigente"
- Badge: "Sin Maltodextrina"
- Badge: "14g Proteína / Porción"
- Badge: "Sin Azúcar Añadida"
- Razón social: "Asociados FUM S.A.C. — RUC 20609122065"

---

## Precios (para slides de oferta)

| Oferta | Precio | Tachado |
|---|---|---|
| 1 unidad | S/ 169 | S/ 195 |
| Tratamiento 3 unidades (5% dcto) | S/ 479 | S/ 585 |
| Fortín-B Order Bump | S/ 75 | S/ 89 |
| Liveratrol Order Bump | S/ 75 | S/ 99 |

**Envío:** Gratis en el tratamiento de 3 unidades. S/ 15 en 1 unidad.
