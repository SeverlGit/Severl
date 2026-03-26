# Design Config Schema

`design.config.json` lives in the project root and defines the design personality for all UI generation.

## Full Schema

```jsonc
{
  // Project identity
  "project": {
    "name": "string — project name",
    "description": "string — one-line description of what this product does",
    "audience": "string — who uses this (e.g. 'SMM freelancers', 'enterprise DevOps teams', 'creative agencies')"
  },

  // Aesthetic direction — the most important section
  "aesthetic": {
    "archetype": "string — primary aesthetic (see Archetype Reference below)",
    "subtype": "string | null — optional refinement (e.g. 'swiss' for editorial, 'retro-crt' for terminal)",
    "mood": ["string[] — 3-5 mood words (e.g. 'precise', 'warm', 'dense', 'confident', 'quiet')"],
    "references": ["string[] — URLs or names of real products/sites that capture the desired feel"],
    "avoid": ["string[] — explicit aesthetics to avoid (e.g. 'corporate blue', 'rounded-everything', 'glassmorphism')"]
  },

  // Color system
  "color": {
    "strategy": "string — color approach (see Color Strategy Reference below)",
    "palette": {
      "background": { "primary": "#hex", "secondary": "#hex", "tertiary": "#hex | null" },
      "foreground": { "primary": "#hex", "secondary": "rgba or #hex", "muted": "rgba or #hex", "hint": "rgba or #hex" },
      "accent": { "primary": "#hex", "secondary": "#hex | null" },
      "semantic": {
        "success": "#hex",
        "warning": "#hex",
        "danger": "#hex",
        "info": "#hex"
      }
    },
    "mode": "dark | light | adaptive",
    "contrast_ratio_minimum": "number — WCAG target (4.5 for AA, 7.0 for AAA)"
  },

  // Typography system
  "typography": {
    "philosophy": "string — describe the typographic intent (e.g. 'sharp editorial clarity', 'warm humanist readability')",
    "display": {
      "family": "string — display/heading font",
      "weights": ["number[] — weights to load (e.g. [500, 700])"],
      "source": "google | local | system — where to load from"
    },
    "body": {
      "family": "string — body text font",
      "weights": ["number[] — weights to load (e.g. [400, 500])"],
      "source": "google | local | system"
    },
    "mono": {
      "family": "string — monospace font (for code, data, labels)",
      "weights": ["number[] — (e.g. [400])"],
      "source": "google | local | system"
    },
    "scale": {
      "base_size": "string — base font size (e.g. '16px', '15px', '14px')",
      "ratio": "number — type scale ratio (e.g. 1.25 for major third, 1.333 for perfect fourth)",
      "line_height": {
        "tight": "number — for headings (e.g. 1.1)",
        "normal": "number — for body (e.g. 1.5)",
        "relaxed": "number — for captions/small text (e.g. 1.7)"
      }
    },
    "letter_spacing": {
      "headings": "string — (e.g. '-0.02em', '0.05em')",
      "body": "string — (e.g. '0', '0.01em')",
      "labels": "string — (e.g. '0.05em', '0.1em')"
    }
  },

  // Spacing and layout
  "spacing": {
    "rhythm": "tight | balanced | generous | asymmetric",
    "base_unit": "number — base spacing unit in px (e.g. 4, 8)",
    "scale": ["number[] — spacing scale multipliers (e.g. [1, 2, 3, 4, 6, 8, 12, 16, 24])"],
    "section_gap": "string — gap between major page sections (e.g. '64px', '96px')",
    "component_padding": {
      "compact": "string — for dense components (e.g. '8px 12px')",
      "default": "string — standard padding (e.g. '16px 20px')",
      "spacious": "string — for hero/feature sections (e.g. '32px 40px')"
    }
  },

  // Component behavior
  "components": {
    "density": "compact | default | spacious",
    "border_radius": {
      "none": "0",
      "sm": "string — (e.g. '2px', '4px')",
      "md": "string — (e.g. '6px', '8px')",
      "lg": "string — (e.g. '12px', '16px')",
      "full": "9999px"
    },
    "border_treatment": "string — how borders are used (e.g. 'subtle 1px borders', 'no borders, use elevation', 'heavy borders as design element')",
    "elevation": {
      "style": "string — shadow approach (e.g. 'none', 'subtle-layered', 'dramatic-drop', 'inner-glow')",
      "levels": {
        "low": "string — CSS box-shadow value",
        "medium": "string",
        "high": "string"
      }
    },
    "interactive_states": {
      "hover": "string — describe hover treatment (e.g. 'subtle background shift', 'border highlight', 'scale + shadow')",
      "active": "string — active/pressed treatment",
      "focus": "string — focus ring treatment",
      "disabled": "string — disabled treatment"
    }
  },

  // Motion and animation
  "motion": {
    "philosophy": "none | subtle | expressive | cinematic",
    "duration": {
      "instant": "string — (e.g. '100ms')",
      "fast": "string — (e.g. '200ms')",
      "normal": "string — (e.g. '300ms')",
      "slow": "string — (e.g. '500ms')"
    },
    "easing": {
      "default": "string — CSS easing (e.g. 'cubic-bezier(0.4, 0, 0.2, 1)')",
      "enter": "string",
      "exit": "string",
      "spring": "string | null — spring config if using framer-motion"
    },
    "page_transitions": "boolean — animate between pages/routes",
    "stagger_children": "boolean — stagger list/grid item entrances"
  },

  // Layout preferences
  "layout": {
    "max_width": "string — content max width (e.g. '1200px', '1440px', 'none')",
    "grid": {
      "type": "string — grid approach (e.g. '12-column', 'fluid', 'asymmetric', 'modular')",
      "gap": "string — default grid gap"
    },
    "sidebar": {
      "style": "string | null — if app has sidebar (e.g. 'icon-rail', 'full-width', 'collapsible', null)",
      "width": "string | null — sidebar width",
      "position": "left | right | null"
    },
    "breakpoints": {
      "sm": "string — (e.g. '640px')",
      "md": "string — (e.g. '768px')",
      "lg": "string — (e.g. '1024px')",
      "xl": "string — (e.g. '1280px')"
    }
  },

  // Framework-specific settings
  "framework": {
    "css": "tailwind | css-modules | styled-components | vanilla",
    "component_library": "string | null — (e.g. 'radix-ui', 'headless-ui', null)",
    "animation_library": "string | null — (e.g. 'framer-motion', 'css-only', null)",
    "icon_set": "string | null — (e.g. 'lucide', 'phosphor', 'heroicons', null)"
  }
}
```

