---
name: ui-ux-pro-max
description: "UI/UX design intelligence for web and mobile. Includes 50+ styles, 161 color palettes, 57 font pairings, 161 product types, 99 UX guidelines, and 25 chart types across 10 stacks (React, Next.js, Vue, Svelte, SwiftUI, React Native, Flutter, Tailwind, shadcn/ui, and HTML/CSS). Actions: plan, build, create, design, implement, review, fix, improve, optimize, enhance, refactor, and check UI/UX code. Projects: website, landing page, dashboard, admin panel, e-commerce, SaaS, portfolio, blog, and mobile app. Elements: button, modal, navbar, sidebar, card, table, form, and chart. Styles: glassmorphism, claymorphism, minimalism, brutalism, neumorphism, bento grid, dark mode, responsive, skeuomorphism, and flat design. Topics: color systems, accessibility, animation, layout, typography, font pairing, spacing, interaction states, shadow, and gradient."
source: https://github.com/nextlevelbuilder/ui-ux-pro-max-skill
---

# UI/UX Pro Max - Design Intelligence

Comprehensive design guide for web and mobile applications. Contains 50+ styles, 161 color palettes, 57 font pairings, 161 product types with reasoning rules, 99 UX guidelines, and 25 chart types across 10 technology stacks. Use the Quick Reference sections below directly — the CLI search scripts are not required; apply the rules inline.

## When to Apply

Use this Skill when the task involves **UI structure, visual design decisions, interaction patterns, or user experience quality control**.

### Must Use
- Designing new pages (Landing Page, Dashboard, Admin, SaaS, Mobile App)
- Creating or refactoring UI components (buttons, modals, forms, tables, charts)
- Choosing color schemes, typography systems, spacing standards, or layout systems
- Reviewing UI code for user experience, accessibility, or visual consistency
- Implementing navigation structures, animations, or responsive behavior
- Making product-level design decisions (style, information hierarchy, brand expression)

### Skip
- Pure backend logic development
- Only involving API or database design
- Performance optimization unrelated to the interface
- Infrastructure or DevOps work

**Decision criteria**: If the task will change how a feature **looks, feels, moves, or is interacted with**, this Skill should be used.

## Rule Categories by Priority

| Priority | Category | Impact | Key Checks (Must Have) | Anti-Patterns (Avoid) |
|----------|----------|--------|------------------------|------------------------|
| 1 | Accessibility | CRITICAL | Contrast 4.5:1, Alt text, Keyboard nav, Aria-labels | Removing focus rings, Icon-only buttons without labels |
| 2 | Touch & Interaction | CRITICAL | Min size 44×44px, 8px+ spacing, Loading feedback | Reliance on hover only, Instant state changes (0ms) |
| 3 | Performance | HIGH | WebP/AVIF, Lazy loading, Reserve space (CLS < 0.1) | Layout thrashing, Cumulative Layout Shift |
| 4 | Style Selection | HIGH | Match product type, Consistency, SVG icons (no emoji) | Mixing flat & skeuomorphic randomly, Emoji as icons |
| 5 | Layout & Responsive | HIGH | Mobile-first breakpoints, Viewport meta, No horizontal scroll | Horizontal scroll, Fixed px container widths, Disable zoom |
| 6 | Typography & Color | MEDIUM | Base 16px, Line-height 1.5, Semantic color tokens | Text < 12px body, Gray-on-gray, Raw hex in components |
| 7 | Animation | MEDIUM | Duration 150–300ms, Motion conveys meaning, Spatial continuity | Decorative-only animation, Animating width/height, No reduced-motion |
| 8 | Forms & Feedback | MEDIUM | Visible labels, Error near field, Helper text, Progressive disclosure | Placeholder-only label, Errors only at top, Overwhelm upfront |
| 9 | Navigation Patterns | HIGH | Predictable back, Bottom nav ≤5, Deep linking | Overloaded nav, Broken back behavior, No deep links |
| 10 | Charts & Data | LOW | Legends, Tooltips, Accessible colors | Relying on color alone to convey meaning |

