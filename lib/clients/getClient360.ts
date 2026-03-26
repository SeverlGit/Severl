import { getSupabaseServerClient } from '@/lib/supabase/server';
import type {
  Client360,
  ClientFull,
  EventRow,
  InvoiceRow,
  DeliverableRow,
  TeamMemberRow,
  ClientNoteRow,
} from '@/lib/database.types';

export async function getClient360(
  clientId: string,
  orgId: string
): Promise<Client360 | null> {
  const supabase = getSupabaseServerClient();

  const { data, error } = await supabase
    .from('clients')
    .select(
      'id, org_id, vertical, brand_name, contact_name, contact_email, account_manager_id, retainer_amount, billing_cycle, contract_start, contract_renewal, tag, platforms, vertical_data, archived_at, created_at, updated_at, team_members(name, email), invoices!left(total, status, created_at, billing_month), deliverables!left(id, status, month)'
    )
    .eq('id', clientId)
    .eq('org_id', orgId)
    .maybeSingle();

  if (error || !data) return null;

  const full = data as unknown as ClientFull;
  const invoices = full.invoices ?? [];
  const deliverables = full.deliverables ?? [];

  const revenue_to_date = invoices
    .filter((i) => i.status === 'paid')
    .reduce((sum, i) => sum + (i.total ?? 0), 0);

  const balance_owed = invoices
    .filter((i) => i.status === 'sent' || i.status === 'overdue')
    .reduce((sum, i) => sum + (i.total ?? 0), 0);

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const deliverablesThisMonth = deliverables.filter((d) => {
    if (!d.month) return false;
    const m = new Date(d.month);
    return m.getFullYear() === monthStart.getFullYear() && m.getMonth() === monthStart.getMonth();
  });

  const deliverables_total = deliverablesThisMonth.length;
  const deliverables_done = deliverablesThisMonth.filter(
    (d) => d.status === 'published'
  ).length;

  return {
    ...data,
    revenue_to_date,
    balance_owed,
    deliverables_total,
    deliverables_done,
  } as unknown as Client360;
}

export async function getClientActivity(
  clientId: string,
  orgId: string
): Promise<Pick<EventRow, 'event_type' | 'amount' | 'metadata' | 'created_at'>[]> {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from('events')
    .select('event_type, amount, metadata, created_at')
    .eq('client_id', clientId)
    .eq('org_id', orgId)
    .order('created_at', { ascending: false })
    .limit(10);

  if (error || !data) return [];
  return data as Pick<EventRow, 'event_type' | 'amount' | 'metadata' | 'created_at'>[];
}

export async function getClientDeliverables(
  clientId: string,
  orgId: string,
  month: Date
): Promise<Pick<DeliverableRow, 'id' | 'type' | 'title' | 'status' | 'due_date'>[]> {
  const supabase = getSupabaseServerClient();
  const start = new Date(month.getFullYear(), month.getMonth(), 1);

  const { data, error } = await supabase
    .from('deliverables')
    .select('id, type, title, status, due_date')
    .eq('org_id', orgId)
    .eq('client_id', clientId)
    .eq('month', start.toISOString().slice(0, 10))
    .order('due_date', { ascending: true, nullsFirst: false });

  if (error || !data) return [];
  return data as Pick<DeliverableRow, 'id' | 'type' | 'title' | 'status' | 'due_date'>[];
}

export async function getClientInvoices(
  clientId: string,
  orgId: string
): Promise<
  Pick<
    InvoiceRow,
    'id' | 'invoice_number' | 'status' | 'total' | 'billing_month' | 'invoice_type' | 'created_at'
  >[]
> {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from('invoices')
    .select('id, invoice_number, status, total, billing_month, invoice_type, created_at')
    .eq('org_id', orgId)
    .eq('client_id', clientId)
    .order('created_at', { ascending: false });

  if (error || !data) return [];
  return data as Pick<
    InvoiceRow,
    'id' | 'invoice_number' | 'status' | 'total' | 'billing_month' | 'invoice_type' | 'created_at'
  >[];
}

export async function getClientNotes(
  clientId: string,
  orgId: string
): Promise<Pick<ClientNoteRow, 'id' | 'author_id' | 'body' | 'created_at'>[]> {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from('client_notes')
    .select('id, author_id, body, created_at')
    .eq('org_id', orgId)
    .eq('client_id', clientId)
    .order('created_at', { ascending: false });

  if (error || !data) return [];
  return data as Pick<ClientNoteRow, 'id' | 'author_id' | 'body' | 'created_at'>[];
}

export async function getTeamMembers(
  orgId: string
): Promise<Pick<TeamMemberRow, 'id' | 'name' | 'email' | 'role' | 'active'>[]> {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from('team_members')
    .select('id, name, email, role, active')
    .eq('org_id', orgId)
    .eq('active', true)
    .order('name', { ascending: true });

  if (error || !data) return [];
  return data as Pick<TeamMemberRow, 'id' | 'name' | 'email' | 'role' | 'active'>[];
}

export async function getTeamMembersAll(
  orgId: string
): Promise<Pick<TeamMemberRow, 'id' | 'name' | 'email' | 'role' | 'active'>[]> {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from('team_members')
    .select('id, name, email, role, active')
    .eq('org_id', orgId)
    .order('name', { ascending: true });

  if (error || !data) return [];
  return data as Pick<TeamMemberRow, 'id' | 'name' | 'email' | 'role' | 'active'>[];
}

export async function getTeamMemberDeliverableCount(
  orgId: string
): Promise<Record<string, number>> {
  const supabase = getSupabaseServerClient();
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);

  const { data, error } = await supabase
    .from('deliverables')
    .select('assignee_id')
    .eq('org_id', orgId)
    .gte('month', monthStart)
    .neq('status', 'published')
    .not('assignee_id', 'is', null);

  if (error || !data) return {};

  const counts: Record<string, number> = {};
  const rows = data as Pick<DeliverableRow, 'assignee_id'>[];
  for (const row of rows) {
    const id = row.assignee_id as string;
    counts[id] = (counts[id] ?? 0) + 1;
  }
  return counts;
}