## Archetype Reference

| Archetype | Description | Key Traits |
|-----------|-------------|------------|
| `editorial` | Magazine/newspaper-inspired layouts | Strong typographic hierarchy, column-based layouts, pull quotes, editorial spacing |
| `terminal` | Data-dense, developer/hacker aesthetic | Monospace type, dense grids, status indicators, dark backgrounds, minimal chrome |
| `organic` | Soft, natural, anti-corporate | Rounded forms, warm colors, hand-drawn elements, gentle gradients, breathing space |
| `brutalist` | Raw, unpolished, confrontational | System fonts, exposed structure, harsh contrast, unconventional layouts, anti-design |
| `luxury` | High-end, refined, premium | Thin weights, generous whitespace, muted palettes, serif typography, subtle motion |
| `playful` | Fun, toy-like, energetic | Bold colors, bouncy animations, rounded everything, illustration-heavy, large type |
| `industrial` | Utilitarian, functional, mechanical | Grid-heavy, monochrome, functional typography, exposed metrics, data-forward |
| `retro` | Nostalgic, period-specific | Era-specific palettes, vintage typography, textured backgrounds, period-appropriate patterns |
| `neo-minimal` | Modern minimal but with character | One accent, dramatic whitespace, oversized type, single visual punch per section |
| `dashboard` | Purpose-built for data display | Dense but organized, metric hierarchy, status colors, responsive data grids |

## Color Strategy Reference

| Strategy | Description |
|----------|-------------|
| `monochrome-accent` | Single hue background system + one accent color for CTAs and highlights |
| `analogous-warm` | Warm adjacent colors (reds, oranges, yellows) creating cohesive warmth |
| `analogous-cool` | Cool adjacent colors (blues, teals, purples) for calm precision |
| `high-contrast-duotone` | Two colors, maximum contrast, graphic impact |
| `neutral-semantic` | Neutral base with color ONLY for semantic meaning (status, alerts) |
| `dark-accent` | Very dark backgrounds with a single vivid accent |
| `earth-tones` | Muted naturals — browns, greens, warm grays |
| `neon-dark` | Dark base with neon/vivid accents (cyberpunk-adjacent) |
| `pastel-light` | Soft, desaturated colors on light backgrounds |
| `monochrome-gradient` | Single hue across a wide lightness range |