## Quick Reference

### 1. Accessibility (CRITICAL)
- `color-contrast` — Minimum 4.5:1 ratio for normal text (large text 3:1)
- `focus-states` — Visible focus rings on interactive elements (2–4px)
- `alt-text` — Descriptive alt text for meaningful images
- `aria-labels` — aria-label for icon-only buttons
- `keyboard-nav` — Tab order matches visual order; full keyboard support
- `form-labels` — Use label with for attribute
- `heading-hierarchy` — Sequential h1→h6, no level skip
- `color-not-only` — Don't convey info by color alone (add icon/text)
- `reduced-motion` — Respect prefers-reduced-motion

### 2. Touch & Interaction (CRITICAL)
- `touch-target-size` — Min 44×44pt; extend hit area beyond visual bounds if needed
- `touch-spacing` — Minimum 8px gap between touch targets
- `hover-vs-tap` — Use click/tap for primary interactions; don't rely on hover alone
- `loading-buttons` — Disable button during async operations; show spinner or progress
- `error-feedback` — Clear error messages near problem
- `cursor-pointer` — Add cursor-pointer to clickable elements
- `tap-delay` — Use touch-action: manipulation to reduce 300ms delay

### 3. Performance (HIGH)
- `image-optimization` — Use WebP/AVIF, responsive images (srcset/sizes), lazy load non-critical assets
- `image-dimension` — Declare width/height or use aspect-ratio to prevent layout shift
- `font-loading` — Use font-display: swap/optional to avoid invisible text
- `font-preload` — Preload only critical fonts
- `critical-css` — Prioritize above-the-fold CSS
- `lazy-loading` — Lazy load non-hero components via dynamic import / route-level splitting
- `bundle-splitting` — Split code by route/feature to reduce initial load
- `progressive-loading` — Use skeleton screens / shimmer instead of long blocking spinners for >1s operations

### 4. Style Selection (HIGH)
- `style-match` — Match style to product type
- `consistency` — Use same style across all pages
- `no-emoji-icons` — Use SVG icons (Heroicons, Lucide), not emojis
- `color-palette-from-product` — Choose palette from product/industry
- `primary-action` — Each screen should have only one primary CTA; secondary actions visually subordinate

### 5. Layout & Responsive (HIGH)
- `viewport-meta` — width=device-width initial-scale=1 (never disable zoom)
- `mobile-first` — Design mobile-first, then scale up to tablet and desktop
- `breakpoint-consistency` — Use systematic breakpoints (375 / 768 / 1024 / 1440)
- `readable-font-size` — Minimum 16px body text on mobile (avoids iOS auto-zoom)
- `line-length-control` — Mobile 35–60 chars per line; desktop 60–75 chars
- `horizontal-scroll` — No horizontal scroll on mobile
- `spacing-scale` — Use 4pt/8dp incremental spacing system
- `container-width` — Consistent max-width on desktop (max-w-6xl / 7xl)
- `viewport-units` — Prefer min-h-dvh over 100vh on mobile

### 6. Typography & Color (MEDIUM)
- `line-height` — Use 1.5-1.75 for body text
- `line-length` — Limit to 65-75 characters per line
- `font-pairing` — Match heading/body font personalities
- `font-scale` — Consistent type scale (e.g. 12 14 16 18 24 32)
- `contrast-readability` — Darker text on light backgrounds (e.g. slate-900 on white)
- `weight-hierarchy` — Bold headings (600–700), Regular body (400), Medium labels (500)
- `color-semantic` — Define semantic color tokens (primary, secondary, error, surface) not raw hex in components
- `whitespace-balance` — Use whitespace intentionally to group related items

