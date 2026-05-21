# Design Principles for Codified Slide Generation

*Research compiled for the Claude HTML slide-generation skill — May 2026*

> Scope: every rule below is **codifiable** — a number, ratio, threshold, or a rule of the form "if X then Y." Rules that resist measurement have been refused or rewritten as concrete checks.

---

## TL;DR — The 20 Rules That Matter Most for Slides

1. **One idea per slide.** Maximum one headline (≤10 words) + at most one supporting body block. If you'd need a second headline, split the slide. [Reynolds; Duarte]
2. **Glanceable in ≤3 seconds.** A viewer must extract the slide's single message in ≤3 s. If it takes longer, simplify or split. [Duarte; NN/g 3-second rule]
3. **Maximum 7 ± 2 distinct visual chunks per slide; ideal 3–5.** Group with proximity so the brain perceives 3–5 chunks, not 9 atoms. [Miller 1956; Cowan 2001: working memory ≈ 4]
4. **40% minimum whitespace ratio.** Of the slide's pixel area, ≥40% must be empty. Hero/title slides: ≥60%. [Refactoring UI; Presentation Zen]
5. **Edge safe-zone = 5% of slide width on every side.** On 1920×1080 that's ≥96 px from any edge. [Broadcast title-safe convention; Apple HIG]
6. **Type scale uses a fixed ratio (1.25, 1.333, 1.414, 1.5, or 1.618).** Pick one; derive every size from it. Never use ad-hoc sizes. [Tschichold; Bringhurst; Modular Scale]
7. **Maximum 4 type sizes per slide, 6 per deck.** Display, subhead, body, caption — done. [Refactoring UI; Müller-Brockmann]
8. **Body text ≥24 px on screen, ≥28 pt for projection.** Title ≥48 px. Caption floor 18 px. [Reynolds; Duarte]
9. **Line-height 1.4–1.6 for body, 1.05–1.2 for display.** [Butterick; Bringhurst]
10. **Line length ≤60 characters; ideal 45–60.** Slides shouldn't have paragraphs at all. [Bringhurst; Butterick]
11. **WCAG contrast: ≥4.5:1 body, ≥3:1 large text, aim for 7:1 (AAA) for projector resilience.** [WCAG 2.2]
12. **60-30-10 color split.** 60% dominant (usually background), 30% secondary, 10% accent. [Itten; Refactoring UI]
13. **One accent color per slide for emphasis.** Multiple accents = no accent. [Tufte; Schoger]
14. **Never encode meaning in hue alone.** Pair color with shape, label, weight, or icon. [WCAG 1.4.1; ColorBrewer]
15. **8-pt grid for all spacing.** Every margin, padding, gap = multiple of 8. On 1920×1080 use 8/16/24/32/48/64/96/128. [Bryn Jackson; Material Design]
16. **Align everything to one grid; prefer 12-column with 24–32 px gutters.** [Müller-Brockmann; Bootstrap/Material]
17. **Proximity: related items ≤16 px apart, unrelated items ≥48 px apart.** [Gestalt proximity; Williams CRAP]
18. **Data-ink ratio ≥ ~80%.** Strip every chart pixel that isn't data: no 3D, no gradients, no chartjunk. [Tufte 1983]
19. **F-pattern: place the headline + key visual in the top-left to top-right band.** First 200 px vertical = primary attention zone. [NN/g eye-tracking]
20. **Two valid slide modes — pick one per deck and stay in it.** *Presenter mode*: ≤15 words/slide, sparse. *Document mode*: dense, hierarchical. Never mix. [Tufte vs. Reynolds — synthesis]

---

## Numbers Cheat Sheet

