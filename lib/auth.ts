import { redirect } from 'next/navigation';
import { cache } from 'react';
import { auth } from '@clerk/nextjs/server';
import { getSupabaseAdminClient } from '@/lib/supabase/server';

export type OrgRecord = {
  id: string;
  name: string;
  vertical: 'smm_freelance' | 'smm_agency';
  owner_id: string;
  timezone: string;
  plan_tier: 'essential' | 'pro' | 'elite' | 'agency';
  stripe_customer_id: string | null;
  subscription_status: string;
  created_at: string;
  updated_at: string;
};

export const getCurrentOrg = cache(async (): Promise<OrgRecord> => {
  const { userId } = await auth();

  if (!userId) {
    redirect('/sign-in');
  }

  const supabase = getSupabaseAdminClient();

  const { data, error } = await supabase
    .from('orgs')
    .select('*')
    .eq('owner_id', userId)
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error('Error fetching current org', error);
    throw new Error('Unable to load organization');
  }

  if (!data) {
    redirect('/onboarding');
  }

  return {
    ...data,
    plan_tier: data.plan_tier || 'essential'
  } as OrgRecord;
});
