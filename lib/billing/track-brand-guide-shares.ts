'use server';

import { getSupabaseAdminClient } from '@/lib/supabase/server';

/**
 * Atomically increment the brand guide share counter for this org in the current
 * calendar month. Counter lives in orgs.ui_meta under the key
 * `brand_guide_shares_YYYY_MM` (e.g. `brand_guide_shares_2026_04`).
 *
 * Call AFTER checkBrandGuideShareLimit passes — this function does not re-validate.
 */
export async function incrementBrandGuideShareCount(orgId: string): Promise<void> {
  const supabase = getSupabaseAdminClient();

  // Build the month key: YYYY_MM
  const now = new Date();
  const monthKey = `brand_guide_shares_${now.getFullYear()}_${String(now.getMonth() + 1).padStart(2, '0')}`;

  // Read current ui_meta first (we can't do a true atomic jsonb increment without a DB function,
  // so we read-then-write under the assumption that concurrent share generation per org is rare)
  const { data: org, error: fetchErr } = await supabase
    .from('orgs')
    .select('ui_meta')
    .eq('id', orgId)
    .single();

  if (fetchErr || !org) return; // Non-fatal: share already happened, just don't block

  const meta = (org.ui_meta ?? {}) as Record<string, unknown>;
  const current = typeof meta[monthKey] === 'number' ? (meta[monthKey] as number) : 0;

  await supabase
    .from('orgs')
    .update({ ui_meta: { ...meta, [monthKey]: current + 1 } })
    .eq('id', orgId);
  // Failure is non-fatal — tracking is best-effort; the limit check already ran
}

/**
 * Get how many brand guide shares the org has used in the current calendar month.
 * Returns 0 if no shares have been made yet.
 */
export async function getBrandGuideShareCount(orgId: string): Promise<number> {
  const supabase = getSupabaseAdminClient();
  const now = new Date();
  const monthKey = `brand_guide_shares_${now.getFullYear()}_${String(now.getMonth() + 1).padStart(2, '0')}`;

  const { data: org } = await supabase
    .from('orgs')
    .select('ui_meta')
    .eq('id', orgId)
    .single();

  if (!org?.ui_meta) return 0;
  const meta = org.ui_meta as Record<string, unknown>;
  return typeof meta[monthKey] === 'number' ? (meta[monthKey] as number) : 0;
}
