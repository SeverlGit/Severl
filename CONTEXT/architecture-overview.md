# Architecture Overview — Severl (SMM OS)

**Date:** 2026-03-20 · **Last reviewed:** 2026-04-10 (updated post-implementation phases 1–8)
**Auditor:** Claude Code (read-only, all source files read)
**App name:** `severl-smm-os` (`package.json`)
**Purpose:** Social media manager operating system — retainer, deliverable, and invoice management for SMM freelancers and agencies.

---

## 1. Tech Stack

### Framework & Runtime

| Layer | Choice | Version |
|---|---|---|
| Framework | Next.js (App Router) | `^15.5.14` |
| Language | TypeScript (strict) | `~5.8.3` |
| Runtime | Node.js | Inferred from Next.js 15 |
| React | React 18 | `^18.3.0` |

### All Dependencies

| Package | Version | Purpose |
|---|---|---|
| `@clerk/nextjs` | `^6.39.1` | Authentication — session, middleware (Node runtime), server identity, `UserButton` |
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
| `stripe` | `^21.0.1` | Stripe Node.js SDK — billing checkout, portal, webhooks |
| `driver.js` | `^1.4.0` | In-app onboarding tour overlay (dashboard welcome tour) |
| `next` | `^15.5.14` | Framework |
| `react-dom` | `^18.3.0` | React DOM + `useFormState`/`useFormStatus` |

**Dev dependencies:**

| Package | Purpose |
|---|---|
| `vitest ^2.0.0` | Unit test runner |
| `@vitejs/plugin-react ^4.2.0` | React support for Vitest |
| `typescript ~5.8.3` | Type checking |
| `tailwindcss ^3.4.0` | CSS framework |
| `eslint ^8.57.0`, `eslint-config-next ^15.5.14` | Linting |
| `@next/bundle-analyzer ^15.5.14` | Optional bundle analysis (`ANALYZE=true`) |
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

