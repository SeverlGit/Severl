# CURSOR_CONTEXT.md

## Project
Severl (SMM OS) — **Next.js 15** App Router, TypeScript strict (**~5.8**), Clerk v6, Supabase, Resend, Tailwind CSS, Radix UI.
Social media manager operating system for freelancers and agencies.

## Key Files
- `lib/auth-guard.ts` — `requireAuth()`, `requireOrgAccess(orgId)` — called as first line in every server action
- `lib/auth.ts` — `getCurrentOrg()` — resolves org from Clerk session, redirects to /onboarding if none; wrapped in `React.cache()` so layout + pages share one Supabase call per request
- `lib/auth/tier-limits.ts` — `checkClientLimit()`, `checkDeliverableLimit()`, `checkStorageLimit()` — call before creating resources; throws `TierLimitError` when limit reached
- `lib/billing/tier-definitions.ts` — `TIER_LIMITS` record (essential/pro/elite/agency) + `TierLimitError` class
- `lib/billing/actions.ts` — `createCheckoutSession()`, `createPortalSession()`, `restorePurchases()` — Stripe billing server actions
- `lib/billing/plan-context.tsx` — `PlanProvider` + `usePlan()` React context — wraps dashboard layout, exposes `planTier`, `limits`, `atClientLimit`
- `lib/billing/stripe.ts` — `stripe` singleton (Stripe v21, `STRIPE_SECRET_KEY`)
- `lib/billing/sync-clerk-metadata.ts` — `syncPlanToClerkMetadata()` — patches Clerk user metadata with plan tier after upgrade/webhook
- `lib/billing/sync-stripe-seat.ts` — `syncStripeTeamSeat()` — syncs team seat quantity with Stripe on team member changes
- `lib/prefs-context.tsx` — `UserPrefs` type + `usePrefs()` hook — density, currency, due days, week start, etc. Stored in localStorage under `"severl:prefs"`
- `lib/tour-guides.ts` — `startMainTour()` — driver.js-based onboarding tour; calls `markUIMetaSeen("has_seen_tour")` on close
- `lib/tour-context.tsx` — tour state context
- `lib/onboarding-actions.ts` — `markUIMetaSeen(key)` — marks `orgs.ui_meta` flags (e.g. `has_seen_tour`) in Supabase
- `lib/supabase/server.ts` — `getSupabaseServerClient()` (Clerk JWT, RLS enforced) for reads, `getSupabaseAdminClient()` (service role, bypasses RLS) for writes
- `lib/database.types.ts` — Row types and composite types for all tables
- `lib/vertical-config.tsx` — `VerticalConfigProvider` + `useVerticalConfig()` React context
- `db/schema.sql` — DDL source of truth (tables, enums, RLS via auth.jwt()->>'sub')
- `middleware.ts` — Clerk v6 `clerkMiddleware()`; **`export const config` includes `runtime: 'nodejs'`** (Next.js 15.5+). Public routes include `/api/cron(.*)`, **`/api/webhooks/stripe(.*)`**, **`/brand/(.*)`** (shareable brand guide), and **`/approve/(.*)`** (client approval pages).
- `instrumentation.ts` — Sentry init for Node.js + Edge runtimes
- `app/layout.tsx` — root metadata (`title`/`description`), `app/icon.png` favicon (App Router convention)

## Auth Pattern
1. `middleware.ts` — `clerkMiddleware()` runs on every request, `auth.protect()` on non-public routes
2. Server components call `getCurrentOrg()` → `auth()` → queries `orgs` by `owner_id`
3. Server actions call `requireOrgAccess(orgId)` as first line → verifies auth AND org ownership → returns `userId`
4. Session client (`getSupabaseServerClient`) uses Clerk JWT via native `accessToken` callback — no JWT template
5. Admin client (`getSupabaseAdminClient`) uses service role key — only called after `requireOrgAccess` or in `getCurrentOrg`

## Next.js 15 Conventions (pages & API)
- **Page props:** `params` and `searchParams` are **`Promise<…>`** in server `page.tsx` files — `await` them before use (e.g. `/clients/[id]`, `/clients`, `/deliverables`, `/invoices`).
- **Route handlers:** dynamic segments use **`params: Promise<{ id: string }>`** and `await params` (e.g. `GET /api/invoices/[id]`).
- **Heavy client shells:** `next/dynamic` with **`ssr: false`** must live in **`"use client"`** modules. Server pages import thin **loader** components: `DashboardClientLoader`, `AnalyticsClientLoader`, `Client360ClientLoader`, `InvoicesClientLoader`, and `DeliverablesDynamic` (`StatusBoardDynamic`, `CloseOutDialogDynamic`) under `app/(dashboard)/`. Shell components export explicit `*Props` types where needed.

