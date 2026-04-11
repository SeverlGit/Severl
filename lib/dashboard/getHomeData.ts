import { unstable_cache } from 'next/cache';
import * as Sentry from '@sentry/nextjs';
import { subMonths } from 'date-fns';
import { getSupabaseServerClient, getSupabaseAdminClient } from '@/lib/supabase/server';
import type {
  EventRow,
  InvoiceRow,
  DeliverableWithClientForWeek,
  RecentInvoiceWithClient,
  RenewalClient,
} from '@/lib/database.types';

export type MRRTrendPoint = {
  month: string; // ISO string for first of month
  mrr: number;
};

type MRRTrendResult = {
  points: MRRTrendPoint[];
  /** True when the current month bar uses live retainer sums (no/zero payment events yet). */
  currentMonthUsesLiveRetainers: boolean;
};

async function getMRRAndActiveCount(orgId: string): Promise<{ mrr: number; activeCount: number }> {
  const supabase = getSupabaseServerClient();
  const { data, count, error } = await supabase
    .from('clients')
    .select('retainer_amount', { count: 'exact' })
    .eq('org_id', orgId)
    .eq('tag', 'active')
    .is('archived_at', null);

  if (error) {
    Sentry.captureException(error);
    return { mrr: 0, activeCount: 0 };
  }

  const mrr = (data || []).reduce((sum, c) => sum + (c.retainer_amount ?? 0), 0);
  return { mrr, activeCount: count ?? 0 };
}

export async function getDeliverablesBehind(orgId: string): Promise<number> {
  const supabase = getSupabaseServerClient();
  const { count, error } = await supabase
    .from('deliverables')
    .select('id', { count: 'exact', head: true })
    .eq('org_id', orgId)
    .lt('due_date', new Date().toISOString().slice(0, 10))
    .neq('status', 'published')
    .gte('month', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString())
    .lt(
      'month',
      new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1).toISOString(),
    );

  if (error) {
    Sentry.captureException(error, { extra: { context: 'getDeliverablesBehind' } });
  }
  return count ?? 0;
}

export async function getAtRiskCount(orgId: string): Promise<number> {
  const supabase = getSupabaseServerClient();
  const { count, error } = await supabase
    .from('clients')
    .select('id', { count: 'exact', head: true })
    .eq('org_id', orgId)
    .eq('tag', 'at_risk')
    .is('archived_at', null);

  if (error) {
    Sentry.captureException(error, { extra: { context: 'getAtRiskCount' } });
  }
  return count ?? 0;
}

export async function getOverdueInvoices(orgId: string): Promise<{ count: number; total: number }> {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from('invoices')
    .select('total')
    .eq('org_id', orgId)
    .eq('status', 'overdue');

  if (error || !data) return { count: 0, total: 0 };
  const total = (data as Pick<InvoiceRow, 'total'>[]).reduce(
    (sum: number, row) => sum + (row.total ?? 0),
    0
  );
  return { count: data.length, total };
}

export async function getDeliverablesThisWeek(orgId: string) {
  const supabase = getSupabaseServerClient();
  const today = new Date();
  const in7 = new Date();
  in7.setDate(today.getDate() + 7);

  const { data, error } = await supabase
    .from('deliverables')
    .select('id, client_id, type, title, status, due_date, notes, clients!inner(brand_name, platforms, archived_at)')
    .eq('org_id', orgId)
    .gte('due_date', today.toISOString().slice(0, 10))
    .lte('due_date', in7.toISOString().slice(0, 10))
    .neq('status', 'published')
    .is('clients.archived_at', null)
    .order('due_date', { ascending: true })
    .order('clients.brand_name', { ascending: true });

  if (error || !data) return [];
  return data as unknown as DeliverableWithClientForWeek[];
}

