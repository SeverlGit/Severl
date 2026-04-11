# Severl — Growth Implementation Plan
**Generated:** 2026-04-10  
**Based on:** CEO Business Model Review (2026-04-10)  
**Status of prior plan:** `implementation-plan-2026-04-09.md` — all phases shipped.  
**Author:** Claude Code (read-only analysis → plan)

---

## Context

Phase 1–3 from the April 9 plan are complete and in production:
- Essential tier limits adjusted (5 clients / 25 deliverables)
- Shareable brand guide (`/brand/[token]`)
- Client content approval workflow (`/approve/[token]`)

This plan addresses the next layer: converting Severl from a peripheral workflow tool into the SMM's primary OS. Two keystone features anchor the plan. Everything else extends what's already built.

---

## Priority Map

| Phase | Feature | Effort (CC+gstack) | Impact | Subscription lever |
|-------|---------|------------|--------|---------------------|
| 1 | Upgrade trigger redesign | ~2 hrs | Critical — affects every tier conversion | Direct |
| 2 | Invoice payment links (Stripe) | ~3 hrs | High — removes a step from billing | Retention |
| 3 | Content calendar view | ~1 day | Critical — daily-use anchor | Retention |
| 4 | Approval workflow v2 | ~4 hrs | High — extends most differentiated feature | Upsell |
| 5 | Brand guide v2 | ~4 hrs | Medium — makes brand guide a real deliverable | Upsell |
| 6 | Analytics v2 | ~4 hrs | High — business-OS positioning | Retention |
| 7 | Auto-invoicing + dunning | ~3 hrs | High — saves time every month | Upsell |
| 8 | Client portal (keystone) | ~1 week | Very high — moat feature | Churn prevention |

---

## Phase 1: Upgrade Trigger Redesign

**Why first:** Revenue impact with minimal code. Currently users upgrade when they hit client count limits — a weak trigger. Feature-based gating creates upgrade moments at maximum perceived value.

**Goal:** Every tier upgrade feels like getting something, not removing a wall.

### New gating model

| Feature | Essential | Pro | Elite | Agency |
|---------|-----------|-----|-------|--------|
| Clients | 5 | 15 | Unlimited | Unlimited |
| Deliverables | 25 | 150 | Unlimited | Unlimited |
| Brand guide sharing | 3 shares/month | Unlimited | Unlimited | Unlimited |
| Approval pages | Severl-branded | Severl-branded | **White-labeled** | White-labeled |
| Invoice payment links | — | Included | Included | Included |
| Invoice CSV export | — | Included | Included | Included |
| Analytics (MRR, delivery rate) | Basic | Full | Full + forecasting | Full + team |
| Auto-recurring invoices | — | — | Included | Included |
| Client portal | — | — | — | Included |
| Team members | — | — | — | Included |

**The rationale per tier:**
- Essential → Pro: unlocks professional client experience (payment links, brand guide shares, invoice export)
- Pro → Elite: unlocks automation (white-label approvals, recurring invoices, full analytics)
- Elite → Agency: unlocks team and client portal

### Changes

**`lib/billing/tier-definitions.ts`** — extend `TIER_LIMITS`:

```ts
export const TIER_LIMITS: Record<PlanTier, {
  clients: number;
  deliverables: number;
  storageBytes: number;
  brandGuideSharesPerMonth: number | null;  // null = unlimited
  whitelabelApprovals: boolean;
  invoicePaymentLinks: boolean;
  invoiceCsvExport: boolean;
  autoRecurringInvoices: boolean;
  analyticsLevel: 'basic' | 'full' | 'full_forecast';
  clientPortal: boolean;
}> = {
  essential: {
    clients: 5, deliverables: 25, storageBytes: 500 * 1024 ** 2,
    brandGuideSharesPerMonth: 3, whitelabelApprovals: false,
    invoicePaymentLinks: false, invoiceCsvExport: false,
    autoRecurringInvoices: false, analyticsLevel: 'basic', clientPortal: false,
  },
  pro: {
    clients: 15, deliverables: 150, storageBytes: 10 * 1024 ** 3,
    brandGuideSharesPerMonth: null, whitelabelApprovals: false,
    invoicePaymentLinks: true, invoiceCsvExport: true,
    autoRecurringInvoices: false, analyticsLevel: 'full', clientPortal: false,
  },
  elite: {
    clients: Infinity, deliverables: Infinity, storageBytes: 100 * 1024 ** 3,
    brandGuideSharesPerMonth: null, whitelabelApprovals: true,
    invoicePaymentLinks: true, invoiceCsvExport: true,
    autoRecurringInvoices: true, analyticsLevel: 'full_forecast', clientPortal: false,
  },
  agency: {
    clients: Infinity, deliverables: Infinity, storageBytes: 500 * 1024 ** 3,
    brandGuideSharesPerMonth: null, whitelabelApprovals: true,
    invoicePaymentLinks: true, invoiceCsvExport: true,
    autoRecurringInvoices: true, analyticsLevel: 'full_forecast', clientPortal: true,
  },
};
```