Next.js App Router, server-rendered on demand (all routes are `ƒ` dynamic). Suitable for Vercel or any Node.js host. **Auth middleware** uses the **Node.js middleware** runtime (`runtime: 'nodejs'` in `middleware.ts` config).

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
| `STRIPE_SECRET_KEY` | Server-only | Stripe API key — checkout, portal, webhook verification |
| `STRIPE_WEBHOOK_SECRET` | Server-only | Stripe webhook signature secret |
| `STRIPE_PRICE_PRO` | Server-only | Stripe Price ID for Pro plan |
| `STRIPE_PRICE_ELITE` | Server-only | Stripe Price ID for Elite plan |
| `STRIPE_PRICE_AGENCY_BASE` | Server-only | Stripe Price ID for Agency plan base seat |
| `NEXT_PUBLIC_APP_URL` | Public | Canonical app URL — used as Stripe redirect base |

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
│   ├── brand/
│   │   └── [token]/
│   │       └── page.tsx               Public — shareable brand guide (no auth); tracks view count/date; shows assets + PDF link; 404 on invalid
│   ├── approve/
│   │   ├── [token]/
│   │   │   ├── page.tsx               Public — single-deliverable approval; handles expired/reviewed states
│   │   │   └── ApproveClient.tsx      "use client" — Approve / Request Revisions UI; revision round tracking (Phase 4A)
│   │   └── batch/[token]/
│   │       └── page.tsx               Public — batch approval (Phase 4B); one token → multiple deliverables for one client
│   ├── portal/
│   │   └── [org-token]/[client-token]/
│   │       ├── page.tsx               Public — client portal (Phase 8, Agency); notFound on bad tokens
│   │       ├── layout.tsx             Portal shell — noindex, warm light background
│   │       └── PortalClient.tsx       "use client" — tabbed portal (Brand / Approvals / Invoices / Activity)
│   ├── api/
│   │   ├── invoices/[id]/route.ts     GET — HTML invoice (auth + org check; print/PDF)
│   │   ├── brand/[token]/pdf/route.ts GET — print-optimized HTML brand guide PDF export (public, Phase 5C)
│   │   └── cron/
│   │       ├── overdue-invoices/      GET — mark overdue + dunning sequences Day 7/14 (Bearer CRON_SECRET, Phase 7B)
│   │       └── auto-billing/          GET — auto-create retainer invoices for qualifying orgs (Bearer CRON_SECRET, Phase 7A)
│   ├── (dashboard)/                   Route group — auth-gated dashboard shell
│   │   ├── layout.tsx                 Dashboard layout — getCurrentOrg(), VerticalConfigProvider, PlanProvider, LabelNav, Topbar
│   │   ├── loading.tsx                Root dashboard loading state
│   │   ├── DashboardClientLoader.tsx  "use client" — next/dynamic wrapper for DashboardClient (ssr: false)
│   │   ├── page.tsx                   / — Home dashboard (server page + DashboardClientLoader)
│   │   ├── billing/
│   │   │   ├── page.tsx               /billing — server page; reads org plan_tier + stripe_customer_id
│   │   │   └── BillingClient.tsx      Billing UI — plan cards, upgrade/portal CTAs
│   │   ├── analytics/
│   │   │   ├── loading.tsx            Analytics loading skeleton
│   │   │   ├── page.tsx               /analytics — server page + AnalyticsClientLoader
│   │   │   ├── AnalyticsClientLoader.tsx  "use client" — dynamic wrapper for AnalyticsClient
│   │   │   └── AnalyticsClient.tsx    Analytics charts client shell
│   │   ├── clients/
│   │   │   ├── loading.tsx            Clients loading skeleton
│   │   │   ├── page.tsx               /clients — server page, filter/search via searchParams (Promise)
│   │   │   └── [id]/
│   │   │       ├── loading.tsx        Client 360 loading skeleton
│   │   │       ├── page.tsx           /clients/[id] — server page + Client360ClientLoader; params/searchParams Promises
│   │   │       ├── Client360ClientLoader.tsx  "use client" — dynamic wrapper for Client360Client
│   │   │       └── Client360Client.tsx Client profile shell (6-tab view)
│   │   ├── deliverables/
│   │   │   ├── loading.tsx            Deliverables loading skeleton
│   │   │   ├── page.tsx               /deliverables — server page, month nav, dual view
│   │   │   └── DeliverablesDynamic.tsx "use client" — StatusBoardDynamic + CloseOutDialogDynamic (ssr: false)
│   │   └── invoices/
│   │       ├── loading.tsx            Invoices loading skeleton
│   │       ├── page.tsx               /invoices — server page + InvoicesClientLoader
│   │       ├── InvoicesClientLoader.tsx  "use client" — dynamic wrapper for InvoicesClient
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
│   │   ├── LabelNav.tsx               Left sidebar nav
│   │   ├── UserNav.tsx                Avatar dropdown (Settings, Billing, Logout) — replaces raw UserButton
│   │   ├── Topbar.tsx                 Top bar — page title, date, live indicator
│   │   ├── TopbarTitleContext.tsx     Context for dynamic topbar title
│   │   ├── NavigationProgress.tsx     Thin top-of-viewport route transition progress bar
│   │   ├── SettingsPanel.tsx          In-app settings dialog (density, currency, prefs, Clerk account)
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
│   │   ├── BrandGuideTab.tsx          Brand guide editor — fields + asset upload/grid + view stats + PDF link (Phase 5)
│   │   ├── NotesTab.tsx               Client notes list + add/edit/delete
│   │   ├── RenewalCountdown.tsx       Countdown to contract renewal with inline update
│   │   └── TeamManagementDialog.tsx   Team member CRUD dialog (agency only)
│   ├── deliverables/
│   │   ├── StatusBoard.tsx            Kanban board — drag-and-drop; batch select + batch approval send (Phase 4B)
│   │   ├── CalendarView.tsx           Week-strip calendar grid by client (Phase 3)
│   │   ├── ClientSection.tsx          Deliverable list grouped by client
│   │   ├── DeliverableCard.tsx        Kanban card — revision round badge R1/R2 (Phase 4A); publish_date picker
│   │   ├── DeliverableRow.tsx         Table row — publish_date picker (Phase 3)
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
│   │   ├── ClientsSkeleton.tsx        Loading skeleton for clients list page
│   │   ├── DeliverablesSkeleton.tsx   Loading skeleton for deliverables page
│   │   ├── InvoicesSkeleton.tsx       Loading skeleton for invoices page
│   │   ├── ClientAvatar.tsx           Initials avatar with tag-colored ring
│   │   ├── EmptyState.tsx             Generic empty state component (supports link or ReactNode action)
│   │   ├── Sparkline.tsx              Mini SVG sparkline chart
│   │   ├── StatusPill.tsx             Generic status colored pill
│   │   ├── Tag.tsx                    Semantic tone tag (green/red/amber/muted)
│   │   └── UpgradePrompt.tsx          Inline rose-tinted upgrade nudge — featureName + requiredTier (Phase 1)
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
│   ├── auth/
│   │   ├── tier-limits.ts             checkClientLimit(), checkDeliverableLimit(), checkStorageLimit(); re-exports TIER_LIMITS + TierLimitError
│   │   └── tier-limits.test.ts        Vitest unit tests for tier limit enforcement
│   ├── billing/
│   │   ├── actions.ts                 createCheckoutSession(), createPortalSession(), restorePurchases(), updateOrgBranding(), getAutoBillingSettings(), updateAutoBilling() (Phase 7)
│   │   ├── plan-context.tsx           PlanProvider + usePlan() — planTier, limits, atClientLimit + all capability flags (Phase 1)
│   │   ├── stripe.ts                  stripe singleton (Stripe v21)
│   │   ├── sync-clerk-metadata.ts     syncPlanToClerkMetadata() — patches Clerk user publicMetadata
│   │   ├── sync-stripe-seat.ts        syncStripeTeamSeat() — syncs agency seat quantity
│   │   └── tier-definitions.ts        TIER_LIMITS record (all Phase 1 gates) + TierLimitError class
│   ├── constants.ts                   DELIVERABLE_STATUS_COLORS, DELIVERABLE_STATUS_PCT, INVOICE_STATUS_COLORS
│   ├── database.types.ts              Row types + composite types (incl. PlanTier, OrgUIMeta)
│   ├── onboarding-actions.ts          markUIMetaSeen(key) — writes orgs.ui_meta flags
│   ├── prefs-context.tsx              UserPrefs type + usePrefs() — localStorage-backed user preferences
│   ├── tour-context.tsx               Tour state context
│   ├── tour-guides.ts                 startMainTour() — driver.js welcome tour
│   ├── types.ts                       VerticalSlug, DeliverableStatus, ClientTag, InvoiceStatus/Type
│   ├── utils.ts                       cn(), formatCurrency(), daysUntil(), renewalUrgency()
│   ├── vertical-config.tsx            VerticalConfigProvider, useVerticalConfig() React context
│   ├── supabase/server.ts             getSupabaseServerClient(), getSupabaseAdminClient()
│   ├── analytics/
│   │   ├── fireEvent.ts               Event insert helper (15 event types)
│   │   └── getAnalyticsData.ts        getAnalyticsMetrics, getRevenueByClient, getRenewalPipeline, getDeliveryRateByClient, getCapacityMetrics (Phase 6A), getRevenueForecast (Phase 6C)
│   ├── clients/
│   │   ├── actions.ts                 Client mutations: createClient, updateClient, archiveClient, updateClientTag, updateClientRenewal, updateClientBrandGuide, generateBrandGuideToken, reassignAccountManager, createClientNote, updateClientNote, deleteClientNote, uploadBrandAsset (Phase 5A), deleteBrandAsset (Phase 5A), generateClientPortalToken (Phase 8)
│   │   ├── getBrandAssets.ts          getBrandAssets(), getBrandAssetsByToken(), trackBrandGuideView() (Phase 5)
│   │   ├── getClient360.ts            Client profile data (8 fetch functions); includes brand_guide_token/view fields
│   │   └── getClientsData.ts          Client list fetch (explicit columns, no vertical_data)
│   ├── dashboard/
│   │   └── getHomeData.ts             Dashboard fetch — getHomeData(), getMRRTrend, getChurnRiskScores() (Phase 6B, exported); MRR sparkline; 30-day renewals
│   ├── deliverables/
│   │   ├── actions.ts                 Deliverable mutations incl. sendForApproval; publish_date support (Phase 3)
│   │   ├── approval-actions.ts        recordApproval() — public; validates expiry; inserts approval_revisions row + increments revision_round on revision_requested (Phase 4A)
│   │   ├── batch-approval-actions.ts  sendBatchApproval(), recordBatchApproval() — batch token for multiple deliverables (Phase 4B)
│   │   └── getDeliverableData.ts      getMonthlyDeliverables() incl. publish_date; computeDeliverableStats()
│   ├── email/
│   │   ├── welcome.ts                 Resend welcome email
│   │   ├── verification.ts            Resend verification email (Clerk custom email provider)
│   │   ├── approval.ts                Resend approval request email; CTA → /approve/[token]
│   │   ├── invoice-sent.ts            Resend invoice sent notification
│   │   ├── invoice-reminder.ts        Resend 7-day overdue nudge (Phase 7B)
│   │   └── invoice-overdue.ts         Resend 14-day overdue follow-up with firmer tone (Phase 7B)
│   ├── invoicing/
│   │   ├── actions.ts                 markInvoicePaid, voidInvoice, markInvoiceSent, createInvoice, createPaymentLink (Phase 2), exportInvoicesCsv (Phase 2)
│   │   ├── batchCreateRetainerInvoices.ts  Batch invoice + line item generation + invoice.sent emails
│   │   ├── getBatchBillingData.ts     Active clients eligible for batch billing
│   │   └── getInvoicesData.ts         Invoice list, summary, counts, active clients for manual create
│   ├── portal/
│   │   └── getPortalData.ts           getPortalData(orgToken, clientToken) — resolves org + client by tokens; parallel fetch brand/deliverables/invoices/activity (Phase 8)
│   └── team/
│       └── actions.ts                 4 team member mutations
├── db/
│   └── schema.sql                     Postgres DDL source of truth (13 tables, 5 enums)
├── __tests__/
│   ├── auth-guard.test.ts             5 tests for requireAuth/requireOrgAccess
│   ├── actions/client-note.test.ts    2 tests for createClientNote auth pattern
│   ├── actions/batch-invoices.test.ts Batch retainer invoice tests
│   └── actions/invoice-actions.test.ts Invoice server action tests
├── lib/auth/
│   └── tier-limits.test.ts            Tier limit enforcement unit tests
├── app/api/webhooks/stripe/
│   └── route.test.ts                  Stripe webhook handler tests
├── public/
│   ├── SeverlLogo.png                 Logo image
│   └── bg.mp4                         Auth page background video
├── docs/                              Internal planning docs (not served)
├── audits/                            Audit reports
├── vercel.json                        Cron schedules: overdue-invoices 02:00 UTC daily; auto-billing 06:00 UTC daily (Phase 7)
├── middleware.ts                      Clerk route protection; public: /brand, /approve, /portal (Phase 8); `config.runtime: 'nodejs'`
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
| `/` | `app/(dashboard)/page.tsx` | Server + client loader | Home dashboard — KPIs, 5 panels, ticker (`DashboardClientLoader`) |
| `/analytics` | `app/(dashboard)/analytics/page.tsx` | Server + client loader | MRR trend, revenue breakdown, delivery rate (`AnalyticsClientLoader`) |
| `/clients` | `app/(dashboard)/clients/page.tsx` | Server | Client roster — filter by tag, full-text search |
| `/clients/[id]` | `app/(dashboard)/clients/[id]/page.tsx` | Server + client loader | Client 360 profile — 5–6 tabs (`Client360ClientLoader`) |
| `/deliverables` | `app/(dashboard)/deliverables/page.tsx` | Server + client loaders | Monthly deliverable board — `DeliverablesDynamic` for kanban + close-out |
| `/invoices` | `app/(dashboard)/invoices/page.tsx` | Server + client loader | Invoice list, summary strip, create + batch billing (`InvoicesClientLoader`) |
| `/billing` | `app/(dashboard)/billing/page.tsx` | Server + client | Billing page — plan tier display, Stripe checkout/portal CTAs (`BillingClient`) |
| `/privacy` | `app/privacy/page.tsx` | Server | Public stub — privacy policy |
| `/terms` | `app/terms/page.tsx` | Server | Public stub — terms of service |
| `/brand/[token]` | `app/brand/[token]/page.tsx` | Server (public) | Shareable client brand guide — tracks view count; shows fields + assets + PDF download link; 404 on invalid token |
| `/approve/[token]` | `app/approve/[token]/page.tsx` + `ApproveClient.tsx` | Server + client (public) | Single-deliverable approval — 7-day expiry; Approve / Request Revisions; revision round tracking (Phase 4A) |
| `/approve/batch/[token]` | `app/approve/batch/[token]/page.tsx` | Server + client (public) | Batch approval — one token covers multiple deliverables for one client; per-item approve/revise + Approve all (Phase 4B) |
| `/portal/[org-token]/[client-token]` | `app/portal/[org-token]/[client-token]/page.tsx` + `PortalClient.tsx` | Server + client (public) | Client portal (Agency only) — Brand guide, Approvals, Invoices, Activity tabs; Stripe Pay button; overdue alert (Phase 8) |

