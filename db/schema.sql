-- Severl — Social Media Manager OS
-- Full schema: all phases 1–8. Paste into Supabase SQL Editor and run.
-- Idempotent: safe to run on an empty or existing database.

create extension if not exists "pgcrypto";

-- ============================================================
-- ENUMS
-- ============================================================

do $$ begin
  if not exists (select 1 from pg_type where typname = 'plan_tier') then
    create type plan_tier as enum ('essential', 'pro', 'elite', 'agency');
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_type where typname = 'vertical_type') then
    create type vertical_type as enum ('smm_freelance', 'smm_agency');
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_type where typname = 'deliverable_status') then
    create type deliverable_status as enum (
      'not_started',
      'in_progress',
      'pending_approval',
      'approved',
      'published'
    );
  end if;
end $$;

do $$ begin
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
end $$;

do $$ begin
  if not exists (select 1 from pg_type where typname = 'invoice_status') then
    create type invoice_status as enum (
      'draft',
      'sent',
      'paid',
      'overdue',
      'voided'
    );
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_type where typname = 'invoice_type') then
    create type invoice_type as enum (
      'retainer',
      'project',
      'ad_spend'
    );
  end if;
end $$;

do $$ begin
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
end $$;

-- ============================================================
-- ORGS
-- ============================================================

