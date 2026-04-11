import * as Sentry from '@sentry/nextjs';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import type {
  ClientRow,
  DeliverableRow,
  DeliveryRateByClientItem,
  RevenueByClientItem,
} from '@/lib/database.types';

export type CapacityMetricItem = {
  id: string;
  brand_name: string;
  retainer_amount: number;
  deliverable_count: number;
  per_deliverable: number;
  vs_avg: number; // positive = above average, negative = below
};

export type RevenueForecastPoint = {
  month: string; // 'YYYY-MM'
  label: string; // e.g. 'May 2026'
  projected_mrr: number;
  renewals_due: number;
  at_risk_revenue: number;
};

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

export type ApprovalStats = {
  avgApprovalDays: number | null;
  revisionRate: number;
  fastestClient: { name: string; avgDays: number } | null;
  mostRevisionsClient: { name: string; rounds: number } | null;
};

/**
 * getApprovalStats — approval performance metrics for Elite+ analytics card.
 *
 * Computes:
 * - Average days between approval_sent_at and approved_at
 * - Revision rate (% of deliverables that needed at least one revision)
 * - Fastest client (lowest avg approval time)
 * - Most revisions client (highest avg revision_round)
 */
export async function getApprovalStats(orgId: string): Promise<ApprovalStats> {
  const supabase = getSupabaseServerClient();

  const { data, error } = await supabase
    .from('deliverables')
    .select('client_id, status, approval_sent_at, approved_at, revision_round, clients!inner(brand_name)')
    .eq('org_id', orgId)
    .not('approval_sent_at', 'is', null)
    .is('archived_at', null);

  if (error || !data) return { avgApprovalDays: null, revisionRate: 0, fastestClient: null, mostRevisionsClient: null };

  type Row = {
    client_id: string;
    status: string;
    approval_sent_at: string | null;
    approved_at: string | null;
    revision_round: number;
    clients: { brand_name: string };
  };

  const rows = data as unknown as Row[];
  const approvedRows = rows.filter((r) => r.approved_at && r.approval_sent_at);
  const withRevisions = rows.filter((r) => (r.revision_round ?? 0) > 0);

  // Overall avg approval days
  let avgApprovalDays: number | null = null;
  if (approvedRows.length > 0) {
    const totalMs = approvedRows.reduce((sum, r) => {
      return sum + (new Date(r.approved_at!).getTime() - new Date(r.approval_sent_at!).getTime());
    }, 0);
    avgApprovalDays = Math.round(totalMs / approvedRows.length / 86_400_000 * 10) / 10;
  }

  // Revision rate
  const revisionRate = rows.length > 0 ? Math.round((withRevisions.length / rows.length) * 100) : 0;

  // Per-client stats
  const byClient: Record<string, { name: string; totalDays: number; count: number; totalRounds: number }> = {};
  for (const r of rows) {
    const cid = r.client_id;
    if (!byClient[cid]) byClient[cid] = { name: r.clients.brand_name, totalDays: 0, count: 0, totalRounds: 0 };
    byClient[cid].totalRounds += r.revision_round ?? 0;
    if (r.approved_at && r.approval_sent_at) {
      const days = (new Date(r.approved_at).getTime() - new Date(r.approval_sent_at).getTime()) / 86_400_000;
      byClient[cid].totalDays += days;
      byClient[cid].count++;
    }
  }

  const clientList = Object.entries(byClient).map(([, v]) => ({
    name: v.name,
    avgDays: v.count > 0 ? Math.round((v.totalDays / v.count) * 10) / 10 : null,
    avgRounds: v.totalRounds,
  }));

  const fastest = clientList
    .filter((c) => c.avgDays !== null)
    .sort((a, b) => (a.avgDays ?? 0) - (b.avgDays ?? 0))[0] ?? null;

  const mostRevisions = clientList
    .sort((a, b) => b.avgRounds - a.avgRounds)[0] ?? null;

  return {
    avgApprovalDays,
    revisionRate,
    fastestClient: fastest ? { name: fastest.name, avgDays: fastest.avgDays! } : null,
    mostRevisionsClient: mostRevisions && mostRevisions.avgRounds > 0
      ? { name: mostRevisions.name, rounds: mostRevisions.avgRounds }
      : null,
  };
}

