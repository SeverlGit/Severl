-- Severl — Column migrations for existing databases
-- Run this in Supabase SQL Editor if you already had the base schema before phases 4–8.
-- All statements are idempotent (ADD COLUMN IF NOT EXISTS).

-- ============================================================
-- clients — Phase 5B: brand guide view tracking
-- ============================================================
alter table clients
  add column if not exists brand_guide_last_viewed_at timestamptz,
  add column if not exists brand_guide_view_count     int not null default 0;

-- ============================================================
-- deliverables — Phase 3: calendar publish date
--               Phase 4A: revision tracking
-- ============================================================
alter table deliverables
  add column if not exists publish_date    date,
  add column if not exists revision_round int not null default 0;

-- ============================================================
-- invoices — Phase 2: Stripe payment links
--            Phase 7: dunning sequences
-- ============================================================
alter table invoices
  add column if not exists stripe_payment_link_url text,
  add column if not exists stripe_payment_link_id  text,
  add column if not exists dunning_sent_at         timestamptz,
  add column if not exists dunning_stage           int not null default 0;

-- ============================================================
-- orgs — Phase 4C: white-label logo
--        Phase 7: auto-billing
--        Phase 8: client portal token
-- ============================================================
alter table orgs
  add column if not exists logo_url             text,
  add column if not exists auto_billing_enabled boolean not null default false,
  add column if not exists auto_billing_day     int check (auto_billing_day between 1 and 28),
  add column if not exists public_token         text unique;

-- ============================================================
-- New tables (safe — IF NOT EXISTS)
-- ============================================================

create table if not exists approval_revisions (
  id             uuid        primary key default gen_random_uuid(),
  deliverable_id uuid        not null references deliverables(id) on delete cascade,
  notes          text,
  requested_at   timestamptz not null default now(),
  round          int         not null default 1
);
create index if not exists idx_approval_revisions_deliverable_id on approval_revisions (deliverable_id);

create table if not exists batch_approvals (
  id              uuid        primary key default gen_random_uuid(),
  org_id          uuid        not null references orgs(id) on delete restrict,
  client_id       uuid        not null references clients(id) on delete restrict,
  token           text        not null unique,
  deliverable_ids uuid[]      not null,
  created_at      timestamptz not null default now(),
  expires_at      timestamptz not null
);
create index if not exists idx_batch_approvals_token on batch_approvals (token);

create table if not exists brand_assets (
  id         uuid        primary key default gen_random_uuid(),
  client_id  uuid        not null references clients(id) on delete cascade,
  org_id     uuid        not null,
  name       text        not null,
  type       text        not null,
  file_url   text        not null,
  file_size  int,
  created_at timestamptz not null default now()
);
create index if not exists idx_brand_assets_client_id on brand_assets (client_id);
create index if not exists idx_brand_assets_org_id    on brand_assets (org_id);

create table if not exists client_portal_tokens (
  id               uuid        primary key default gen_random_uuid(),
  client_id        uuid        not null references clients(id) on delete cascade,
  org_id           uuid        not null,
  token            text        not null unique,
  created_at       timestamptz not null default now(),
  last_accessed_at timestamptz,
  access_count     int         not null default 0
);
create index if not exists idx_client_portal_tokens_token     on client_portal_tokens (token);
create index if not exists idx_client_portal_tokens_client_id on client_portal_tokens (client_id);
