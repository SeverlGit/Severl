import * as Sentry from '@sentry/nextjs';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import type { InvoiceRow, InvoiceWithClient } from '@/lib/database.types';

export async function getInvoices(
  orgId: string,
  status?: string,
  search?: string
): Promise<InvoiceWithClient[]> {
  const supabase = getSupabaseServerClient();

  let query = supabase
    .from('invoices')
    .select('id, invoice_number, invoice_type, status, total, due_date, paid_date, payment_method, billing_month, notes, created_at, client_id, clients!inner(brand_name)')
    .eq('org_id', orgId)
    .order('created_at', { ascending: false });

  if (status && status !== 'all') {
    query = query.eq('status', status);
  }

  if (search && search.trim()) {
    const term = `%${search.trim()}%`;
    query = query.or(`invoice_number.ilike.${term},clients.brand_name.ilike.${term}`);
  }

  const { data, error } = await query;
  if (error || !data) return [];
  return data as unknown as InvoiceWithClient[];
}

export async function getInvoiceSummary(orgId: string) {
  const supabase = getSupabaseServerClient();
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);

  const [paidRes, outstandingRes, overdueRes, retainerRes] = await Promise.all([
    supabase
      .from('invoices')
      .select('total')
      .eq('org_id', orgId)
      .eq('status', 'paid')
      .gte('paid_date', monthStart),
    supabase
      .from('invoices')
      .select('total')
      .eq('org_id', orgId)
      .in('status', ['sent', 'overdue']),
    supabase
      .from('invoices')
      .select('total')
      .eq('org_id', orgId)
      .eq('status', 'overdue'),
    supabase
      .from('clients')
      .select('id', { count: 'exact', head: true })
      .eq('org_id', orgId)
      .eq('tag', 'active')
      .gt('retainer_amount', 0)
      .is('archived_at', null),
  ]);

  if (paidRes.error) {
    Sentry.captureException(paidRes.error, { extra: { context: 'getInvoiceSummary', query: 'paidRes' } });
  }
  if (outstandingRes.error) {
    Sentry.captureException(outstandingRes.error, { extra: { context: 'getInvoiceSummary', query: 'outstandingRes' } });
  }
  if (overdueRes.error) {
    Sentry.captureException(overdueRes.error, { extra: { context: 'getInvoiceSummary', query: 'overdueRes' } });
  }
  if (retainerRes.error) {
    Sentry.captureException(retainerRes.error, { extra: { context: 'getInvoiceSummary', query: 'retainerRes' } });
  }

  const sum = (rows: Pick<InvoiceRow, 'total'>[] | null) =>
    (rows ?? []).reduce((s: number, r) => s + (r.total ?? 0), 0);

  return {
    collected_this_month: sum(paidRes.data),
    outstanding: sum(outstandingRes.data),
    overdue_total: sum(overdueRes.data),
    active_retainers: retainerRes.count ?? 0,
  };
}

export async function getInvoiceCountsByStatus(orgId: string) {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from('invoices')
    .select('status')
    .eq('org_id', orgId);

  if (error || !data) return { all: 0, draft: 0, sent: 0, paid: 0, overdue: 0, voided: 0 };

  const counts: Record<string, number> = { all: data.length, draft: 0, sent: 0, paid: 0, overdue: 0, voided: 0 };
  const rows = data as Pick<InvoiceRow, 'status'>[];
  for (const row of rows) {
    const s = row.status;
    if (s in counts) counts[s]++;
  }
  return counts;
}

export type InvoiceClientOption = { id: string; brand_name: string };

/** Active, non-archived clients for manual invoice creation. */
export async function getClientsForInvoiceCreation(orgId: string): Promise<InvoiceClientOption[]> {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from('clients')
    .select('id, brand_name')
    .eq('org_id', orgId)
    .eq('tag', 'active')
    .is('archived_at', null)
    .order('brand_name', { ascending: true });

  if (error || !data) return [];
  return data;
}
