# Layout Archetypes

Non-generic layout systems organized by aesthetic archetype. Use these as starting points, not templates — adapt them to the project's design config.

---

## Dashboard Layouts

### The Command Center
**Best for:** terminal, industrial, dashboard archetypes
```
┌──────────────────────────────────────────┐
│ ▌ Status Bar (full width, dense, mono)   │
├────┬─────────────────────────────────────┤
│    │  ┌─────────┐ ┌──────────────────┐   │
│ I  │  │ Metric  │ │                  │   │
│ C  │  │  Stack  │ │   Primary View   │   │
│ O  │  │ (narrow)│ │   (wide, tall)   │   │
│ N  │  │         │ │                  │   │
│    │  ├─────────┤ ├──────────────────┤   │
│ R  │  │ Alert   │ │  Data Table /    │   │
│ A  │  │ Feed    │ │  Activity Feed   │   │
│ I  │  │ (live)  │ │  (scrollable)    │   │
│ L  │  └─────────┘ └──────────────────┘   │
├────┴─────────────────────────────────────┤
│ ▌ Ticker / Live Feed (full width)        │
└──────────────────────────────────────────┘
```
**Key traits:** Icon rail not sidebar. Status bar replaces traditional top nav. Metric stack is narrow and vertical. Primary view dominates. Bottom ticker for ambient data.

### The Magazine Spread
**Best for:** editorial, luxury archetypes
```
┌──────────────────────────────────────────┐
│  Heading (oversized, left-aligned)       │
│  Subhead (muted, wide letter-spacing)    │
├──────────────────────┬───────────────────┤
│                      │                   │
│   Hero Metric        │   Sidebar         │
│   (large number,     │   (stacked list,  │
│    minimal label)    │    dense text)     │
│                      │                   │
├──────────┬───────────┴───────────────────┤
│          │                               │
│  Column  │   Feature Content             │
│  (1/3)   │   (2/3 width, editorial       │
│  Notes,  │    layout with pull quotes    │
│  asides  │    and inline data)           │
│          │                               │
└──────────┴───────────────────────────────┘
```
**Key traits:** Asymmetric columns. Oversized headings with contrast. Pull-quote style callouts. Sidebar with dense supporting data. Reading flow, not scanning flow.

### The Data Wall
**Best for:** terminal, dashboard, industrial archetypes
```
┌────┬────┬────┬────┬────┬────┐
│ M1 │ M2 │ M3 │ M4 │ M5 │ M6 │  ← Metric strip (equal width)
├────┴────┴────┴────┴────┴────┤
│ ┌────────────────────────┐  │
│ │    Chart / Timeline     │  │  ← Full-width primary viz
│ │    (wide, short)        │  │
│ └────────────────────────┘  │
├─────────────┬───────────────┤
│  Table A    │   Table B     │  ← Side-by-side data tables
│  (sortable) │   (filterable)│
├─────────────┴───────────────┤
│  Activity Log (full width)  │  ← Bottom feed
└─────────────────────────────┘
```
**Key traits:** Maximum density. Metric strip across top. Data tables dominate. Minimal decoration. Monospace for numbers.

---

## Page Layouts

### The Offset Grid
**Best for:** organic, neo-minimal, editorial archetypes
```
┌──────────────────────────────────────────┐
│                                          │
│     Title (offset left, oversized)       │
│                                          │
│            ┌──────────────────────┐      │
│            │                      │      │
│            │   Content Block 1    │      │
│            │   (offset right)     │      │
│            └──────────────────────┘      │
│                                          │
│  ┌──────────────────┐                    │
│  │                  │                    │
│  │ Content Block 2  │                    │
│  │ (offset left)    │                    │
│  └──────────────────┘                    │
│                                          │
│              ┌────────────────────────┐  │
│              │  Content Block 3       │  │
│              │  (wider, offset right) │  │
│              └────────────────────────┘  │
└──────────────────────────────────────────┘
```
**Key traits:** Content blocks alternate sides. No strict grid. Generous whitespace between blocks. Each block has its own width. Creates a zig-zag reading path.

### The Split Screen
**Best for:** brutalist, luxury, retro archetypes
```
┌─────────────────────┬────────────────────┐
│                     │                    │
│                     │                    │
│   Fixed Panel       │   Scrollable       │
│   (visual,          │   Content          │
│    brand-heavy,     │   (text, data,     │
│    could be image   │    forms — all     │
│    or solid color)  │    interaction     │
│                     │    happens here)   │
│                     │                    │
│                     │                    │
└─────────────────────┴────────────────────┘
```
**Key traits:** Exact 50/50 or 40/60 split. Left panel is atmospheric/brand. Right panel is functional. Left can be sticky while right scrolls. Strong vertical divider.

