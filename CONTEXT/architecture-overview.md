# Architecture Overview — Severl (SMM OS)

**Date:** 2026-03-20 · **Last reviewed:** 2026-03-20
**Auditor:** Claude Code (read-only, all source files read)
**App name:** `severl-smm-os` (`package.json`)
**Purpose:** Social media manager operating system — retainer, deliverable, and invoice management for SMM freelancers and agencies.

---

## 1. Tech Stack

### Framework & Runtime

| Layer | Choice | Version |
|---|---|---|
| Framework | Next.js (App Router) | `^14.2.25` |
| Language | TypeScript (strict) | `^5.4.0` |
| Runtime | Node.js | Inferred from Next.js 14 |
| React | React 18 | `^18.3.0` |

### All Dependencies

| Package | Version | Purpose |
|---|---|---|
| `@clerk/nextjs` | `^6.0.0` | Authentication — session, middleware, server identity, `UserButton` |
| `@supabase/supabase-js` | `^2.48.0` | Postgres DB client (both session-scoped and service-role) |
| `@sentry/nextjs` | `^8.0.0` | Error monitoring — client, server, edge, `global-error.tsx` |
| `resend` | `^3.2.0` | Transactional email (welcome email on org creation) |
| `framer-motion` | `^11.0.0` | Page/component animations (dashboard panels, auth pages) |
| `@dnd-kit/core` | `^6.1.0` | Drag-and-drop base for deliverable kanban |
| `@dnd-kit/sortable` | `^8.0.0` | Sortable extension for kanban columns |
| `@dnd-kit/utilities` | `^3.2.0` | DnD helper utilities |
| `@radix-ui/*` | `^1.x–^2.x` | Headless UI (14 packages: dialog, select, tabs, tooltip, popover, checkbox, dropdown, avatar, separator, slot, progress, alert-dialog, label, icons) |
| `lucide-react` | `^0.577.0` | Icon set (nav icons, action icons) |
| `date-fns` | `^3.3.0` | Date arithmetic — used in deliverable month windowing |
| `sonner` | `^2.0.7` | Toast notifications |
| `clsx` | `^2.1.1` | Conditional class utility |
| `tailwind-merge` | `^3.5.0` | Tailwind class deduplication |
| `class-variance-authority` | `^0.7.1` | Variant-based component styling (ui/ primitives) |
| `tailwindcss-animate` | `^1.0.7` | CSS animation plugin (accordion keyframes) |
| `next` | `^14.2.25` | Framework |
| `react-dom` | `^18.3.0` | React DOM + `useFormState`/`useFormStatus` |

**Dev dependencies:**

| Package | Purpose |
|---|---|
| `vitest ^2.0.0` | Unit test runner |
| `@vitejs/plugin-react ^4.2.0` | React support for Vitest |
| `typescript ^5.4.0` | Type checking |
| `tailwindcss ^3.4.0` | CSS framework |
| `eslint ^8.57.0`, `eslint-config-next 14.2.25` | Linting |
| `@types/node`, `@types/react`, `@types/react-dom` | Type definitions |
| `autoprefixer`, `postcss` | CSS processing |

### CSS / Styling

- **Tailwind CSS v3** with custom dark-mode design system in `tailwind.config.ts`
- **Font:** Poppins (300/400/500) via `next/font/google`, CSS variable `--font-poppins`
- **Semantic colour tokens:**

| Token | Value | Usage |
|---|---|---|
| `page` | `#0a0a0a` | Root background |
| `panel` / `surface` | `#0c0c0c` | Card/panel background |
| `surface-hover` | `#111111` | Interactive hover |
| `border.DEFAULT` | `#1a1a1a` | Standard border |
| `txt.primary` | `#ffffff` | Primary text |
| `txt.secondary` | `rgba(255,255,255,0.60)` | Secondary text |
| `txt.muted` | `rgba(255,255,255,0.35)` | Muted text |
| `txt.hint` | `rgba(255,255,255,0.18)` | Hint text |
| `accent` | `#4ade80` | Green — CTAs, active states |
| `success` | `#4ade80` | Success state |
| `warning` | `#facc15` | Warning state |
| `danger` | `#f87171` | Danger/error state |
| `info` | `#4ade80` | Info state (aligned with accent in this design system) |

- No CSS Modules or SCSS — pure Tailwind utility classes throughout
- Shared Radix-based primitives in `components/ui/` styled with `cva`
- Clerk auth forms inherit custom appearance theme set in `app/layout.tsx`

### Deployment Target

Next.js App Router, server-rendered on demand (all routes are `ƒ` dynamic). Suitable for Vercel or any Node.js host.

### Environment Variables

| Variable | Scope | Purpose |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Public | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public | Supabase anon key (used with Clerk JWT) |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only | Service-role key for admin client |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Public | Clerk frontend key |
| `CLERK_SECRET_KEY` | Server-only | Clerk backend key |
| `NEXT_PUBLIC_CLERK_SIGN_IN_URL` | Public | `/sign-in` |
| `NEXT_PUBLIC_CLERK_SIGN_UP_URL` | Public | `/sign-up` |
| `NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL` | Public | `/` |
| `NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL` | Public | `/onboarding` |
| `RESEND_API_KEY` | Server-only | Resend email API key |
| `RESEND_FROM_EMAIL` | Server-only | From address (defaults to `noreply@severl.app`) |
| `NEXT_PUBLIC_SENTRY_DSN` | Public | Sentry DSN (used client + server + edge) |
| `SENTRY_AUTH_TOKEN` | Server-only | Source map upload to Sentry |
| `CRON_SECRET` | Server-only | Shared secret for `Authorization: Bearer` on `/api/cron/*` (e.g. Vercel Cron) |

---

## 2. Project Structure