**`lib/billing/plan-context.tsx`** — expose new fields through `usePlan()` so UI components can gate inline:

```ts
// usePlan() should expose the full limits object, not just planTier + client limits
// Add: canUsePaymentLinks, canExportCsv, canWhitelabelApprovals, etc.
```

**`components/shared/UpgradePrompt.tsx`** — new shared component (create):

```tsx
// Inline upgrade nudge, shown in-context when a gated feature is triggered
// Props: featureName, requiredTier, compact (boolean for icon-only vs full prompt)
// Renders a small rose-tinted banner with "Upgrade to [tier] to unlock [feature]" + CTA
```

**In each gated UI location**, replace hard disabling with this component. Example:
- Brand guide "Share" button: show `<UpgradePrompt featureName="brand guide sharing" requiredTier="pro" />` after 3 shares on Essential
- Approval page settings: show "White-label this page" locked behind `<UpgradePrompt ... requiredTier="elite" />`

**`lib/billing/track-brand-guide-shares.ts`** — new helper (create):
Track monthly brand guide share count per org in `orgs.ui_meta` (e.g. `ui_meta.brand_guide_shares_YYYY_MM: number`). Check against limit in `generateBrandGuideToken`.

### Files touched
- `lib/billing/tier-definitions.ts`
- `lib/billing/plan-context.tsx`
- `lib/auth/tier-limits.ts` — add new check helpers
- `lib/billing/track-brand-guide-shares.ts` — new
- `components/shared/UpgradePrompt.tsx` — new
- `app/(dashboard)/billing/BillingClient.tsx` — update plan copy to reflect new features per tier
- `lib/auth/tier-limits.test.ts` — update + extend tests

---

## Phase 2: Invoice Payment Links

**Why:** SMMs currently send an invoice HTML page, then separately send a payment link (PayPal, Venmo, bank transfer). Stripe Payment Links close this gap: one click generates a payment URL the client follows to pay by card.

**Goal:** Each invoice gets a "Pay with card" button. Clicking it creates a Stripe Payment Link and copies it (or adds it to the invoice email).

### Changes

**`lib/invoicing/actions.ts`** — add `createPaymentLink(invoiceId: string, orgId: string)`:

```ts
import { stripe } from '@/lib/billing/stripe';

export async function createPaymentLink(invoiceId: string, orgId: string) {
  const userId = await requireOrgAccess(orgId);
  // 1. Fetch invoice total from line items
  // 2. Create Stripe Payment Link via stripe.paymentLinks.create()
  //    - line_items: [{ price_data: { currency, unit_amount, product_data }, quantity: 1 }]
  //    - after_completion: { type: 'redirect', redirect: { url: NEXT_PUBLIC_APP_URL } }
  // 3. Store stripe_payment_link_url on invoice row (add column below)
  // 4. Return { url }
}
```

**DB migration:**

```sql
ALTER TABLE invoices
  ADD COLUMN IF NOT EXISTS stripe_payment_link_url TEXT,
  ADD COLUMN IF NOT EXISTS stripe_payment_link_id TEXT;
```

**`GET /api/invoices/[id]`** — update HTML invoice template to include a "Pay with card" button when `stripe_payment_link_url` is set. This button is visible to the client without auth.

**`components/invoices/InvoicesClient.tsx` or `InvoiceRow`** — add "Generate payment link" action to each invoice row (Pro+ only via `usePlan().canUsePaymentLinks`). On click: calls `createPaymentLink`, copies URL to clipboard, toasts "Payment link copied".

**CSV export** — add `exportInvoicesCsv(orgId)` server action (Pro+). Returns CSV of invoices with date, client, amount, status. Hook into a download button in `InvoicesClient.tsx`.

