/**
 * Database types for Severl — manually defined to match db/schema.sql.
 * Use these instead of `as any` for typed Supabase responses.
 */

export type PlanTier = 'essential' | 'pro' | 'elite' | 'agency';

export type OrgUIMeta = {
  has_seen_tour?: boolean;
  has_seen_first_client?: boolean;
  has_seen_first_invoice?: boolean;
  has_seen_first_deliverable?: boolean;
};

export type OrgRow = {
  id: string;
  name: string;
  vertical: 'smm_freelance' | 'smm_agency';
  owner_id: string;
  timezone: string;
  plan_tier: PlanTier;
  stripe_customer_id: string | null;
  subscription_status: string;
  ui_meta: OrgUIMeta;
  created_at: string;
  updated_at: string;
};

export type TeamMemberRow = {
  id: string;
  org_id: string;
  name: string;
  email: string;
  role: string;
  active: boolean;
  created_at: string;
  updated_at: string;
};

export type ClientRow = {
  id: string;
  org_id: string;
  vertical: 'smm_freelance' | 'smm_agency';
  brand_name: string;
  contact_name: string | null;
  contact_email: string | null;
  account_manager_id: string | null;
  retainer_amount: number | null;
  billing_cycle: string | null;
  contract_start: string | null;
  contract_renewal: string | null;
  tag: 'prospect' | 'onboarding' | 'active' | 'at_risk' | 'paused' | 'churned';
  platforms: string[];
  vertical_data: Record<string, any>;
  archived_at: string | null;
  created_at: string;
  updated_at: string;
};

export type ClientNoteRow = {
  id: string;
  org_id: string;
  client_id: string;
  author_id: string | null;
  body: string;
  created_at: string;
};

export type DeliverableRow = {
  id: string;
  org_id: string;
  client_id: string;
  month: string;
  type: string;
  title: string;
  status: 'not_started' | 'in_progress' | 'pending_approval' | 'approved' | 'published';
  assignee_id: string | null;
  due_date: string | null;
  notes: string | null;
  archived_at: string | null;
  created_at: string;
  updated_at: string;
};

export type InvoiceRow = {
  id: string;
  org_id: string;
  client_id: string;
  invoice_number: string;
  invoice_type: 'retainer' | 'project' | 'ad_spend';
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'voided';
  total: number;
  due_date: string | null;
  paid_date: string | null;
  payment_method: string | null;
  billing_month: string | null;
  notes: string | null;
  vertical: 'smm_freelance' | 'smm_agency';
  created_at: string;
  updated_at: string;
};

export type InvoiceLineItemRow = {
  id: string;
  invoice_id: string;
  description: string;
  quantity: number;
  unit_price: number;
  total: number;
};

export type EventRow = {
  id: string;
  org_id: string;
  vertical: 'smm_freelance' | 'smm_agency';
  event_type: string;
  amount: number | null;
  client_id: string | null;
  metadata: Record<string, any>;
  created_at: string;
};

// Composite types for joined query results
export type ClientWithManager = ClientRow & {
  team_members: Pick<TeamMemberRow, 'name'> | { name: string } | null;
};

export type ClientFull = ClientRow & {
  team_members: Pick<TeamMemberRow, 'name' | 'email'> | { name: string; email: string } | null;
  invoices: Pick<InvoiceRow, 'total' | 'status' | 'created_at' | 'billing_month'>[];
  deliverables: Pick<DeliverableRow, 'id' | 'status' | 'month'>[];
};

export type Client360 = ClientFull & {
  revenue_to_date: number;
  balance_owed: number;
  deliverables_total: number;
  deliverables_done: number;
};

export type DeliverableWithClient = DeliverableRow & {
  clients: Pick<ClientRow, 'brand_name' | 'platforms' | 'tag' | 'retainer_amount' | 'archived_at'>;
  team_members: Pick<TeamMemberRow, 'name'> | { name: string } | null;
};

export type DeliverableWithClientForWeek = Pick<
  DeliverableRow,
  'id' | 'client_id' | 'type' | 'title' | 'status' | 'due_date' | 'notes'
> & {
  clients: Pick<ClientRow, 'brand_name' | 'platforms' | 'archived_at'>;
};

export type InvoiceWithClient = InvoiceRow & {
  clients: Pick<ClientRow, 'brand_name'>;
};

export type RecentInvoiceWithClient = Pick<
  InvoiceRow,
  'id' | 'invoice_number' | 'status' | 'total' | 'created_at'
> & {
  clients: Pick<ClientRow, 'brand_name'>;
};

export type RenewalClient = Pick<
  ClientRow,
  'id' | 'brand_name' | 'contract_renewal' | 'retainer_amount' | 'tag'
>;

export type RevenueByClientItem = Pick<ClientRow, 'id' | 'brand_name' | 'retainer_amount'>;

export type DeliveryRateByClientItem = {
  id: string;
  brand_name: string;
  total: number;
  published: number;
  pct: number;
};

export type CloseOutClientItem = {
  clientId: string;
  total: number;
  published: number;
  brand_name: string;
  retainer_amount: number | null;
};

export type BatchBillingClient = Pick<ClientRow, 'id' | 'brand_name' | 'retainer_amount'>;