```
Business Dashboard/
├── app/
│   ├── layout.tsx                     Root layout — metadata, ClerkProvider, Poppins font, Toaster
│   ├── icon.png                       App icon / favicon (also SeverlLogo in public/)
│   ├── globals.css                    Global styles
│   ├── global-error.tsx               Global error boundary — captures to Sentry
│   ├── privacy/page.tsx               Public stub — Privacy Policy
│   ├── terms/page.tsx                 Public stub — Terms of Service
│   ├── api/
│   │   ├── invoices/[id]/route.ts   GET — HTML invoice (auth + org check; print/PDF)
│   │   └── cron/overdue-invoices/   GET — mark overdue (Bearer CRON_SECRET)
│   ├── (dashboard)/                   Route group — auth-gated dashboard shell
│   │   ├── layout.tsx                 Dashboard layout — getCurrentOrg(), VerticalConfigProvider, LabelNav, Topbar
│   │   ├── page.tsx                   / — Home dashboard (server page + dynamic DashboardClient)
│   │   ├── analytics/
│   │   │   ├── page.tsx               /analytics — server page + AnalyticsClient
│   │   │   └── AnalyticsClient.tsx    Analytics charts client shell
│   │   ├── clients/
│   │   │   ├── page.tsx               /clients — server page, filter/search via searchParams
│   │   │   └── [id]/
│   │   │       ├── page.tsx           /clients/[id] — server page + dynamic Client360Client
│   │   │       └── Client360Client.tsx Client profile shell (6-tab view)
│   │   ├── deliverables/
│   │   │   └── page.tsx               /deliverables — server page, month nav, dual view
│   │   └── invoices/
│   │       ├── page.tsx               /invoices — server page + dynamic InvoicesClient
│   │       └── InvoicesClient.tsx     Invoices list + CreateInvoiceDialog + batch billing
│   ├── onboarding/
│   │   ├── page.tsx                   /onboarding — server guard, redirects if org exists
│   │   ├── OnboardingClient.tsx       2-step onboarding form (business name → vertical)
│   │   └── actions.ts                 createOrg — org creation server action
│   ├── sign-in/[[...sign-in]]/page.tsx  Clerk SignIn component wrapped in AuthShell
│   └── sign-up/[[...sign-up]]/page.tsx  Clerk SignUp component wrapped in AuthShell
├── components/
│   ├── brand/
│   │   ├── AuthShell.tsx              Video-background auth page wrapper
│   │   └── SeverlLogo.tsx             Logo component
│   ├── dashboard/
│   │   ├── DashboardClient.tsx        Main dashboard — 5-panel layout with framer-motion
│   │   ├── LabelNav.tsx               Left sidebar nav — uses UserButton from Clerk
│   │   ├── Topbar.tsx                 Top bar — page title, date, live indicator
│   │   ├── AlertStrip.tsx             Inline alert banner (overdue, at-risk, renewals)
│   │   ├── StatsStrip.tsx             KPI cards strip (MRR, clients, deliverables)
│   │   ├── TickerBar.tsx              Scrolling metric ticker at bottom of dashboard
│   │   ├── PanelHeader.tsx            Reusable panel header with title/value/delta
│   │   ├── PlatformChip.tsx           Platform icon pill
│   │   └── DeliverableStatusPill.tsx  Status colored pill for deliverable status
│   ├── clients/
│   │   ├── AddClientDialog.tsx        Dialog form to create a new client
│   │   ├── EditClientDialog.tsx       Dialog form to edit core client fields
│   │   ├── ClientTable.tsx            Sortable client list table
│   │   ├── ClientRow.tsx              Single row in client table
│   │   ├── ClientSearchInput.tsx      Search input with URL param sync
│   │   ├── ClientTagPill.tsx          Colored tag badge for client lifecycle status
│   │   ├── ActivityTimeline.tsx       Event timeline from events table
│   │   ├── BrandGuideTab.tsx          Vertical-specific brand guide fields editor
│   │   ├── NotesTab.tsx               Client notes list + add/edit/delete
│   │   ├── RenewalCountdown.tsx       Countdown to contract renewal with inline update
│   │   └── TeamManagementDialog.tsx   Team member CRUD dialog (agency only)
│   ├── deliverables/
│   │   ├── StatusBoard.tsx            Kanban board — drag-and-drop across 5 status columns
│   │   ├── ClientSection.tsx          Deliverable list grouped by client
│   │   ├── DeliverableCard.tsx        Kanban card for a deliverable
│   │   ├── DeliverableRow.tsx         Table row for a deliverable
│   │   ├── AddDeliverableRow.tsx      Inline add form for new deliverable
│   │   ├── CloseOutDialog.tsx         Month close-out dialog with per-client completion
│   │   ├── CompletionBar.tsx          Progress bar for deliverable completion
│   │   ├── MonthNav.tsx               Month-picker navigation component
│   │   └── StatusDropdown.tsx         Status change dropdown
│   ├── invoices/
│   │   ├── BatchBillingDialog.tsx     Batch retainer invoice creation dialog
│   │   └── CreateInvoiceDialog.tsx    Single draft invoice (retainer / project / ad_spend)
│   ├── shared/
│   │   ├── AnalyticsSkeleton.tsx      Loading skeleton for analytics page
│   │   ├── DashboardSkeleton.tsx      Loading skeleton for dashboard page
│   │   ├── Client360Skeleton.tsx      Loading skeleton for client profile page
│   │   ├── InvoicesSkeleton.tsx       Loading skeleton for invoices page
│   │   ├── ClientAvatar.tsx           Initials avatar with tag-colored ring
│   │   ├── EmptyState.tsx             Generic empty state component (supports link or ReactNode action)
│   │   ├── Sparkline.tsx              Mini SVG sparkline chart
│   │   ├── StatusPill.tsx             Generic status colored pill
│   │   ├── Tag.tsx                    Semantic tone tag (green/red/amber/muted)
│   └── ui/                            Radix-based primitives (cva-styled)
│       ├── alert-dialog.tsx, avatar.tsx, badge.tsx, button.tsx
│       ├── checkbox.tsx, dropdown-menu.tsx, input.tsx, popover.tsx
│       ├── progress.tsx, select.tsx, separator.tsx, sheet.tsx, dialog.tsx
│       ├── skeleton.tsx, tabs.tsx, textarea.tsx, tooltip.tsx
├── config/
│   └── verticals/
│       ├── index.ts                   getVerticalConfig() — vertical resolver (no type re-exports)
│       ├── smm_freelance.ts           Solo SMM config — labels, fields, types, metrics
│       └── smm_agency.ts              Agency config — extends freelance + team/capacity
├── lib/
│   ├── auth-guard.ts                  requireAuth(), requireOrgAccess()
│   ├── auth.ts                        getCurrentOrg(), OrgRecord type
│   ├── constants.ts                   DELIVERABLE_STATUS_COLORS, DELIVERABLE_STATUS_PCT, INVOICE_STATUS_COLORS
│   ├── database.types.ts              8 row types + composite types
│   ├── types.ts                       VerticalSlug, DeliverableStatus, ClientTag, InvoiceStatus/Type
│   ├── utils.ts                       cn(), formatCurrency(), daysUntil(), renewalUrgency()
│   ├── vertical-config.tsx            VerticalConfigProvider, useVerticalConfig() React context
│   ├── supabase/server.ts             getSupabaseServerClient(), getSupabaseAdminClient()
│   ├── analytics/
│   │   ├── fireEvent.ts               Event insert helper (15 event types)
│   │   └── getAnalyticsData.ts        Analytics data fetching — getAnalyticsMetrics (4 parallel queries; MRR from active clients), getRevenueByClient, getRenewalPipeline, getDeliveryRateByClient
│   ├── clients/
│   │   ├── actions.ts                 10 client mutations
│   │   ├── getClient360.ts            Client profile data (8 fetch functions)
│   │   └── getClientsData.ts          Client list fetch (explicit columns, no vertical_data)
│   ├── dashboard/
│   │   └── getHomeData.ts             Dashboard fetch — getMRRAndActiveCount, getDeliverablesBehind, getAtRiskCount, getOverdueInvoices, getDeliverablesThisWeek, getMRRTrend (points + current-month live fallback flag), getRecentInvoices, getUpcomingRenewalsList, getClientCountSparkline (3 cached); MRR sparkline derived from mrrTrend points; 30-day renewals derived from renewalsList
│   ├── deliverables/
│   │   ├── actions.ts                 6 deliverable mutations + getMonthCloseOutData
│   │   └── getDeliverableData.ts      getMonthlyDeliverables(), computeDeliverableStats()
│   ├── email/
│   │   └── welcome.ts                 Resend welcome email template + send function
│   ├── invoicing/
│   │   ├── actions.ts                 Invoice mutations + createInvoice (draft + line item)
│   │   ├── batchCreateRetainerInvoices.ts  Batch invoice + line item generation
│   │   ├── getBatchBillingData.ts     Active clients eligible for batch billing
│   │   └── getInvoicesData.ts         Invoice list, summary, counts, active clients for manual create
│   └── team/
│       └── actions.ts                 4 team member mutations
├── db/
│   └── schema.sql                     Postgres DDL source of truth (8 tables, 5 enums)
├── __tests__/
│   ├── auth-guard.test.ts             5 tests for requireAuth/requireOrgAccess
│   └── actions/client-note.test.ts    2 tests for createClientNote auth pattern
├── public/
│   ├── SeverlLogo.png                 Logo image
│   └── bg.mp4                         Auth page background video
├── docs/                              Internal planning docs (not served)
├── audits/                            Audit reports
├── middleware.ts                      Clerk route protection
├── instrumentation.ts                 Sentry init for Node.js + Edge runtimes
├── sentry.client.config.ts            Sentry client init (also has replay integration)
├── sentry.server.config.ts            Legacy — superseded by instrumentation.ts ⚠️
├── next.config.mjs                    withSentryConfig() wrapper
├── tailwind.config.ts                 Design system tokens
├── vitest.config.ts                   Test runner config
├── tsconfig.json                      TypeScript (strict mode, @ path alias)
└── .env.example                       Env template (incl. CRON_SECRET, Sentry, Clerk, Supabase, Resend)
```