**API routes (non-mutation):** `GET /api/invoices/[id]` — printable HTML invoice (auth required). `GET /api/brand/[token]/pdf` — print-optimized brand guide HTML (public). `GET /api/cron/overdue-invoices` — mark overdue + dunning Day 7/14 (Bearer `CRON_SECRET`). `GET /api/cron/auto-billing` — auto-create retainer invoices (Bearer `CRON_SECRET`). `POST /api/webhooks/stripe` — Stripe events (public, verified via `STRIPE_WEBHOOK_SECRET`). **All writes** use Next.js Server Actions.

---

## 3. Authentication Flow

### Middleware (`middleware.ts`)

```ts
const isPublicRoute = createRouteMatcher([
  '/sign-in(.*)', '/sign-up(.*)', '/onboarding(.*)', '/privacy(.*)', '/terms(.*)',
  '/api/cron(.*)', '/api/webhooks/stripe(.*)',
  '/brand/(.*)',    // shareable brand guide — no auth required
  '/approve/(.*)', // client approval pages — no auth required
  '/portal/(.*)',  // client portal — no auth required (Phase 8)
]);

export default clerkMiddleware(async (auth, req) => {
  if (!isPublicRoute(req)) await auth.protect();
});

export const config = {
  runtime: 'nodejs',
  matcher: [ /* app routes + api|trpc */ ],
};
```

