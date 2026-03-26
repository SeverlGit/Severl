# Severl — Design & Styling Reference

This document describes **everything styling-related** in the app: tokens, typography, global CSS, Tailwind, third-party theming (Clerk, Sonner), and where to change them.

**Sources of truth (implemented UI):**

| File | Role |
|------|------|
| [`tailwind.config.ts`](tailwind.config.ts) | Tailwind theme: colors, fonts, radius, accordion animations |
| [`app/globals.css`](app/globals.css) | CSS variables (`:root`), scrollbar, form font inheritance, utility tags |
| [`app/layout.tsx`](app/layout.tsx) | Google fonts (`next/font`), Clerk `appearance`, Sonner `Toaster` styles |
| [`components/ui/*`](components/ui/) | Radix primitives + **`cva`** variants (e.g. [`button.tsx`](components/ui/button.tsx)) |

**Reference mockup:** [`severl-premium.html`](severl-premium.html) — single-file browser mockup. When in doubt about a specific value, the mockup is the visual source of truth.

---

## Visual Direction

- **Archetype:** dashboard · **subtype:** editorial command
- **Mood:** warm, precise, confident, premium — a business OS, not a planning tool
- **Target user:** female SMM freelancers and agency owners, 20s–30s
- **References (feel):** HoneyBook warmth + Linear density + editorial serif weight
- **Avoid:** cold navy/blue SaaS, developer-coded aesthetics, generic white-card dashboards, light corporate templates, pastel lifestyle branding, heavy glassmorphism

---

## Stack

| Layer | Choice |
|-------|--------|
| CSS | **Tailwind CSS v3** (`@tailwind base/components/utilities` in `globals.css`) |
| PostCSS | `tailwindcss`, `autoprefixer` |
| Components | **Radix UI** primitives under `components/ui/`, styled with **`cva`** and `cn()` from `lib/utils.ts` |
| Icons | **lucide-react** |
| Motion | **framer-motion** (panels, auth shell, dashboard) |
| Animation plugin | **tailwindcss-animate** (accordion keyframes) |

---

## Color System (Tailwind)

Warm cream canvas with **dusty rose** (`brand-rose`) as the primary accent and **warm plum** (`brand-plum`) as the secondary. Sidebar is deep aubergine-charcoal — kept dark for visual grounding and contrast against the light canvas.

### Brand

| Token | Hex | Usage |
|-------|-----|-------|
| `brand-rose` | `#C4909A` | Primary accent — CTAs, active states, key highlights |
| `brand-rose-mid` | `#DDB4BC` | Softer rose — sidebar active icons, secondary badges |
| `brand-rose-deep` | `#8C5562` | Dark rose — text on rose-tinted backgrounds, hover states |
| `brand-rose-dim` | `#F7ECED` | Blush tint — badge backgrounds, hover surfaces, alert strips |
| `brand-plum` | `#6B6178` | Secondary accent — bridges sidebar and rose |
| `brand-plum-mid` | `#9B92A8` | Softer plum — secondary health bars, borders |
| `brand-plum-deep` | `#3D3649` | Dark plum — text on plum-tinted backgrounds |
| `brand-plum-dim` | `#EDEBF2` | Plum tint — secondary badge backgrounds |

### Canvas & Surfaces

| Token | Hex | Usage |
|-------|-----|-------|
| `page` | `#F0EBE3` | Root background — warm cream |
| `panel` | `#FAF7F4` | Cards, right panel, topbar background |
| `surface` | `#FFFFFF` | KPI cards, chart wrappers, onboarding cards |
| `surface-hover` | `#E8E2D9` | Interactive hover backgrounds |

### Sidebar

| Token | Hex | Usage |
|-------|-----|-------|
| `sidebar` | `#1E1B24` | Deep aubergine-charcoal — nav rail + ticker footer |
| `sidebar-icon` | `rgba(255,255,255,0.30)` | Default nav icon |
| `sidebar-active` | `#DDB4BC` | Active nav icon — rose-mid |
| `sidebar-border` | `rgba(255,255,255,0.05)` | Sidebar right edge |

### Borders

| Token | Hex | Usage |
|-------|-----|-------|
| `border` | `#DDD7CE` | Default hairline — card edges, dividers |
| `border-subtle` | `#E8E2D9` | Softer separation — section dividers |
| `border-strong` | `#C8C0B5` | Emphasized edge — strong dividers |
| `border-rose` | `rgba(196,144,154,0.25)` | Rose-tinted border — badge outlines, hover |
| `border-plum` | `rgba(107,97,120,0.20)` | Plum-tinted border |