### Route Inventory

| Route | File | Type | Purpose |
|---|---|---|---|
| `/sign-in` | `app/sign-in/[[...sign-in]]/page.tsx` | Client | Clerk `<SignIn>` in branded `AuthShell` |
| `/sign-up` | `app/sign-up/[[...sign-up]]/page.tsx` | Client | Clerk `<SignUp>` in branded `AuthShell` |
| `/onboarding` | `app/onboarding/page.tsx` | Server | 2-step org creation — redirects if org exists |
| `/` | `app/(dashboard)/page.tsx` | Server + dynamic client | Home dashboard — KPIs, 5 panels, ticker |
| `/analytics` | `app/(dashboard)/analytics/page.tsx` | Server + client | MRR trend, revenue breakdown, delivery rate |
| `/clients` | `app/(dashboard)/clients/page.tsx` | Server | Client roster — filter by tag, full-text search |
| `/clients/[id]` | `app/(dashboard)/clients/[id]/page.tsx` | Server + dynamic client | Client 360 profile — 5–6 tabs |
| `/deliverables` | `app/(dashboard)/deliverables/page.tsx` | Server + dynamic client | Monthly deliverable board — by-client and kanban views |
| `/invoices` | `app/(dashboard)/invoices/page.tsx` | Server + dynamic client | Invoice list, summary strip, create + batch billing |
| `/privacy` | `app/privacy/page.tsx` | Server | Public stub — privacy policy |
| `/terms` | `app/terms/page.tsx` | Server | Public stub — terms of service |

**API routes (non-mutation):** `GET /api/invoices/[id]` returns a printable HTML invoice (auth required). `GET /api/cron/overdue-invoices` is for scheduled overdue updates (Bearer `CRON_SECRET`). **All writes** use Next.js Server Actions.

---

## 3. Authentication Flow

### Middleware (`middleware.ts`)

```ts
const isPublicRoute = createRouteMatcher([
  '/sign-in(.*)', '/sign-up(.*)', '/onboarding(.*)', '/privacy(.*)', '/terms(.*)',
]);

export default clerkMiddleware(async (auth, req) => {
  if (!isPublicRoute(req)) await auth.protect();
});
```

- Uses `clerkMiddleware` (v6, not deprecated `authMiddleware`)
- `auth.protect()` returns 401/redirect for unauthenticated requests to protected routes
- Matcher excludes static assets, images, fonts, and media files
- Middleware bundle: 84.5 kB

### Identity Flow

```
Browser request
  → middleware.ts (clerkMiddleware) — verifies session cookie
  → DashboardLayout (server component)
      → getCurrentOrg() [lib/auth.ts]
          → auth() [Clerk] — extracts userId
          → getSupabaseAdminClient() — queries orgs WHERE owner_id = userId
          → if no org → redirect('/onboarding')
          → returns OrgRecord { id, name, vertical, timezone, ... }
  → Server page component — passes orgId to data fetch functions
  → Server Action (mutation)
      → requireOrgAccess(orgId) [lib/auth-guard.ts]
          → requireAuth() → auth() → userId
          → getSupabaseAdminClient() — SELECT id FROM orgs WHERE id=orgId AND owner_id=userId
          → if null → throw new Error('Forbidden')
          → returns userId (used as author_id in writes)
```

