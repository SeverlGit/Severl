# CURSOR_CONTEXT.md

## Project
Severl (SMM OS) — Next.js 14 App Router, TypeScript strict, Clerk v6, Supabase, Resend, Tailwind CSS, Radix UI.
Social media manager operating system for freelancers and agencies.

## Key Files
- `lib/auth-guard.ts` — `requireAuth()`, `requireOrgAccess(orgId)` — called as first line in every server action
- `lib/auth.ts` — `getCurrentOrg()` — resolves org from Clerk session, redirects to /onboarding if none; wrapped in `React.cache()` so layout + pages share one Supabase call per request
- `lib/supabase/server.ts` — `getSupabaseServerClient()` (Clerk JWT, RLS enforced) for reads, `getSupabaseAdminClient()` (service role, bypasses RLS) for writes
- `lib/database.types.ts` — Row types and composite types for all 8 tables
- `lib/vertical-config.tsx` — `VerticalConfigProvider` + `useVerticalConfig()` React context
- `db/schema.sql` — DDL source of truth (8 tables, 5 enums, RLS via auth.jwt()->>'sub')
- `middleware.ts` — Clerk v6 `clerkMiddleware()` route protection
- `instrumentation.ts` — Sentry init for Node.js + Edge runtimes
- `app/layout.tsx` — root metadata (`title`/`description`), `app/icon.png` favicon (App Router convention)

## Auth Pattern
1. `middleware.ts` — `clerkMiddleware()` runs on every request, `auth.protect()` on non-public routes
2. Server components call `getCurrentOrg()` → `auth()` → queries `orgs` by `owner_id`
3. Server actions call `requireOrgAccess(orgId)` as first line → verifies auth AND org ownership → returns `userId`
4. Session client (`getSupabaseServerClient`) uses Clerk JWT via native `accessToken` callback — no JWT template
5. Admin client (`getSupabaseAdminClient`) uses service role key — only called after `requireOrgAccess` or in `getCurrentOrg`

## Database
8 tables: `orgs`, `team_members`, `clients`, `client_notes`, `deliverables`, `invoices`, `invoice_line_items`, `events`
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

## Testing
Vitest: auth guards, client-note tests, batch invoice tests, and related action coverage. Deliverable/team UI remains mostly untested.

## Verticals
Two verticals in `config/verticals/`: `smm_freelance` (solo) and `smm_agency` (team). Vertical resolved at org load, distributed via React context. Agency adds: team management, deliverable assignees, extra deliverable types. **`team_capacity` is configured but `show: false`** in agency analytics (metric not computed yet).

## API Routes (minimal)
- `GET /api/invoices/[id]` — authenticated HTML invoice view (print/save as PDF in browser); Clerk `auth()` + org ownership check
- `GET /api/cron/overdue-invoices` — cron; requires `Authorization: Bearer ${CRON_SECRET}`

All other mutations use Server Actions.

## What's Complete
- Clerk v6 + Supabase native integration (no JWT templates)
- RLS on all tables via `auth.jwt()->>'sub'`
- Auth guards on server actions; type safety via `lib/database.types.ts`
- Dashboard caching with `unstable_cache` + `revalidateTag`
- Dynamic imports with `next/dynamic` on heavy client shells + skeletons (DashboardClient, Client360Client, InvoicesClient, AnalyticsClient, StatusBoard, CloseOutDialog)
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

## Known Gaps (not yet addressed)
- Cron: Vercel cron schedule + `CRON_SECRET` must be set in production for overdue automation
- `markInvoiceSent` / batch flow can send Resend email when client email exists — verify deliverability in prod
- `team_capacity` metric: hidden, not computed (flip `show: true` when logic exists)
- Broader test coverage for deliverables, team, and invoice UI
- ESLint: `next lint` may prompt interactive setup if no eslint config committed

## Infrastructure Status
- Clerk / Supabase / Sentry / Resend: configure per environment via `.env` (see `.env.example`)
- Production deploy (e.g. Vercel): set env vars, `CRON_SECRET`, connect domain as needed

**Last reviewed:** 2026-03-20 — bump with [`architecture-overview.md`](./architecture-overview.md) on release or material changes.