async function _getMRRTrend(orgId: string): Promise<MRRTrendResult> {
  const admin = getSupabaseAdminClient();
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
  sixMonthsAgo.setDate(1);

  const { data, error } = await admin
    .from('events')
    .select('created_at, amount')
    .eq('org_id', orgId)
    .eq('event_type', 'payment.received')
    .gte('created_at', sixMonthsAgo.toISOString());

  if (error) {
    Sentry.captureException(error);
    return { points: [], currentMonthUsesLiveRetainers: false };
  }

  const buckets = new Map<string, number>();
  for (let i = 0; i < 6; i++) {
    const d = new Date(sixMonthsAgo);
    d.setMonth(sixMonthsAgo.getMonth() + i);
    const key = new Date(d.getFullYear(), d.getMonth(), 1).toISOString();
    buckets.set(key, 0);
  }

  (data as Pick<EventRow, 'created_at' | 'amount'>[] | null)?.forEach((row) => {
    const d = new Date(row.created_at);
    const key = new Date(d.getFullYear(), d.getMonth(), 1).toISOString();
    if (!buckets.has(key)) buckets.set(key, 0);
    buckets.set(key, (buckets.get(key) ?? 0) + (row.amount ?? 0));
  });

  const trendData = Array.from(buckets.entries())
    .sort((a, b) => (a[0] < b[0] ? -1 : 1))
    .map(([month, mrr]) => ({ month, mrr }));

  const now = new Date();
  const currentMonthKey = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const currentMonthEntry = trendData.find((d) => d.month === currentMonthKey);

  let currentMonthUsesLiveRetainers = false;

  if (!currentMonthEntry || currentMonthEntry.mrr === 0) {
    const supabase = getSupabaseServerClient();
    const { data: activeClients, error: clientsErr } = await supabase
      .from('clients')
      .select('retainer_amount')
      .eq('org_id', orgId)
      .eq('tag', 'active')
      .is('archived_at', null);

    if (clientsErr) {
      Sentry.captureException(clientsErr);
    }

    const liveSum = (activeClients ?? []).reduce(
      (sum, c) => sum + (c.retainer_amount ?? 0),
      0,
    );

    if (liveSum > 0) {
      if (currentMonthEntry) {
        currentMonthEntry.mrr = liveSum;
      } else {
        trendData.push({ month: currentMonthKey, mrr: liveSum });
        trendData.sort((a, b) => (a.month < b.month ? -1 : 1));
      }
      currentMonthUsesLiveRetainers = true;
    }
  }

  return { points: trendData, currentMonthUsesLiveRetainers };
}

export const getMRRTrend = (orgId: string) =>
  unstable_cache(
    () => _getMRRTrend(orgId),
    [`mrr-trend-${orgId}`],
    { revalidate: 60, tags: [`dashboard-${orgId}`] },
  )();

export async function getRecentInvoices(orgId: string) {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from('invoices')
    .select('id, invoice_number, status, total, created_at, clients!inner(brand_name)')
    .eq('org_id', orgId)
    .order('created_at', { ascending: false })
    .limit(4);

  if (error || !data) return [];
  return data as unknown as RecentInvoiceWithClient[];
}

async function _getUpcomingRenewalsList(orgId: string): Promise<RenewalClient[]> {
  const supabase = getSupabaseAdminClient();
  const today = new Date();
  const in90 = new Date();
  in90.setDate(today.getDate() + 90);

  const { data, error } = await supabase
    .from('clients')
    .select('id, brand_name, contract_renewal, retainer_amount, tag')
    .eq('org_id', orgId)
    .gte('contract_renewal', today.toISOString().slice(0, 10))
    .lte('contract_renewal', in90.toISOString().slice(0, 10))
    .is('archived_at', null)
    .order('contract_renewal', { ascending: true });

  if (error || !data) return [];
  return data as unknown as RenewalClient[];
}

export const getUpcomingRenewalsList = (orgId: string) =>
  unstable_cache(
    () => _getUpcomingRenewalsList(orgId),
    [`upcoming-renewals-${orgId}`],
    { revalidate: 60, tags: [`dashboard-${orgId}`] },
  )();

export async function getHomeData(orgId: string) {
  const [
    mrrAndActive,
    deliverablesBehind,
    atRiskCount,
    overdue,
    deliverablesWeek,
    mrrTrend,
    recentInvoices,
    renewalsList,
    clientCountSparkline,
    churnRiskScores,
  ] = await Promise.all([
    getMRRAndActiveCount(orgId),
    getDeliverablesBehind(orgId),
    getAtRiskCount(orgId),
    getOverdueInvoices(orgId),
    getDeliverablesThisWeek(orgId),
    getMRRTrend(orgId).then((r) => r.points),
    getRecentInvoices(orgId),
    getUpcomingRenewalsList(orgId),
    getClientCountSparkline(orgId),
    getChurnRiskScores(orgId),
  ]);

  const { mrr, activeCount: activeClients } = mrrAndActive;
  const upcomingRenewals = renewalsList.filter(
    (c) => c.tag === 'active' && daysUntil(c.contract_renewal ?? '') <= 30
  ).length;
  const mrrSparkline = mrrTrend.map((point) => point.mrr);

  return {
    mrr,
    activeClients,
    deliverablesBehind,
    atRiskCount,
    overdue,
    renewalsCount: upcomingRenewals,
    deliverablesWeek,
    mrrTrend,
    mrrSparkline,
    clientSparkline: clientCountSparkline,
    recentInvoices,
    renewalsList,
    churnRiskScores,
  };
}

