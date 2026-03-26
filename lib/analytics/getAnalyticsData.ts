import * as Sentry from '@sentry/nextjs';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import type {
  ClientRow,
  DeliverableRow,
  DeliveryRateByClientItem,
  RevenueByClientItem,
} from '@/lib/database.types';

export async function getAnalyticsMetrics(orgId: string) {
  const supabase = getSupabaseServerClient();

  const [activeRes, churnRes, renewalRes, deliveryRes] = await Promise.all([
    supabase
      .from('clients')
      .select('id, retainer_amount', { count: 'exact' })
      .eq('org_id', orgId)
      .eq('tag', 'active')
      .is('archived_at', null),
    supabase
      .from('clients')
      .select('id', { count: 'exact', head: true })
      .eq('org_id', orgId)
      .eq('tag', 'churned'),
    supabase
      .from('clients')
      .select('id', { count: 'exact', head: true })
      .eq('org_id', orgId)
      .eq('tag', 'active')
      .is('archived_at', null)
      .not('contract_renewal', 'is', null),
    supabase
      .from('deliverables')
      .select('status')
      .eq('org_id', orgId)
      .gte('month', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10))
      .lt('month', new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1).toISOString().slice(0, 10)),
  ]);

  if (activeRes.error) {
    Sentry.captureException(activeRes.error, { extra: { context: 'getAnalyticsMetrics', query: 'activeRes' } });
  }
  if (churnRes.error) {
    Sentry.captureException(churnRes.error, { extra: { context: 'getAnalyticsMetrics', query: 'churnRes' } });
  }
  if (renewalRes.error) {
    Sentry.captureException(renewalRes.error, { extra: { context: 'getAnalyticsMetrics', query: 'renewalRes' } });
  }
  if (deliveryRes.error) {
    Sentry.captureException(deliveryRes.error, { extra: { context: 'getAnalyticsMetrics', query: 'deliveryRes' } });
  }

  const activeCount = activeRes.count ?? 0;
  const mrr = (activeRes.data ?? []).reduce(
    (s: number, r: Pick<ClientRow, 'retainer_amount'>) => s + (r.retainer_amount ?? 0),
    0
  );
  const avgRetainer = activeCount > 0 ? Math.round(mrr / activeCount) : 0;
  const churnedCount = churnRes.count ?? 0;
  const totalClients = activeCount + churnedCount;
  const churnRate = totalClients > 0 ? Math.round((churnedCount / totalClients) * 100) : 0;
  const renewalCount = renewalRes.count ?? 0;
  const renewalRate = activeCount > 0 ? Math.round((renewalCount / activeCount) * 100) : 0;

  const deliverables = deliveryRes.data ?? [];
  const totalDel = deliverables.length;
  const publishedDel = deliverables.filter(
    (d: Pick<DeliverableRow, 'status'>) => d.status === 'published'
  ).length;
  const deliveryRate = totalDel > 0 ? Math.round((publishedDel / totalDel) * 100) : 0;

  return {
    mrr,
    active_clients: activeCount,
    churn_rate: churnRate,
    renewal_rate: renewalRate,
    avg_retainer: avgRetainer,
    delivery_rate: deliveryRate,
  };
}

export async function getRevenueByClient(orgId: string) {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from('clients')
    .select('id, brand_name, retainer_amount')
    .eq('org_id', orgId)
    .eq('tag', 'active')
    .is('archived_at', null)
    .gt('retainer_amount', 0)
    .order('retainer_amount', { ascending: false })
    .limit(10);

  if (error || !data) return [];
  return data as unknown as RevenueByClientItem[];
}

export async function getRenewalPipeline(orgId: string) {
  const supabase = getSupabaseServerClient();
  const today = new Date();
  const in90 = new Date();
  in90.setDate(today.getDate() + 90);

  const { data, error } = await supabase
    .from('clients')
    .select('id, brand_name, contract_renewal, retainer_amount')
    .eq('org_id', orgId)
    .eq('tag', 'active')
    .is('archived_at', null)
    .gte('contract_renewal', today.toISOString().slice(0, 10))
    .lte('contract_renewal', in90.toISOString().slice(0, 10))
    .order('contract_renewal', { ascending: true });

  if (error || !data) return [];
  return data as Pick<ClientRow, 'id' | 'brand_name' | 'contract_renewal' | 'retainer_amount'>[];
}

export async function getDeliveryRateByClient(orgId: string): Promise<DeliveryRateByClientItem[]> {
  const supabase = getSupabaseServerClient();
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString().slice(0, 10);

  const { data, error } = await supabase
    .from('deliverables')
    .select('client_id, status, clients!inner(brand_name)')
    .eq('org_id', orgId)
    .gte('month', monthStart)
    .lt('month', monthEnd);

  if (error || !data) return [];

  type Row = { client_id: string; status: string; clients: { brand_name: string } };
  const byClient: Record<string, { brand_name: string; total: number; published: number }> = {};
  const rows = data as unknown as Row[];
  for (const d of rows) {
    const cid = d.client_id;
    if (!byClient[cid]) byClient[cid] = { brand_name: d.clients.brand_name, total: 0, published: 0 };
    byClient[cid].total++;
    if (d.status === 'published') byClient[cid].published++;
  }

  return Object.entries(byClient).map(([id, v]) => ({
    id,
    ...v,
    pct: v.total > 0 ? Math.round((v.published / v.total) * 100) : 0,
  })) as DeliveryRateByClientItem[];
}