### Files touched
- `db/schema.sql` — add payment link columns to invoices
- `lib/database.types.ts` — update invoices Row type
- `lib/invoicing/actions.ts` — add `createPaymentLink`, `exportInvoicesCsv`
- `app/api/invoices/[id]/route.ts` — add payment button to HTML template
- `components/invoices/InvoicesClient.tsx` — UI for generate link + CSV export
- Vitest: add `createPaymentLink` tests (mock Stripe SDK)

---

## Phase 3: Content Calendar View

**Why:** This is the second keystone. SMMs plan by publish date — Monday's Instagram post, Wednesday's email, Friday's reel. Without a calendar, Severl is not where they start their day. With it, it is.

**The data is already there.** Deliverables have a `month` field and status. What's missing is a date-keyed view.

### Schema addition

Add `publish_date` to deliverables:

```sql
ALTER TABLE deliverables
  ADD COLUMN IF NOT EXISTS publish_date DATE;
```

This is optional on creation (kanban flow is unchanged). Set it when the SMM schedules content for a specific publish date.

### UI

**`components/deliverables/CalendarView.tsx`** — new component (create):

```
Layout: week-strip header (Mon–Sun) + scrollable rows per client

┌─────────┬────────┬────────┬────────┬────────┬────────┬────────┐
│ Client  │  Mon   │  Tue   │  Wed   │  Thu   │  Fri   │  Sat   │
├─────────┼────────┼────────┼────────┼────────┼────────┼────────┤
│ Acme Co │ [Reel] │        │ [Post] │        │        │        │
│ Brand B │        │ [Email]│        │ [Post] │        │        │
└─────────┴────────┴────────┴────────┴────────┴────────┴────────┘
```

Each cell shows deliverable type chip + status color dot. Click to open deliverable detail.

**View toggle** in `app/(dashboard)/deliverables/page.tsx`:
- Add a `view` query param: `?view=board` (default) | `?view=calendar`
- Segmented control in the topbar: "Board / Calendar"
- `MonthNav` stays — calendar shows the selected month

**`components/deliverables/DeliverableCard.tsx`** / `DeliverableRow.tsx` — add `publish_date` date picker (optional field). DM Sans 10px, muted, shows only if set.

**`lib/deliverables/getDeliverableData.ts`** — include `publish_date` in `getMonthlyDeliverables()` select.

### Mobile consideration
Calendar view uses horizontal scroll on narrow viewports. Each day column min-width 80px. The board view remains the default on mobile.

### Files touched
- `db/schema.sql` — add `publish_date` to deliverables
- `lib/database.types.ts` — update deliverables Row type
- `lib/deliverables/getDeliverableData.ts` — include `publish_date`
- `lib/deliverables/actions.ts` — add `publish_date` to create/update mutations
- `components/deliverables/CalendarView.tsx` — new
- `components/deliverables/MonthNav.tsx` — unchanged (reused)
- `components/deliverables/DeliverableCard.tsx` — add publish_date field
- `components/deliverables/DeliverableRow.tsx` — add publish_date field
- `app/(dashboard)/deliverables/page.tsx` — view toggle + pass `view` param
- `app/(dashboard)/deliverables/DeliverablesDynamic.tsx` — lazy-load CalendarView

---

## Phase 4: Approval Workflow v2

**Why:** The approval flow is the most differentiated feature. It shipped with the basics. This phase adds the extensions that turn it from a nice touch into a competitive moat.

### 4A. Revision history

Add `approval_revisions` table to track each revision request:

```sql
CREATE TABLE IF NOT EXISTS approval_revisions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deliverable_id UUID NOT NULL REFERENCES deliverables(id) ON DELETE CASCADE,
  notes       TEXT,
  requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  round       INT NOT NULL DEFAULT 1
);
```

In `recordApproval`: on `revision_requested`, insert a row into `approval_revisions` with the notes and auto-incremented `round` count. This gives the SMM a paper trail.

Surface in `DeliverableCard.tsx`: show "R1", "R2" badge when revision rounds > 0. Tooltip shows all revision notes.

### 4B. Batch approval link

New server action `sendBatchApproval(deliverableIds: string[], orgId: string)`:
- Generates a single token stored in a new `batch_approvals` table
- `/approve/batch/[token]` public route lists all deliverables in the batch
- Client approves or requests revisions per item, or "Approve all" at the top