### Supabase Client Configuration

Two distinct clients, never mixed:

```ts
// Session client — reads only, RLS enforced via Clerk JWT
export function getSupabaseServerClient(): SupabaseClient {
  return createClient(url, anonKey, {
    async accessToken() {
      return (await auth()).getToken(); // Clerk native JWKS integration
    },
  });
}

// Admin client — bypasses RLS, only called after requireOrgAccess()
export function getSupabaseAdminClient(): SupabaseClient {
  return createClient(url, serviceKey, {
    auth: { persistSession: false },
  });
}
```

**Pattern rule:** `getSupabaseServerClient()` is used in all read-only data fetch functions. `getSupabaseAdminClient()` is used in all server actions (after `requireOrgAccess`) and in `getCurrentOrg()` / `requireOrgAccess()` itself.

### Vertical Config Context

After org is resolved, `DashboardLayout` wraps children in `VerticalConfigProvider`:

```tsx
<VerticalConfigProvider verticalSlug={org.vertical}>
  {/* All dashboard routes have access to useVerticalConfig() */}
</VerticalConfigProvider>
```

Client components call `useVerticalConfig()` to get labels, sections, and feature flags without prop drilling.

---

## 4. Database Layer

### Enum Types

| Enum | Values |
|---|---|
| `vertical_type` | `smm_freelance`, `smm_agency` |
| `deliverable_status` | `not_started`, `in_progress`, `pending_approval`, `approved`, `published` |
| `client_tag` | `prospect`, `onboarding`, `active`, `at_risk`, `paused`, `churned` |
| `invoice_status` | `draft`, `sent`, `paid`, `overdue`, `voided` |
| `invoice_type` | `retainer`, `project`, `ad_spend` |
| `event_type` | `client.added`, `client.tag_changed`, `client.renewed`, `client.churned`, `deliverable.created`, `deliverable.status_changed`, `deliverable.completed`, `invoice.created`, `invoice.sent`, `invoice.paid`, `invoice.overdue`, `invoice.voided`, `payment.received`, `payment.refunded`, `retainer.batch_sent` |

### Tables

| Table | PK | Key FKs | Purpose |
|---|---|---|---|
| `orgs` | `id uuid` | — | Organization / workspace. One per user. `owner_id` = Clerk userId (text). |
| `team_members` | `id uuid` | `org_id → orgs` | Agency team members. `active` boolean for soft deactivation. |
| `clients` | `id uuid` | `org_id → orgs`, `account_manager_id → team_members` | Brand accounts / clients. `vertical_data jsonb` stores vertical-specific fields. `archived_at` for soft delete. |
| `client_notes` | `id uuid` | `org_id → orgs`, `client_id → clients` | CRM notes on client profiles. `author_id` = Clerk userId. |
| `deliverables` | `id uuid` | `org_id → orgs`, `client_id → clients`, `assignee_id → team_members` | Monthly deliverables. `month` always = first of month. `archived_at` for soft delete. |
| `invoices` | `id uuid` | `org_id → orgs`, `client_id → clients` | Invoice records. Unique `(org_id, invoice_number)`. `billing_month` always = first of month. |
| `invoice_line_items` | `id uuid` | `invoice_id → invoices ON DELETE CASCADE` | Line item breakdown per invoice. Written by `batchCreateRetainerInvoices` and `createInvoice`. |
| `events` | `id uuid` | `org_id → orgs`, `client_id → clients (nullable, SET NULL)` | Append-only analytics event log. `metadata jsonb`. |

### Indexes

| Index | Table | Columns | Type |
|---|---|---|---|
| `idx_orgs_owner_id` | `orgs` | `owner_id` | btree |
| `idx_team_members_org_id` | `team_members` | `org_id` | btree |
| `idx_clients_org_id` | `clients` | `org_id` | btree |
| `idx_clients_org_id_tag` | `clients` | `(org_id, tag)` | btree |
| `idx_clients_org_id_contract_renewal` | `clients` | `(org_id, contract_renewal)` | btree |
| `idx_client_notes_org_id` | `client_notes` | `org_id` | btree |
| `idx_client_notes_client_id` | `client_notes` | `client_id` | btree |
| `idx_deliverables_org_id` | `deliverables` | `org_id` | btree |
| `idx_deliverables_org_client_month` | `deliverables` | `(org_id, client_id, month)` | btree |
| `idx_deliverables_org_status_due` | `deliverables` | `(org_id, status, due_date)` | btree |
| `uq_invoices_org_invoice_number` | `invoices` | `(org_id, invoice_number)` | unique |
| `idx_invoices_org_id` | `invoices` | `org_id` | btree |
| `idx_invoices_org_status_due` | `invoices` | `(org_id, status, due_date)` | btree |
| `idx_invoices_org_billing_month` | `invoices` | `(org_id, billing_month)` | btree |
| `idx_invoice_line_items_invoice_id` | `invoice_line_items` | `invoice_id` | btree |
| `idx_events_org_id` | `events` | `org_id` | btree |
| `idx_events_org_event_type` | `events` | `(org_id, event_type)` | btree |
| `idx_events_org_client_id` | `events` | `(org_id, client_id)` | btree |

### RLS Strategy

RLS is enforced at the Supabase level via `auth.jwt()->>'sub'` (Clerk user ID) for the session client. The admin client (service-role key) bypasses RLS entirely. Application code enforces org-ownership via `requireOrgAccess(orgId)` before every mutation.

The schema notes `-- Application layer must: Scope every Supabase query with .eq('org_id', orgId)` — this is a convention, not enforced by RLS rows. All data fetch functions and actions correctly apply `eq('org_id', orgId)`.

### Data Fetch Functions → Tables