- Uses `clerkMiddleware` (v6, not deprecated `authMiddleware`)
- **`config.runtime: 'nodejs'`** — middleware runs on the **Node.js middleware runtime** (Next.js 15.5+), not the Edge runtime, avoiding Vercel Edge bundler failures with Clerk’s transitive imports
- `auth.protect()` returns 401/redirect for unauthenticated requests to protected routes
- **`/api/cron(.*)`** is public so cron routes can authenticate via `Authorization: Bearer` instead of Clerk session
- Matcher excludes static assets, images, fonts, and media files (see `matcher` in repo)

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
| `plan_tier` | `essential`, `pro`, `elite`, `agency` |
| `vertical_type` | `smm_freelance`, `smm_agency` |
| `deliverable_status` | `not_started`, `in_progress`, `pending_approval`, `approved`, `published` |
| `client_tag` | `prospect`, `onboarding`, `active`, `at_risk`, `paused`, `churned` |
| `invoice_status` | `draft`, `sent`, `paid`, `overdue`, `voided` |
| `invoice_type` | `retainer`, `project`, `ad_spend` |
| `event_type` | `client.added`, `client.tag_changed`, `client.renewed`, `client.churned`, `deliverable.created`, `deliverable.status_changed`, `deliverable.completed`, `invoice.created`, `invoice.sent`, `invoice.paid`, `invoice.overdue`, `invoice.voided`, `payment.received`, `payment.refunded`, `retainer.batch_sent` |

### Tables

