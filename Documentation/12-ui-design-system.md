# 12 — UI Design System

## Purpose

Define the visual language — "Premium Organic" — and the mechanics that keep it
consistent. Everything lives in `src/styles.css` as Tailwind v4 `@theme` tokens.

## Identity

Warm, cultivated, calm. Deep leaf green as the anchor, cream paper as the field, a wheat
accent for highlights. Generous whitespace, soft shadows, rounded-but-not-bubbly corners.
It should feel like a good farmers' market, not a supermarket flyer.

Explicitly avoided: default Inter-on-white SaaS look, purple/indigo gradients,
neon "tech" palettes.

## Colour tokens

Declared in OKLCH for perceptual consistency and predictable dark-mode inversion.

| Token | Light value | Use |
| --- | --- | --- |
| `--color-primary` | `oklch(0.52 0.13 148)` | Brand green, primary actions, links |
| `--color-primary-foreground` | near-white | Text on primary |
| `--color-leaf` | `oklch(0.94 0.04 148)` | Soft green surfaces, badges |
| `--color-cream` | `oklch(0.98 0.01 76)` | Page background |
| `--color-accent` | `oklch(0.82 0.12 85)` | Wheat highlight, ratings, offers |
| `--color-foreground` / `--color-muted-foreground` | ink / 60% ink | Body / secondary text |
| `--color-border`, `--color-input`, `--color-ring` | hairline neutrals | Structure and focus |
| `--color-destructive` | warm red | Destructive actions, errors |
| `--color-success`, `--color-warning` | green / amber | Status feedback |

Usage is always semantic:

```tsx
// ✅
<div className="bg-card text-foreground border border-border rounded-xl" />
// ⚠️ never
<div className="bg-[#2E7D32] text-white" />
```

To retheme the entire app, change the token values — not the components.

## Typography

| Level | Classes |
| --- | --- |
| Display / hero | `text-4xl md:text-6xl font-semibold tracking-tight` |
| H1 | `text-3xl md:text-4xl font-semibold tracking-tight` |
| H2 | `text-2xl font-semibold` |
| H3 | `text-lg font-medium` |
| Body | `text-base leading-relaxed` |
| Meta / caption | `text-sm text-muted-foreground` |
| Price | `text-lg font-semibold tabular-nums` |

Exactly one `<h1>` per page (SEO + a11y). Use `tabular-nums` wherever money is displayed.

## Spacing and layout

- 4px base scale; prefer `gap-*` over margins.
- Page container: `mx-auto w-full max-w-7xl px-4 md:px-6`.
- Section rhythm: `py-10 md:py-16`.
- Product grids: `grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6`.
- Mobile pages need bottom padding for `MobileTabBar` (`pb-20 md:pb-0`).

## Radius, elevation, motion

| Aspect | Rule |
| --- | --- |
| Radius | `rounded-xl` cards, `rounded-lg` inputs/buttons, `rounded-full` pills/avatars |
| Shadow | `shadow-sm` at rest, `shadow-md` on hover for interactive cards |
| Transition | `transition-colors`/`transition-transform` at 150–200ms, `ease-out` |
| Hover lift | `hover:-translate-y-0.5` on product cards only |
| Reduced motion | Honour `prefers-reduced-motion`; disable transforms |

## Iconography and imagery

- `lucide-react`, 1.5px stroke, sized 16/20/24.
- Products may fall back to an emoji glyph (`products.emoji`) when no image exists — this
  is intentional and keeps grids visually complete.
- Images: `loading="lazy"`, explicit `width`/`height` or an `AspectRatio` wrapper to avoid
  layout shift, and meaningful `alt` text.

## Dark mode

Tokens are redefined under `.dark`. Because components reference semantic names only, dark
mode requires no component changes. Test dashboards and charts explicitly — Recharts needs
token-driven colours, not literals.

## Accessibility baseline

- Contrast ≥ 4.5:1 for body text, ≥ 3:1 for large text and UI boundaries.
- Visible focus: `focus-visible:ring-2 focus-visible:ring-ring`.
- Every icon-only button has `aria-label`.
- Dialogs trap focus and restore it on close (Radix handles this — don't bypass it).
- Forms: `<Label htmlFor>` on every input; errors announced via `aria-describedby`.

## Common mistakes

- ⚠️ Adding a colour utility that isn't a token.
- ⚠️ Two `<h1>`s on a page because a hero and a section both used one.
- ⚠️ Fixed pixel heights that break at 320px width.
- ⚠️ Removing focus outlines "for design".
