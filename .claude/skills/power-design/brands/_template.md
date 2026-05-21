# Brand Style — [Brand Name]

**brand:** [Brand Name]
**slug:** [slug]
**website:** [URL]
**extracted_via:** [manual | Firecrawl]

---

## Colors

| Role | Hex | Usage |
|---|---|---|
| Background | #000000 | Primary bg |
| Surface | #111111 | Cards, panels |
| Text primary | #FFFFFF | Headlines, body |
| Text secondary | #888888 | Captions, meta |
| Accent primary | #AABBCC | CTAs, highlights |
| Accent secondary | #DDEEFF | Hover, secondary accent |
| Border | #222222 | Dividers, card borders |

## CSS Variables (ready to drop in)

```css
:root {
  --bg:          #000000;
  --surface:     #111111;
  --text:        #FFFFFF;
  --text-muted:  #888888;
  --accent:      #AABBCC;
  --accent-2:    #DDEEFF;
  --border:      #222222;
}
```

---

## Typography

**Display font:** [Font Name] — [Google Fonts URL or CDN]
**Body font:** [Font Name] — [Google Fonts URL or CDN]

**Type scale (ratio 1.333, base 20px):**
| Level | Size | Weight | Use |
|---|---|---|---|
| Hero | 84px | 900 | Hero headline |
| H1 | 64px | 800 | Slide headline |
| H2 | 48px | 700 | Section title |
| H3 | 36px | 600 | Card title |
| Body | 24px | 400 | Body copy |
| Caption | 18px | 400 | Meta, captions |
| Footer | 14px | 400 | Source, footnotes |

---

## Spacing & Shape

**Grid:** 8pt base. Slide outer margin: 96px. Gutter: 32px.
**Border radius:** [Xpx] — [sharp | rounded | pill]
**Card padding:** 40px

---

## Buttons

**Primary:** bg [accent], text [#FFF or #000], radius [Xpx], uppercase, tracking 0.08em
**Secondary:** border 1.5px [accent], text [accent], bg transparent

---

## Logo

**File:** `brands/[slug]/logo.svg`
**Default placement on slides:** bottom-left, 24px tall, 96px from edges
**On dark bg:** use [white | brand color] fill
**On light bg:** use [dark | brand color] fill

---

## Voice & Tone

- [Sample headline 1]
- [Sample headline 2]
- [Sample headline 3]

**Tone:** [e.g. direct, scientific, warm, premium]
**Avoid:** [e.g. hype, medical claims, slang]
