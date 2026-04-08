'use server';

import * as Sentry from '@sentry/nextjs';
import { revalidatePath } from 'next/cache';
import { requireOrgAccess } from '@/lib/auth-guard';
import { getSupabaseAdminClient } from '@/lib/supabase/server';
import type { TeamMemberRow } from '@/lib/database.types';
import { syncStripeTeamSeat } from '@/lib/billing/sync-stripe-seat';

export async function getTeamMembersForOrg(
  orgId: string
): Promise<Pick<TeamMemberRow, 'id' | 'name' | 'email' | 'role' | 'active'>[]> {
  await requireOrgAccess(orgId);
  const supabase = getSupabaseAdminClient();

  const { data, error } = await supabase
    .from('team_members')
    .select('id, name, email, role, active')
    .eq('org_id', orgId)
    .order('name', { ascending: true });

  if (error) {
    Sentry.captureException(error);
    return [];
  }

  return (data ?? []) as Pick<TeamMemberRow, 'id' | 'name' | 'email' | 'role' | 'active'>[];
}

export async function createTeamMember(params: {
  orgId: string;
  name: string;
  email: string;
  role: string;
}) {
  await requireOrgAccess(params.orgId);
  const supabase = getSupabaseAdminClient();

  // Tier check: only Agency plan can add team members
  const { data: org } = await supabase.from('orgs').select('plan_tier').eq('id', params.orgId).single();
  if (org?.plan_tier !== 'agency') {
    throw new Error('Team management requires the Agency plan.');
  }

  const { data, error } = await supabase
    .from('team_members')
    .insert({
      org_id: params.orgId,
      name: params.name,
      email: params.email,
      role: params.role,
    })
    .select()
    .single();

  if (error || !data) {
    const err = new Error(error?.message ?? 'Failed to create team member');
    Sentry.captureException(err);
    throw err;
  }

  revalidatePath('/clients');
  revalidatePath('/deliverables');

  // Async seat sync in background
  syncStripeTeamSeat(params.orgId).catch(console.error);

  return data;
}

export async function updateTeamMember(params: {
  orgId: string;
  memberId: string;
  name: string;
  email: string;
  role: string;
}) {
  await requireOrgAccess(params.orgId);
  const supabase = getSupabaseAdminClient();

  const { data, error } = await supabase
    .from('team_members')
    .update({
      name: params.name,
      email: params.email,
      role: params.role,
    })
    .eq('id', params.memberId)
    .eq('org_id', params.orgId)
    .select()
    .single();

  if (error || !data) {
    const err = new Error(error?.message ?? 'Failed to update team member');
    Sentry.captureException(err);
    throw err;
  }

  revalidatePath('/clients');
  revalidatePath('/deliverables');
  return data;
}

export async function deactivateTeamMember(params: {
  orgId: string;
  memberId: string;
}) {
  await requireOrgAccess(params.orgId);
  const supabase = getSupabaseAdminClient();

  const { error } = await supabase
    .from('team_members')
    .update({ active: false })
    .eq('id', params.memberId)
    .eq('org_id', params.orgId);

  if (error) {
    const err = new Error(error.message);
    Sentry.captureException(err);
    throw err;
  }

  revalidatePath('/clients');
  revalidatePath('/deliverables');

  // Async seat sync
  syncStripeTeamSeat(params.orgId).catch(console.error);
}

export async function reactivateTeamMember(params: {
  orgId: string;
  memberId: string;
}) {
  await requireOrgAccess(params.orgId);
  const supabase = getSupabaseAdminClient();

  const { error } = await supabase
    .from('team_members')
    .update({ active: true })
    .eq('id', params.memberId)
    .eq('org_id', params.orgId);

  if (error) {
    const err = new Error(error.message);
    Sentry.captureException(err);
    throw err;
  }

  revalidatePath('/clients');
  revalidatePath('/deliverables');

  // Async seat sync
  syncStripeTeamSeat(params.orgId).catch(console.error);
}