### Text

| Token | Value | Usage |
|-------|-------|-------|
| `txt-primary` | `#1A1714` | Main copy — warm near-black |
| `txt-secondary` | `#6B6560` | Secondary labels, descriptions |
| `txt-muted` | `#A09890` | De-emphasized — sublabels, axis ticks |
| `txt-hint` | `#C4BAB0` | Hints, placeholders, empty state |

### Semantic

| Role | Hex | Background | Usage |
|------|-----|------------|-------|
| Success | `#5A8A6A` | `#EEF5F0` | Healthy states, "on track" values |
| Danger | `#C05A48` | `#FBF0EE` | Overdue, error states — warm coral |
| Warning | `#B5803A` | `#FBF3E8` | At-risk, caution — warm amber |

**Note:** Success (green) is intentionally separate from the brand-rose accent. Never use rose for "healthy" states — it carries too much brand weight and creates semantic confusion.

---

## CSS Variables (`app/globals.css`)

`:root` exposes the full palette for non-Tailwind use. Map exactly to Tailwind tokens above:

```css
:root {
  /* Canvas */
  --bg:              #F0EBE3;
  --bg-panel:        #FAF7F4;
  --bg-white:        #FFFFFF;
  --bg-hover:        #E8E2D9;

  /* Sidebar */
  --sidebar-bg:      #1E1B24;

  /* Borders */
  --border:          #DDD7CE;
  --border-subtle:   #E8E2D9;
  --border-strong:   #C8C0B5;

  /* Text */
  --text-1:          #1A1714;
  --text-2:          #6B6560;
  --text-3:          #A09890;
  --text-4:          #C4BAB0;

  /* Primary — dusty rose */
  --rose:            #C4909A;
  --rose-dim:        #F7ECED;
  --rose-mid:        #DDB4BC;
  --rose-deep:       #8C5562;
  --rose-border:     rgba(196,144,154,0.25);

  /* Secondary — warm plum */
  --plum:            #6B6178;
  --plum-dim:        #EDEBF2;
  --plum-mid:        #9B92A8;
  --plum-deep:       #3D3649;
  --plum-border:     rgba(107,97,120,0.20);

  /* Semantic */
  --success:         #5A8A6A;
  --success-bg:      #EEF5F0;
  --danger:          #C05A48;
  --danger-bg:       #FBF0EE;
  --warning:         #B5803A;
  --warning-bg:      #FBF3E8;
}
```

**Body:** `background-color: var(--bg)` · `color: var(--text-1)` · `font-family: var(--font-dm-sans)`.

**Scrollbars (WebKit):** 4px thin track; thumb `var(--border)`, hover `var(--border-strong)`.

### Utility Tag Pills (`@layer utilities`)

| Class | Role |
|-------|------|
| `tag-rose` | Primary rose badge |
| `tag-plum` | Secondary plum badge |
| `tag-green` | Success / healthy |
| `tag-red` | Error / danger |
| `tag-amber` | Warning |
| `tag-muted` | Neutral muted |

---

## Typography

**Two fonts only.** No exceptions.

### Fonts (`app/layout.tsx`)

| Role | Family | Weights | CSS variable | Usage |
|------|--------|---------|--------------|-------|
| Display / KPI | **Fraunces** | 300, 400, 500 (+ italic 300) | `--font-fraunces` | Large KPI values, dashboard greeting, step numerals, editorial empty states |
| UI / body / data | **DM Sans** | 300, 400, 500, 600 | `--font-dm-sans` | Everything else — labels, descriptions, badges, buttons, axis ticks, ticker, data values |

Load both with `opsz` axis enabled and `display: swap`:

```ts
// app/layout.tsx
import { Fraunces, DM_Sans } from 'next/font/google'

const fraunces = Fraunces({
  subsets: ['latin'],
  axes: ['opsz'],
  weight: ['300', '400', '500'],
  style: ['normal', 'italic'],
  variable: '--font-fraunces',
  display: 'swap',
})

const dmSans = DM_Sans({
  subsets: ['latin'],
  axes: ['opsz'],
  weight: ['300', '400', '500', '600'],
  variable: '--font-dm-sans',
  display: 'swap',
})
```

