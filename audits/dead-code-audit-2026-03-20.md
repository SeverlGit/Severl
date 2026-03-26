# Dead Code & Redundancy Audit
**Date:** 2026-03-20
**Tool run:** `npx tsc --noEmit --noUnusedLocals --noUnusedParameters`
**Scope:** `lib/`, `components/`, `config/`, `app/`

---

## CRITICAL

_None. No exports or components found that would cause a runtime crash or render nothing silently due to dead code._

---

## HIGH

Items that increase bundle size, create maintenance confusion, or represent silently missing features.

---

### H1 — Orphaned components: TagBadge, SectionLabel, LoadingRow

| File | Exported As | Import Sites |
|------|------------|--------------|
| `components/shared/TagBadge.tsx` | `TagBadge` | **0** |
| `components/shared/SectionLabel.tsx` | `SectionLabel` | **0** |
| `components/shared/LoadingRow.tsx` | `LoadingRow` | **0** |

All three are exported, fully implemented, and never imported anywhere in the project. They are dead weight — shipped in the bundle if the module graph ever touches them, and a maintenance liability.

**Recommendation:** Delete all three files.

---

### H2 — Dead utility exports

| Location | Symbol | Import Sites |
|----------|--------|--------------|
| `lib/utils.ts:12` | `formatCurrencyPerMonth` | **0** |
| `lib/constants.ts:27` | `TONE_COLORS` | **0** |

`formatCurrencyPerMonth` formats `1000` → `"$1,000/mo"`. `formatCurrency` (which appends nothing) is used everywhere; this variant is not called once. `TONE_COLORS` maps strings to hex colors and is never imported by any component.

**Recommendation:** Delete both.

---

### H3 — `isPending` destructured but UI never reflects it

**Files:** `components/clients/BrandGuideTab.tsx:19`, `components/deliverables/StatusBoard.tsx:106`

Both files call `const [isPending, startTransition] = useTransition()` and use `startTransition` to wrap mutations. `isPending` is destructured but never read. This means:
- No button disabling during the transition
- No spinner/loading indicator
- No prevention of double-submits

This is almost certainly a missing feature rather than intentional: the `startTransition` wrapper without using `isPending` is the skeleton of a pending UI that was never completed.

**Recommendation:** Either wire `isPending` to `disabled={isPending}` on the relevant button/select, or switch to a plain `startTransition` call (not `useTransition`) to document the intent.

---

### H4 — `firstName` and `verticalName` props destructured in DashboardClient but never rendered

**File:** `components/dashboard/DashboardClient.tsx:225,239`

Both props are declared in the type, passed from `app/(dashboard)/page.tsx`, and destructured in the component signature — but are never referenced in the JSX. The dashboard renders no personalized greeting ("Good morning, Matt") and no vertical-specific label. These two props represent a fetch-and-pass chain that produces nothing visible.

```ts
// Props declared:
firstName: string;      // line 71
verticalName: string;   // line 85

// Destructured:
firstName,              // line 225  — never used below
verticalName,           // line 239  — never used below
```

**Recommendation:** Either add the intended greeting/label UI, or remove both from the type and the parent's prop call site.

---

## MEDIUM

Items that work correctly but carry duplication risk or unnecessary noise.

---

### M1 — `DeliverableStatus` type duplicated in StatusPill.tsx

**File:** `components/shared/StatusPill.tsx:9`

```ts
// lib/types.ts (canonical)
export type DeliverableStatus =
  | 'not_started' | 'in_progress' | 'pending_approval' | 'approved' | 'published';

// components/shared/StatusPill.tsx:9 (duplicate)
type DeliverableStatus =
  | "not_started" | "in_progress" | "pending_approval" | "approved" | "published";
```

StatusPill imports `InvoiceStatus` from `lib/types` but defines its own `DeliverableStatus` locally. If a new status is ever added to `lib/types.ts`, StatusPill silently won't handle it — no type error, no visual variant, just a fallback.

**Recommendation:** Replace the local definition with `import type { DeliverableStatus } from "@/lib/types"`.

---

### M2 — Local `type ClientRow` in CloseOutDialog.tsx shadows the database type

**File:** `components/deliverables/CloseOutDialog.tsx:30`

```ts
type ClientRow = {          // local definition, line 30
  id: string;
  brand_name: string;
  retainer_amount: number | null;
};
```

`lib/database.types.ts` exports a `ClientRow` with 15+ fields. The local alias has the same name but a different shape. This creates a name collision: any developer reading an import of `ClientRow` in this file will expect the database type.

**Recommendation:** Rename the local type to `CloseOutClient` (or similar) to prevent confusion. The actual `CloseOutClientItem` type already exists in `lib/database.types.ts` — check if it can be reused directly.