function daysUntil(dateStr: string): number {
  const d = new Date(dateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  d.setHours(0, 0, 0, 0);
  return Math.ceil((d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

async function _getClientCountSparkline(orgId: string): Promise<number[]> {
  const supabase = getSupabaseAdminClient();
  const twelveMonthsAgo = subMonths(new Date(), 12);

  const { data, error } = await supabase
    .from('events')
    .select('event_type, created_at')
    .eq('org_id', orgId)
    .in('event_type', ['client.added', 'client.churned'])
    .gte('created_at', twelveMonthsAgo.toISOString());

  if (error || !data) return [];

  const deltas: Record<string, number> = {};
  for (const row of data as Pick<EventRow, 'event_type' | 'created_at'>[]) {
    const d = new Date(row.created_at);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    if (!deltas[key]) deltas[key] = 0;
    deltas[key] += row.event_type === 'client.added' ? 1 : -1;
  }

  const months: string[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  }

  let running = 0;
  const result: number[] = [];
  const sortedKeys = Object.keys(deltas).sort();
  for (const key of sortedKeys) {
    if (key < months[0]) running += deltas[key];
  }
  for (const m of months) {
    running += deltas[m] ?? 0;
    result.push(Math.max(running, 0));
  }
  return result;
}

export const getClientCountSparkline = (orgId: string) =>
  unstable_cache(
    () => _getClientCountSparkline(orgId),
    [`client-count-sparkline-${orgId}`],
    { revalidate: 60, tags: [`dashboard-${orgId}`] },
  )();

export type ChurnRiskItem = {
  clientId: string;
  name: string;
  score: number; // 0–100
  topReason: string;
  retainer_amount: number;
};

/**
 * getChurnRiskScores — computes a churn risk score (0–100) for each active client.
 *
 * Scoring factors (each contributes up to 25 points):
 * 1. Renewal proximity: < 14 days = 25, < 30 days = 15, < 60 days = 8, else 0
 * 2. Overdue invoice: any overdue invoice = 25
 * 3. High revision rate: any deliverable with revision_round >= 2 this month = 25
 * 4. Low delivery rate: < 70% published this month = 25, < 85% = 10
 *
 * Returns top 5 by score descending.
 */
export async function getChurnRiskScores(orgId: string): Promise<ChurnRiskItem[]> {
  const supabase = getSupabaseAdminClient();
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString().slice(0, 10);

  const [clientsRes, invoicesRes, deliverablesRes] = await Promise.all([
    supabase
      .from('clients')
      .select('id, brand_name, contract_renewal, retainer_amount')
      .eq('org_id', orgId)
      .eq('tag', 'active')
      .is('archived_at', null),
    supabase
      .from('invoices')
      .select('client_id, status')
      .eq('org_id', orgId)
      .eq('status', 'overdue'),
    supabase
      .from('deliverables')
      .select('client_id, status, revision_round')
      .eq('org_id', orgId)
      .gte('month', monthStart)
      .lt('month', monthEnd)
      .is('archived_at', null),
  ]);

  if (!clientsRes.data) return [];

  const overdueClients = new Set(
    (invoicesRes.data ?? []).map((i) => i.client_id),
  );

  const delivByClient: Record<string, { total: number; published: number; maxRevRound: number }> = {};
  for (const d of deliverablesRes.data ?? []) {
    const cid = d.client_id;
    if (!delivByClient[cid]) delivByClient[cid] = { total: 0, published: 0, maxRevRound: 0 };
    delivByClient[cid].total++;
    if (d.status === 'published') delivByClient[cid].published++;
    if ((d.revision_round ?? 0) > delivByClient[cid].maxRevRound) {
      delivByClient[cid].maxRevRound = d.revision_round ?? 0;
    }
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const scored: ChurnRiskItem[] = clientsRes.data.map((client) => {
    let score = 0;
    const reasons: string[] = [];

    // Factor 1: renewal proximity
    if (client.contract_renewal) {
      const renewDate = new Date(client.contract_renewal);
      renewDate.setHours(0, 0, 0, 0);
      const days = Math.ceil((renewDate.getTime() - today.getTime()) / 86_400_000);
      if (days <= 14) { score += 25; reasons.push('Renewal in 2 weeks'); }
      else if (days <= 30) { score += 15; reasons.push('Renewal due soon'); }
      else if (days <= 60) { score += 8; }
    }

    // Factor 2: overdue invoice
    if (overdueClients.has(client.id)) {
      score += 25;
      reasons.push('Overdue invoice');
    }

    // Factor 3: high revision count
    const deliv = delivByClient[client.id];
    if (deliv && deliv.maxRevRound >= 2) {
      score += 25;
      reasons.push('Multiple revisions');
    }

    // Factor 4: low delivery rate
    if (deliv && deliv.total > 0) {
      const pct = deliv.published / deliv.total;
      if (pct < 0.7) { score += 25; reasons.push('Low delivery rate'); }
      else if (pct < 0.85) { score += 10; }
    }

    return {
      clientId: client.id,
      name: client.brand_name,
      score: Math.min(score, 100),
      topReason: reasons[0] ?? 'Low risk',
      retainer_amount: client.retainer_amount ?? 0,
    };
  });

  return scored
    .filter((c) => c.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);
}

