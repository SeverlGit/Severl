# CURSOR_CONTEXT.md

## Project
Severl (SMM OS) — **Next.js 15** App Router, TypeScript strict (**~5.8**), Clerk v6, Supabase, Resend, Tailwind CSS, Radix UI.
Social media manager operating system for freelancers and agencies.

**Last updated:** 2026-04-10 — reflects phases 1–8 (all plan phases complete).

## Key Files
- `lib/auth-guard.ts` — `requireAuth()`, `requireOrgAccess(orgId)` — called as first line in every server action
- `lib/auth.ts` — `getCurrentOrg()` — resolves org from Clerk session, redirects to /onboarding if none; wrapped in `React.cache()` so layout + pages share one Supabase call per request
- `lib/auth/tier-limits.ts` — `checkClientLimit()`, `checkDeliverableLimit()`, `checkStorageLimit()`, `checkFeatureAccess()`, `checkBrandGuideShareLimit()` — call before creating resources; throws `TierLimitError` when limit reached
- `lib/billing/tier-definitions.ts` — `TIER_LIMITS` record (essential/pro/elite/agency) + `TierLimitError` class. Fields: `clients`, `deliverables`, `storageBytes`, `brandGuideSharesPerMonth` (null = unlimited), `whitelabelApprovals`, `invoicePaymentLinks`, `invoiceCsvExport`, `autoRecurringInvoices`, `analyticsLevel`, `clientPortal`.
- `lib/billing/actions.ts` — `createCheckoutSession()`, `createPortalSession()`, `restorePurchases()`, `updateOrgBranding()`, `getAutoBillingSettings()`, `updateAutoBilling()` — Stripe billing + auto-invoicing server actions
- `lib/billing/plan-context.tsx` — `PlanProvider` + `usePlan()` React context — wraps dashboard layout, exposes `planTier`, `limits`, `atClientLimit`, `canUsePaymentLinks`, `canExportCsv`, `canWhitelabelApprovals`, `canAutoRecurringInvoices`, `canAccessClientPortal`, `hasUnlimitedBrandGuideShares`
- `lib/billing/stripe.ts` — `stripe` singleton (Stripe v21, `STRIPE_SECRET_KEY`)
- `lib/billing/sync-clerk-metadata.ts` — `syncPlanToClerkMetadata()` — patches Clerk user metadata with plan tier after upgrade/webhook
- `lib/billing/sync-stripe-seat.ts` — `syncStripeTeamSeat()` — syncs team seat quantity with Stripe on team member changes
- `lib/prefs-context.tsx` — `UserPrefs` type + `usePrefs()` hook — density, currency, due days, week start, etc. Stored in localStorage under `"severl:prefs"`
- `lib/tour-guides.ts` — `startMainTour()` — driver.js-based onboarding tour; calls `markUIMetaSeen("has_seen_tour")` on close
- `lib/tour-context.tsx` — tour state context
- `lib/onboarding-actions.ts` — `markUIMetaSeen(key)` — marks `orgs.ui_meta` flags (e.g. `has_seen_tour`) in Supabase
- `lib/supabase/server.ts` — `getSupabaseServerClient()` (Clerk JWT, RLS enforced) for reads, `getSupabaseAdminClient()` (service role, bypasses RLS) for writes
- `lib/database.types.ts` — Row types and composite types for all tables (including `BrandAssetRow`, `ClientPortalTokenRow`, `ApprovalRevisionRow`, `BatchApprovalRow`)
- `lib/vertical-config.tsx` — `VerticalConfigProvider` + `useVerticalConfig()` React context
- `db/schema.sql` — DDL source of truth (13 tables, 5 enums). See Schema section below.
- `middleware.ts` — Clerk v6 `clerkMiddleware()`; **`export const config` includes `runtime: 'nodejs'`** (Next.js 15.5+). Public routes: `/api/cron(.*)`, `/api/webhooks/stripe(.*)`, `/brand/(.*)`, `/approve/(.*)`, **`/portal/(.*)`** (client portal).
- `vercel.json` — Cron schedules: `GET /api/cron/overdue-invoices` at 02:00 UTC daily; `GET /api/cron/auto-billing` at 06:00 UTC daily.
- `instrumentation.ts` — Sentry init for Node.js + Edge runtimes