```sql
CREATE TABLE IF NOT EXISTS batch_approvals (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id       UUID NOT NULL,
  client_id    UUID NOT NULL REFERENCES clients(id),
  token        TEXT NOT NULL UNIQUE,
  deliverable_ids UUID[] NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at   TIMESTAMPTZ NOT NULL
);
```

New button in `StatusBoard.tsx`: "Send batch for approval" when multiple `in_progress` deliverables are selected for the same client.

### 4C. White-label approval pages (Elite+)

When `usePlan().canWhitelabelApprovals` is true, the `/approve/[token]` page:
- Replaces the Severl logo with the SMM's agency name + logo (stored in `orgs.brand_name` and a new `orgs.logo_url`)
- Removes the "Powered by Severl" footer (or makes it subtle for non-Elite)

Changes:
- `db/schema.sql` — add `logo_url TEXT` to `orgs`
- `app/approve/[token]/page.tsx` — fetch org fields alongside deliverable; pass to `ApproveClient`
- `ApproveClient.tsx` — render org logo/name if provided and tier allows
- `components/dashboard/SettingsPanel.tsx` — add "Agency branding" section (logo upload, agency name) visible only to Elite+

### 4D. Approval analytics

New card in `AnalyticsClient.tsx` (Elite+ only):

```
APPROVAL PERFORMANCE
Avg. approval time      2.4 days
Revision rate           18%
Fastest client          Acme Co  (same-day)
Most revisions          Brand B  (3 rounds avg)
```

Data query in `lib/analytics/getAnalyticsData.ts`:
```ts
// getApprovalStats(orgId): avg days between approval_sent_at and approved_at,
// revision count from approval_revisions, per-client breakdown
```

### Files touched
- `db/schema.sql` — new `approval_revisions`, `batch_approvals` tables; `logo_url` on orgs
- `lib/database.types.ts` — new table types
- `lib/deliverables/actions.ts` — update `sendForApproval` to track rounds
- `lib/deliverables/approval-actions.ts` — update `recordApproval` to insert revision row
- `lib/deliverables/batch-approval-actions.ts` — new: `sendBatchApproval`, `recordBatchApproval`
- `app/approve/[token]/page.tsx` + `ApproveClient.tsx` — white-label support
- `app/approve/batch/[token]/page.tsx` — new public route
- `components/deliverables/StatusBoard.tsx` — batch select + batch send button
- `components/deliverables/DeliverableCard.tsx` — revision round badge
- `lib/analytics/getAnalyticsData.ts` — add `getApprovalStats`
- `components/dashboard/SettingsPanel.tsx` — agency branding section

---

## Phase 5: Brand Guide v2

**Why:** The brand guide is currently text fields. A real brand guide has files. Making it a proper client-facing asset document creates a deliverable SMMs can charge for and clients bookmark.

### 5A. Asset uploads

Add `brand_assets` table:

```sql
CREATE TABLE IF NOT EXISTS brand_assets (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id   UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  org_id      UUID NOT NULL,
  name        TEXT NOT NULL,
  type        TEXT NOT NULL,  -- 'logo' | 'font' | 'image' | 'color_palette' | 'other'
  file_url    TEXT NOT NULL,
  file_size   INT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

Use Supabase Storage for files. Bucket: `brand-assets`, private, accessed via signed URLs for internal view, public paths for brand guide shares.

New server action `uploadBrandAsset(file, clientId, orgId, type)` in `lib/clients/actions.ts`.

In `BrandGuideTab.tsx`: add "Assets" section below the intake fields. Drag-drop or file input. Shows uploaded logos, fonts, images in a grid. Delete button per asset.

In `/brand/[token]` public route: fetch and display brand assets alongside text fields.

### 5B. View tracking

Add to `clients`:

```sql
ALTER TABLE clients
  ADD COLUMN IF NOT EXISTS brand_guide_last_viewed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS brand_guide_view_count INT NOT NULL DEFAULT 0;
