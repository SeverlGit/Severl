# Anti-Patterns: The Generic SaaS Defaults

These are the patterns that make AI-generated UIs look identical. Before finalizing ANY output, verify it does not match these. If it does, redesign.

## Typography Anti-Patterns

### AP-T1: The Same Five Fonts
**Avoid:** Inter, Roboto, Open Sans, Lato, Poppins as the ONLY font choice with no personality.
**Why:** These are the top Google Fonts by usage. Every AI defaults to them. They are not bad fonts — they are overused to the point of invisibility.
**Instead:** Consult `typography-pairings.md` for distinctive alternatives. If the project already uses one of these fonts (like Poppins), pair it with something unexpected for headings or use it in a non-default way (unusual weight, tight letter-spacing, all-caps with wide tracking).

### AP-T2: Uniform Text Sizing
**Avoid:** Body 16px, H1 36px, H2 24px, H3 20px — the "safe" scale with no tension.
**Why:** This creates hierarchy without drama. Nothing pulls the eye.
**Instead:** Create contrast. If body is 15px, make H1 48px or larger. Skip sizes to create jumps. Use a mathematical scale (1.333 ratio gives: 15, 20, 27, 36, 48).

### AP-T3: Default Line Heights
**Avoid:** 1.5 line-height everywhere.
**Why:** Headings look floaty at 1.5. Dense data looks wasteful at 1.5.
**Instead:** Headings at 1.0–1.15, body at 1.5–1.6, dense data at 1.3.

## Color Anti-Patterns