| Table | PK | Key FKs | Purpose |
|---|---|---|---|
| `orgs` | `id uuid` | — | Organization / workspace. One per user. `owner_id` = Clerk userId. `plan_tier`, `stripe_customer_id`, `subscription_status`, `ui_meta jsonb`. `logo_url` — agency white-label (Phase 4C). `auto_billing_enabled bool` + `auto_billing_day int(1–28)` — auto-invoicing (Phase 7). `public_token text unique` — portal URL segment (Phase 8). |
| `team_members` | `id uuid` | `org_id → orgs` | Agency team members. `active` boolean for soft deactivation. |
| `clients` | `id uuid` | `org_id → orgs`, `account_manager_id → team_members` | Brand accounts. `vertical_data jsonb`, `brand_guide_token text unique` (lazy), `brand_guide_last_viewed_at` + `brand_guide_view_count int default 0` (Phase 5B). `archived_at` soft delete. |
| `client_notes` | `id uuid` | `org_id → orgs`, `client_id → clients` | CRM notes. `author_id` = Clerk userId. |
| `deliverables` | `id uuid` | `org_id → orgs`, `client_id → clients`, `assignee_id → team_members` | Monthly deliverables. `month` always = first of month. Approval cols: `approval_token`, `approval_sent_at`, `approval_expires_at` (7-day TTL), `approved_at`, `approval_notes`. `publish_date date` (Phase 3). `revision_round int default 0` (Phase 4A). `archived_at` soft delete. |
| `invoices` | `id uuid` | `org_id → orgs`, `client_id → clients` | Invoice records. Unique `(org_id, invoice_number)`. `billing_month` always = first of month. `stripe_payment_link_url` + `stripe_payment_link_id` (Phase 2). `dunning_sent_at` + `dunning_stage int default 0` (Phase 7B: 0=none, 1=7d, 2=14d). |
| `invoice_line_items` | `id uuid` | `invoice_id → invoices ON DELETE CASCADE` | Line item breakdown per invoice. |
| `events` | `id uuid` | `org_id → orgs`, `client_id → clients (nullable)` | Append-only analytics event log. `metadata jsonb`. |
| `approval_revisions` | `id uuid` | `deliverable_id → deliverables ON DELETE CASCADE` | Revision request history per deliverable. `notes`, `requested_at`, `round` (Phase 4A). |
| `batch_approvals` | `id uuid` | `org_id → orgs`, `client_id → clients` | Batch approval token covering multiple deliverables. `deliverable_ids uuid[]`, `expires_at` (Phase 4B). |
| `brand_assets` | `id uuid` | `client_id → clients ON DELETE CASCADE` | Brand guide file attachments. `type` (logo/font/image/color_palette/other), `file_url`, `file_size`. Files in Supabase Storage bucket `brand-assets` (Phase 5A). |
| `client_portal_tokens` | `id uuid` | `client_id → clients ON DELETE CASCADE` | Per-client portal access token scoped to org. `last_accessed_at`, `access_count` (Phase 8). |

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
| `idx_approval_revisions_deliverable_id` | `approval_revisions` | `deliverable_id` | btree |
| `idx_batch_approvals_token` | `batch_approvals` | `token` | btree |
| `idx_brand_assets_client_id` | `brand_assets` | `client_id` | btree |
| `idx_brand_assets_org_id` | `brand_assets` | `org_id` | btree |
| `idx_client_portal_tokens_token` | `client_portal_tokens` | `token` | btree |
| `idx_client_portal_tokens_client_id` | `client_portal_tokens` | `client_id` | btree |

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
| `getCapacityMetrics()` | `lib/analytics/getAnalyticsData.ts` | Admin | `clients` + `deliverables` (parallel; Phase 6A) | None |
| `getRevenueForecast()` | `lib/analytics/getAnalyticsData.ts` | Admin | `clients` (+ churnScores param; Phase 6C) | None |
| `getMRRTrend()` (analytics page) | `lib/dashboard/getHomeData.ts` | Admin | Same as dashboard | `unstable_cache` 60s |
| `getChurnRiskScores()` | `lib/dashboard/getHomeData.ts` | Admin | `clients` + `invoices` + `deliverables` (parallel; Phase 6B) | None |
| `getBrandAssets()` | `lib/clients/getBrandAssets.ts` | Admin | `brand_assets` (Phase 5A) | None |
| `getBrandAssetsByToken()` | `lib/clients/getBrandAssets.ts` | Admin | `clients` (by token) + `brand_assets` (Phase 5A) | None |
| `getPortalData()` | `lib/portal/getPortalData.ts` | Admin | `orgs` + `client_portal_tokens` + `clients` + `brand_assets` + `deliverables` + `invoices` + `events` (parallel; Phase 8) | None |

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
| `generateBrandGuideToken` | `requireOrgAccess` | `clients` (`brand_guide_token`) | None | `/clients/{id}` |
| `reassignAccountManager` | `requireOrgAccess` | `clients` (`account_manager_id`) | None | `/clients/{id}`, `/deliverables` |
| `createClientNote` | `requireOrgAccess` (returns `userId`) | `client_notes` | None | `/clients/{id}` |
| `updateClientNote` | `requireOrgAccess` | `client_notes` | None | `/clients`, `/clients/{id}` |
| `deleteClientNote` | `requireOrgAccess` | `client_notes` | None | `/clients/{id}` |
| `uploadBrandAsset` | `requireOrgAccess` | `brand_assets` + Supabase Storage | None | `/clients/{id}` (Phase 5A) |
| `deleteBrandAsset` | `requireOrgAccess` | `brand_assets` + Supabase Storage | None | `/clients/{id}` (Phase 5A) |
| `generateClientPortalToken` | `requireOrgAccess` | `orgs` (`public_token`, lazy), `client_portal_tokens` | None | None — returns portal URL (Phase 8) |

### Deliverable Actions (`lib/deliverables/actions.ts`)

| Action | Auth Guard | Tables Written | Events Fired | Revalidates |
|---|---|---|---|---|
| `sendForApproval` | `requireOrgAccess` | `deliverables` (`status→pending_approval`, `approval_token`, `approval_sent_at`, `approval_expires_at`) | None | `/deliverables`, `dashboard-{orgId}` (+ Resend email if `contact_email` set) |
| `updateDeliverableStatus` | `requireOrgAccess` | `deliverables` | `deliverable.status_changed` (+ `deliverable.completed` if published) | `/deliverables`, `/`, `/analytics` |
| `createDeliverable` | `requireOrgAccess` | `deliverables` | `deliverable.created` | `/deliverables`, `/` |
| `deleteDeliverable` | `requireOrgAccess` | `deliverables` (`archived_at`) | None | `/deliverables`, `/` |
| `restoreDeliverable` | `requireOrgAccess` | `deliverables` (`archived_at → null`) | None | `/deliverables` |
| `updateDeliverableAssignee` | `requireOrgAccess` | `deliverables` (`assignee_id`) | None | `/deliverables` |
| `getMonthCloseOutData` | `requireOrgAccess` | None (read) | None | None |