```

In `/brand/[token]/page.tsx`: on each load, fire an unauthenticated server action `trackBrandGuideView(token)` that increments `brand_guide_view_count` and updates `brand_guide_last_viewed_at`.

Surface in `BrandGuideTab.tsx` header: "Last viewed by client: 3 days ago · 7 total views".

### 5C. PDF export

Route `GET /api/brand/[token]/pdf` — server-rendered PDF of the brand guide. Use `@react-pdf/renderer` or Puppeteer (serverless-chrome). Return as `application/pdf` with `Content-Disposition: attachment`.

Add "Download PDF" button in `BrandGuideTab.tsx` (authenticated, for the SMM) and on the public `/brand/[token]` page.

### Files touched
- `db/schema.sql` — new `brand_assets` table; view tracking columns on clients
- `lib/database.types.ts` — update
- `lib/clients/actions.ts` — add `uploadBrandAsset`, `deleteBrandAsset`, `trackBrandGuideView`
- `app/brand/[token]/page.tsx` — render assets + track view + PDF link
- `app/api/brand/[token]/pdf/route.ts` — new: PDF export route
- `components/clients/BrandGuideTab.tsx` — assets section + view stats + PDF download
- Supabase Storage bucket: `brand-assets`

---

## Phase 6: Analytics v2

**Why:** The analytics page currently shows MRR trend, delivery rate by client, and renewal pipeline. These are lagging indicators. SMMs need leading indicators to make decisions.

### 6A. Effective hourly rate per client

```ts
// lib/analytics/getAnalyticsData.ts
// getCapacityMetrics(orgId):
// For each client: retainer_amount / deliverables_this_month
// = effective $/deliverable. SMMs want this to identify underpriced clients.
```

Display: table sorted by effective rate descending. Columns: Client, Retainer, Deliverables/month, $/deliverable, vs average.

### 6B. Churn risk score

For each active client, compute a score (0–100) from:
- Days until renewal (closer = higher risk)
- Invoice payment speed (overdue = higher risk)
- Approval revision rate (high revision count = higher risk)
- Delivery rate last 30 days (< 80% = higher risk)

Surface in the right panel "Business Pulse" section: replace the raw health bars with a small churn risk list. Top 3 at-risk clients with a score indicator.

```ts
// lib/dashboard/getHomeData.ts — add getChurnRiskScores(orgId)
// Returns: [{ clientId, name, score, topReason }]
```

### 6C. Revenue forecasting

Add to analytics page (Elite+ only):

```
PROJECTED 90-DAY MRR
Month 1  $4,200  (3 renewals)
Month 2  $3,800  (1 renewal at risk)
Month 3  $4,200  →
```

Computed from: current MRR + renewals pipeline (clients whose `contract_end` falls in the window) × renewal probability (based on churn risk score).

```ts
// lib/analytics/getAnalyticsData.ts — add getRevenueForecast(orgId, months: 3)
```

### Files touched
- `lib/analytics/getAnalyticsData.ts` — add `getCapacityMetrics`, `getChurnRiskScores`, `getRevenueForecast`
- `lib/dashboard/getHomeData.ts` — add `getChurnRiskScores`
- `components/dashboard/DashboardClient.tsx` — replace health bars with churn risk list
- `components/dashboard/AnalyticsClient.tsx` — add capacity table + forecast chart

---

## Phase 7: Auto-Invoicing + Dunning

**Why:** The batch invoice tool exists but it's manual. Elite users should be able to set "bill all active clients on the 1st of each month" and not think about it. Dunning (automated overdue follow-ups) removes the awkward money conversation.

### 7A. Auto-recurring invoices (Elite+)

Add `auto_billing_enabled` and `auto_billing_day` to `orgs`:

```sql
ALTER TABLE orgs
  ADD COLUMN IF NOT EXISTS auto_billing_enabled BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS auto_billing_day INT CHECK (auto_billing_day BETWEEN 1 AND 28);
