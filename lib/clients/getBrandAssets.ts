import { getSupabaseServerClient } from '@/lib/supabase/server';
import type { BrandAssetRow } from '@/lib/database.types';

export async function getBrandAssets(
  clientId: string,
  orgId: string,
): Promise<BrandAssetRow[]> {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from('brand_assets')
    .select('id, client_id, org_id, name, type, file_url, file_size, created_at')
    .eq('client_id', clientId)
    .eq('org_id', orgId)
    .order('created_at', { ascending: true });

  if (error || !data) return [];
  return data as BrandAssetRow[];
}

export async function getBrandAssetsByToken(token: string): Promise<BrandAssetRow[]> {
  const supabase = getSupabaseServerClient();

  // Resolve client from brand_guide_token, then fetch assets
  const { data: client } = await supabase
    .from('clients')
    .select('id, org_id')
    .eq('brand_guide_token', token)
    .maybeSingle();

  if (!client) return [];

  const { data, error } = await supabase
    .from('brand_assets')
    .select('id, client_id, org_id, name, type, file_url, file_size, created_at')
    .eq('client_id', client.id)
    .eq('org_id', client.org_id)
    .order('created_at', { ascending: true });

  if (error || !data) return [];
  return data as BrandAssetRow[];
}

/**
 * trackBrandGuideView — increments view count and updates last_viewed_at.
 * Called from the public /brand/[token] page (no auth required).
 */
export async function trackBrandGuideView(token: string): Promise<void> {
  const supabase = getSupabaseServerClient();

  const { data: client } = await supabase
    .from('clients')
    .select('id, org_id, brand_guide_view_count')
    .eq('brand_guide_token', token)
    .maybeSingle();

  if (!client) return;

  await supabase
    .from('clients')
    .update({
      brand_guide_last_viewed_at: new Date().toISOString(),
      brand_guide_view_count: (client.brand_guide_view_count ?? 0) + 1,
    })
    .eq('id', client.id)
    .eq('org_id', client.org_id);
}