/**
 * getCapacityMetrics — effective revenue per deliverable per client.
 *
 * Computes: retainer_amount / deliverables_this_month for each active client.
 * Sorted by per_deliverable rate descending. Includes vs_avg delta.
 */
export async function getCapacityMetrics(orgId: string): Promise<CapacityMetricItem[]> {
  const supabase = getSupabaseServerClient();
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString().slice(0, 10);

  const [clientsRes, deliverablesRes] = await Promise.all([
    supabase
      .from('clients')
      .select('id, brand_name, retainer_amount')
      .eq('org_id', orgId)
      .eq('tag', 'active')
      .is('archived_at', null)
      .gt('retainer_amount', 0),
    supabase
      .from('deliverables')
      .select('client_id')
      .eq('org_id', orgId)
      .gte('month', monthStart)
      .lt('month', monthEnd)
      .is('archived_at', null),
  ]);

  if (clientsRes.error || deliverablesRes.error) return [];

  const delivCountByClient: Record<string, number> = {};
  for (const d of deliverablesRes.data ?? []) {
    delivCountByClient[d.client_id] = (delivCountByClient[d.client_id] ?? 0) + 1;
  }

  const items: CapacityMetricItem[] = (clientsRes.data ?? []).map((c) => {
    const count = delivCountByClient[c.id] ?? 0;
    const retainer = c.retainer_amount ?? 0;
    return {
      id: c.id,
      brand_name: c.brand_name,
      retainer_amount: retainer,
      deliverable_count: count,
      per_deliverable: count > 0 ? Math.round(retainer / count) : retainer,
      vs_avg: 0, // computed below
    };
  });

  const withDelivs = items.filter((i) => i.deliverable_count > 0);
  const avgPerDel =
    withDelivs.length > 0
      ? withDelivs.reduce((sum, i) => sum + i.per_deliverable, 0) / withDelivs.length
      : 0;

  for (const item of items) {
    item.vs_avg = Math.round(item.per_deliverable - avgPerDel);
  }

  return items.sort((a, b) => b.per_deliverable - a.per_deliverable);
}

/**
 * getRevenueForecast — projects MRR for the next `months` calendar months.
 *
 * Logic:
 * - Start from current MRR (active retainer sum)
 * - For each month in window: identify clients whose contract_renewal falls within the month
 * - If a client has churn_risk_score > 60, mark their retainer as at_risk_revenue
 * - Projected MRR = current MRR - at_risk_revenue
 *
 * Requires `churnScores` map (clientId → score) from getChurnRiskScores.
 */
export async function getRevenueForecast(
  orgId: string,
  months: number = 3,
  churnScores: Record<string, number> = {},
): Promise<RevenueForecastPoint[]> {
  const supabase = getSupabaseServerClient();

  const { data: clients } = await supabase
    .from('clients')
    .select('id, brand_name, retainer_amount, contract_renewal')
    .eq('org_id', orgId)
    .eq('tag', 'active')
    .is('archived_at', null);

  if (!clients) return [];

  const currentMrr = clients.reduce((sum, c) => sum + (c.retainer_amount ?? 0), 0);
  const now = new Date();

  const points: RevenueForecastPoint[] = [];

  for (let i = 0; i < months; i++) {
    const monthDate = new Date(now.getFullYear(), now.getMonth() + i + 1, 1);
    const monthKey = `${monthDate.getFullYear()}-${String(monthDate.getMonth() + 1).padStart(2, '0')}`;
    const label = monthDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

    const monthStart = monthDate.toISOString().slice(0, 7);
    const renewalsDue = clients.filter((c) => {
      if (!c.contract_renewal) return false;
      return c.contract_renewal.startsWith(monthStart);
    });

    const atRiskRevenue = renewalsDue.reduce((sum, c) => {
      const score = churnScores[c.id] ?? 0;
      return score > 60 ? sum + (c.retainer_amount ?? 0) : sum;
    }, 0);

    points.push({
      month: monthKey,
      label,
      projected_mrr: Math.max(0, currentMrr - atRiskRevenue),
      renewals_due: renewalsDue.length,
      at_risk_revenue: atRiskRevenue,
    });
  }

  return points;
}