```

Extend `/api/cron/overdue-invoices` (already exists) into a general cron handler, or add `/api/cron/auto-billing`:

```ts
// GET /api/cron/auto-billing — runs daily, requires CRON_SECRET
// 1. Fetch all orgs where auto_billing_enabled=true AND today = auto_billing_day
// 2. For each org: call batchCreateRetainerInvoices (already exists in lib/invoicing/)
// 3. Log results
```

Add toggle in `SettingsPanel.tsx` or `/billing` page: "Auto-generate retainer invoices" + day-of-month picker. Visible to Elite+ only.

### 7B. Overdue dunning sequences

Extend the existing `GET /api/cron/overdue-invoices` cron:

```ts
// Currently: marks invoices as overdue
// Add: 
// - Day 7 overdue: send first reminder email via Resend
// - Day 14 overdue: send second reminder with firmer tone
// - Day 30 overdue: flag client as at-risk in churn risk score
```

New email templates in `lib/email/`:
- `lib/email/invoice-reminder.ts` — 7-day nudge ("Just a quick reminder about your invoice")
- `lib/email/invoice-overdue.ts` — 14-day follow-up (firmer, includes payment link if available)

Add `dunning_sent_at` and `dunning_stage` columns to invoices to track which stage has fired.

### Files touched
- `db/schema.sql` — `auto_billing_enabled`, `auto_billing_day` on orgs; dunning columns on invoices
- `lib/database.types.ts` — update
- `app/api/cron/auto-billing/route.ts` — new cron route
- `app/api/cron/overdue-invoices/route.ts` — extend with dunning logic
- `lib/email/invoice-reminder.ts` — new
- `lib/email/invoice-overdue.ts` — new
- `components/dashboard/SettingsPanel.tsx` — auto-billing toggle (Elite+)
- `vercel.json` — add cron schedule for auto-billing

---

## Phase 8: Client Portal (Keystone Moat Feature)

**Why:** This is the feature that makes SMMs impossible to churn. When their clients are inside Severl — viewing brand guides, approving content, paying invoices — the SMM cannot leave without disrupting their own client relationships.

**Tier:** Agency only.

### Architecture

The client portal is a **separate subdomain or path** from the main app, fully public but token-gated per client.

```
Portal URL options:
A) portal.severl.app/[org-slug]/[client-slug]  — hosted on Severl domain
B) /portal/[org-token]/[client-token]          — path-based, simpler to ship
```

Start with B (path-based). If white-label demand is high, add A later with custom domain support.

Portal sections per client:
1. **Brand guide** — all intake fields + uploaded assets (read-only)
2. **Pending approvals** — deliverables awaiting approval, inline approve/revise
3. **Invoice history** — list of invoices with status + "Pay with card" button where applicable
4. **Recent activity** — last 5 events (deliverable submitted, invoice sent, renewal upcoming)

### New tables

```sql
-- Client portal access tokens (Agency org creates one per client)
CREATE TABLE IF NOT EXISTS client_portal_tokens (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id      UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  org_id         UUID NOT NULL,
  token          TEXT NOT NULL UNIQUE,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_accessed_at TIMESTAMPTZ,
  access_count   INT NOT NULL DEFAULT 0
);
```

### New routes

```
app/portal/
  [org-token]/
    [client-token]/
      page.tsx          — server: load org + client by tokens; 404 on invalid
      layout.tsx        — portal shell (org logo if white-labeled, client name header)
      PortalClient.tsx  — "use client": tabbed interface (Brand / Approvals / Invoices)
