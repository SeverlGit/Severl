'use server';

import { getSupabaseAdminClient } from '@/lib/supabase/server';

type Decision = 'approved' | 'revision_requested';

type RecordApprovalResult = { data: Decision } | { error: string };

export async function recordApproval(
  token: string,
  decision: Decision,
  notes?: string,
): Promise<RecordApprovalResult> {
  const supabase = getSupabaseAdminClient();

  const { data: deliverable } = await supabase
    .from('deliverables')
    .select('id, org_id, status, approval_expires_at, revision_round')
    .eq('approval_token', token)
    .maybeSingle();

  if (!deliverable) return { error: 'Invalid approval link' };

  if (deliverable.approval_expires_at && new Date(deliverable.approval_expires_at) < new Date()) {
    return { error: 'This approval link has expired. Ask your social media manager to resend.' };
  }

  if (deliverable.status !== 'pending_approval') {
    return { error: 'This item has already been reviewed.' };
  }

  const newStatus = decision === 'approved' ? 'approved' : 'in_progress';
  const nextRound = (deliverable.revision_round ?? 0) + (decision === 'revision_requested' ? 1 : 0);

  const { error } = await supabase
    .from('deliverables')
    .update({
      status: newStatus,
      approved_at: decision === 'approved' ? new Date().toISOString() : null,
      approval_notes: notes ?? null,
      revision_round: nextRound,
      // Clear token on approved (single-use); leave it on revision so SMM can see notes context
      approval_token: decision === 'approved' ? null : token,
    })
    .eq('id', deliverable.id);

  if (error) return { error: error.message };

  // Insert revision history record for paper trail
  if (decision === 'revision_requested') {
    await supabase.from('approval_revisions').insert({
      deliverable_id: deliverable.id,
      notes: notes ?? null,
      round: nextRound,
    });
    // Non-fatal: if this fails, the deliverable status is already updated
  }

  return { data: decision };
}