Tailwind `fontFamily`:
- `font-sans` → `var(--font-dm-sans), sans-serif`
- `font-display` → `var(--font-fraunces), serif`

### When to Use Each Font

| Context | Font | Notes |
|---------|------|-------|
| Dashboard greeting | Fraunces 300 italic | e.g. *Good afternoon, Maya* — italic name in rose-deep |
| KPI metric values | Fraunces 400 | 36px, letter-spacing -0.03em |
| "On track" / text KPI | Fraunces 300 italic | In success green |
| Step numerals (01, 02…) | Fraunces 300 | 28px, used as decorative anchors in onboarding cards |
| Empty state copy | Fraunces 300 italic | Warm, editorial voice in txt-hint |
| All other UI | DM Sans | Labels, descriptions, buttons, nav |
| Data / financial figures | DM Sans + `font-variant-numeric: tabular-nums` | Keeps columns aligned without needing monospace |
| Uppercase section labels | DM Sans 600, 9px, 0.10em tracking | e.g. "REVENUE TREND", "BUSINESS PULSE" |
| Logo mark "S" in sidebar | Fraunces 500 | White on rose→plum gradient |

### Scale & Rhythm

- Base size **13px**, line heights: headings **1.0–1.1**, body **1.5**, dense data **1.3**
- Letter spacing: display headings **-0.02 to -0.03em**, labels **0.08–0.10em** (uppercase only)
- Section labels: always uppercase, 9px, 600 weight, 0.10em tracking, `txt-muted` color

---

## Border Radius

| Token | Value | Usage |
|-------|-------|-------|
| `rounded-xl` | `10px` | KPI cards, chart wrappers, onboarding cards |
| `rounded-lg` | `9px` | Nav items |
| `rounded-md` | `8px` | Logo mark, buttons |
| `rounded-sm` | `6px` | Topbar button, small elements |
| `rounded` | `4px` | Badges, pills |
| `rounded-full` | `9999px` | Dots, avatars |

---

## Spacing & Density

- **Rhythm:** tight but breathable — compact padding with deliberate section gaps
- **Base unit:** 4px
- **Scale hint:** `[1, 2, 3, 4, 6, 8, 10, 12, 16, 20, 22, 24]`
- **Section padding:** `20px 24px` (left panel content)
- **Card padding:** `14px 16px`
- **Gap between KPI cards:** `12px`
- **Gap between onboarding cards:** `8px`

---

## Layout Shell

```
┌──────────────────────────────────────────────────────┐
│  Topbar (48px) — page title · date · live · CTA btn  │
├────┬─────────────────────────────────┬───────────────┤
│    │                                 │               │
│ S  │   Left panel (flex: 1)          │  Right panel  │
│ I  │   — Greeting                    │  (240px)      │
│ D  │   — KPI row (3 cards)           │  — Business   │
│ E  │   — Revenue chart               │    Pulse      │
│ B  │   — Onboarding / content        │  — Health     │
│ A  │                                 │    bars       │
│ R  │                                 │  — Activity   │
│    │                                 │  — Actions    │
│54px│                                 │               │
├────┴─────────────────────────────────┴───────────────┤
│  Ticker (34px) — dark band, DM Sans tabular data      │
└──────────────────────────────────────────────────────┘
```

- **Sidebar:** icon rail, **54px** wide, `#1E1B24`, active state = left 3px rose strip + rose-mid icon
- **Topbar:** 48px, `panel` background, border-bottom, page title + date + live dot + `+ Add client` ghost button
- **Left panel:** `flex: 1`, scrollable, holds greeting → KPIs → chart → content
- **Right panel:** 240px fixed, `panel` background, border-left, Business Pulse section (health bars + activity feed + quick actions)
- **Ticker:** 34px, `#1E1B24` (matches sidebar), DM Sans tabular data, rose badge for % deltas

### KPI Cards

Three-column grid, `gap-3`. Each card:
- `surface` background, `border` edge, `rounded-xl`
- 2px top accent strip: **rose** (MRR), **plum-mid** (clients), **success** (deliverables)
- Label: uppercase 9px DM Sans 600 · Value: 36px Fraunces 400 · Footer: badge + sublabel

### Logo Mark

30×30px, `rounded-md`, `linear-gradient(135deg, #C4909A 0%, #6B6178 100%)`, Fraunces 500 white "S".