```

All portal routes added to `middleware.ts` as public.

### Data access pattern

Portal pages use `getSupabaseAdminClient()` (same as `/brand/[token]` and `/approve/[token]`). Org-scoping is enforced by token lookup — no RLS bypass risk since the token was generated by the org that owns the data.

```ts
// lib/portal/getPortalData.ts
export async function getPortalData(orgToken: string, clientToken: string) {
  const supabase = getSupabaseAdminClient();
  // 1. Resolve org by org_token
  // 2. Resolve client by client_portal_tokens where token = clientToken AND org_id matches
  // 3. Parallel fetch: brand guide, pending deliverables, invoices, recent events
  return { org, client, brandGuide, pendingDeliverables, invoices, activity };
}
```

### Server action: `generateClientPortalToken`

```ts
// lib/clients/actions.ts — add generateClientPortalToken(clientId, orgId)
// Requires Agency tier check
// Inserts into client_portal_tokens, returns portal URL
```

### UI surface

`Client360Client.tsx` — in the client header row, add "Share portal" button (Agency+). 
On click: calls `generateClientPortalToken`, copies portal URL, toasts "Portal link copied".

Also: portal access stats in the client header: "Client last accessed portal: 2 days ago".

### Org token

Orgs need a stable public token (separate from auth) to form the portal URL:

```sql
ALTER TABLE orgs ADD COLUMN IF NOT EXISTS public_token TEXT UNIQUE;
-- Populated on org creation in onboarding-actions.ts
```

### Files touched
- `db/schema.sql` — `client_portal_tokens` table; `public_token` on orgs
- `lib/database.types.ts` — update
- `lib/portal/getPortalData.ts` — new
- `lib/clients/actions.ts` — add `generateClientPortalToken`
- `app/portal/[org-token]/[client-token]/page.tsx` — new public route
- `app/portal/[org-token]/[client-token]/layout.tsx` — new portal shell
- `app/portal/[org-token]/[client-token]/PortalClient.tsx` — new client component
- `components/clients/Client360Client.tsx` — "Share portal" button (Agency+)
- `middleware.ts` — add `/portal/(.*)` to public routes
- `lib/onboarding-actions.ts` — generate `public_token` on org creation

---

## Rollout Order

```
Week 1:  Phase 1 — upgrade trigger redesign (revenue impact, no migrations)
Week 1:  Phase 2 — invoice payment links (2 new columns, Stripe integration)
Week 2:  Phase 3 — content calendar view (1 new column, new UI component)
Week 3:  Phase 4 — approval workflow v2 (2 new tables, batch approval route)
Week 3:  Phase 5 — brand guide v2 (new table, Supabase Storage, PDF route)
Week 4:  Phase 6 — analytics v2 (no new schema, new query logic)
Week 4:  Phase 7 — auto-invoicing + dunning (2 new cron routes, 2 email templates)
Week 5+: Phase 8 — client portal (new tables, new routes, most complex phase)
```

With CC+gstack compressing implementation: phases 1–7 fit in ~2 weeks of focused work. Phase 8 is a full week on its own.

---

## DB Migrations Summary

All migrations must be run in Supabase before deploying the corresponding phase.

| Phase | Migration |
|-------|-----------|
| 2 | `invoices`: `stripe_payment_link_url`, `stripe_payment_link_id` |
| 3 | `deliverables`: `publish_date DATE` |
| 4 | New tables: `approval_revisions`, `batch_approvals`; `orgs`: `logo_url` |
| 5 | New table: `brand_assets`; `clients`: `brand_guide_last_viewed_at`, `brand_guide_view_count` |
| 7 | `orgs`: `auto_billing_enabled`, `auto_billing_day`; `invoices`: `dunning_sent_at`, `dunning_stage` |
| 8 | New table: `client_portal_tokens`; `orgs`: `public_token` |

---

## What This Plan Doesn't Cover (Deliberate Deferrals)

| Feature | Why deferred |
|---------|--------------|
| Social media scheduling (posting to platforms) | OAuth complexity per platform, rate limits, requires separate infra. Build after 200+ paying users request it |
| AI caption / content generation | Useful add-on but not what drives retention or upgrades at this stage |
| Proposal + contract creation | HoneyBook territory. Enter only if win rate for new client intake becomes a stated pain point |
| Referral / affiliate program | Wire after the product loop (approval workflow → client portal) is in place so referred users don't immediately churn |
| Custom domain portals | Phase 2 of the client portal. Implement after Phase 8 validates demand |
| Mobile app | Nice to have. The web app is responsive; native app is a separate investment |

---

## Files Created Net New (across all phases)

```
lib/billing/track-brand-guide-shares.ts
lib/deliverables/batch-approval-actions.ts
lib/analytics/getChurnRisk.ts
lib/portal/getPortalData.ts
lib/email/invoice-reminder.ts
lib/email/invoice-overdue.ts
components/shared/UpgradePrompt.tsx
components/deliverables/CalendarView.tsx
app/api/brand/[token]/pdf/route.ts
app/api/cron/auto-billing/route.ts
app/approve/batch/[token]/page.tsx
app/portal/[org-token]/[client-token]/page.tsx
app/portal/[org-token]/[client-token]/layout.tsx
app/portal/[org-token]/[client-token]/PortalClient.tsx
```

---

## Known Risks

| Risk | Mitigation |
|------|------------|
| Supabase Storage for brand assets requires bucket setup + signed URL policy | Set up bucket before Phase 5 deploy; test with a staging org |
| Stripe Payment Links create a new Stripe object per invoice — cost at scale | Cache `stripe_payment_link_url` on the invoice row; only create once |
| PDF export (brand guide) is compute-heavy in serverless | Use `@react-pdf/renderer` (no headless Chrome) for first version; upgrade if quality is insufficient |
| Batch approval tokens cover multiple deliverables — token compromise exposes all | Token is per-batch per-client per-send. Short expiry (7 days), same as single approval |
| Client portal data scope: org token + client token must both be valid | Token lookup enforces org scoping in `getPortalData`; no cross-org leakage possible |
| Auto-billing cron fires on the right day across timezones | Use UTC midnight; document that `auto_billing_day` is UTC calendar day |
