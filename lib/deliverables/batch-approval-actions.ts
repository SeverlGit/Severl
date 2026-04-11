'use server';

import * as Sentry from '@sentry/nextjs';
import { getSupabaseAdminClient } from '@/lib/supabase/server';
import { requireOrgAccess } from '@/lib/auth-guard';
import { sendApprovalEmail } from '@/lib/email/approval';

export type BatchDeliverable = {
  id: string;
  title: string;
  type: string;
  status: string;
  approved_at: string | null;
  approval_notes: string | null;
};

export type BatchApprovalData = {
  token: string;
  orgName: string;
  orgLogoUrl: string | null;
  clientName: string;
  deliverables: BatchDeliverable[];
  expiresAt: string;
};

/**
 * sendBatchApproval — generates a single approval token covering multiple deliverables.
 *
 * All deliverables must belong to the same org + client. Sends one email to the
 * client's contact with the batch approval link (or returns the URL if no email).
 */
export async function sendBatchApproval(params: {
  deliverableIds: string[];
  orgId: string;
}): Promise<{ data: { batchUrl: string; contactEmail: string | null } } | { error: string }> {
  await requireOrgAccess(params.orgId);

  if (params.deliverableIds.length === 0) {
    return { error: 'No deliverables selected' };
  }

  const supabase = getSupabaseAdminClient();

  // Fetch all deliverables + verify they belong to this org and the same client
  const { data: deliverables, error: fetchErr } = await supabase
    .from('deliverables')
    .select('id, title, type, client_id, clients(brand_name, contact_email, contact_name)')
    .eq('org_id', params.orgId)
    .in('id', params.deliverableIds)
    .is('archived_at', null);

  if (fetchErr || !deliverables || deliverables.length === 0) {
    return { error: 'No deliverables found' };
  }

  // All must be for the same client
  const clientIds = new Set(deliverables.map((d) => d.client_id));
  if (clientIds.size > 1) {
    return { error: 'Batch approval must target a single client' };
  }

  const firstClient = deliverables[0].clients as unknown as {
    brand_name: string;
    contact_email: string | null;
    contact_name: string | null;
  } | null;

  const token = crypto.randomUUID().replace(/-/g, '');
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? '';
  const batchUrl = `${appUrl}/approve/batch/${token}`;
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

  // Upsert into batch_approvals
  const { error: insertErr } = await supabase.from('batch_approvals').insert({
    org_id: params.orgId,
    client_id: deliverables[0].client_id,
    token,
    deliverable_ids: params.deliverableIds,
    expires_at: expiresAt,
  });

  if (insertErr) {
    Sentry.captureException(insertErr);
    return { error: insertErr.message };
  }

  // Mark each deliverable as pending_approval
  await supabase
    .from('deliverables')
    .update({
      status: 'pending_approval',
      approval_sent_at: new Date().toISOString(),
      approval_expires_at: expiresAt,
    })
    .eq('org_id', params.orgId)
    .in('id', params.deliverableIds);

  const contactEmail = firstClient?.contact_email ?? null;
  const contactName = firstClient?.contact_name ?? firstClient?.brand_name ?? '';
  const brandName = firstClient?.brand_name ?? '';

  if (contactEmail) {
    try {
      await sendApprovalEmail({
        to: contactEmail,
        contactName,
        brandName,
        deliverableTitle: `${deliverables.length} items for review`,
        deliverableType: 'Batch',
        approvalUrl: batchUrl,
      });
    } catch (emailErr) {
      Sentry.captureException(emailErr);
    }
  }

  return { data: { batchUrl, contactEmail } };
}

/**
 * getBatchApprovalData — resolves a batch token and returns the full approval context.
 * Used by the public `/approve/batch/[token]` page.
 */
export async function getBatchApprovalData(
  token: string,
): Promise<BatchApprovalData | null> {
  const supabase = getSupabaseAdminClient();

  const { data: batch } = await supabase
    .from('batch_approvals')
    .select('org_id, client_id, deliverable_ids, expires_at, clients(brand_name)')
    .eq('token', token)
    .maybeSingle();

  if (!batch) return null;
  if (new Date(batch.expires_at) < new Date()) return null;

  // Fetch org name + logo for white-label
  const { data: org } = await supabase
    .from('orgs')
    .select('name, logo_url, plan_tier')
    .eq('id', batch.org_id)
    .maybeSingle();

  // Fetch deliverables in this batch
  const { data: deliverables } = await supabase
    .from('deliverables')
    .select('id, title, type, status, approved_at, approval_notes')
    .in('id', batch.deliverable_ids as string[]);

  const client = batch.clients as unknown as { brand_name: string } | null;
  const tierAllowsWhiteLabel = ['elite', 'agency'].includes(org?.plan_tier ?? '');

  return {
    token,
    orgName: org?.name ?? '',
    orgLogoUrl: tierAllowsWhiteLabel ? (org?.logo_url ?? null) : null,
    clientName: client?.brand_name ?? '',
    deliverables: (deliverables ?? []) as BatchDeliverable[],
    expiresAt: batch.expires_at,
  };
}

/**
 * recordBatchItemApproval — records a single item decision within a batch.
 */
export async function recordBatchItemApproval(params: {
  token: string;
  deliverableId: string;
  decision: 'approved' | 'revision_requested';
  notes?: string;
}): Promise<{ data: 'approved' | 'revision_requested' } | { error: string }> {
  const supabase = getSupabaseAdminClient();

  // Verify the deliverable is part of this batch
  const { data: batch } = await supabase
    .from('batch_approvals')
    .select('deliverable_ids, expires_at')
    .eq('token', params.token)
    .maybeSingle();

  if (!batch) return { error: 'Invalid batch link' };
  if (new Date(batch.expires_at) < new Date()) return { error: 'This batch link has expired.' };

  const ids = batch.deliverable_ids as string[];
  if (!ids.includes(params.deliverableId)) {
    return { error: 'Deliverable not found in this batch' };
  }

  const newStatus = params.decision === 'approved' ? 'approved' : 'in_progress';

  const { data: current } = await supabase
    .from('deliverables')
    .select('revision_round')
    .eq('id', params.deliverableId)
    .maybeSingle();

  const nextRound = (current?.revision_round ?? 0) + (params.decision === 'revision_requested' ? 1 : 0);

  const { error } = await supabase
    .from('deliverables')
    .update({
      status: newStatus,
      approved_at: params.decision === 'approved' ? new Date().toISOString() : null,
      approval_notes: params.notes ?? null,
      revision_round: nextRound,
    })
    .eq('id', params.deliverableId);

  if (error) return { error: error.message };

  if (params.decision === 'revision_requested') {
    await supabase.from('approval_revisions').insert({
      deliverable_id: params.deliverableId,
      notes: params.notes ?? null,
      round: nextRound,
    });
  }

  return { data: params.decision };
}
