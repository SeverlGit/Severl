-- Severl — Social Media Manager OS
-- Primary Postgres schema for Supabase
-- Source of truth: docs/SMM-SKILL.md + platform strategy docs

-- Enable UUID generation (available by default on Supabase)
create extension if not exists "pgcrypto";

-- ============================
-- ENUM TYPES
-- ============================

-- Plan Tier for an organization
do $$
begin
  if not exists (select 1 from pg_type where typname = 'plan_tier') then
    create type plan_tier as enum ('essential', 'pro', 'elite', 'agency');
  end if;
end$$;

-- Vertical for an organization
do $$
begin
  if not exists (select 1 from pg_type where typname = 'vertical_type') then
    create type vertical_type as enum ('smm_freelance', 'smm_agency');
  end if;
end$$;

-- Deliverable status lifecycle
do $$
begin
  if not exists (select 1 from pg_type where typname = 'deliverable_status') then
    create type deliverable_status as enum (
      'not_started',
      'in_progress',
      'pending_approval',
      'approved',
      'published'
    );
  end if;
end$$;

-- Client tag lifecycle
do $$
begin
  if not exists (select 1 from pg_type where typname = 'client_tag') then
    create type client_tag as enum (
      'prospect',
      'onboarding',
      'active',
      'at_risk',
      'paused',
      'churned'
    );
  end if;
end$$;

-- Invoice status lifecycle
do $$
begin
  if not exists (select 1 from pg_type where typname = 'invoice_status') then
    create type invoice_status as enum (
      'draft',
      'sent',
      'paid',
      'overdue',
      'voided'
    );
  end if;
end$$;

-- Invoice type (retainer vs others)
do $$
begin
  if not exists (select 1 from pg_type where typname = 'invoice_type') then
    create type invoice_type as enum (
      'retainer',
      'project',
      'ad_spend'
    );
  end if;
end$$;

-- Event types for analytics backbone
do $$
begin
  if not exists (select 1 from pg_type where typname = 'event_type') then
    create type event_type as enum (
      'client.added',
      'client.tag_changed',
      'client.renewed',
      'client.churned',
      'deliverable.created',
      'deliverable.status_changed',
      'deliverable.completed',
      'invoice.created',
      'invoice.sent',
      'invoice.paid',
      'invoice.overdue',
      'invoice.voided',
      'payment.received',
      'payment.refunded',
      'retainer.batch_sent'
    );
  end if;
end$$;

-- ============================
-- CORE ORG + TEAM TABLES
-- ============================