Note: `getMonthCloseOutData` uses the `'use server'` file directive and calls `requireOrgAccess`, but is a data-fetch function, not a mutation. It is called directly from the page component as a server function.

### Public Approval Action (`lib/deliverables/approval-actions.ts`)

| Action | Auth | Tables Written | Revalidates |
|---|---|---|---|
| `recordApproval(token, decision, notes?)` | None (validates by token) | `deliverables` (`status`, `approved_at`, `approval_notes`, `approval_token`) | None (no revalidatePath — public page has no cached dashboard data) |

Guards: returns `{ error }` if token not found, if `approval_expires_at` is past, or if `status !== 'pending_approval'`. On `approved`: clears `approval_token` (single-use). On `revision_requested`: keeps token, sets status back to `in_progress`.

### Invoice Actions (`lib/invoicing/actions.ts`)

| Action | Auth Guard | Tables Written | Events Fired | Revalidates |
|---|---|---|---|---|
| `markInvoicePaid` | `requireOrgAccess` | `invoices` | `invoice.paid`, `payment.received` | `/invoices`, `/`, `/analytics`, `dashboard-{orgId}` |
| `voidInvoice` | `requireOrgAccess` | `invoices` | `invoice.voided` | `/invoices`, `/`, `/analytics` |
| `markInvoiceSent` | `requireOrgAccess` | `invoices` | `invoice.sent` | `/invoices` (+ Resend email when client email exists) |
| `createInvoice` | `requireOrgAccess` | `invoices`, `invoice_line_items` | `invoice.created` | `/invoices`, `/`, `/analytics`, `dashboard-{orgId}` |
| `createPaymentLink` | `requireOrgAccess` (Pro+ check) | `invoices` (`stripe_payment_link_url/id`) | None | `/invoices` (Phase 2) |
| `exportInvoicesCsv` | `requireOrgAccess` (Pro+ check) | None (read) | None | None — returns CSV blob (Phase 2) |

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

### Billing Actions (`lib/billing/actions.ts`)

| Action | Auth Guard | Side Effects |
|---|---|---|
| `createCheckoutSession` | `requireOrgAccess` | Creates/retrieves Stripe customer; returns Stripe Checkout URL |
| `createPortalSession` | `requireOrgAccess` | Returns Stripe Customer Portal URL |
| `restorePurchases` | `requireOrgAccess` | Queries active Stripe subscription; updates `orgs.plan_tier` + syncs Clerk metadata |
| `updateOrgBranding` | `requireOrgAccess` | Updates `orgs.logo_url` (Elite+ white-label; Phase 4C) |
| `getAutoBillingSettings` | `requireOrgAccess` | Returns `{ enabled, billingDay }` from `orgs` (Phase 7) |
| `updateAutoBilling` | `requireOrgAccess` (Elite+ check) | Updates `orgs.auto_billing_enabled` + `auto_billing_day` (Phase 7) |

### Deliverable Batch Actions (`lib/deliverables/batch-approval-actions.ts`)

| Action | Auth Guard | Tables Written | Revalidates |
|---|---|---|---|
| `sendBatchApproval(deliverableIds, orgId)` | `requireOrgAccess` | `batch_approvals` | `/deliverables` (Phase 4B) |
| `recordBatchApproval(token, decisions)` | None (token-validated) | `deliverables` (status, approval fields per item), `approval_revisions` | None (Phase 4B) |

### Onboarding UI Action (`lib/onboarding-actions.ts`)

| Action | Auth | Tables Written |
|---|---|---|
| `markUIMetaSeen(key)` | `getCurrentOrg()` | `orgs.ui_meta` — merges flag `{ [key]: true }` |

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

The dominant pattern is **server page → client loader → dynamic client shell** (Next.js 15 does not allow `next/dynamic` with `ssr: false` directly in Server Components):

```
Server page (async, fetches all data)
  ↓ passes all data as props
  Client loader ("use client") — imports next/dynamic(..., { ssr: false, loading })
    ↓ lazy-loads shell component
  Client shell — framer-motion, state, server actions
```

| Route | Server Page | Loader (client) | Shell | Skeleton |
|---|---|---|---|---|
| `/` | `app/(dashboard)/page.tsx` | `DashboardClientLoader` | `DashboardClient` | `DashboardSkeleton` |
| `/clients/[id]` | `app/(dashboard)/clients/[id]/page.tsx` | `Client360ClientLoader` | `Client360Client` | `Client360Skeleton` |
| `/invoices` | `app/(dashboard)/invoices/page.tsx` | `InvoicesClientLoader` | `InvoicesClient` | `InvoicesSkeleton` |
| `/analytics` | `app/(dashboard)/analytics/page.tsx` | `AnalyticsClientLoader` | `AnalyticsClient` | `AnalyticsSkeleton` |
| `/clients` | `app/(dashboard)/clients/page.tsx` | None (pure server) | — | `ClientsSkeleton` |
| `/deliverables` | `app/(dashboard)/deliverables/page.tsx` | `DeliverablesDynamic` (`StatusBoardDynamic`, `CloseOutDialogDynamic`) | `StatusBoard`, `CloseOutDialog` | `DeliverablesSkeleton` |
| `/billing` | `app/(dashboard)/billing/page.tsx` | None (pure server shell → passes props) | `BillingClient` | None |