| Function | File | Client Type | Tables | Caching |
|---|---|---|---|---|
| `getCurrentOrg()` | `lib/auth.ts` | Admin | `orgs` | `React.cache()` (request dedup) |
| `requireOrgAccess()` | `lib/auth-guard.ts` | Admin | `orgs` | None |
| `getMRRAndActiveCount()` | `lib/dashboard/getHomeData.ts` | Server | `clients` | None |
| `getDeliverablesBehind()` | `lib/dashboard/getHomeData.ts` | Server | `deliverables` | None |
| `getAtRiskCount()` | `lib/dashboard/getHomeData.ts` | Server | `clients` | None |
| `getOverdueInvoices()` | `lib/dashboard/getHomeData.ts` | Server | `invoices` | None |
| `getDeliverablesThisWeek()` | `lib/dashboard/getHomeData.ts` | Server | `deliverables` + `clients` join | None |
| `getRecentInvoices()` | `lib/dashboard/getHomeData.ts` | Server | `invoices` + `clients` join | None |
| `getMRRTrend()` | `lib/dashboard/getHomeData.ts` | Admin | `events` (+ live client read for current-month fallback) | `unstable_cache` 60s `dashboard-{orgId}` |
| `getUpcomingRenewalsList()` | `lib/dashboard/getHomeData.ts` | Admin | `clients` | `unstable_cache` 60s `dashboard-{orgId}` |
| `getClientCountSparkline()` | `lib/dashboard/getHomeData.ts` | Admin | `events` | `unstable_cache` 60s `dashboard-{orgId}` |
| `getClients()` | `lib/clients/getClientsData.ts` | Server | `clients` + `team_members` join (excludes `vertical_data`) | None |
| `getClient360()` | `lib/clients/getClient360.ts` | Server | `clients` + `team_members` + `invoices` + `deliverables` (explicit columns) | None |
| `getClientActivity()` | `lib/clients/getClient360.ts` | Server | `events` | None |
| `getClientDeliverables()` | `lib/clients/getClient360.ts` | Server | `deliverables` | None |
| `getClientInvoices()` | `lib/clients/getClient360.ts` | Server | `invoices` | None |
| `getClientNotes()` | `lib/clients/getClient360.ts` | Server | `client_notes` | None |
| `getTeamMembers()` | `lib/clients/getClient360.ts` | Server | `team_members` (active only) | None |
| `getTeamMembersAll()` | `lib/clients/getClient360.ts` | Server | `team_members` (all) | None |
| `getTeamMemberDeliverableCount()` | `lib/clients/getClient360.ts` | Server | `deliverables` | None |
| `getMonthlyDeliverables()` | `lib/deliverables/getDeliverableData.ts` | Server | `deliverables` + `clients` + `team_members` | None |
| `getInvoices()` | `lib/invoicing/getInvoicesData.ts` | Server | `invoices` + `clients` join | None |
| `getInvoiceSummary()` | `lib/invoicing/getInvoicesData.ts` | Server | `invoices` + `clients` | None |
| `getInvoiceCountsByStatus()` | `lib/invoicing/getInvoicesData.ts` | Server | `invoices` | None |
| `getClientsForInvoiceCreation()` | `lib/invoicing/getInvoicesData.ts` | Server | `clients` (active) | None |
| `getBatchBillingClients()` | `lib/invoicing/getBatchBillingData.ts` | Server | `clients` + `invoices` (parallel queries) | None |
| `getAnalyticsMetrics()` | `lib/analytics/getAnalyticsData.ts` | Server | `clients` + `deliverables` (4 parallel; MRR from active clients) | None |
| `getRevenueByClient()` | `lib/analytics/getAnalyticsData.ts` | Server | `clients` | None |
| `getRenewalPipeline()` | `lib/analytics/getAnalyticsData.ts` | Server | `clients` | None |
| `getDeliveryRateByClient()` | `lib/analytics/getAnalyticsData.ts` | Server | `deliverables` + `clients` join | None |
| `getMRRTrend()` (analytics page) | `lib/dashboard/getHomeData.ts` | Admin | Same as dashboard | `unstable_cache` 60s |

---

## 5. Server Actions

All server actions follow this contract:
1. Call `requireOrgAccess(params.orgId)` as first statement
2. Use `getSupabaseAdminClient()` for writes
3. Wrap errors with `Sentry.captureException`
4. Call `revalidatePath`/`revalidateTag` to invalidate cache
5. Fire events via `fireEvent()` where relevant

### Client Actions (`lib/clients/actions.ts`)

| Action | Auth Guard | Tables Written | Events Fired | Revalidates |
|---|---|---|---|---|
| `createClient` | `requireOrgAccess` | `clients` | `client.added` | `/clients`, `/`, `/analytics`, `dashboard-{orgId}` |
| `updateClientTag` | `requireOrgAccess` | `clients` | `client.tag_changed` | `/clients`, `/`, `/analytics`, `dashboard-{orgId}` |
| `archiveClient` | `requireOrgAccess` | `clients` (`archived_at`) | None | `/clients`, `/clients/{id}`, `/`, `/analytics` |
| `updateClient` | `requireOrgAccess` | `clients` | None | `/clients`, `/clients/{id}`, `/`, `/analytics`, `dashboard-{orgId}` |
| `updateClientRenewal` | `requireOrgAccess` | `clients` (`contract_renewal`, `tag→active`) | None | `/clients`, `/clients/{id}`, `/` |
| `updateClientBrandGuide` | `requireOrgAccess` | `clients` (`vertical_data` merge) | None | `/clients/{id}` |
| `reassignAccountManager` | `requireOrgAccess` | `clients` (`account_manager_id`) | None | `/clients/{id}`, `/deliverables` |
| `createClientNote` | `requireOrgAccess` (returns `userId`) | `client_notes` | None | `/clients/{id}` |
| `updateClientNote` | `requireOrgAccess` | `client_notes` | None | `/clients`, `/clients/{id}` |
| `deleteClientNote` | `requireOrgAccess` | `client_notes` | None | `/clients/{id}` |

### Deliverable Actions (`lib/deliverables/actions.ts`)

| Action | Auth Guard | Tables Written | Events Fired | Revalidates |
|---|---|---|---|---|
| `updateDeliverableStatus` | `requireOrgAccess` | `deliverables` | `deliverable.status_changed` (+ `deliverable.completed` if published) | `/deliverables`, `/`, `/analytics` |
| `createDeliverable` | `requireOrgAccess` | `deliverables` | `deliverable.created` | `/deliverables`, `/` |
| `deleteDeliverable` | `requireOrgAccess` | `deliverables` (`archived_at`) | None | `/deliverables`, `/` |
| `restoreDeliverable` | `requireOrgAccess` | `deliverables` (`archived_at → null`) | None | `/deliverables` |
| `updateDeliverableAssignee` | `requireOrgAccess` | `deliverables` (`assignee_id`) | None | `/deliverables` |
| `getMonthCloseOutData` | `requireOrgAccess` | None (read) | None | None |

Note: `getMonthCloseOutData` uses the `'use server'` file directive and calls `requireOrgAccess`, but is a data-fetch function, not a mutation. It is called directly from the page component as a server function.