## Database
8 tables: `orgs`, `team_members`, `clients`, `client_notes`, `deliverables`, `invoices`, `invoice_line_items`, `events`
`orgs` now includes: `plan_tier plan_tier not null default 'essential'`, `stripe_customer_id text`, `subscription_status text not null default 'active'`, `ui_meta jsonb not null default '{}'` (stores `has_seen_tour` and similar one-time flags).
`clients` now includes: `brand_guide_token text unique` — lazily generated share token; NULL until first share. Run migration: `ALTER TABLE clients ADD COLUMN IF NOT EXISTS brand_guide_token TEXT UNIQUE;`
`deliverables` now includes: `approval_token text unique`, `approval_sent_at timestamptz`, `approval_expires_at timestamptz` (7-day TTL), `approved_at timestamptz`, `approval_notes text`. Run migration: `ALTER TABLE deliverables ADD COLUMN IF NOT EXISTS approval_token TEXT UNIQUE, ADD COLUMN IF NOT EXISTS approval_sent_at TIMESTAMPTZ, ADD COLUMN IF NOT EXISTS approval_expires_at TIMESTAMPTZ, ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ, ADD COLUMN IF NOT EXISTS approval_notes TEXT;`
`plan_tier` enum: `essential`, `pro`, `elite`, `agency`. Limits enforced in app layer via `lib/auth/tier-limits.ts`.
All RLS policies use `auth.jwt()->>'sub'` for Clerk user ID. Admin client bypasses RLS; app layer enforces org scoping.

## Caching
3 dashboard functions use `unstable_cache` with 60s TTL and `dashboard-{orgId}` tag:
- `getMRRTrend`, `getClientCountSparkline`, `getUpcomingRenewalsList`
- `getMRRTrend` returns `{ points, currentMonthUsesLiveRetainers }`: historical months from `payment.received` events; **current month** falls back to live sum of active client retainers when event total is 0 (aligns with MRR metric card)
- MRR sparkline on the home dashboard is derived from `getMRRTrend` points
- These use `getSupabaseAdminClient()` (not session client) because cached functions run outside request context
- Invalidated by `revalidateTag('dashboard-{orgId}')` in relevant server actions
- `getCurrentOrg()` is wrapped in `React.cache()` — layout and page share one Supabase call per request

## Error Monitoring
Sentry via `@sentry/nextjs` v8. Init in `instrumentation.ts` (server/edge) and `sentry.client.config.ts` (browser + Replay). `captureException` / `captureMessage` across actions and data layers (including analytics/invoice query failures). `global-error.tsx` catches unhandled errors.

## Verticals
Two verticals in `config/verticals/`: `smm_freelance` (solo) and `smm_agency` (team). Vertical resolved at org load, distributed via React context. Agency adds: team management, deliverable assignees, extra deliverable types. **`team_capacity` is configured but `show: false`** in agency analytics (metric not computed yet).

## API Routes (minimal)
- `GET /api/invoices/[id]` — authenticated HTML invoice view (print/save as PDF in browser); Clerk `auth()` + org ownership check
- `GET /api/cron/overdue-invoices` — cron; requires `Authorization: Bearer ${CRON_SECRET}`
- `POST /api/webhooks/stripe` — Stripe webhook handler; verifies `STRIPE_WEBHOOK_SECRET`, updates `orgs.plan_tier` + `stripe_customer_id`, syncs Clerk metadata

All other mutations use Server Actions.

## Public Routes (no Clerk session required)
- `/brand/[token]` — `app/brand/[token]/page.tsx` — server component; looks up client by `brand_guide_token` via admin client; renders all vertical intake fields read-only. Returns 404 on invalid token.
- `/approve/[token]` — `app/approve/[token]/page.tsx` + `ApproveClient.tsx` — server component loads deliverable by `approval_token`; handles invalid/expired/already-reviewed states. Client component (`ApproveClient`) has Approve / Request Revisions flow with notes textarea and confirmation states. 7-day expiry enforced.

