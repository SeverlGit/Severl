import { getSupabaseAdminClient } from '@/lib/supabase/server';
import type { PlanTier } from '@/lib/database.types';
import { TierLimitError, TIER_LIMITS } from '@/lib/billing/tier-definitions';

export * from '@/lib/billing/tier-definitions';

export async function checkClientLimit(orgId: string): Promise<void> {
  const supabase = getSupabaseAdminClient();
  
  const [{ data: org, error: orgError }, { count, error: countError }] = await Promise.all([
    supabase.from('orgs').select('plan_tier').eq('id', orgId).single(),
    supabase.from('clients').select('id', { count: 'exact', head: true })
      .eq('org_id', orgId)
      .is('archived_at', null)
  ]);

  if (orgError) {
    throw new Error(`Database error fetching org limits: ${orgError.message}`);
  }
  if (!org) {
    throw new Error('Organization not found');
  }
  if (countError) {
    throw new Error(`Database error counting clients: ${countError.message}`);
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

export async function checkStorageLimit(orgId: string, bytesToAdd: number): Promise<void> {
  const supabase = getSupabaseAdminClient();
  const { data: org, error: orgError } = await supabase.from('orgs').select('plan_tier').eq('id', orgId).single();
  
  if (orgError) throw new Error(`Database error fetching org limits: ${orgError.message}`);
  if (!org) throw new Error('Organization not found');

  const tier = org.plan_tier as PlanTier;
  const limits = TIER_LIMITS[tier];

  // NOTE: Currently, actual usage calculation is deferred to Supabase Storage RLS.
  // This function serves as the application-level gate if file uploads are implemented in the API.
  // For full enforcement, sum sizes of objects in org-files/[orgId] + bytesToAdd and compare.

  if (bytesToAdd > limits.storageBytes) {
    throw new TierLimitError(
      `File exceeds storage limit for tier ${tier}`,
      `Your current plan (${tier}) is limited to ${limits.storageBytes / (1024 ** 3)} GB of storage. Please upgrade to add larger files.`
    );
  }
}

export async function checkDeliverableLimit(orgId: string, month: Date): Promise<void> {
  const supabase = getSupabaseAdminClient();
  const monthStartStr = `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, '0')}-01`;
  
  const [{ data: org, error: orgError }, { count, error: countError }] = await Promise.all([
    supabase.from('orgs').select('plan_tier').eq('id', orgId).single(),
    supabase.from('deliverables').select('id', { count: 'exact', head: true })
      .eq('org_id', orgId)
      .eq('month', monthStartStr)
      .is('archived_at', null)
  ]);

  if (orgError) {
    throw new Error(`Database error fetching org limits: ${orgError.message}`);
  }
  if (!org) {
    throw new Error('Organization not found');
  }
  if (countError) {
    throw new Error(`Database error counting deliverables: ${countError.message}`);
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
