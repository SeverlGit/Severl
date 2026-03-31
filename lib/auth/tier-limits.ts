import { getSupabaseAdminClient } from '@/lib/supabase/server';
import type { PlanTier } from '@/lib/database.types';
import { TierLimitError, TIER_LIMITS } from '@/lib/billing/tier-definitions';

export * from '@/lib/billing/tier-definitions';

export async function checkClientLimit(orgId: string): Promise<void> {
  const supabase = getSupabaseAdminClient();
  
  const [{ data: org }, { count }] = await Promise.all([
    supabase.from('orgs').select('plan_tier').eq('id', orgId).single(),
    supabase.from('clients').select('id', { count: 'exact', head: true })
      .eq('org_id', orgId)
      .is('archived_at', null)
  ]);

  if (!org) {
    throw new Error('Organization not found');
  }

  const currentCount = count || 0;
  const tier = org.plan_tier as PlanTier;
  const limits = TIER_LIMITS[tier];

  if (currentCount >= limits.clients) {
    throw new TierLimitError(
      `Org ${orgId} hit client limit for tier ${tier} (${currentCount}/${limits.clients})`,
      `Your current plan (${tier}) is limited to ${limits.clients} clients. Please upgrade to add more.`
    );
  }
}

export async function checkDeliverableLimit(orgId: string, month: Date): Promise<void> {
  const supabase = getSupabaseAdminClient();
  const monthStart = new Date(month.getFullYear(), month.getMonth(), 1).toISOString().slice(0, 10);
  
  const [{ data: org }, { count }] = await Promise.all([
    supabase.from('orgs').select('plan_tier').eq('id', orgId).single(),
    supabase.from('deliverables').select('id', { count: 'exact', head: true })
      .eq('org_id', orgId)
      .eq('month', monthStart)
      .is('archived_at', null)
  ]);

  if (!org) {
    throw new Error('Organization not found');
  }

  const currentCount = count || 0;
  const tier = org.plan_tier as PlanTier;
  const limits = TIER_LIMITS[tier];

  if (currentCount >= limits.deliverables) {
    throw new TierLimitError(
      `Org ${orgId} hit deliverable limit for tier ${tier} (${currentCount}/${limits.deliverables})`,
      `Your current plan (${tier}) is limited to ${limits.deliverables} deliverables per month. Please upgrade to add more.`
    );
  }
}