| Category | Variable | Value |
|---|---|---|
| Working memory | Max chunks | 7 ± 2 (Miller); ideal 4 (Cowan) |
| Slide canvas | Default aspect | 16:9 |
| Slide canvas | Reference px | 1920 × 1080 |
| Spacing | Grid base | 8 px |
| Spacing | Allowed scale | 4, 8, 12, 16, 24, 32, 40, 48, 64, 80, 96, 128, 160, 192, 256 |
| Spacing | Slide outer margin | ≥96 px (5%) |
| Spacing | Card padding | 32–48 px |
| Spacing | Card-to-card gap | ≥24 px |
| Spacing | Related-item gap | ≤16 px |
| Spacing | Unrelated-item gap | ≥48 px |
| Whitespace | Content slide | ≥40% |
| Whitespace | Hero/title slide | ≥60% |
| Whitespace | Quote slide | ≥70% |
| Type | Body min (screen) | 24 px |
| Type | Body min (projection) | 28 pt (~37 px) |
| Type | Headline min | 48 px |
| Type | Caption min | 18 px |
| Type | Footer/source | 14–16 px @ 50–60% opacity |
| Type | Sizes per slide | ≤4 |
| Type | Sizes per deck | ≤6 |
| Type | Fonts per deck | ≤2 |
| Type | Modular ratios | 1.200, 1.250, 1.333, 1.414, 1.500, 1.618 |
| Type | Default ratio | 1.333 |
| Type | Body line-height | 1.4–1.6 |
| Type | Display line-height | 1.0–1.2 |
| Type | Body line length | ≤60 ch (ideal 45–60) |
| Type | Display line length | ≤30 ch |
| Type | Display tracking | –0.01 to –0.02 em |
| Type | All-caps tracking | +0.05 to +0.1 em |
| Color | 60-30-10 split | dominant / secondary / accent |
| Color | Accents per slide | 1 |
| Color | Accents per deck | 1 |
| Color | Body contrast (AA) | 4.5:1 |
| Color | Large text contrast (AA) | 3:1 |
| Color | Body contrast (AAA — projection target) | 7:1 |
| Color | Large text contrast (AAA) | 4.5:1 |
| Color | UI/graphical contrast | 3:1 |
| Hierarchy | Headline:body size ratio | 2.0–4.0 |
| Hierarchy | Subhead:body ratio | 1.25–1.5 |
| Hierarchy | Focal element area | ≥25% slide OR ≥1.5× next largest |
| Charts | Data-ink ratio | ≥80% |
| Charts | Series per chart | ≤5 |
| Charts | Gridlines | ≤4 horizontal, 50% opacity |
| Words | Title slide | ≤10 |
| Words | Section divider | ≤8 |
| Words | Content (presenter) | ≤25 |
| Words | Content (document) | ≤75 |
| Words | Quote | ≤30 |
| Words | Bullets per slide | ≤3 |
| Words | Words per bullet | ≤8 |
| Hicks | Visible options per decision | ≤3 |
| Animation | Transition duration | ≤300 ms |
| Animation | Flashes/sec max | <3 |
| Image | Full-bleed scrim opacity | 40–70% |
| Image | Text-overlay contrast | ≥4.5:1 at 9 sample points |
| Icon | Allowed sizes | 16, 20, 24, 32, 40, 48, 64, 96 |
| Icon | Inline icon size | 1 em (matches cap height) |
| Grid | Columns | 12 (default) |
| Grid | Gutter | 24–32 px |
| Grid | Outer margin (1920 wide) | 96 px |
| Golden ratio | Two-zone split | 38% / 62% |
| Rule of thirds | Intersection points (1920×1080) | (640,360), (1280,360), (640,720), (1280,720) |
| Edge | Title-safe zone | ≥5% (96 px on 1920) |
| Symmetry | Off-center threshold | ≥15% asymmetric or true-centered |

---

## What not to do

- No purple-gradient hero slides
- No six-bullet slides (Rule #3)
- No drop shadows on bars (Rule #18)
- No centered-everything layouts (Rule #19)
- No multiple accent colors (Rule #13)
- No ad-hoc spacing like 13px or 27px (Rule #15)
- No paragraphs on slides (Rule #10)
- No mode-mixing (Rule #20)
- No omitting brand logo unless user explicitly said no (Rule #21)

---

## Resolved Contradictions

| Conflict | Resolution |
|---|---|
| **Tufte: more density** vs. **Reynolds: less density** | Codify as `mode = 'presenter'` (Reynolds) or `mode = 'document'` (Tufte). Default presenter for live decks. |
| **6×6 bullet rule** vs. **no-bullet rule** | Replace with ≤3 bullets ≤8 words OR no bullets. |
| **Golden ratio** vs. **8-pt grid** | 8-pt grid wins for daily layout; golden ratio reserved for hero/title splits. |
| **Symmetry** vs. **Asymmetry** | Either fully symmetric or deliberately asymmetric (≥15% offset). Avoid near-symmetric. |
| **Brand color saturation** vs. **WCAG contrast** | WCAG wins for text. Use brand-derived shades for text to hit contrast. |