## Auth Pattern
1. `middleware.ts` — `clerkMiddleware()` runs on every request, `auth.protect()` on non-public routes
2. Server components call `getCurrentOrg()` → `auth()` → queries `orgs` by `owner_id`
3. Server actions call `requireOrgAccess(orgId)` as first line → verifies auth AND org ownership → returns `userId`
4. Session client (`getSupabaseServerClient`) uses Clerk JWT via native `accessToken` callback — no JWT template
5. Admin client (`getSupabaseAdminClient`) uses service role key — only called after `requireOrgAccess` or in `getCurrentOrg`

## Next.js 15 Conventions (pages & API)
- **Page props:** `params` and `searchParams` are **`Promise<…>`** in server `page.tsx` files — `await` them before use.
- **Route handlers:** dynamic segments use **`params: Promise<{ id: string }>`** and `await params`.
- **Heavy client shells:** `next/dynamic` with **`ssr: false`** must live in **`"use client"`** modules. Server pages import thin **loader** components: `DashboardClientLoader`, `AnalyticsClientLoader`, `Client360ClientLoader`, `InvoicesClientLoader`, and `DeliverablesDynamic`.

## Database Schema (13 tables)

### orgs
Core fields: `id`, `name`, `vertical`, `owner_id`, `timezone`, `plan_tier`, `stripe_customer_id`, `subscription_status`, `ui_meta jsonb`, `logo_url` (Phase 4C white-label), `auto_billing_enabled boolean default false` (Phase 7), `auto_billing_day int` (Phase 7, 1–28 UTC), `public_token text unique` (Phase 8 portal URL), `created_at`, `updated_at`.

Migrations needed: `ALTER TABLE orgs ADD COLUMN IF NOT EXISTS auto_billing_enabled BOOLEAN NOT NULL DEFAULT false, ADD COLUMN IF NOT EXISTS auto_billing_day INT CHECK (auto_billing_day BETWEEN 1 AND 28), ADD COLUMN IF NOT EXISTS public_token TEXT UNIQUE;`

### clients
Core fields: `id`, `org_id`, `vertical`, `brand_name`, `contact_name`, `contact_email`, `account_manager_id`, `retainer_amount`, `billing_cycle`, `contract_start`, `contract_renewal`, `tag`, `platforms[]`, `vertical_data jsonb`, `brand_guide_token text unique` (Phase 1), `brand_guide_last_viewed_at timestamptz` (Phase 5B), `brand_guide_view_count int default 0` (Phase 5B), `archived_at`, `created_at`, `updated_at`.

### deliverables
Core fields: `id`, `org_id`, `client_id`, `month date` (always first of month), `type`, `title`, `status`, `assignee_id`, `due_date`, `notes`, `approval_token text unique`, `approval_sent_at`, `approval_expires_at` (7-day TTL), `approved_at`, `approval_notes`, `publish_date date` (Phase 3 calendar view), `revision_round int default 0` (Phase 4A), `archived_at`, `created_at`, `updated_at`.

### invoices
Core fields: `id`, `org_id`, `client_id`, `invoice_number`, `invoice_type`, `status`, `total`, `due_date`, `paid_date`, `payment_method`, `billing_month`, `notes`, `vertical`, `stripe_payment_link_url text` (Phase 2), `stripe_payment_link_id text` (Phase 2), `dunning_sent_at timestamptz` (Phase 7), `dunning_stage int default 0` (Phase 7: 0=none, 1=7-day, 2=14-day), `created_at`, `updated_at`.

Migrations needed: `ALTER TABLE invoices ADD COLUMN IF NOT EXISTS dunning_sent_at TIMESTAMPTZ, ADD COLUMN IF NOT EXISTS dunning_stage INT NOT NULL DEFAULT 0;`

### invoice_line_items
`id`, `invoice_id → invoices ON DELETE CASCADE`, `description`, `quantity`, `unit_price`, `total`.

### approval_revisions (Phase 4A)
`id`, `deliverable_id → deliverables ON DELETE CASCADE`, `notes`, `requested_at`, `round`. Records each revision request for paper trail.

### batch_approvals (Phase 4B)
`id`, `org_id`, `client_id`, `token text unique`, `deliverable_ids uuid[]`, `created_at`, `expires_at`. Covers multiple deliverables for one client in a single token.