### 7. Animation (MEDIUM)
- `duration-timing` — Use 150–300ms for micro-interactions; complex transitions ≤400ms
- `transform-performance` — Use transform/opacity only; avoid animating width/height/top/left
- `loading-states` — Show skeleton or progress indicator when loading exceeds 300ms
- `easing` — Use ease-out for entering, ease-in for exiting
- `motion-meaning` — Every animation must express a cause-effect relationship
- `scale-feedback` — Subtle scale (0.95–1.05) on press for tappable cards/buttons

### 8. Forms & Feedback (MEDIUM)
- `input-labels` — Visible label per input (not placeholder-only)
- `error-placement` — Show error below the related field
- `submit-feedback` — Loading then success/error state on submit
- `required-indicators` — Mark required fields (e.g. asterisk)
- `inline-validation` — Validate on blur (not keystroke)
- `input-type-keyboard` — Use semantic input types (email, tel, number) to trigger the correct mobile keyboard
- `autofill-support` — Use autocomplete attributes so the system can autofill
- `error-clarity` — Error messages must state cause + how to fix
- `multi-step-progress` — Multi-step flows show step indicator or progress bar
- `destructive-emphasis` — Destructive actions use semantic danger color (red) and are visually separated

### 9. Navigation Patterns (HIGH)
- `back-behavior` — Back navigation must be predictable and consistent
- `deep-linking` — All key screens must be reachable via URL
- `nav-state-active` — Current location must be visually highlighted in navigation
- `modal-escape` — Modals must offer a clear close/dismiss affordance
- `state-preservation` — Navigating back must restore previous scroll position and filter state
- `persistent-nav` — Core navigation must remain reachable from deep pages

### 10. Charts & Data (LOW)
- `chart-type` — Match chart type to data type (trend → line, comparison → bar, proportion → pie/donut)
- `legend-visible` — Always show legend near the chart
- `tooltip-on-interact` — Provide tooltips on hover/tap showing exact values
- `responsive-chart` — Charts must reflow or simplify on small screens

## Pre-Delivery Checklist

Before delivering UI code, verify:

**Visual Quality**
- [ ] No emojis used as icons (use SVG instead)
- [ ] All icons come from a consistent icon family
- [ ] Semantic theme tokens are used (no ad-hoc hardcoded colors)

**Interaction**
- [ ] All tappable elements provide clear pressed feedback
- [ ] Touch targets meet minimum size (≥44×44pt)
- [ ] Micro-interaction timing stays in the 150-300ms range
- [ ] Disabled states are visually clear and non-interactive

**Layout**
- [ ] Verified on 375px (small phone) and landscape orientation
- [ ] Horizontal insets/gutters adapt correctly by device size
- [ ] 4/8dp spacing rhythm is maintained

**Accessibility**
- [ ] All meaningful images/icons have accessibility labels
- [ ] Form fields have labels, hints, and clear error messages
- [ ] Color is not the only indicator
- [ ] Reduced motion is supported without layout breakage

## Design System Recommendations for Health/Pharma E-commerce (Roycon Context)

When building for Roycon Digital (pharmaceutical/nutraceutical products), apply:

- **Style**: Clean medical + modern wellness hybrid. Minimalist with strategic warm accents. Trust-first.
- **Color palette**: Deep navy or forest green as primary (trust, health) + warm gold or orange accent (energy, CTA) + white/off-white backgrounds
- **Typography**: Authoritative display font (e.g., Playfair Display, Lora) for hero headlines paired with clean humanist sans (e.g., Plus Jakarta Sans, DM Sans) for body
- **Trust signals**: DIGESA badge, RUC visible, product certifications prominent near CTA
- **CTA style**: High-contrast, single primary CTA per screen — "Comprar ahora" or "Pedir por WhatsApp"
- **Mobile-first mandatory**: Majority of Meta Ads traffic arrives on mobile
- **No navigation on landings**: Landing pages remove navbar to eliminate exit paths