---

## Component Patterns

### Badges / Pills

```
rose badge:   bg-rose-dim   text-rose-deep   rounded
plum badge:   bg-plum-dim   text-plum-deep   rounded
green badge:  bg-success-bg text-success      rounded
neutral:      bg-surface-hover text-muted    rounded
```

DM Sans 9.5px, 500 weight, `2px 7px` padding.

### Active Nav Item

- Left edge: 3px absolute strip, `#C4909A` (rose), `border-radius: 0 3px 3px 0`
- Icon color: `#DDB4BC` (rose-mid)
- Background: `rgba(221,180,188,0.10)`

### Section Headers

```
REVENUE TREND          ← DM Sans 600, 9px, 0.10em, txt-muted
```
Always paired with right-aligned meta in DM Sans 10px txt-hint, rose-deep for positive delta.

### Onboarding / Step Cards

- `surface` bg, `border` edge, `rounded-xl`, `14px 16px` padding
- Step numeral: Fraunces 300, 28px, `border-strong` color (muted) — first card uses `rose-mid`
- Title: DM Sans 600, 12px · Description: DM Sans 400, 11px, txt-muted
- Arrow `→`: rose, bottom-right — hover shifts card to `rose-dim` background + `rose-border` border

### Business Pulse Panel (Right)

- Header: section label + subtitle
- Health rows: label (DM Sans 500, 10.5px) + value (DM Sans tabular, 10px, txt-muted) + 3px progress track
  - Track fill colors: rose (MRR), success (delivery rate), plum-mid (renewals), border-strong (outstanding)
- Activity feed: 6px dot + text (DM Sans 11px) + timestamp (DM Sans 9px tabular, txt-hint)
- Empty state: Fraunces 300 italic, 13px, txt-hint, centered
- Quick actions: full-width buttons — primary (`rose` bg, white text), ghost (`surface-hover` bg, txt-secondary)

---

## Motion

- **Library:** framer-motion for panels, auth shell, dashboard sections
- **Durations:** 100–300ms for UI interactions, 400–500ms for page-level transitions
- **Easing:** `ease-out` for entrances, `ease-in-out` for transitions
- **Stagger:** 40–60ms between card/panel reveals on load
- **Buttons:** `active:scale-[0.98]`, `transition-all duration-100`
- **Nav items:** `transition: color 0.15s, background 0.15s`
- **No spring bounce on load** — reserve spring for a single hero interaction if needed

---

## Clerk (`appearance` in `app/layout.tsx`)

Themed to warm cream + rose system:

- Card: `panel` background (`#FAF7F4`), `border` edge, no shadow
- Text: `txt-primary` (`#1A1714`)
- Primary / accent: `#C4909A` (rose)
- Primary button: `#C4909A` bg, white text, hover `#8C5562`
- Inputs: `surface-hover` background, `border` edge, rose focus ring
- Social buttons: `surface` fill + `border` edge

---

## Toasts (Sonner)

`position="bottom-right"`, `theme="light"`.

Inline styles: `panel` background (`#FAF7F4`), `txt-primary` text, `border` border (`#DDD7CE`), 13px, 8px radius, `font-family: var(--font-dm-sans)`.

---

## Focus & Accessibility

- Buttons: `focus-visible:ring-1 focus-visible:ring-rose/40`
- **Light theme only** — no dark mode variant
- Minimum contrast: **4.5:1** — verify all rose/plum text on cream backgrounds
- Key pairs to check: `rose-deep` on `rose-dim` ✓, `plum-deep` on `plum-dim` ✓, `txt-muted` on `page` ✓

---

## Changing the Look (Checklist)

1. **Global tokens:** `tailwind.config.ts` → `theme.extend.colors`, `borderRadius`, `fontFamily`
2. **Raw CSS vars:** `app/globals.css` → `:root` block
3. **Fonts:** `app/layout.tsx` → `next/font` import, variable names
4. **Clerk / Sonner:** same file, `clerkAppearance` and `<Toaster toastOptions`
5. **Primitives:** `components/ui/*.tsx` → `cva` variants
6. **Directional doc:** update `design.config.json` when intentionally shifting brand/motion/layout rules

---

**Last updated:** 2026-03-26 — full redesign to Editorial Command theme (warm cream + dusty rose + warm plum). Reference mockup: `severl-premium.html`.