### Invoice Actions (`lib/invoicing/actions.ts`)

| Action | Auth Guard | Tables Written | Events Fired | Revalidates |
|---|---|---|---|---|
| `markInvoicePaid` | `requireOrgAccess` | `invoices` | `invoice.paid`, `payment.received` | `/invoices`, `/`, `/analytics`, `dashboard-{orgId}` |
| `voidInvoice` | `requireOrgAccess` | `invoices` | `invoice.voided` | `/invoices`, `/`, `/analytics` |
| `markInvoiceSent` | `requireOrgAccess` | `invoices` | `invoice.sent` | `/invoices` (+ Resend email when client email exists) |
| `createInvoice` | `requireOrgAccess` | `invoices`, `invoice_line_items` | `invoice.created` | `/invoices`, `/`, `/analytics`, `dashboard-{orgId}` |

### Batch Invoice Action (`lib/invoicing/batchCreateRetainerInvoices.ts`)

| Action | Auth Guard | Tables Written | Events Fired | Revalidates |
|---|---|---|---|---|
| `batchCreateRetainerInvoices` | `requireOrgAccess` | `invoices`, `invoice_line_items` | `invoice.sent` (per invoice), `retainer.batch_sent` | `/invoices`, `/`, `dashboard-{orgId}` |

Invoice numbering: sequential `INV-NNNN` based on last invoice in org. Line item failure is non-fatal (Sentry-logged but not thrown).

### Team Actions (`lib/team/actions.ts`)

| Action | Auth Guard | Tables Written | Revalidates |
|---|---|---|---|
| `createTeamMember` | `requireOrgAccess` | `team_members` | `/clients`, `/deliverables` |
| `updateTeamMember` | `requireOrgAccess` | `team_members` | `/clients`, `/deliverables` |
| `deactivateTeamMember` | `requireOrgAccess` | `team_members` (`active → false`) | `/clients`, `/deliverables` |
| `reactivateTeamMember` | `requireOrgAccess` | `team_members` (`active → true`) | `/clients`, `/deliverables` |

### Onboarding Action (`app/onboarding/actions.ts`)

| Action | Auth | Tables Written | Side Effects |
|---|---|---|---|
| `createOrg` | `auth()` directly | `orgs` | Welcome email via Resend (best-effort, non-fatal) |

Note: `createOrg` uses `auth()` directly (not `requireOrgAccess`) because no org exists yet to verify ownership against. It checks for duplicate org creation before inserting.

### Event System (`lib/analytics/fireEvent.ts`)

```ts
export async function fireEvent({
  orgId, vertical, eventType, amount?, clientId?, metadata?
}) { ... }
```

- Uses `getSupabaseAdminClient()` (service-role) to write to `events`
- 15 event types (see enum above)
- Called from within server actions after the primary mutation succeeds
- Throws on insert failure (not silenced — if `fireEvent` fails, the calling action fails)

---

## 6. Key Business Logic

### Domain Model

```
Org (workspace)
 ├─ vertical: smm_freelance | smm_agency
 ├─ owner_id (Clerk userId — the operator)
 └─ TeamMembers[] (agency only — assigned to clients and deliverables)
     └─ active: boolean (soft deactivation)

Client (brand account)
 ├─ tag: prospect → onboarding → active → at_risk | paused | churned
 ├─ retainer_amount: monthly fee
 ├─ contract_renewal: date (driving renewal pipeline)
 ├─ account_manager_id → TeamMember (agency only)
 ├─ platforms: string[] (social platforms served)
 ├─ vertical_data: jsonb (vertical-specific brand guide fields)
 └─ archived_at: soft delete
     ├─ Deliverables[] (monthly, per client)
     ├─ Invoices[]
     └─ ClientNotes[]

Deliverable
 ├─ month: date (always first of month)
 ├─ status: not_started → in_progress → pending_approval → approved → published
 ├─ assignee_id → TeamMember (agency only)
 └─ archived_at: soft delete

Invoice
 ├─ invoice_type: retainer | project | ad_spend
 ├─ status: draft → sent → paid | overdue | voided
 ├─ billing_month: date (always first of month)
 └─ LineItems[] (written by `batchCreateRetainerInvoices` and `createInvoice`)

Event (append-only analytics log)
 ├─ event_type (15 types)
 ├─ amount (for payment events)
 └─ metadata jsonb
```

### Vertical System

Two verticals are configured in `config/verticals/`:

| Feature | `smm_freelance` (Solo SMM) | `smm_agency` (SMM Agency) |
|---|---|---|
| Client label | Client | Account |
| Contact label | Contact | Client contact |
| Profile tabs | overview, deliverables, invoices, brand_guide, notes | + team |
| Team management | No | Yes (`TeamManagementDialog`, `showAccountManager: true`) |
| Deliverable assignee | No | Yes |
| Capacity tracking | No | Yes |
| Deliverable types | 8 types | 9 types (adds `paid_ad`) |
| Approval SLA field | No | Yes (`approval_sla_days`) |
| Monthly ad budget field | No | Yes (`monthly_budget`) |
| At-risk renewal warning | 30 days | 45 days |
| Team capacity metric | Hidden | Hidden (`show: false` — not computed yet) |
| `pending_approval` label | "Awaiting approval" | "With client" |
| `approved` label | "Approved" | "Client approved" |
| `published` label | "Published" | "Live" |

The vertical config is resolved at org load time in `DashboardLayout` and provided via React context so all client components can consume it without prop drilling.

### Main User Workflows

**1. Onboarding**
- User signs up via Clerk → redirected to `/onboarding`
- 2-step form: business name → vertical selection
- `createOrg` server action creates org row + sends welcome email
- Redirected to `/` (dashboard)

**2. Client Management**
- Client roster at `/clients` — filterable by tag, searchable by brand/contact/email
- Add client via `AddClientDialog` → `createClient` action (tag starts as `prospect`)
- Edit client core fields via `EditClientDialog` → `updateClient`
- Tag transitions via `updateClientTag` — fires `client.tag_changed` event
- Archive via `archiveClient` (soft delete via `archived_at`)
- Client profile at `/clients/[id]` — 5 or 6 tabs depending on vertical
- Brand guide fields written to `vertical_data` jsonb via `updateClientBrandGuide`
- Contract renewal tracked and updated inline via `updateClientRenewal`

