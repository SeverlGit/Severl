import { getSupabaseServerClient } from '@/lib/supabase/server';
import type { ClientWithManager } from '@/lib/database.types';

export async function getClientCounts(
  orgId: string
): Promise<{ total: number; active: number }> {
  const supabase = getSupabaseServerClient();
  const [totalRes, activeRes] = await Promise.all([
    supabase
      .from('clients')
      .select('id', { count: 'exact', head: true })
      .eq('org_id', orgId)
      .is('archived_at', null),
    supabase
      .from('clients')
      .select('id', { count: 'exact', head: true })
      .eq('org_id', orgId)
      .is('archived_at', null)
      .in('tag', ['active', 'onboarding']),
  ]);
  return { total: totalRes.count ?? 0, active: activeRes.count ?? 0 };
}

export async function getClients(
  orgId: string,
  filter?: string,
  search?: string
): Promise<ClientWithManager[]> {
  const supabase = getSupabaseServerClient();

  let query = supabase
    .from('clients')
    .select(
      'id, brand_name, contact_name, contact_email, platforms, retainer_amount, contract_renewal, tag, account_manager_id, created_at, team_members(name)'
    )
    .eq('org_id', orgId)
    .is('archived_at', null)
    .order('brand_name', { ascending: true });

  if (filter && filter !== 'all') {
    query = query.eq('tag', filter);
  }

  if (search && search.trim()) {
    const term = `%${search.trim()}%`;
    query = query.or(
      `brand_name.ilike.${term},contact_name.ilike.${term},contact_email.ilike.${term}`
    );
  }

  const { data, error } = await query;
  if (error || !data) return [];
  return data as unknown as ClientWithManager[];
}

