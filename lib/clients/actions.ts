'use server';

import * as Sentry from '@sentry/nextjs';
import { revalidatePath, revalidateTag } from 'next/cache';
import { getSupabaseAdminClient } from '@/lib/supabase/server';
import { fireEvent } from '@/lib/analytics/fireEvent';
import { requireOrgAccess } from '@/lib/auth-guard';
import { checkClientLimit, TierLimitError } from '@/lib/auth/tier-limits';

export async function createClient(params: {
  orgId: string;
  vertical: 'smm_freelance' | 'smm_agency';
  data: {
    brand_name: string;
    contact_name: string;
    contact_email: string;
    platforms?: string[];
    retainer_amount?: number | null;
    contract_start?: string | null;
    contract_renewal?: string | null;
    account_manager_id?: string | null;
    vertical_data?: Record<string, unknown>;
  };
}) {
  await requireOrgAccess(params.orgId);

  try {
    await checkClientLimit(params.orgId);
  } catch (error) {
    if (error instanceof TierLimitError) {
      throw new Error(error.userMessage);
    }
    throw error;
  }

  const supabase = getSupabaseAdminClient();

  const { data, error } = await supabase
    .from('clients')
    .insert({
      org_id: params.orgId,
      vertical: params.vertical,
      brand_name: params.data.brand_name,
      contact_name: params.data.contact_name,
      contact_email: params.data.contact_email,
      platforms: params.data.platforms ?? [],
      retainer_amount: params.data.retainer_amount ?? null,
      contract_start: params.data.contract_start ?? null,
      contract_renewal: params.data.contract_renewal ?? null,
      account_manager_id: params.data.account_manager_id ?? null,
      vertical_data: params.data.vertical_data ?? {},
      tag: 'prospect',
    })
    .select('id')
    .maybeSingle();

  if (error || !data) {
    const err = new Error('Unable to create client');
    Sentry.captureException(err);
    throw err;
  }

  await fireEvent({
    orgId: params.orgId,
    vertical: params.vertical,
    eventType: 'client.added',
    clientId: data.id,
  });

  revalidatePath('/clients');
  revalidatePath('/');
  revalidatePath('/analytics');
  revalidateTag(`dashboard-${params.orgId}`);
  return data;
}

export async function updateClientTag(params: {
  clientId: string;
  orgId: string;
  vertical: 'smm_freelance' | 'smm_agency';
  newTag: string;
}) {
  await requireOrgAccess(params.orgId);
  const supabase = getSupabaseAdminClient();

  const { data, error } = await supabase
    .from('clients')
    .update({ tag: params.newTag })
    .eq('id', params.clientId)
    .eq('org_id', params.orgId)
    .select('id')
    .maybeSingle();

  if (error || !data) {
    const err = new Error('Unable to update client tag');
    Sentry.captureException(err);
    throw err;
  }

  await fireEvent({
    orgId: params.orgId,
    vertical: params.vertical,
    eventType: 'client.tag_changed',
    clientId: params.clientId,
    metadata: { new_tag: params.newTag },
  });

  revalidatePath('/clients');
  revalidatePath('/');
  revalidatePath('/analytics');
  revalidateTag(`dashboard-${params.orgId}`);
}

export async function archiveClient(params: { clientId: string; orgId: string }) {
  await requireOrgAccess(params.orgId);
  const supabase = getSupabaseAdminClient();

  const { error } = await supabase
    .from('clients')
    .update({ archived_at: new Date().toISOString() })
    .eq('id', params.clientId)
    .eq('org_id', params.orgId);

  if (error) {
    const err = new Error('Unable to archive client');
    Sentry.captureException(err);
    throw err;
  }

  revalidatePath('/clients');
  revalidatePath(`/clients/${params.clientId}`);
  revalidatePath('/');
  revalidatePath('/analytics');
}

export async function updateClient(params: {
  orgId: string;
  clientId: string;
  brand_name: string;
  contact_name: string;
  contact_email: string;
  platforms: string[];
  retainer_amount: number | null;
  contract_start: string | null;
  contract_renewal: string | null;
}) {
  await requireOrgAccess(params.orgId);
  const supabase = getSupabaseAdminClient();

  const { error } = await supabase
    .from('clients')
    .update({
      brand_name: params.brand_name,
      contact_name: params.contact_name,
      contact_email: params.contact_email,
      platforms: params.platforms,
      retainer_amount: params.retainer_amount,
      contract_start: params.contract_start,
      contract_renewal: params.contract_renewal,
    })
    .eq('id', params.clientId)
    .eq('org_id', params.orgId);

  if (error) {
    const err = new Error('Failed to update client');
    Sentry.captureException(error);
    Sentry.captureException(err);
    throw err;
  }

  revalidatePath('/clients');
  revalidatePath(`/clients/${params.clientId}`);
  revalidatePath('/');
  revalidatePath('/analytics');
  revalidateTag(`dashboard-${params.orgId}`);
}