**3. Deliverables**
- Monthly board at `/deliverables?month=YYYY-MM`
- Two views: by-client list and by-status kanban (drag-and-drop; **disabled while status update pending**)
- By-client view lists **all** active/onboarding clients for the month (even with zero deliverables); **empty states** when no clients or no rows for the selected month
- Status transitions via `updateDeliverableStatus` — fires `deliverable.status_changed` and `deliverable.completed` events
- Month close-out via `CloseOutDialog` — shows per-client completion rate + invoice review + pending/loading state on send
- Agency: assignee tracking + team capacity shown in client profile

**4. Invoicing**
- Invoice list at `/invoices` — filterable by status, searchable; **Create invoice** dialog for single draft invoices (`createInvoice`) + batch billing
- Batch billing via `BatchBillingDialog` → `batchCreateRetainerInvoices`:
  - Fetches all active clients with `retainer_amount > 0`
  - Deduplicates against existing invoices for the billing month
  - Creates invoices (INV-NNNN sequential numbering) + line items
  - Fires `invoice.sent` per invoice + `retainer.batch_sent` aggregate event
- **`createInvoice`:** manual draft (`retainer` | `project` | `ad_spend`) + one line item; `invoice.created` event
- Individual invoice actions: mark sent (optional Resend to client email), mark paid (with payment method/date), void; **printable HTML** at `GET /api/invoices/[id]`
- `markInvoicePaid` fires `invoice.paid` + `payment.received` events

**5. Analytics**
- Analytics page at `/analytics` — parallel data fetches (`AnalyticsClient` dynamically imported with `ssr: false`); **empty state** when no active clients and MRR is 0
- Metrics: MRR, active clients, churn rate, renewal rate, avg retainer, delivery rate (filtered by vertical `show` flags)
- Charts: MRR trend (6 months — historical from `payment.received`; **current month** uses live retainer sum when event total is 0, with on-page explanation when applicable), revenue by client, renewal pipeline, delivery rate by client

**6. Dashboard Home**
- Time-of-day greeting with optional first name; 5-panel layout: Revenue (MRR bar chart), Renewals (90-day list), Deliverables (this week), Invoices (recent 4), This week (text briefing)
- Alert strips: overdue invoices, at-risk clients, upcoming renewals
- Ticker bar: MRR, ARR proj, avg retainer, renewals count, outstanding

### Caching

| Function | Cache | TTL | Tag | Invalidated by |
|---|---|---|---|---|
| `getCurrentOrg` | `React.cache()` | Request scope | — | Per-request dedup (layout + page share one Supabase call) |
| `getMRRTrend` | `unstable_cache` | 60s | `dashboard-{orgId}` | `createClient`, `updateClientTag`, `markInvoicePaid`, `batchCreateRetainerInvoices`, `createInvoice`, and other invoice-affecting mutations |
| `getUpcomingRenewalsList` | `unstable_cache` | 60s | `dashboard-{orgId}` | Same |
| `getClientCountSparkline` | `unstable_cache` | 60s | `dashboard-{orgId}` | Same |
| MRR sparkline | Derived from `getMRRTrend` | — | — | No separate query |
| All others | None | — | — | `revalidatePath` per action |

### Background Jobs / Cron

**Overdue invoices:** `GET /api/cron/overdue-invoices` (protected with `CRON_SECRET`) updates `sent` → `overdue` and fires events — intended to be triggered by Vercel Cron or similar. Batch billing remains manual via `BatchBillingDialog` / close-out.

---

## 7. UI Architecture

### Server vs Client Split

The dominant pattern is **server page → dynamic client shell**:

```
Server page (async, fetches all data)
  ↓ passes all data as props
  Dynamic client shell ("use client", ssr: false, loading skeleton)
    ↓ renders interactive UI with framer-motion, state, event handlers
    ↓ calls server actions for mutations
```

| Route | Server Page | Client Shell | Skeleton |
|---|---|---|---|
| `/` | `app/(dashboard)/page.tsx` | `DashboardClient` | `DashboardSkeleton` |
| `/clients/[id]` | `app/(dashboard)/clients/[id]/page.tsx` | `Client360Client` | `Client360Skeleton` |
| `/invoices` | `app/(dashboard)/invoices/page.tsx` | `InvoicesClient` | `InvoicesSkeleton` |
| `/analytics` | `app/(dashboard)/analytics/page.tsx` | `AnalyticsClient` | `AnalyticsSkeleton` |
| `/clients` | `app/(dashboard)/clients/page.tsx` | None (pure server) | None |
| `/deliverables` | `app/(dashboard)/deliverables/page.tsx` | `StatusBoard` (partial) | Inline pulse |

`CloseOutDialog` and `StatusBoard` are dynamically imported on the deliverables page with `ssr: false`.

### Navigation Shell

```
RootLayout (app/layout.tsx)
  └─ ClerkProvider + Toaster
      └─ DashboardLayout (app/(dashboard)/layout.tsx)
          └─ VerticalConfigProvider
              ├─ LabelNav (56px sidebar — Clerk UserButton, 5 nav icons, framer-motion entries)
              └─ Topbar (50px top bar — page title, date, live indicator)
                  └─ {children} (page content)
```

### State Management

- **No global state library** (no Redux, Zustand, Jotai)
- Server state: fetched at page level, passed as props to client shells
- Local UI state: `useState`/`useTransition` in client components
- URL state: `searchParams` used for filter, search, tab, month, view parameters
- Vertical config: React context (`VerticalConfigProvider` / `useVerticalConfig()`)
- Toast: `sonner` for mutation feedback

### Client Components Using Clerk

| Component | Clerk API | Purpose |
|---|---|---|
| `LabelNav` | `UserButton` | Account menu in sidebar |
| `app/sign-in/.../page.tsx` | `SignIn` | Sign-in form |
| `app/sign-up/.../page.tsx` | `SignUp` | Sign-up form |
| `OnboardingClient` | `useFormState` (react-dom) | Org creation form |

### Component Organisation

```
components/
├── ui/          Primitive building blocks (Radix-based, cva-styled, no business logic)
├── shared/      Reusable domain-aware atoms (Avatar, StatusPill, Sparkline, Skeletons)
├── brand/       Auth page shell (AuthShell, SeverlLogo)
├── dashboard/   Dashboard-specific components (DashboardClient, LabelNav, Topbar, panels)
├── clients/     Client domain components (table, sheet, tabs, team management)
├── deliverables/ Deliverable board, kanban, row, close-out sheet
└── invoices/    Batch billing + create invoice dialog
```