### brand_assets (Phase 5A)
`id`, `client_id → clients ON DELETE CASCADE`, `org_id`, `name`, `type` (logo/font/image/color_palette/other), `file_url`, `file_size int`, `created_at`. Files in Supabase Storage bucket `brand-assets`, path `[orgId]/[clientId]/[uuid].[ext]`.

### client_portal_tokens (Phase 8)
`id`, `client_id → clients ON DELETE CASCADE`, `org_id`, `token text unique`, `created_at`, `last_accessed_at`, `access_count int default 0`.

Migrations needed: `CREATE TABLE IF NOT EXISTS client_portal_tokens (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE, org_id UUID NOT NULL, token TEXT NOT NULL UNIQUE, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), last_accessed_at TIMESTAMPTZ, access_count INT NOT NULL DEFAULT 0);`

### team_members, client_notes, events
Unchanged from original schema.

## Plan Tiers (lib/billing/tier-definitions.ts)

| Feature | Essential | Pro | Elite | Agency |
|---------|-----------|-----|-------|--------|
| Clients | 5 | 15 | Unlimited | Unlimited |
| Deliverables/mo | 25 | 150 | Unlimited | Unlimited |
| Brand guide shares/mo | 3 | Unlimited | Unlimited | Unlimited |
| Invoice payment links | No | Yes | Yes | Yes |
| Invoice CSV export | No | Yes | Yes | Yes |
| White-label approvals | No | No | Yes | Yes |
| Auto-recurring invoices | No | No | Yes | Yes |
| Analytics level | basic | full | full_forecast | full_forecast |
| Client portal | No | No | No | Yes |

## Caching
3 dashboard functions use `unstable_cache` with 60s TTL and `dashboard-{orgId}` tag:
- `getMRRTrend`, `getClientCountSparkline`, `getUpcomingRenewalsList`
- `getMRRTrend` returns `{ points, currentMonthUsesLiveRetainers }` — current month falls back to live sum of active client retainers when event total is 0
- Invalidated by `revalidateTag('dashboard-{orgId}')` in relevant server actions
- `getCurrentOrg()` is wrapped in `React.cache()` — layout and page share one Supabase call per request

## Error Monitoring
Sentry via `@sentry/nextjs` v8. Init in `instrumentation.ts` (server/edge) and `sentry.client.config.ts` (browser + Replay). `captureException` across all actions and data layers. `global-error.tsx` catches unhandled errors.

## Verticals
Two verticals in `config/verticals/`: `smm_freelance` (solo) and `smm_agency` (team). Vertical resolved at org load, distributed via React context.

## API Routes
- `GET /api/invoices/[id]` — authenticated HTML invoice view (print/PDF)
- `GET /api/cron/overdue-invoices` — marks overdue + runs dunning sequences (Bearer `CRON_SECRET`). Day 7 → `sendInvoiceReminderEmail`; Day 14 → `sendInvoiceOverdueEmail`. Tracks `dunning_stage` per invoice.
- `GET /api/cron/auto-billing` — daily; creates retainer invoices for orgs where `auto_billing_enabled=true AND auto_billing_day = UTC day` (Bearer `CRON_SECRET`).
- `GET /api/brand/[token]/pdf` — print-optimized HTML brand guide (public, no auth). Renders brand fields + assets with inline styles.
- `POST /api/webhooks/stripe` — Stripe webhook handler; verifies `STRIPE_WEBHOOK_SECRET`, updates `orgs.plan_tier`

## Public Routes (no Clerk session required)
- `/brand/[token]` — client-facing brand guide (lookup by `brand_guide_token`). Tracks `brand_guide_view_count` + `brand_guide_last_viewed_at` on every load (fire-and-forget). Shows brand fields + uploaded assets. PDF download links to `/api/brand/[token]/pdf`.
- `/approve/[token]` — single-deliverable approval. 7-day expiry enforced.
- `/approve/batch/[token]` — batch approval page (Phase 4B). Single token covers multiple deliverables for one client.
- `/portal/[org-token]/[client-token]` — client portal (Phase 8, Agency only). Resolved via `orgs.public_token` + `client_portal_tokens.token`. Token lookup enforces org scoping. Tabbed UI: Brand guide, Approvals (with links to `/approve/[token]`), Invoices (with Stripe Pay button), Activity. Overdue invoice alert banner. Indexed as noindex.