### AP-C1: The Blue SaaS Gradient
**Avoid:** Blue-to-purple gradient backgrounds. White cards on light gray. Blue primary buttons.
**Why:** This is the single most common SaaS color scheme. It signals "template."
**Instead:** Commit to an unusual palette. If the project needs blue, use a specific blue (not #3B82F6 / Tailwind blue-500) and pair it with an unexpected accent.

### AP-C2: Equal-Weight Color Distribution
**Avoid:** 3-4 colors used in roughly equal amounts.
**Why:** Creates visual noise. Nothing dominates, nothing recedes.
**Instead:** 60-30-10 rule or more extreme: 80% dominant, 15% secondary, 5% accent. Let one color OWN the interface.

### AP-C3: Generic Semantic Colors
**Avoid:** Green for success, red for danger, yellow for warning, blue for info — with no customization.
**Why:** These defaults are fine functionally but become generic when they're the ONLY color decisions.
**Instead:** Adjust semantic colors to harmonize with the palette. A warm palette might use coral instead of pure red, amber instead of yellow.

### AP-C4: Pure White Cards on Gray Backgrounds
**Avoid:** #FFFFFF cards on #F5F5F5 or #F9FAFB backgrounds.
**Why:** The hallmark of every SaaS dashboard template.
**Instead:** Tinted backgrounds (warm gray, cool slate). Cards with subtle hue. Borderless sections with spacing alone. Or invert it — dark cards on a slightly lighter dark background.

## Layout Anti-Patterns

### AP-L1: The Holy Trinity Layout
**Avoid:** Left sidebar (240px) + top bar + centered content area.
**Why:** Every SaaS dashboard uses this exact layout. It works, but it's invisible.
**Instead:** Consider icon-rail sidebar (56px), top-only nav, edge-to-edge content, asymmetric splits, or collapsible panels. If you must use a sidebar, make it distinctive (width, styling, content approach).

### AP-L2: The 3-Column Feature Grid
**Avoid:** Three equal-width cards in a row with icon + heading + paragraph.
**Why:** The most templated layout in SaaS marketing and dashboards.
**Instead:** Unequal columns (2:1 split, 1:2:1). Overlapping cards. Horizontal scroll. Stacked full-width blocks. Asymmetric grid.

### AP-L3: Centered Everything
**Avoid:** Every section centered, max-width 1200px, symmetric padding.
**Why:** Safe but forgettable.
**Instead:** Left-aligned sections with right-side accents. Edge-bleeding elements. Varied max-widths per section. Intentional asymmetry.

### AP-L4: Uniform Card Heights
**Avoid:** Grid of cards all exactly the same height with the same internal structure.
**Why:** Creates monotonous rhythm.
**Instead:** Mixed card sizes (featured + standard). Varying content density. Cards that grow to fit content. Masonry-style stagger.

### AP-L5: Predictable Spacing
**Avoid:** 24px gap everywhere. Same padding on every component.
**Why:** Uniform spacing creates uniform boredom.
**Instead:** Rhythmic spacing — alternate tight and generous gaps. Use the spacing scale from the config. Let section importance dictate space.

## Component Anti-Patterns

### AP-K1: The Rounded Rectangle Button
**Avoid:** `border-radius: 8px` pill-ish buttons with centered text and medium font weight.
**Why:** The default button shape in every component library.
**Instead:** Match the project's aesthetic: sharp rectangles for editorial/industrial, subtle 2px radius for minimal, full pills for playful, or custom shapes.

### AP-K2: Cookie-Cutter Cards
**Avoid:** Rounded corners, subtle shadow, white background, padding-6, icon or image on top.
**Why:** This is the Shadcn/Radix default card.
**Instead:** Cards that fit the aesthetic: borderless floating content, heavy-bordered containers, full-bleed image cards, cards with accent strips, translucent cards, or no cards at all (use spatial grouping).

### AP-K3: Generic Data Tables
**Avoid:** Alternating row colors, standard header row, generic borders.
**Why:** Default table styling from every UI library.
**Instead:** Dense monospace tables for terminal aesthetic. Borderless tables with spacing. Color-coded row states. Inline sparklines. Sticky columns with scroll indicators.

### AP-K4: Standard Form Inputs
**Avoid:** Rounded border, gray placeholder, padding-2, focus ring.
**Why:** Every form looks the same.
**Instead:** Underline-only inputs for minimal. Heavy bordered for brutalist. Floating labels for luxury. Custom select dropdowns that match the aesthetic.

### AP-K5: Identical Status Badges
**Avoid:** Small rounded pill with colored background and text: "Active" in green, "Inactive" in gray.
**Why:** Every SaaS uses this exact pattern.
**Instead:** Dot indicators, custom icons, color strips on parent container, animated status indicators, typographic treatment (bold/color text without pill background).

## Animation Anti-Patterns

### AP-A1: FadeIn Everything
**Avoid:** `opacity: 0 → 1` on page load for every element.
**Why:** Overused, looks like a loading state, not a design choice.
**Instead:** Targeted entrance animations. Staggered reveals on specific elements. Slide-from-edge on important content. Or no animation at all — static confidence.

### AP-A2: Hover Scale
**Avoid:** `transform: scale(1.02)` on every hoverable element.
**Why:** The default hover effect. Becomes meaningless when everything does it.
**Instead:** Per-component hover treatments: border color shift, background tint, shadow elevation, underline reveal, icon animation, or just cursor change.

### AP-A3: Spring Bounce on Load
**Avoid:** `spring` physics animation on every component entrance (framer-motion default).
**Why:** Charming once, distracting everywhere.
**Instead:** Reserve spring/bounce for ONE hero element per page. Use `tween` with custom easing for the rest.

## Process Anti-Patterns

### AP-P1: Starting from a Template
**Avoid:** Mentally starting from a Shadcn dashboard template and modifying it.
**Why:** You'll never escape the template's DNA.
**Instead:** Start from the config's aesthetic archetype. What does an "editorial" version of this component look like? Build from that mental image, not from a template.

### AP-P2: Defaulting to Component Libraries
**Avoid:** Reaching for Radix/Shadcn defaults without restyling them.
**Why:** Headless primitives are great for behavior, but their default styling IS the generic look.
**Instead:** Use headless primitives for accessibility and behavior, but style them from scratch using the design config.

### AP-P3: Matching Existing SaaS Products
**Avoid:** "Make it look like Linear/Notion/Stripe."
**Why:** You're copying someone else's design system, not building your own.
**Instead:** Study what makes those products feel good (density, type choices, motion philosophy), extract the principles, and apply them through your own config's lens.