---

## 8. External Integrations

| Service | Package | Version | Purpose | Config |
|---|---|---|---|---|
| **Clerk** | `@clerk/nextjs` | `^6.0.0` | Authentication — sign-in/up, session, middleware | `clerkMiddleware`, `auth()`, `currentUser()`, `UserButton`, `SignIn`, `SignUp`, `ClerkProvider`. Env: `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY` |
| **Supabase** | `@supabase/supabase-js` | `^2.48.0` | Postgres database | Two clients: session (Clerk JWT JWKS) + admin (service role). Env: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` |
| **Resend** | `resend` | `^3.2.0` | Transactional email | `lib/email/welcome.ts` — welcome email on org creation. Non-fatal if `RESEND_API_KEY` absent. Env: `RESEND_API_KEY`, `RESEND_FROM_EMAIL` |
| **Sentry** | `@sentry/nextjs` | `^8.0.0` | Error monitoring | `instrumentation.ts` (Node.js + Edge), `sentry.client.config.ts` (browser + Replay), `withSentryConfig` in `next.config.mjs`, `global-error.tsx`. Widespread `captureException` / `captureMessage` in actions and data loaders. Env: `NEXT_PUBLIC_SENTRY_DSN`, `SENTRY_AUTH_TOKEN` |

**`withSentryConfig` options:**
```js
{ org: 'severl', project: 'smm-os', silent: true,
  widenClientFileUpload: true, hideSourceMaps: true, disableLogger: true }
```

Note: `next.config.mjs` sets `sourcemaps.deleteSourcemapsAfterUpload: true` for Sentry uploads.

---

## 9. Known Gaps & Follow-ups

### Type Safety

| Location | Issue | Severity |
|---|---|---|
| `ClientRow.vertical_data` | `Record<string, any>` | Low — intentional (jsonb schema-less) |
| `EventRow.metadata` | `Record<string, any>` | Low — intentional (open-ended event payload) |
| `getMonthCloseOutData` | Uses `as unknown as CloseOutRow[]` cast for Supabase join | Low |

### Test Coverage

Unit tests cover auth guards, client notes, and batch invoice flows. **Gaps:** `lib/team/actions.ts`, deliverable actions, non-batch invoice actions, and most UI — **0 tests**.

### Operational

| Item | Notes |
|---|---|
| Vercel Cron | Schedule `GET /api/cron/overdue-invoices` with `Authorization: Bearer ${CRON_SECRET}` |
| Resend | Invoice-sent email runs when `contact_email` exists; verify domain/DNS in production |
| `team_capacity` | Metric remains **`show: false`** for agency until computed in `getAnalyticsMetrics` |

### Sentry / build

Legacy `sentry.server.config.ts` / `sentry.edge.config.ts` may duplicate `instrumentation.ts` — SDK v8 prefers the instrumentation hook; optional cleanup to silence warnings.

### No TODO / FIXME sweep

Occasional `TODO` in components (e.g. logo SVG); no systematic FIXME backlog.

---

## Delta from Previous Audit

Compared to `audits/architecture-overview.md` (2026-03-18, same date — first version):

### Added since previous audit

| Item | Details |
|---|---|
| `lib/database.types.ts` | New — 8 row types + 12 composite types replacing `as any` throughout |
| `lib/team/actions.ts` | New — 4 team member CRUD server actions |
| `components/clients/TeamManagementDialog.tsx` | New — team member CRUD UI (agency-gated) |
| `instrumentation.ts` | New — Sentry init via Next.js instrumentation hook |
| `sentry.client.config.ts` | Added — client-side Sentry + Replay |
| `next.config.mjs` | Updated — now wraps with `withSentryConfig` |
| `app/global-error.tsx` | Added — global error boundary with Sentry capture |
| `__tests__/auth-guard.test.ts` | New — 5 unit tests |
| `__tests__/actions/client-note.test.ts` | New — 2 unit tests |
| `vitest.config.ts` | New — Vitest configuration |
| `unstable_cache` on 3 dashboard functions | `getMRRTrend`, `getUpcomingRenewalsList`, `getClientCountSparkline` (MRR sparkline derived from trend) |
| `React.cache()` on `getCurrentOrg` | Request-scoped dedup — layout + pages share one org query |
| `next/dynamic` on 6 components | `DashboardClient`, `Client360Client`, `InvoicesClient`, `AnalyticsClient`, `StatusBoard`, `CloseOutDialog` |
| 4 skeleton files | `DashboardSkeleton`, `Client360Skeleton`, `InvoicesSkeleton`, `AnalyticsSkeleton` |
| Performance fixes (2026-03-18) | `getMRR` + `getActiveClientCount` → `getMRRAndActiveCount`; Client 360 + batch billing parallelized; `getAnalyticsMetrics` 5→4 queries; `getClients` excludes `vertical_data`; `getClient360` explicit columns |
| `invoice_line_items` now written | `batchCreateRetainerInvoices` now inserts line items |
| Cross-route revalidation | `createClient`, `updateClientTag`, `markInvoicePaid`, `batchCreateRetainerInvoices` now revalidate `/`, `/analytics`, and `dashboard-{orgId}` tag |

### Removed since previous audit

| Item | Details |
|---|---|
| `@supabase/ssr` | Removed from dependencies (was installed, not used) |
| `@next/font` | Removed (replaced by `next/font/google`) |
| `@headlessui/react` | Removed (was never imported) |
| `recharts` | Removed (was installed, never imported — charts now done with custom framer-motion bars) |
| `geist` font package | Removed (font now inlined via Tailwind fallback) |

### Changed

| Item | Change |
|---|---|
| `package.json` scripts | Added `"test": "vitest run"`, `"test:watch": "vitest"` |
| `lib/clients/actions.ts` `createClientNote` | `authorId` param removed; now uses server-derived `userId` from `requireOrgAccess` |
| `CONTEXT/CURSOR_CONTEXT.md` | Updated 2026-03-20 — reflects API routes, invoicing, analytics, legal stubs |

---

## Document maintenance

On each **release** or **material architecture change** (new routes, actions, integrations, or data flows): update **Last reviewed** in the title block at the top of this file, skim §§1–9 for drift, and align [`CURSOR_CONTEXT.md`](./CURSOR_CONTEXT.md) if behavior or conventions changed.