## What's Complete (Phases 1–8)

### Phase 1 — Upgrade Trigger Redesign
- `TIER_LIMITS` extended with all feature gates (`brandGuideSharesPerMonth`, `whitelabelApprovals`, `invoicePaymentLinks`, `invoiceCsvExport`, `autoRecurringInvoices`, `analyticsLevel`, `clientPortal`)
- `PlanProvider` / `usePlan()` exposes all capability flags (`canUsePaymentLinks`, `canExportCsv`, etc.)
- `checkFeatureAccess()` + `checkBrandGuideShareLimit()` in `lib/auth/tier-limits.ts`
- `components/shared/UpgradePrompt.tsx` — inline rose-tinted upgrade nudge component
- `BillingClient.tsx` — plan cards updated to reflect new per-tier feature list

### Phase 2 — Invoice Payment Links
- `stripe_payment_link_url` + `stripe_payment_link_id` on `invoices`
- `createPaymentLink(invoiceId, orgId)` in `lib/invoicing/actions.ts` — Pro+ gated; creates Stripe Payment Link, stores URL on invoice
- `exportInvoicesCsv(orgId)` in `lib/invoicing/actions.ts` — Pro+ gated; returns CSV blob
- Invoice HTML template (`/api/invoices/[id]`) includes "Pay with card" button when `stripe_payment_link_url` is set
- `InvoicesClient.tsx` — "Generate payment link" action (Pro+); "Export CSV" button (Pro+)

### Phase 3 — Content Calendar View
- `publish_date date` on `deliverables`
- `CalendarView.tsx` — week-strip calendar grid (Mon–Sun × active clients), deliverable type chips + status dots, month-aware
- `/deliverables?view=calendar` — view toggle (board vs calendar) via URL param; segmented control in topbar
- `DeliverableCard.tsx` + `DeliverableRow.tsx` — optional `publish_date` date picker field
- `getMonthlyDeliverables()` includes `publish_date` in select

### Phase 4 — Approval Workflow v2
- **4A — Revision history:** `approval_revisions` table; `revision_round` on deliverables; `recordApproval` inserts revision row + increments round on `revision_requested`; `DeliverableCard` shows "R1", "R2" badge with tooltip
- **4B — Batch approval:** `batch_approvals` table; `sendBatchApproval()` in `lib/deliverables/batch-approval-actions.ts`; `/approve/batch/[token]` public route; "Send batch for approval" in `StatusBoard.tsx` when multiple in_progress deliverables selected for same client
- **4C — White-label approvals:** `logo_url` on `orgs`; `/approve/[token]` renders org logo/name when `canWhitelabelApprovals`; "Agency branding" section in `SettingsPanel.tsx` (Elite+); `updateOrgBranding()` server action

### Phase 5 — Brand Guide v2
- **5A — Asset uploads:** `brand_assets` table; Supabase Storage bucket `brand-assets`; `uploadBrandAsset(formData)` + `deleteBrandAsset()` in `lib/clients/actions.ts`; `BrandGuideTab.tsx` — asset grid with type selector + upload + delete per card + image previews
- **5B — View tracking:** `brand_guide_view_count` + `brand_guide_last_viewed_at` on `clients`; `trackBrandGuideView(token)` in `lib/clients/getBrandAssets.ts` (fire-and-forget on every brand guide page load); `BrandGuideTab.tsx` shows "last viewed X ago · N views"
- **5C — PDF export:** `GET /api/brand/[token]/pdf` — print-optimized HTML (browser `window.print()`); "Download PDF" button in `BrandGuideTab.tsx` and `/brand/[token]`