Shell components export explicit prop types (e.g. `DashboardClientProps`, `AnalyticsClientProps`) for loaders; avoid `ComponentProps<typeof dynamic(...)>` on heavy `dynamic()` imports.

**Page props (Next.js 15):** `params` and `searchParams` in server pages are **Promises** — await before use. API route handlers use **`params: Promise<{ id: string }>`** for dynamic segments.

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
- URL state: `searchParams` used for filter, search, tab, month, view parameters (in server pages, `searchParams` is a **Promise** — await in the page)
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
├── shared/      Reusable domain-aware atoms (Avatar, StatusPill, Sparkline, Skeletons — incl. ClientsSkeleton, DeliverablesSkeleton)
├── brand/       Auth page shell (AuthShell, SeverlLogo)
├── dashboard/   Dashboard-specific components (DashboardClient, LabelNav, UserNav, Topbar, SettingsPanel, NavigationProgress, panels)
├── clients/     Client domain components (table, sheet, tabs, team management)
├── deliverables/ Deliverable board, kanban, row, close-out sheet
└── invoices/    Batch billing + create invoice dialog
```

---

## 8. External Integrations

| Service | Package | Version | Purpose | Config |
|---|---|---|---|---|
| **Clerk** | `@clerk/nextjs` | `^6.39.1` | Authentication — sign-in/up, session, **Node middleware** | `clerkMiddleware`, `auth()`, `currentUser()`, `UserButton`, `SignIn`, `SignUp`, `ClerkProvider`. Middleware `config.runtime: 'nodejs'`. Env: `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY` |
| **Supabase** | `@supabase/supabase-js` | `^2.48.0` | Postgres database | Two clients: session (Clerk JWT JWKS) + admin (service role). Env: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` |
| **Resend** | `resend` | `^3.2.0` | Transactional email | `lib/email/welcome.ts` — welcome email on org creation. Non-fatal if `RESEND_API_KEY` absent. Env: `RESEND_API_KEY`, `RESEND_FROM_EMAIL` |
| **Sentry** | `@sentry/nextjs` | `^8.0.0` | Error monitoring | `instrumentation.ts` (Node.js + Edge), `sentry.client.config.ts` (browser + Replay), `withSentryConfig` in `next.config.mjs`, `global-error.tsx`. Widespread `captureException` / `captureMessage` in actions and data loaders. Env: `NEXT_PUBLIC_SENTRY_DSN`, `SENTRY_AUTH_TOKEN` |
| **Stripe** | `stripe` | `^21.0.1` | Billing — Checkout, Customer Portal, webhooks | `lib/billing/stripe.ts` singleton. Checkout session + portal via `lib/billing/actions.ts`. Webhook at `POST /api/webhooks/stripe` (public route). Plan tier synced to `orgs.plan_tier` + Clerk user metadata. Env: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_PRO/ELITE/AGENCY_BASE`, `NEXT_PUBLIC_APP_URL` |
| **driver.js** | `driver.js` | `^1.4.0` | In-app onboarding tour | `lib/tour-guides.ts` — `startMainTour()` triggered on first login; tour completion writes `has_seen_tour` flag to `orgs.ui_meta` via `markUIMetaSeen()` |

**`withSentryConfig` options:**
```js
{ org: 'severl', project: 'smm', silent: true,
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

Unit tests cover: auth guards, client notes, batch invoice flows, invoice server actions, **tier-limit enforcement** (`lib/auth/tier-limits.test.ts`), **Stripe webhook handler** (`app/api/webhooks/stripe/route.test.ts`). **Gaps:** `lib/team/actions.ts`, deliverable actions, billing UI, and most component-level UI — **0 tests**.

### Operational

| Item | Notes |
|---|---|
| **DB migrations pending** | Run in Supabase SQL editor before deploying Phase 2/3 features: `ALTER TABLE clients ADD COLUMN IF NOT EXISTS brand_guide_token TEXT UNIQUE;` and 5 approval columns on `deliverables` (see `db/schema.sql` migration comments). |
| Approval email deliverability | Resend domain verification must be confirmed in production before approval emails are live. |
| `recordApproval` rate limiting | No IP-level rate limiting yet — 7-day token expiry is the primary guard. Add middleware rate limiting if abuse occurs. |
| Vercel Cron | Schedule `GET /api/cron/overdue-invoices` with `Authorization: Bearer ${CRON_SECRET}` |
| Resend | Invoice-sent email runs when `contact_email` exists; verify domain/DNS in production |
| `team_capacity` | Metric remains **`show: false`** for agency until computed in `getAnalyticsMetrics` |
| Stripe | Set `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, price IDs, and `NEXT_PUBLIC_APP_URL` in production; register webhook endpoint in Stripe Dashboard |
| `syncStripeTeamSeat` | Agency seat sync is wired; verify Stripe product/seat quantity configuration in production |

### Sentry / build

Legacy `sentry.server.config.ts` / `sentry.edge.config.ts` may duplicate `instrumentation.ts` — SDK v8 prefers the instrumentation hook; optional cleanup to silence warnings.

### No TODO / FIXME sweep

Occasional `TODO` in components (e.g. logo SVG); no systematic FIXME backlog.

---

## Delta — Implementation Phases 1–3 (2026-04-09)

| Item | Details |
|---|---|
| **Phase 1 — Essential tier limits** | `TIER_LIMITS.essential` bumped: clients `2 → 5`, deliverables `15 → 25`. `BillingClient.tsx` copy updated. `tier-limits.test.ts` updated (count assertions reflect new limits). No DB migration. |
| **Phase 2 — Shareable brand guide** | `clients.brand_guide_token text unique` column added (migration required). `generateBrandGuideToken` server action in `lib/clients/actions.ts`. New public route `app/brand/[token]/page.tsx` — server component, admin client lookup, 404 on invalid, renders all vertical intake fields read-only with brand styling. `BrandGuideTab` gains `brandGuideToken` prop + share bar UI (Copy link / Regenerate with AlertDialog). `Client360Client` passes `brand_guide_token` down. `/brand/(.*)` added to middleware public routes. |
| **Phase 3 — Content approval workflow** | 5 new columns on `deliverables` (migration required): `approval_token`, `approval_sent_at`, `approval_expires_at` (7-day TTL), `approved_at`, `approval_notes`. `sendForApproval` in `lib/deliverables/actions.ts`. `recordApproval` in new `lib/deliverables/approval-actions.ts` (public, no auth). `lib/email/approval.ts` — branded Resend template. New public route `app/approve/[token]/page.tsx` + `ApproveClient.tsx` (Approve / Request Revisions + confirmation states). `DeliverableCard` and `DeliverableRow` gain "Send for Approval" / "Resend" buttons. `getMonthlyDeliverables` query extended to fetch approval columns + `clients.contact_email/contact_name`. `/approve/(.*)` added to middleware public routes. `DeliverableWithClient.clients` pick extended with `contact_email`, `contact_name`. |

## Delta from Previous Audit (2026-04-09)

| Item | Details |
|---|---|
| **Billing / Stripe** | New `lib/billing/` module: `stripe.ts`, `actions.ts` (checkout, portal, restore), `tier-definitions.ts`, `plan-context.tsx`, `sync-clerk-metadata.ts`, `sync-stripe-seat.ts`. New `/billing` route (`BillingClient`). Stripe webhook at `POST /api/webhooks/stripe` (public route). |
| **Plan tiers** | New `plan_tier` enum (`essential`, `pro`, `elite`, `agency`). `orgs` table gains `plan_tier`, `stripe_customer_id`, `subscription_status`, `ui_meta` columns. `lib/auth/tier-limits.ts` enforces per-tier client/deliverable/storage limits via `TierLimitError`. |
| **`PlanProvider`** | Dashboard layout now wraps children in `PlanProvider` (client count + tier exposed via `usePlan()`) alongside existing `VerticalConfigProvider`. |
| **Tour / onboarding** | `lib/tour-guides.ts` (driver.js), `lib/tour-context.tsx`, `lib/onboarding-actions.ts` (`markUIMetaSeen`). Tour completion stored in `orgs.ui_meta.has_seen_tour`. |
| **Settings panel** | `components/dashboard/SettingsPanel.tsx` — in-app preferences dialog. `lib/prefs-context.tsx` (`usePrefs()`) stores density, currency, due days, etc. in localStorage. |
| **UserNav** | `components/dashboard/UserNav.tsx` — avatar dropdown with Settings, Billing, Logout (replaces raw Clerk `UserButton` in sidebar). |
| **NavigationProgress** | `components/dashboard/NavigationProgress.tsx` — thin top-of-viewport route transition bar. |
| **TopbarTitleContext** | `components/dashboard/TopbarTitleContext.tsx` — context for dynamic topbar page title. |
| **Loading states** | `loading.tsx` added for all dashboard routes: `/`, `/clients`, `/clients/[id]`, `/analytics`, `/deliverables`, `/invoices`. |
| **New skeletons** | `ClientsSkeleton`, `DeliverablesSkeleton` added to `components/shared/`. |
| **Verification email** | `lib/email/verification.ts` — Resend-based Clerk custom verification email template. |
| **Middleware** | `/api/webhooks/stripe(.*)` added to `createRouteMatcher` public routes. |
| **New tests** | `lib/auth/tier-limits.test.ts` (tier limit enforcement), `app/api/webhooks/stripe/route.test.ts` (Stripe webhook). |
| **New deps** | `stripe ^21.0.1`, `driver.js ^1.4.0`. |

---

## Delta from Previous Audit (2026-03-26)

| Item | Details |
|---|---|
| `next` | Upgraded to **15.5.x** (App Router). |
| `@clerk/nextjs` | Pinned to **^6.39.x**; middleware uses **`runtime: 'nodejs'`** (Node middleware, Next 15.5+). |
| Public middleware | `/api/cron(.*)` added to `createRouteMatcher` for cron auth. |
| TypeScript | **`~5.8.3`** in devDependencies (toolchain stability). |
| `eslint-config-next` / `@next/bundle-analyzer` | Aligned to **15.5.x**. |
| Client loaders | `app/(dashboard)/` **`*ClientLoader.tsx`** and **`DeliverablesDynamic.tsx`** — `next/dynamic` + `ssr: false` in client modules only; exported `*Props` types on shells. |
| Page / API route props | **`params` / `searchParams` as `Promise`** in server `page.tsx`; **`params` Promise** in `GET /api/invoices/[id]`. |

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
| `CONTEXT/CURSOR_CONTEXT.md` | Updated 2026-03-26 — Next 15, Node middleware, loaders, async page props |

---

## Document maintenance

On each **release** or **material architecture change** (new routes, actions, integrations, or data flows): update **Last reviewed** in the title block at the top of this file, skim §§1–9 for drift, and align [`CURSOR_CONTEXT.md`](./CURSOR_CONTEXT.md) if behavior or conventions changed.
