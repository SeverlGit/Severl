import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { getSupabaseAdminClient } from '@/lib/supabase/server';

export async function requireAuth() {
  const { userId } = await auth();
  if (!userId) redirect('/sign-in');
  return userId;
}

export async function requireOrgAccess(orgId: string) {
  const userId = await requireAuth();
  const supabase = getSupabaseAdminClient();
  const { data } = await supabase
    .from('orgs')
    .select('id')
    .eq('id', orgId)
    .eq('owner_id', userId)
    .single();

  if (!data) throw new Error('Forbidden');
  return userId;
}