### Phase 6 — Analytics v2
- **6A — Capacity metrics:** `getCapacityMetrics(orgId)` — effective $/deliverable per client; capacity table in `AnalyticsClient.tsx` (Client, Retainer, Deliverables/mo, $/item, vs avg)
- **6B — Churn risk scoring:** `getChurnRiskScores(orgId)` in `lib/dashboard/getHomeData.ts` — 4-factor composite 0–100 (renewal proximity, overdue invoice, revision round ≥2, delivery rate); top 5 displayed in `DashboardClient.tsx` BusinessPulse section with color-coded risk dots
- **6C — Revenue forecasting:** `getRevenueForecast(orgId, months, churnScoreMap)` — 3-month projection; at-risk when `churnScore > 60` + renewal in that month; `RevenueForecastPoint[]` rendered as bar chart in `AnalyticsClient.tsx` (Elite+)

### Phase 7 — Auto-Invoicing + Dunning
- **7A — Auto-recurring invoices:** `auto_billing_enabled` + `auto_billing_day` on `orgs`; `GET /api/cron/auto-billing` — runs daily at 06:00 UTC, creates retainer invoices for qualifying orgs, sends `sendInvoiceSentEmail`, fires events; `AutoBillingSection` in `SettingsPanel.tsx` (Elite+ only) with toggle + day picker; `getAutoBillingSettings()` + `updateAutoBilling()` server actions
- **7B — Dunning sequences:** `dunning_sent_at` + `dunning_stage` on `invoices`; `GET /api/cron/overdue-invoices` extended — Day 7: `sendInvoiceReminderEmail` (stage 1); Day 14: `sendInvoiceOverdueEmail` (stage 2, firmer tone); `lib/email/invoice-reminder.ts` + `lib/email/invoice-overdue.ts` via Resend; both include Stripe payment link button if available; `vercel.json` schedules both crons

### Phase 8 — Client Portal
- `client_portal_tokens` table; `public_token` on `orgs` (lazy-generated on first portal share)
- `lib/portal/getPortalData.ts` — `getPortalData(orgToken, clientToken)`: resolves org by `public_token`, client by token scoped to that org, parallel fetches brand assets + pending deliverables + invoices + activity
- `generateClientPortalToken(clientId, orgId)` in `lib/clients/actions.ts` — Agency-gated; lazy-generates `orgs.public_token`; reuses existing token for client if present; returns full portal URL
- `app/portal/[org-token]/[client-token]/` — `page.tsx` (server, notFound on bad tokens) + `layout.tsx` (noindex) + `PortalClient.tsx` (tabbed client UI)
- `PortalClient.tsx` tabs: Brand guide (fields + asset grid/links), Approvals (pending items with Review button → `/approve/[token]`), Invoices (history + Stripe Pay button on overdue/sent), Activity (last 5 events). Overdue invoice alert banner on all tabs.
- "Share portal" button in `Client360Client.tsx` header (Agency+ via `canAccessClientPortal`); copies portal URL to clipboard
- `/portal/(.*)` added to public routes in `middleware.ts`

## Known Gaps / Production Checklist
- **DB migrations not yet run:** All new columns and tables documented in `db/schema.sql` comments must be migrated in Supabase before the corresponding phase works in production. See schema section above for exact SQL.
- **Supabase Storage bucket:** `brand-assets` bucket must exist in Supabase (create via Storage dashboard) before Phase 5 uploads work.
- **Stripe env vars:** `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_PRO/ELITE/AGENCY_BASE`, `NEXT_PUBLIC_APP_URL` must be set in production.
- **`CRON_SECRET`:** Must be set in Vercel environment and match `Authorization: Bearer` header sent by Vercel Cron.
- **Vercel Cron:** `vercel.json` cron schedules are only active on Vercel Hobby/Pro+ plans with cron enabled.
- **Resend deliverability:** Verify domain and from address in Resend dashboard before enabling dunning emails in production.
- `syncStripeTeamSeat` for agency seat billing — verify Stripe product configuration in production.
- `team_capacity` metric: hidden (`show: false`), not computed — flip when logic exists.
- No rate limiting on `recordApproval` — mitigated by 7-day token expiry.
- Phase 8 portal `access_count` increment is tracked via `last_accessed_at` update only (no atomic increment without custom RPC).

## Testing
Vitest: auth guards, client-note tests, batch invoice tests, invoice action tests, tier-limits tests (`lib/auth/tier-limits.test.ts`), Stripe webhook tests (`app/api/webhooks/stripe/route.test.ts`), payment-link tests (`__tests__/actions/payment-link.test.ts`). **75 tests passing.** Deliverable/team UI remains mostly untested.