### The Stacked Sections
**Best for:** editorial, luxury, neo-minimal archetypes
```
┌──────────────────────────────────────────┐
│                                          │
│  Section 1 (full bleed, max impact)      │
│  Large type, single message              │
│                                          │
├──────────────────────────────────────────┤
│                                          │
│  Section 2 (contained width, dense)      │
│  Data grid or feature list               │
│                                          │
├──────────────────────────────────────────┤
│                                          │
│  Section 3 (full bleed, contrasting bg)  │
│  Testimonial or highlight                │
│                                          │
├──────────────────────────────────────────┤
│                                          │
│  Section 4 (contained, asymmetric)       │
│  Two-column with unequal widths          │
│                                          │
└──────────────────────────────────────────┘
```
**Key traits:** Each section is its own world — different widths, backgrounds, densities. Alternating full-bleed and contained. Strong rhythm through contrast.

---

## Component Layouts

### The Metric Card (Non-Generic)

**Instead of:** Icon + number + label in a rounded card

**Try these:**

| Variant | Structure | Best for |
|---------|-----------|----------|
| **Stack** | Large number on top, tiny label below, no border | neo-minimal, luxury |
| **Inline** | Label · Number · Delta — all in one line, monospace | terminal, industrial |
| **Bar** | Full-width strip with label left, number right, thin accent bottom | editorial, dashboard |
| **Contextual** | Number with inline sparkline, no card wrapper | dashboard, terminal |
| **Hero** | One metric huge (48px+), supporting metrics tiny below | editorial, neo-minimal |

### The Data Table (Non-Generic)

| Variant | Traits | Best for |
|---------|--------|----------|
| **Dense mono** | No alternating rows, tight padding, monospace numbers, thin bottom borders only | terminal |
| **Spacious** | No borders at all, generous row height, subtle hover highlight | luxury, neo-minimal |
| **Grouped** | Section headers within table, collapsible groups, indent hierarchy | editorial, dashboard |
| **Card rows** | Each row is a mini-card with rounded corners and gap between | playful, organic |
| **Highlighted** | Status color as left border strip on row, rest minimal | industrial, dashboard |

### The Navigation (Non-Generic)

| Variant | Traits | Best for |
|---------|--------|----------|
| **Icon rail** | 48-64px wide, icons only, tooltip on hover, active dot indicator | dashboard, terminal |
| **Tab bar** | Horizontal tabs, underline active, no sidebar at all | editorial, neo-minimal |
| **Command** | Searchable command palette (cmd+k), minimal persistent nav | terminal, industrial |
| **Breadcrumb** | No fixed nav, breadcrumb trail + back button, context-driven | editorial, luxury |
| **Edge tabs** | Vertical text tabs on the extreme left edge, rotated 90° | brutalist, retro |

### The Form (Non-Generic)

| Variant | Traits | Best for |
|---------|--------|----------|
| **Underline** | Bottom border only, no box, label above or inline | luxury, neo-minimal |
| **Outlined** | Thick border, sharp corners, label as floating overlay | brutalist, editorial |
| **Filled** | Darker background fill, no border, subtle focus glow | terminal, dashboard |
| **Stacked label** | Large label above, input below with generous gap | organic, playful |
| **Inline** | Label and input on same line, colon separator | terminal, industrial |

---

## Responsive Patterns

### Mobile-First Considerations

When generating responsive layouts, avoid the anti-pattern of just stacking everything vertically on mobile. Instead:

| Pattern | Description |
|---------|-------------|
| **Priority collapse** | Show only the most important metric/content on mobile, expand on desktop |
| **Tab → accordion** | Desktop tabs become mobile accordions (same content, different interaction) |
| **Horizontal scroll** | Allow horizontal scroll for data tables and metric strips on mobile |
| **Progressive disclosure** | Show summary on mobile, full detail on desktop — don't just shrink everything |
| **Sticky actions** | Float primary actions to bottom of screen on mobile |

### Breakpoint Behavior

Don't just change column count at breakpoints. Consider:
- Typography scale reduction (not just wrapping)
- Spacing compression (tighter rhythm on mobile)
- Navigation transformation (sidebar → bottom bar, tabs → hamburger)
- Component simplification (charts → numbers, tables → cards)
