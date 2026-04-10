import { getSupabaseServerClient } from '@/lib/supabase/server';
import type { DeliverableWithClient } from '@/lib/database.types';

type ClientRowBrief = {
  id: string;
  brand_name: string;
  platforms: string[] | null;
};

/**
 * Active + onboarding clients for the deliverables board (may have zero deliverables this month).
 */
export async function getActiveOnboardingClientsForDeliverables(
  orgId: string
): Promise<ClientRowBrief[]> {
  const supabase = getSupabaseServerClient();

  const { data, error } = await supabase
    .from('clients')
    .select('id, brand_name, platforms')
    .eq('org_id', orgId)
    .is('archived_at', null)
    .in('tag', ['active', 'onboarding'])
    .order('brand_name', { ascending: true });

  if (error || !data) return [];
  return data.map((row) => ({
    id: row.id,
    brand_name: row.brand_name,
    platforms: row.platforms as string[] | null,
  }));
}

function localMonthFirstDayStr(month: Date): string {
  const y = month.getFullYear();
  const m = month.getMonth() + 1;
  return `${y}-${String(m).padStart(2, '0')}-01`;
}

export async function getMonthlyDeliverables(
  orgId: string,
  month: Date
): Promise<DeliverableWithClient[]> {
  const supabase = getSupabaseServerClient();
  const monthKey = localMonthFirstDayStr(month);

  const { data, error } = await supabase
    .from('deliverables')
    .select(
      'id, org_id, client_id, month, type, title, status, assignee_id, due_date, notes, approval_token, approval_sent_at, approval_expires_at, approved_at, approval_notes, archived_at, clients!inner(brand_name, platforms, tag, retainer_amount, archived_at, contact_email, contact_name), team_members(name)'
    )
    .eq('org_id', orgId)
    .eq('month', monthKey)
    .is('archived_at', null)
    .is('clients.archived_at', null)
    .not('clients.tag', 'in', '("paused","churned")')
    .order('due_date', { ascending: true, nullsFirst: false });

  if (error || !data) return [];
  return data as unknown as DeliverableWithClient[];
}

/**
 * Compute per-client deliverable stats from already-fetched deliverables.
 * Avoids a second DB round-trip when the deliverables are already loaded.
 */
export function computeDeliverableStats(
  deliverables: { client_id: string; status: string }[]
): Record<string, { total: number; published: number }> {
  const stats: Record<string, { total: number; published: number }> = {};
  for (const d of deliverables) {
    if (!stats[d.client_id]) stats[d.client_id] = { total: 0, published: 0 };
    stats[d.client_id].total += 1;
    if (d.status === 'published') stats[d.client_id].published += 1;
  }
  return stats;
}


