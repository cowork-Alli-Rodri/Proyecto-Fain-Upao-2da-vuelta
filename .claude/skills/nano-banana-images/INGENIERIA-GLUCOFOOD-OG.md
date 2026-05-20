# Ingeniería — Creativo "glucofood-og-real"

Imagen resultante: `roycon-web/public/og/glucofood-og-real.jpg` (2752×1536)
Fecha: 2026-05-11
Modelo: Nano Banana 2 (Kie.ai) via img2img

---

## Resultado

Banner horizontal 16:9 estilo lifestyle/ad con:
- Fondo cocina luminosa (mármol blanco, ventana con luz natural)
- Lata Glucofood real en centro-derecha, ligeramente rotada
- Vaso con batido de vainilla a la izquierda
- Flores y vainas de vainilla como props
- Scoop con polvo proteico
- Texto overlay: "TU COMPLEMENTO PROTEÍCO COMPLETO" + subtítulo + handles sociales
- Branding "libre de maltodextrina" flotante

**Insight clave:** El prompt pedía fondo navy oscuro (#070f22). El modelo interpretó libremente el contexto
y generó un lifestyle scene mucho más natural y comercial. El usuario prefirió este resultado sobre la versión
con fondo oscuro y sobre el composite con Pillow. Lección: con img2img de producto real, el modelo tiende
a generar contexto lifestyle apropiado aunque el prompt pida otra cosa — dejar que lo haga es mejor resultado.

---

## Pipeline de generación

```
PNG del producto real (local)
    ↓
catbox.moe upload → URL pública temporal
    ↓
Kie.ai createTask API (img2img: image_input = URL catbox)
    ↓
Poll recordInfo hasta state = "success"
    ↓
Download resultUrls[0] → archivo local
```

---

## Comando de ejecución

```powershell
py generate_og.py `
  "d:/ANTIGRAVITY - PROYECTOS/ROYCON DIGITAL/roycon-web/public/products/glucofood-liso.png" `
  "prompts/glucofood-og.json" `
  "images/glucofood-og-real.jpg" `
  "16:9"
```

---

## Prompt JSON usado (`prompts/glucofood-og.json`)

```json
{
  "prompt": "Premium supplement brand social share banner, horizontal 16:9 format. Use the reference image provided as the exact Glucofood product can — preserve its label design, colors, typography and shape faithfully. Do not invent or alter the can design. Place the can prominently on the right two-thirds of the frame, slightly angled 10 degrees for depth, large and sharp. Deep navy background #070f22. Behind the can: large soft radial orange glow #ea7b0b blurred heavily, warm halo effect. Left third: bold white headline text 'La proteína que trabaja contigo.' in heavy 900-weight clean sans-serif font, large. Below headline: muted blue-gray subtitle '14g proteína · Sin maltodextrina · Sabor vainilla' in 400 weight. Top-left: 'Roycon' white wordmark 700 weight small. Bottom-left row of three small rounded pill badges with orange #ea7b0b border and faint orange fill: 'Registro DIGESA', 'Sin Maltodextrina', 'Omega 3-6-9' — uppercase 10pt bold orange text. Studio product photography: key light from upper right creating specular highlight on can lid, soft fill from left. 50mm lens, f/8, ISO 100, tack sharp, no noise. Premium dark aesthetic, conversion-focused supplement brand.",
  "negative_prompt": "white background, bright background, wrong can design, altered label, different product, invented text on can, cluttered layout, blurry text, illegible font, humans, faces, multiple cans, distorted can, cartoon, illustration, vector art, flat design, neon colors, watermark, frame border",
  "api_parameters": {
    "resolution": "2K",
    "output_format": "jpg",
    "aspect_ratio": "16:9"
  }
}
```

---

## Parámetros del API call (Kie.ai)

```json
{
  "model": "nano-banana-2",
  "input": {
    "prompt": "<JSON.stringify del objeto anterior>",
    "aspect_ratio": "16:9",
    "resolution": "2K",
    "output_format": "jpg",
    "image_input": ["<URL pública catbox.moe del PNG del producto>"]
  }
}
```

Endpoints:
- POST `https://api.kie.ai/api/v1/jobs/createTask` → devuelve `taskId`
- GET  `https://api.kie.ai/api/v1/jobs/recordInfo?taskId=XXX` → polling hasta `state: "success"` → `resultJson.resultUrls[0]`

Auth: `Authorization: Bearer <KIE_API_KEY>`

---

## Reglas de prompt para creativos de producto (aprendizajes)

1. **Siempre pasar el PNG real como `image_input`** — el modelo respeta el diseño del label aunque reinterprete el fondo
2. **No forzar el fondo en el prompt** — si el modelo elige lifestyle, generalmente es mejor resultado que fondo sólido
3. **Describir la ubicación del producto** ("right two-thirds", "slightly angled 10 degrees") — controla composición
4. **Cámara math obligatorio**: focal length, f-stop, ISO — fuerza física óptica real, no CGI
5. **Negative prompt agresivo contra**: wrong can design, altered label, invented text on can — el modelo tiende a "corregir" etiquetas
6. **Resolución 2K mínimo** para creativos que van a Meta Ads

---

## Estructura de carpetas para nuevos productos

Para replicar con Liveratrol o Fortín-B:

```
prompts/
  liveratrol-og.json        ← copiar glucofood-og.json, ajustar colores y copy
  fortin-b-og.json
  liveratrol/
    vanilla-shake-scene.json  ← remplazar por escena apropiada para el producto
images/
  liveratrol-og-real.jpg
  fortin-b-og-real.jpg
```

Comando:
```powershell
py generate_og.py `
  "roycon-web/public/products/liveratrol-liso.png" `
  "prompts/liveratrol-og.json" `
  "images/liveratrol-og-real.jpg" `
  "16:9"
```

---

## Para la App de Creativos

Variables que cambian por producto/creativo:
- `image_input`: PNG del producto (el modelo preserva el label)
- `prompt`: headline copy, colores de acento, posición del can
- `aspect_ratio`: "16:9" (banner), "4:5" (feed), "9:16" (stories/reels), "1:1" (grid)
- `resolution`: "2K" estándar, "4K" si necesitas impresión

Variables fijas (reutilizar):
- Modelo: `nano-banana-2`
- Pipeline: catbox.moe → Kie.ai img2img
- Auth: `KIE_API_KEY` en `.env`
- Script: `generate_og.py` (funciona para cualquier producto/formato)