---

### M3 — `verticalConfig` prop declared but unused in CloseOutDialog

**File:** `components/deliverables/CloseOutDialog.tsx:50` (`tsc --noUnusedLocals` flags this)

The prop is destructured from the component signature but never referenced in the component body. It's passed by the parent for no effect.

**Recommendation:** Remove from the props type and the parent call site.

---

### M4 — Unused imports in InvoicesClient.tsx

**File:** `app/(dashboard)/invoices/InvoicesClient.tsx:3,6` (flagged by `tsc --noUnusedLocals`)

```ts
import React, { useState, useTransition, useEffect, useCallback, useOptimistic } from "react";
//                                                              ^^^^^^^^^^^ unused

import Link from "next/link";
// ^^^^ unused
```

`useCallback` and `Link` are imported but have no call sites in the file. A previous refactor likely removed the usage without cleaning up the imports.

**Recommendation:** Remove both unused imports.

---

### M5 — `searchParams` prop declared but never read in AnalyticsPage

**File:** `app/(dashboard)/analytics/page.tsx:21` (flagged by `tsc --noUnusedLocals`)

```ts
export default async function AnalyticsPage({ searchParams }: Props) {
  // searchParams is never accessed in the function body
```

The `Props` type declares `searchParams: { period?: string }` which suggests period filtering was planned (or existed). The function body ignores it.

**Recommendation:** Remove from the type and signature if period filtering is not planned. If it is planned, file a tracking note.

---

### M6 — `Check` imported from lucide-react in dropdown-menu.tsx but unused

**File:** `components/ui/dropdown-menu.tsx:5` (flagged by `tsc --noUnusedLocals`)

```ts
import { Check, ChevronRight, Circle } from "lucide-react";
//       ^^^^^  — never used
```

Shadcn boilerplate import left over. The `DropdownMenuRadioItem` checkmark uses `Circle` instead.

**Recommendation:** Remove `Check` from the import.

---

### M7 — `ClientRow` imported but unused in getHomeData.ts

**File:** `lib/dashboard/getHomeData.ts:6` (flagged by `tsc --noUnusedLocals`)

```ts
import type { ClientRow, DeliverableRow, InvoiceRow } from '@/lib/database.types';
//             ^^^^^^^^^  — never referenced in this file
```

**Recommendation:** Remove `ClientRow` from the import.

---

### M8 — `MRRTrendResult` and `ClientRowBrief` exported but never consumed externally

| Symbol | File | External Import Sites |
|--------|------|-----------------------|
| `MRRTrendResult` | `lib/dashboard/getHomeData.ts:19` | 0 |
| `ClientRowBrief` | `lib/deliverables/getDeliverableData.ts:4` | 0 |

Both types are used only within their own files. Exporting them leaks implementation details without any consumer.

**Recommendation:** Remove `export` from both type declarations.

---

## LOW

Minor cleanup: dead CSS, misleading variable names, console statements.

---

### L1 — `pulse-dot` CSS animation defined but never used

**File:** `app/globals.css`

```css
@keyframes pulse-dot {
  0%, 100% { opacity: 1; }
  50%       { opacity: 0.4; }
}
```

No component in `components/` or `app/` references `pulse-dot` or `animate-[pulse-dot]`.
`drawLine` (also in globals.css) is used in `components/shared/Sparkline.tsx` inline style and is fine.

**Recommendation:** Delete the `pulse-dot` keyframe.

---

### L2 — `--blue` / `--blue-dim` / `--border-blue` / `.tag-blue` are all green

**File:** `app/globals.css`

```css
--blue:         #4ade80;                      /* same as --green */
--blue-dim:     rgba(74,222,128,0.10);        /* same as --green-dim */
--border-blue:  rgba(74,222,128,0.25);        /* same as --border-green */

.tag-blue {
  background: rgba(74,222,128,0.08);          /* same as .tag-green */
  color: #4ade80;
  border: 1px solid rgba(74,222,128,0.18);
}
```

All four "blue" values are identical to their green equivalents. This appears to be a stale renaming — blue was reassigned to green during a theme pass but the variable names were not cleaned up. Additionally, `.tag-blue` is never referenced in any component.

**Recommendation:** Delete `.tag-blue`, `--blue`, `--blue-dim`, `--border-blue`. If a true blue is ever needed, add it then.

---

### L3 — `VerticalSlug` re-exported from config/verticals/index.ts with no consumers on that path

**File:** `config/verticals/index.ts:5`

```ts
export type { VerticalSlug };
```

All import sites for `VerticalSlug` use `from '@/lib/types'`. Nobody imports it from `@/config/verticals`. This re-export is dead.

**Recommendation:** Remove the `export type { VerticalSlug }` line from `config/verticals/index.ts`.

