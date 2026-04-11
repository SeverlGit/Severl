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

/**
 * Check whether the org's plan tier includes a specific boolean feature.
 * Throws TierLimitError if the feature is not available on the current tier.
 *
 * Usage:
 *   await checkFeatureAccess(orgId, 'invoicePaymentLinks', 'pro');
 */
export async function checkFeatureAccess(
  orgId: string,
  feature: 'invoicePaymentLinks' | 'invoiceCsvExport' | 'whitelabelApprovals' | 'autoRecurringInvoices' | 'clientPortal',
  requiredTier: 'pro' | 'elite' | 'agency',
): Promise<void> {
  const supabase = getSupabaseAdminClient();
  const { data: org, error } = await supabase.from('orgs').select('plan_tier').eq('id', orgId).single();

  if (error) throw new Error(`Database error fetching org: ${error.message}`);
  if (!org) throw new Error('Organization not found');

  const tier = org.plan_tier as PlanTier;
  const limits = TIER_LIMITS[tier];

  if (!limits[feature]) {
    throw new TierLimitError(
      `Org ${orgId} on tier ${tier} cannot access feature ${feature} (requires ${requiredTier})`,
      `This feature requires the ${requiredTier} plan or higher. Please upgrade to access it.`
    );
  }
}

/**
 * Check whether the org has brand guide shares remaining this calendar month.
 * Returns the current share count and the limit.
 * Throws TierLimitError if the monthly limit is exhausted.
 */
export async function checkBrandGuideShareLimit(orgId: string): Promise<{ used: number; limit: number | null }> {
  const supabase = getSupabaseAdminClient();
  const { data: org, error } = await supabase
    .from('orgs')
    .select('plan_tier, ui_meta')
    .eq('id', orgId)
    .single();

  if (error) throw new Error(`Database error fetching org: ${error.message}`);
  if (!org) throw new Error('Organization not found');

  const tier = org.plan_tier as PlanTier;
  const limits = TIER_LIMITS[tier];

  // Unlimited on pro/elite/agency
  if (limits.brandGuideSharesPerMonth === null) {
    return { used: 0, limit: null };
  }

  const monthKey = `brand_guide_shares_${new Date().toISOString().slice(0, 7).replace('-', '_')}`;
  const used = (org.ui_meta as Record<string, number>)[monthKey] ?? 0;

  if (used >= limits.brandGuideSharesPerMonth) {
    throw new TierLimitError(
      `Org ${orgId} hit brand guide share limit for tier ${tier} (${used}/${limits.brandGuideSharesPerMonth} this month)`,
      `Your current plan allows ${limits.brandGuideSharesPerMonth} brand guide shares per month. Upgrade to Pro for unlimited sharing.`
    );
  }

  return { used, limit: limits.brandGuideSharesPerMonth };
}