create table if not exists orgs (
  id                  uuid primary key default gen_random_uuid(),
  name                text not null,
  vertical            vertical_type not null,
  owner_id            text not null,
  timezone            text not null default 'America/New_York',
  plan_tier           plan_tier not null default 'essential',
  stripe_customer_id  text,
  subscription_status text not null default 'active',
  ui_meta             jsonb not null default '{}'::jsonb,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create index if not exists idx_orgs_owner_id
  on orgs (owner_id);

-- Team members within an org
-- SMM-SKILL: team_members: id, org_id, name, email, role, active
create table if not exists team_members (
  id         uuid primary key default gen_random_uuid(),
  org_id     uuid not null references orgs(id) on delete restrict,
  name       text not null,
  email      text not null,
  role       text not null,
  active     boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_team_members_org_id
  on team_members (org_id);

-- ============================
-- CLIENTS (BRAND ACCOUNTS)
-- ============================

-- SMM-SKILL: clients: id, org_id, vertical, brand_name, contact_name, contact_email,
--             account_manager_id, retainer_amount, billing_cycle, contract_start,
--             contract_renewal, tag, platforms[], vertical_data jsonb, archived_at
create table if not exists clients (
  id                  uuid primary key default gen_random_uuid(),
  org_id              uuid not null references orgs(id) on delete restrict,
  vertical            vertical_type not null,
  brand_name          text not null,
  contact_name        text,
  contact_email       text,
  account_manager_id  uuid references team_members(id) on delete set null,
  retainer_amount     numeric(12,2), -- monthly retainer amount, used for invoices
  billing_cycle       text,          -- e.g. 'monthly', 'quarterly'
  contract_start      date,
  contract_renewal    date,
  tag                 client_tag not null default 'prospect',
  platforms           text[] default '{}',
  vertical_data       jsonb default '{}'::jsonb,
  archived_at         timestamptz,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create index if not exists idx_clients_org_id
  on clients (org_id);

create index if not exists idx_clients_org_id_tag
  on clients (org_id, tag);

create index if not exists idx_clients_org_id_contract_renewal
  on clients (org_id, contract_renewal);

-- Client notes (notes attached to a client profile)
create table if not exists client_notes (
  id         uuid primary key default gen_random_uuid(),
  org_id     uuid not null references orgs(id) on delete restrict,
  client_id  uuid not null references clients(id) on delete restrict,
  author_id  text,
  body       text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_client_notes_org_id
  on client_notes (org_id);

create index if not exists idx_client_notes_client_id
  on client_notes (client_id);

-- ============================
-- DELIVERABLES (RETAINER TRACKER)
-- ============================

-- SMM-SKILL: deliverables: id, org_id, client_id, month (date, first of month),
--             type, title, status, assignee_id, due_date, notes
create table if not exists deliverables (
  id           uuid primary key default gen_random_uuid(),
  org_id       uuid not null references orgs(id) on delete restrict,
  client_id    uuid not null references clients(id) on delete restrict,
  month        date not null, -- must always be startOfMonth(date) at write time
  type         text not null,
  title        text not null,
  status       deliverable_status not null default 'not_started',
  assignee_id  uuid references team_members(id) on delete set null,
  due_date     date,
  notes        text,
  archived_at  timestamptz,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists idx_deliverables_org_id
  on deliverables (org_id);

create index if not exists idx_deliverables_org_client_month
  on deliverables (org_id, client_id, month);

create index if not exists idx_deliverables_org_status_due
  on deliverables (org_id, status, due_date);

-- ============================
-- INVOICES + LINE ITEMS
-- ============================

-- SMM-SKILL: invoices: id, org_id, client_id, invoice_number, invoice_type,
--             status, total, due_date, paid_date, payment_method,
--             billing_month, notes, vertical
create table if not exists invoices (
  id              uuid primary key default gen_random_uuid(),
  org_id          uuid not null references orgs(id) on delete restrict,
  client_id       uuid not null references clients(id) on delete restrict,
  invoice_number  text not null,
  invoice_type    invoice_type not null default 'retainer',
  status          invoice_status not null default 'draft',
  total           numeric(12,2) not null default 0,
  due_date        date,
  paid_date       date,
  payment_method  text,
  billing_month   date, -- first of month for monthly retainers
  notes           text,
  vertical        vertical_type not null,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create unique index if not exists uq_invoices_org_invoice_number
  on invoices (org_id, invoice_number);

create index if not exists idx_invoices_org_id
  on invoices (org_id);

create index if not exists idx_invoices_org_status_due
  on invoices (org_id, status, due_date);

create index if not exists idx_invoices_org_billing_month
  on invoices (org_id, billing_month);

-- SMM-SKILL: invoice_line_items: id, invoice_id, description, quantity, unit_price, total
create table if not exists invoice_line_items (
  id           uuid primary key default gen_random_uuid(),
  invoice_id   uuid not null references invoices(id) on delete cascade,
  description  text not null,
  quantity     numeric(12,2) not null default 1,
  unit_price   numeric(12,2) not null default 0,
  total        numeric(12,2) not null default 0
);

create index if not exists idx_invoice_line_items_invoice_id
  on invoice_line_items (invoice_id);

-- ============================
-- EVENTS (ANALYTICS BACKBONE)
-- ============================

-- SMM-SKILL: events: id, org_id, vertical, event_type, amount, client_id, metadata jsonb
create table if not exists events (
  id         uuid primary key default gen_random_uuid(),
  org_id     uuid not null references orgs(id) on delete restrict,
  vertical   vertical_type not null,
  event_type event_type not null,
  amount     numeric(12,2),
  client_id  uuid references clients(id) on delete set null,
  metadata   jsonb default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_events_org_id
  on events (org_id);

create index if not exists idx_events_org_event_type
  on events (org_id, event_type);

create index if not exists idx_events_org_client_id
  on events (org_id, client_id);

-- ============================
-- DATA INTEGRITY NOTES
-- ============================
-- 1. Application layer must:
--    - Scope every Supabase query with `.eq('org_id', orgId)`
--    - Use date-fns `startOfMonth` when writing `deliverables.month` and `invoices.billing_month`
--    - Soft delete client records by setting `clients.archived_at` (never hard delete)
--    - Route all analytics writes through a `fireEvent()` helper that writes into `events`
-- 2. Retainer invoice generation:
--    - Auto-generated invoices should pull `clients.retainer_amount` into `invoices.total`
--      and corresponding `invoice_line_items` rather than duplicating configuration elsewhere.

-- ============================
-- STORAGE RLS POLICIES (OPTIONAL)
-- ============================
-- Ensure your Supabase instance has a Storage bucket named 'org-files'.
-- This policy enforces the tier bytes limit before a new object is inserted.
-- We cast size to bigint for comparison. Limits:
--   essential = 524288000 (500MB)
--   pro       = 10737418240 (10GB)
--   elite     = 107374182400 (100GB)
--   agency    = 536870912000 (500GB)
-- Assuming the folder structure is `[org_id]/...` so (bucket_id = 'org-files' and (storage.foldername(name))[1] = org_id::text)

-- Example Storage policy statement (Run in SQL Editor if needed):
/*
CREATE POLICY "Enforce Storage Tier Limits"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'org-files' AND
  (
    -- 1. Allowed file size checks
    (metadata->>'size')::bigint +
    COALESCE((
      SELECT sum((metadata->>'size')::bigint)
      FROM storage.objects
      WHERE bucket_id = 'org-files'
      AND (storage.foldername(name))[1] = (storage.foldername(storage.objects.name))[1]
    ), 0) <= (
      SELECT CASE
               WHEN orgs.plan_tier = 'essential' THEN 524288000
               WHEN orgs.plan_tier = 'pro' THEN 10737418240
               WHEN orgs.plan_tier = 'elite' THEN 107374182400
               WHEN orgs.plan_tier = 'agency' THEN 536870912000
               ELSE 524288000
             END
      FROM orgs
      WHERE orgs.id::text = (storage.foldername(name))[1]
    )
  )
);
*/