create table if not exists orgs (
  id                   uuid        primary key default gen_random_uuid(),
  name                 text        not null,
  vertical             vertical_type not null,
  owner_id             text        not null,
  timezone             text        not null default 'America/New_York',
  plan_tier            plan_tier   not null default 'essential',
  stripe_customer_id   text,
  subscription_status  text        not null default 'active',
  ui_meta              jsonb       not null default '{}'::jsonb,
  logo_url             text,
  auto_billing_enabled boolean     not null default false,
  auto_billing_day     int         check (auto_billing_day between 1 and 28),
  public_token         text        unique,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

create index if not exists idx_orgs_owner_id on orgs (owner_id);

-- ============================================================
-- TEAM MEMBERS
-- ============================================================

create table if not exists team_members (
  id         uuid        primary key default gen_random_uuid(),
  org_id     uuid        not null references orgs(id) on delete restrict,
  name       text        not null,
  email      text        not null,
  role       text        not null,
  active     boolean     not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_team_members_org_id on team_members (org_id);

-- ============================================================
-- CLIENTS
-- ============================================================

create table if not exists clients (
  id                         uuid          primary key default gen_random_uuid(),
  org_id                     uuid          not null references orgs(id) on delete restrict,
  vertical                   vertical_type not null,
  brand_name                 text          not null,
  contact_name               text,
  contact_email              text,
  account_manager_id         uuid          references team_members(id) on delete set null,
  retainer_amount            numeric(12,2),
  billing_cycle              text,
  contract_start             date,
  contract_renewal           date,
  tag                        client_tag    not null default 'prospect',
  platforms                  text[]        default '{}',
  vertical_data              jsonb         default '{}'::jsonb,
  brand_guide_token          text          unique,
  brand_guide_last_viewed_at timestamptz,
  brand_guide_view_count     int           not null default 0,
  archived_at                timestamptz,
  created_at                 timestamptz   not null default now(),
  updated_at                 timestamptz   not null default now()
);

create index if not exists idx_clients_org_id
  on clients (org_id);
create index if not exists idx_clients_org_id_tag
  on clients (org_id, tag);
create index if not exists idx_clients_org_id_contract_renewal
  on clients (org_id, contract_renewal);
create unique index if not exists idx_clients_brand_guide_token
  on clients (brand_guide_token) where brand_guide_token is not null;

-- ============================================================
-- CLIENT NOTES
-- ============================================================

create table if not exists client_notes (
  id         uuid        primary key default gen_random_uuid(),
  org_id     uuid        not null references orgs(id) on delete restrict,
  client_id  uuid        not null references clients(id) on delete restrict,
  author_id  text,
  body       text        not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_client_notes_org_id    on client_notes (org_id);
create index if not exists idx_client_notes_client_id on client_notes (client_id);

-- ============================================================
-- DELIVERABLES
-- ============================================================

create table if not exists deliverables (
  id                  uuid               primary key default gen_random_uuid(),
  org_id              uuid               not null references orgs(id) on delete restrict,
  client_id           uuid               not null references clients(id) on delete restrict,
  month               date               not null,
  type                text               not null,
  title               text               not null,
  status              deliverable_status not null default 'not_started',
  assignee_id         uuid               references team_members(id) on delete set null,
  due_date            date,
  notes               text,
  approval_token      text               unique,
  approval_sent_at    timestamptz,
  approval_expires_at timestamptz,
  approved_at         timestamptz,
  approval_notes      text,
  publish_date        date,
  revision_round      int                not null default 0,
  archived_at         timestamptz,
  created_at          timestamptz        not null default now(),
  updated_at          timestamptz        not null default now()
);

create index if not exists idx_deliverables_org_id
  on deliverables (org_id);
create index if not exists idx_deliverables_org_client_month
  on deliverables (org_id, client_id, month);
create index if not exists idx_deliverables_org_status_due
  on deliverables (org_id, status, due_date);
create unique index if not exists idx_deliverables_approval_token
  on deliverables (approval_token) where approval_token is not null;

-- ============================================================
-- INVOICES
-- ============================================================

create table if not exists invoices (
  id                      uuid           primary key default gen_random_uuid(),
  org_id                  uuid           not null references orgs(id) on delete restrict,
  client_id               uuid           not null references clients(id) on delete restrict,
  invoice_number          text           not null,
  invoice_type            invoice_type   not null default 'retainer',
  status                  invoice_status not null default 'draft',
  total                   numeric(12,2)  not null default 0,
  due_date                date,
  paid_date               date,
  payment_method          text,
  billing_month           date,
  notes                   text,
  vertical                vertical_type  not null,
  stripe_payment_link_url text,
  stripe_payment_link_id  text,
  dunning_sent_at         timestamptz,
  dunning_stage           int            not null default 0,
  created_at              timestamptz    not null default now(),
  updated_at              timestamptz    not null default now()
);

create unique index if not exists uq_invoices_org_invoice_number
  on invoices (org_id, invoice_number);
create index if not exists idx_invoices_org_id
  on invoices (org_id);
create index if not exists idx_invoices_org_status_due
  on invoices (org_id, status, due_date);
create index if not exists idx_invoices_org_billing_month
  on invoices (org_id, billing_month);

-- ============================================================
-- INVOICE LINE ITEMS
-- ============================================================

create table if not exists invoice_line_items (
  id           uuid          primary key default gen_random_uuid(),
  invoice_id   uuid          not null references invoices(id) on delete cascade,
  description  text          not null,
  quantity     numeric(12,2) not null default 1,
  unit_price   numeric(12,2) not null default 0,
  total        numeric(12,2) not null default 0
);

create index if not exists idx_invoice_line_items_invoice_id on invoice_line_items (invoice_id);

-- ============================================================
-- EVENTS (analytics backbone)
-- ============================================================

create table if not exists events (
  id         uuid          primary key default gen_random_uuid(),
  org_id     uuid          not null references orgs(id) on delete restrict,
  vertical   vertical_type not null,
  event_type event_type    not null,
  amount     numeric(12,2),
  client_id  uuid          references clients(id) on delete set null,
  metadata   jsonb         default '{}'::jsonb,
  created_at timestamptz   not null default now()
);

create index if not exists idx_events_org_id            on events (org_id);
create index if not exists idx_events_org_event_type    on events (org_id, event_type);
create index if not exists idx_events_org_client_id     on events (org_id, client_id);

-- ============================================================
-- APPROVAL REVISIONS (Phase 4A)
-- ============================================================

create table if not exists approval_revisions (
  id             uuid        primary key default gen_random_uuid(),
  deliverable_id uuid        not null references deliverables(id) on delete cascade,
  notes          text,
  requested_at   timestamptz not null default now(),
  round          int         not null default 1
);

create index if not exists idx_approval_revisions_deliverable_id on approval_revisions (deliverable_id);

-- ============================================================
-- BATCH APPROVALS (Phase 4B)
-- ============================================================

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

-- ============================================================
-- BRAND ASSETS (Phase 5A)
-- Storage bucket: brand-assets, path: [org_id]/[client_id]/[uuid].[ext]
-- ============================================================

create table if not exists brand_assets (
  id         uuid        primary key default gen_random_uuid(),
  client_id  uuid        not null references clients(id) on delete cascade,
  org_id     uuid        not null,
  name       text        not null,
  type       text        not null, -- logo | font | image | color_palette | other
  file_url   text        not null,
  file_size  int,
  created_at timestamptz not null default now()
);

create index if not exists idx_brand_assets_client_id on brand_assets (client_id);
create index if not exists idx_brand_assets_org_id    on brand_assets (org_id);

-- ============================================================
-- CLIENT PORTAL TOKENS (Phase 8)
-- One token per client per org. Lookup requires both token + org_id.
-- ============================================================

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
