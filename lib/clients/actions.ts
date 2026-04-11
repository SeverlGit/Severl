'use server';

import * as Sentry from '@sentry/nextjs';
import { revalidatePath, revalidateTag } from 'next/cache';
import { getSupabaseAdminClient } from '@/lib/supabase/server';
import { fireEvent } from '@/lib/analytics/fireEvent';
import { requireOrgAccess } from '@/lib/auth-guard';
import { checkClientLimit, TierLimitError } from '@/lib/auth/tier-limits';
import type { BrandAssetRow } from '@/lib/database.types';

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

/**
 * uploadBrandAsset — uploads a file to Supabase Storage and records metadata in brand_assets.
 *
 * FormData keys: file (File), clientId, orgId, type, name
 * Requires: bucket `brand-assets` exists in Supabase (create via Storage dashboard).
 * Path: [orgId]/[clientId]/[uuid]-[filename]
 */
export async function uploadBrandAsset(
  formData: FormData,
): Promise<{ data: BrandAssetRow } | { error: string }> {
  const file = formData.get('file') as File | null;
  const clientId = formData.get('clientId') as string | null;
  const orgId = formData.get('orgId') as string | null;
  const type = (formData.get('type') as string | null) ?? 'other';
  const name = (formData.get('name') as string | null) ?? file?.name ?? 'asset';

  if (!file || !clientId || !orgId) {
    return { error: 'Missing required fields' };
  }

  await requireOrgAccess(orgId);
  const supabase = getSupabaseAdminClient();

  const ext = file.name.split('.').pop() ?? '';
  const storagePath = `${orgId}/${clientId}/${crypto.randomUUID()}${ext ? `.${ext}` : ''}`;

  const arrayBuffer = await file.arrayBuffer();
  const { error: uploadError } = await supabase.storage
    .from('brand-assets')
    .upload(storagePath, arrayBuffer, { contentType: file.type, upsert: false });

  if (uploadError) {
    Sentry.captureException(uploadError);
    return { error: uploadError.message };
  }

  const { data: urlData } = supabase.storage.from('brand-assets').getPublicUrl(storagePath);

  const { data, error } = await supabase
    .from('brand_assets')
    .insert({
      client_id: clientId,
      org_id: orgId,
      name,
      type,
      file_url: urlData.publicUrl,
      file_size: file.size,
    })
    .select()
    .single();

  if (error || !data) {
    Sentry.captureException(error ?? new Error('uploadBrandAsset insert failed'));
    // Best-effort: remove the orphaned storage object
    await supabase.storage.from('brand-assets').remove([storagePath]);
    return { error: error?.message ?? 'Failed to save asset record' };
  }

  revalidatePath(`/clients/${clientId}`);
  return { data: data as BrandAssetRow };
}

/**
 * deleteBrandAsset — removes asset row and its Supabase Storage object.
 */
export async function deleteBrandAsset(params: {
  assetId: string;
  clientId: string;
  orgId: string;
}): Promise<{ success: true } | { error: string }> {
  await requireOrgAccess(params.orgId);
  const supabase = getSupabaseAdminClient();

  const { data: asset, error: fetchErr } = await supabase
    .from('brand_assets')
    .select('id, file_url')
    .eq('id', params.assetId)
    .eq('client_id', params.clientId)
    .eq('org_id', params.orgId)
    .maybeSingle();

  if (fetchErr || !asset) return { error: 'Asset not found' };

  // Derive storage path from URL: last path segment after /brand-assets/
  try {
    const url = new URL(asset.file_url);
    const pathSegments = url.pathname.split('/brand-assets/');
    const storagePath = pathSegments[1];
    if (storagePath) {
      await supabase.storage.from('brand-assets').remove([storagePath]);
    }
  } catch {
    // Non-fatal: continue with DB delete
  }

  const { error } = await supabase
    .from('brand_assets')
    .delete()
    .eq('id', params.assetId)
    .eq('org_id', params.orgId);

  if (error) {
    Sentry.captureException(error);
    return { error: error.message };
  }

  revalidatePath(`/clients/${params.clientId}`);
  return { success: true };
}

/**
 * generateClientPortalToken — creates (or returns existing) a portal token
 * for a client and ensures the org has a public_token for the portal URL.
 * Requires Agency tier.
 *
 * Returns the full portal URL: /portal/[org-token]/[client-token]
 */
export async function generateClientPortalToken(params: {
  clientId: string;
  orgId: string;
}): Promise<{ data: string } | { error: string }> {
  await requireOrgAccess(params.orgId);
  const supabase = getSupabaseAdminClient();

  // Check agency tier
  const { data: org, error: orgError } = await supabase
    .from('orgs')
    .select('plan_tier, public_token')
    .eq('id', params.orgId)
    .single();

  if (orgError || !org) return { error: 'Organization not found' };
  if (org.plan_tier !== 'agency') {
    return { error: 'Client portal requires the Agency plan.' };
  }

  // Ensure the org has a public_token (lazy generation)
  let orgPublicToken = org.public_token as string | null;
  if (!orgPublicToken) {
    orgPublicToken = crypto.randomUUID().replace(/-/g, '');
    const { error: orgUpdateError } = await supabase
      .from('orgs')
      .update({ public_token: orgPublicToken })
      .eq('id', params.orgId);
    if (orgUpdateError) {
      Sentry.captureException(orgUpdateError);
      return { error: 'Could not generate org portal token' };
    }
  }

  // Check for an existing portal token for this client
  const { data: existing } = await supabase
    .from('client_portal_tokens')
    .select('token')
    .eq('client_id', params.clientId)
    .eq('org_id', params.orgId)
    .maybeSingle();

  const clientToken = existing?.token ?? crypto.randomUUID().replace(/-/g, '');

  if (!existing) {
    const { error: insertError } = await supabase.from('client_portal_tokens').insert({
      client_id: params.clientId,
      org_id: params.orgId,
      token: clientToken,
    });
    if (insertError) {
      Sentry.captureException(insertError);
      return { error: 'Could not create portal token' };
    }
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
  const portalUrl = `${appUrl}/portal/${orgPublicToken}/${clientToken}`;
  return { data: portalUrl };
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

