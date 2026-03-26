import { getSupabaseServerClient } from '@/lib/supabase/server';
import type { BatchBillingClient } from '@/lib/database.types';

export async function getBatchBillingClients(orgId: string): Promise<BatchBillingClient[]> {
  const supabase = getSupabaseServerClient();
  const now = new Date();
  const billingMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);

  const [activeClientsRes, existingInvoicesRes] = await Promise.all([
    supabase
      .from('clients')
      .select('id, brand_name, retainer_amount')
      .eq('org_id', orgId)
      .eq('tag', 'active')
      .gt('retainer_amount', 0)
      .is('archived_at', null)
      .order('retainer_amount', { ascending: false }),
    supabase
      .from('invoices')
      .select('client_id')
      .eq('org_id', orgId)
      .eq('billing_month', billingMonth)
      .neq('status', 'voided'),
  ]);

  const { data: activeClients, error: clientsErr } = activeClientsRes;
  if (clientsErr || !activeClients) return [];

  const invoicedIds = new Set(
    (existingInvoicesRes.data ?? []).map((i: { client_id: string }) => i.client_id)
  );

  return activeClients.filter((c) => !invoicedIds.has(c.id));
}