## What's Complete
- Clerk v6 + Supabase native integration (no JWT templates)
- RLS on all tables via `auth.jwt()->>'sub'`
- Auth guards on server actions; type safety via `lib/database.types.ts`
- Dashboard caching with `unstable_cache` + `revalidateTag`
- Client loaders + `next/dynamic` (`ssr: false`) for heavy shells (home, client 360, invoices, analytics, deliverables board/close-out)
- Team member CRUD + `TeamManagementDialog` (agency)
- **Invoices:** `batchCreateRetainerInvoices` + line items; **`createInvoice`** (single draft invoice + line item); invoice list actions (send, paid, void); **`CreateInvoiceDialog`** on `/invoices`
- **`GET /api/invoices/[id]`** — client-facing HTML invoice for print/PDF
- **Analytics:** empty state when no clients/MRR; MRR chart note when current month uses live retainers; agency `team_capacity` hidden from UI
- **Deliverables:** empty states (no clients / empty month); board lists all active+onboarding clients even with zero rows for the month
- **Brand guide:** blur-to-save (no per-keystroke save spam); **Notes:** add-note uses Save button + Cmd/Ctrl+Enter (no blur auto-save)
- **Legal stubs:** `/privacy`, `/terms` (beta copy)
- **Dashboard:** time-of-day greeting with `firstName`
- Cross-route revalidation on mutations (including `/clients/[id]` for notes, archive, etc. where applicable)
- `.gitignore` covers `.env*`, local AI dirs, caches, keys; `.env.example` documents vars including **`CRON_SECRET`**
- **Billing/Stripe:** `/billing` route (`BillingClient`), `createCheckoutSession`, `createPortalSession`, `restorePurchases` server actions; Stripe webhook at `/api/webhooks/stripe`; `plan_tier` + `stripe_customer_id` on `orgs`; `PlanProvider` wraps dashboard layout
- **Plan tiers + limits:** `essential` (5 clients / 25 deliverables), `pro` (10 / 100), `elite` (unlimited), `agency` (unlimited). `checkClientLimit`, `checkDeliverableLimit`, `checkStorageLimit` throw `TierLimitError` on violation.
- **Settings panel:** `SettingsPanel` dialog (density, currency, due days, week start, notifications); user prefs via `usePrefs()` stored in localStorage
- **Tour / onboarding:** `startMainTour()` (driver.js) triggered on first login; `markUIMetaSeen()` records seen flags in `orgs.ui_meta`
- **Navigation progress bar:** `NavigationProgress` — thin top-of-viewport bar on route transitions
- **UserNav:** `UserNav` component (replaces `UserButton` in sidebar) — avatar dropdown with Settings, Billing, Logout
- **Loading states:** `loading.tsx` files for all dashboard routes (`/`, `/clients`, `/clients/[id]`, `/analytics`, `/deliverables`, `/invoices`)
- **New skeletons:** `ClientsSkeleton`, `DeliverablesSkeleton`
- **Verification email:** `lib/email/verification.ts` — Resend-based Clerk custom verification email
- **Shareable brand guide:** `brand_guide_token` column on `clients`; `generateBrandGuideToken` server action in `lib/clients/actions.ts`; public route `/brand/[token]`; "Share with client" button in `BrandGuideTab` with copy + regenerate (AlertDialog confirmation).
- **Client content approval workflow:** `approval_token`, `approval_sent_at`, `approval_expires_at`, `approved_at`, `approval_notes` on `deliverables`; `sendForApproval` in `lib/deliverables/actions.ts` (transitions to `pending_approval`, generates 7-day token, sends Resend email); `recordApproval` in `lib/deliverables/approval-actions.ts` (public, no auth — validates expiry, prevents double-submit, clears token on approved); approval email template in `lib/email/approval.ts`; public route `/approve/[token]`; "Send for Approval" / "Resend" buttons on `DeliverableCard` and `DeliverableRow`; kanban already shows "With client" label for `pending_approval` column.

## Known Gaps (not yet addressed)
- **DB migrations not yet run:** Both `brand_guide_token` on `clients` and the 5 approval columns on `deliverables` must be migrated in Supabase before these features work in production. SQL is documented in `db/schema.sql` comments and in CURSOR_CONTEXT above.
- **Approval email deliverability:** Not yet verified in prod. Test Resend domain verification in staging first.
- `recordApproval` has no rate limiting — mitigated by 7-day token expiry, but consider IP rate limiting in production.
- `syncStripeTeamSeat` for agency seat billing is wired but verify Stripe product configuration in production.
- Cron: Vercel cron schedule + `CRON_SECRET` must be set in production for overdue automation.
- `markInvoiceSent` / batch flow can send Resend email when client email exists — verify deliverability in prod.
- `team_capacity` metric: hidden, not computed (flip `show: true` when logic exists).
- Broader test coverage for deliverables, team, and invoice UI.
- ESLint: migrate off deprecated `next lint` when adopting flat `eslint.config` (Next 16 direction).
- Stripe env vars (`STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_PRO/ELITE/AGENCY_BASE`, `NEXT_PUBLIC_APP_URL`) must be set in production.

## Infrastructure Status
- Clerk / Supabase / Sentry / Resend: configure per environment via `.env` (see `.env.example`)
- Production deploy (e.g. Vercel): set env vars, `CRON_SECRET`, connect domain as needed
- **Stripe:** `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_PRO`, `STRIPE_PRICE_ELITE`, `STRIPE_PRICE_AGENCY_BASE`, `NEXT_PUBLIC_APP_URL`

## Testing
Vitest: auth guards, client-note tests, batch invoice tests, invoice action tests, **tier-limits tests** (`lib/auth/tier-limits.test.ts`), **Stripe webhook tests** (`app/api/webhooks/stripe/route.test.ts`). Deliverable/team UI remains mostly untested.

**Last reviewed:** 2026-04-09 — bump with [`architecture-overview.md`](./architecture-overview.md) on release or material changes.