---

### L4 — Console.error calls in data-fetching functions bypass Sentry

**Files:**
- `lib/analytics/getAnalyticsData.ts:39-42`
- `lib/dashboard/getHomeData.ts:57,70`
- `lib/invoicing/getInvoicesData.ts:62-65`

Pattern:
```ts
if (activeRes.error) console.error('[getAnalyticsMetrics] activeRes failed:', activeRes.error.message);
```

These errors are silently swallowed (the function continues and returns partial data). They appear in server logs but are not tracked in Sentry, meaning they won't trigger alerts. The `app/onboarding/actions.ts` and `app/onboarding/page.tsx` have the same pattern.

**Recommendation:** Replace with `Sentry.captureException(activeRes.error, { extra: { context: 'getAnalyticsMetrics' } })` to ensure visibility. Or at minimum, add the query error as Sentry breadcrumbs.

---

## Summary Table

| ID | Severity | File(s) | Issue | Action |
|----|----------|---------|-------|--------|
| H1 | HIGH | `components/shared/TagBadge.tsx`, `SectionLabel.tsx`, `LoadingRow.tsx` | Orphaned — 0 import sites | Delete |
| H2 | HIGH | `lib/utils.ts`, `lib/constants.ts` | `formatCurrencyPerMonth`, `TONE_COLORS` — 0 call sites | Delete |
| H3 | HIGH | `BrandGuideTab.tsx`, `StatusBoard.tsx` | `isPending` unused — no loading UI wired | Wire to `disabled` prop or remove |
| H4 | HIGH | `DashboardClient.tsx` | `firstName`, `verticalName` passed but never rendered | Add UI or remove props |
| M1 | MEDIUM | `StatusPill.tsx` | Local `DeliverableStatus` duplicates `lib/types.ts` | Import from canonical source |
| M2 | MEDIUM | `CloseOutDialog.tsx` | Local `type ClientRow` name-collides with database type | Rename to `CloseOutClient` |
| M3 | MEDIUM | `CloseOutDialog.tsx` | `verticalConfig` prop declared, never used | Remove from type + call site |
| M4 | MEDIUM | `InvoicesClient.tsx` | `useCallback`, `Link` imported, never used | Remove imports |
| M5 | MEDIUM | `analytics/page.tsx` | `searchParams` destructured, never read | Remove or implement |
| M6 | MEDIUM | `dropdown-menu.tsx` | `Check` imported from lucide-react, unused | Remove from import |
| M7 | MEDIUM | `getHomeData.ts` | `ClientRow` imported, unused | Remove from import |
| M8 | MEDIUM | `getHomeData.ts`, `getDeliverableData.ts` | `MRRTrendResult`, `ClientRowBrief` exported, 0 consumers | Remove `export` keyword |
| L1 | LOW | `globals.css` | `pulse-dot` keyframe, never referenced | Delete |
| L2 | LOW | `globals.css` | `--blue`/`.tag-blue` are green aliases, `.tag-blue` unused | Delete |
| L3 | LOW | `config/verticals/index.ts` | `VerticalSlug` re-export, 0 consumers on this path | Remove re-export |
| L4 | LOW | analytics, dashboard, invoicing data files | `console.error` bypasses Sentry | Capture via Sentry |

---

## What Was Checked and Found Clean

- **All server action imports** — every exported function in `lib/clients/actions.ts`, `lib/deliverables/actions.ts`, `lib/invoicing/actions.ts`, `lib/invoicing/batchCreateRetainerInvoices.ts`, `lib/team/actions.ts`, `app/onboarding/actions.ts` has at least one call site.
- **All npm packages** — `framer-motion` (AuthShell, ActivityTimeline, ClientRow, CloseOutDialog), `@dnd-kit/*` (DeliverableCard, StatusBoard), `@radix-ui/react-avatar` (via ClientAvatar → ui/avatar), `@radix-ui/react-icons` (ClientSection chevrons), `@radix-ui/react-separator` (Client360Client) — all actively used.
- **No stale Sheet components** — the only remaining `components/ui/sheet.tsx` usage is `InvoicesClient.tsx` (mark-as-paid flow), which is intentional.
- **No `.bak` / `.old` / `.orig` source files** — only webpack cache files in `.next/`.
- **Data-fetching functions** — no orphaned query functions found. All `getClient360`, `getClientActivity`, `getTeamMembersAll`, `getRevenueByClient`, `getRenewalPipeline`, `getDeliveryRateByClient`, `getBatchBillingClients`, `getInvoiceCountsByStatus`, `getClientsForInvoiceCreation`, `getMonthCloseOutData` have verified call sites in page components.
- **TypeScript clean build** — `npx tsc --noEmit` exits 0 with no errors.