export async function updateClientRenewal(params: {
  clientId: string;
  orgId: string;
  newDate: string;
}) {
  await requireOrgAccess(params.orgId);
  const supabase = getSupabaseAdminClient();
  const { error } = await supabase
    .from('clients')
    .update({ contract_renewal: params.newDate, tag: 'active' })
    .eq('id', params.clientId)
    .eq('org_id', params.orgId);

  if (error) {
    const err = new Error('Unable to update client renewal');
    Sentry.captureException(err);
    throw err;
  }
  revalidatePath('/clients');
  revalidatePath(`/clients/${params.clientId}`);
  revalidatePath('/');
}

export async function updateClientBrandGuide(params: {
  clientId: string;
  orgId: string;
  field: string;
  value: unknown;
}) {
  await requireOrgAccess(params.orgId);
  const supabase = getSupabaseAdminClient();

  // Read current vertical_data first so we merge rather than replace
  const { data: current, error: readError } = await supabase
    .from('clients')
    .select('vertical_data')
    .eq('id', params.clientId)
    .eq('org_id', params.orgId)
    .single();

  if (readError) {
    const err = new Error('Unable to update brand guide');
    Sentry.captureException(err);
    throw err;
  }

  const merged = { ...(current?.vertical_data ?? {}), [params.field]: params.value };

  const { error } = await supabase
    .from('clients')
    .update({ vertical_data: merged })
    .eq('id', params.clientId)
    .eq('org_id', params.orgId);

  if (error) {
    const err = new Error('Unable to update brand guide');
    Sentry.captureException(err);
    throw err;
  }
  revalidatePath(`/clients/${params.clientId}`);
}

export async function reassignAccountManager(params: {
  clientId: string;
  orgId: string;
  teamMemberId: string | null;
}) {
  await requireOrgAccess(params.orgId);
  const supabase = getSupabaseAdminClient();

  const { error } = await supabase
    .from('clients')
    .update({ account_manager_id: params.teamMemberId })
    .eq('id', params.clientId)
    .eq('org_id', params.orgId);

  if (error) {
    const err = new Error('Unable to reassign account manager');
    Sentry.captureException(err);
    throw err;
  }
  revalidatePath(`/clients/${params.clientId}`);
  revalidatePath('/deliverables');
}

export async function createClientNote(params: {
  clientId: string;
  orgId: string;
  body: string;
}) {
  const userId = await requireOrgAccess(params.orgId);
  const supabase = getSupabaseAdminClient();
  const { error } = await supabase
    .from('client_notes')
    .insert({
      client_id: params.clientId,
      org_id: params.orgId,
      author_id: userId,
      body: params.body,
    });

  if (error) {
    const err = new Error('Unable to create client note');
    Sentry.captureException(err);
    throw err;
  }
  revalidatePath(`/clients/${params.clientId}`);
}

export async function updateClientNote(params: {
  orgId: string;
  clientId: string;
  noteId: string;
  content: string;
}) {
  await requireOrgAccess(params.orgId);
  const supabase = getSupabaseAdminClient();

  const { error } = await supabase
    .from('client_notes')
    .update({ body: params.content })
    .eq('id', params.noteId)
    .eq('org_id', params.orgId);

  if (error) {
    const err = new Error('Failed to update note');
    Sentry.captureException(error);
    Sentry.captureException(err);
    throw err;
  }

  revalidatePath('/clients');
  revalidatePath(`/clients/${params.clientId}`);
}

export async function generateBrandGuideToken(params: {
  clientId: string;
  orgId: string;
}): Promise<{ data: string } | { error: string }> {
  await requireOrgAccess(params.orgId);
  const supabase = getSupabaseAdminClient();

  const token = crypto.randomUUID().replace(/-/g, '');

  const { error } = await supabase
    .from('clients')
    .update({ brand_guide_token: token })
    .eq('id', params.clientId)
    .eq('org_id', params.orgId);

  if (error) {
    Sentry.captureException(error);
    return { error: 'Could not generate share link' };
  }

  revalidatePath(`/clients/${params.clientId}`);
  return { data: token };
}

export async function deleteClientNote(params: {
  orgId: string;
  noteId: string;
  clientId: string;
}) {
  await requireOrgAccess(params.orgId);
  const supabase = getSupabaseAdminClient();

  const { error } = await supabase
    .from('client_notes')
    .delete()
    .eq('id', params.noteId)
    .eq('org_id', params.orgId);

  if (error) {
    const err = new Error('Failed to delete note');
    Sentry.captureException(error);
    Sentry.captureException(err);
    throw err;
  }

  revalidatePath(`/clients/${params.clientId}`);
}

