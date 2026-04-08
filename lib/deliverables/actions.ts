'use server';

import * as Sentry from '@sentry/nextjs';
import { revalidatePath } from 'next/cache';
import { getSupabaseAdminClient } from '@/lib/supabase/server';
import { fireEvent } from '@/lib/analytics/fireEvent';
import { requireOrgAccess } from '@/lib/auth-guard';
import type { ClientRow } from '@/lib/database.types';
import { checkDeliverableLimit, TierLimitError } from '@/lib/auth/tier-limits';

export async function updateDeliverableStatus(params: {
  deliverableId: string;
  newStatus: 'not_started' | 'in_progress' | 'pending_approval' | 'approved' | 'published';
  orgId: string;
  vertical: 'smm_freelance' | 'smm_agency';
}) {
  await requireOrgAccess(params.orgId);
  const supabase = getSupabaseAdminClient();

  const { data, error } = await supabase
    .from('deliverables')
    .update({ status: params.newStatus })
    .eq('id', params.deliverableId)
    .eq('org_id', params.orgId)
    .select('id, client_id, status')
    .maybeSingle();

  if (error || !data) {
    const err = new Error('Unable to update deliverable status');
    Sentry.captureException(err);
    throw err;
  }

  await fireEvent({
    orgId: params.orgId,
    vertical: params.vertical,
    eventType: 'deliverable.status_changed',
    clientId: data.client_id,
    metadata: { deliverable_id: data.id, status: data.status },
  });

  if (params.newStatus === 'published') {
    await fireEvent({
      orgId: params.orgId,
      vertical: params.vertical,
      eventType: 'deliverable.completed',
      clientId: data.client_id,
      metadata: { deliverable_id: data.id },
    });
  }

  revalidatePath('/deliverables');
  revalidatePath('/');
  revalidatePath('/analytics');
  return data;
}

export async function createDeliverable(params: {
  orgId: string;
  clientId: string;
  month: Date;
  type: string;
  title: string;
  dueDate?: string | null;
  vertical: 'smm_freelance' | 'smm_agency';
}) {
  await requireOrgAccess(params.orgId);

  try {
    await checkDeliverableLimit(params.orgId, params.month);
  } catch (error) {
    if (error instanceof TierLimitError) {
      throw new Error(error.userMessage);
    }
    throw error;
  }

  const supabase = getSupabaseAdminClient();
  const monthStartStr = `${params.month.getFullYear()}-${String(params.month.getMonth() + 1).padStart(2, '0')}-01`;

  const { data, error } = await supabase
    .from('deliverables')
    .insert({
      org_id: params.orgId,
      client_id: params.clientId,
      month: monthStartStr,
      type: params.type,
      title: params.title || params.type,
      status: 'not_started',
      due_date: params.dueDate ?? null,
    })
    .select('id, client_id, status')
    .maybeSingle();

  if (error || !data) {
    const err = new Error('Unable to create deliverable');
    Sentry.captureException(err);
    throw err;
  }

  await fireEvent({
    orgId: params.orgId,
    vertical: params.vertical,
    eventType: 'deliverable.created',
    clientId: data.client_id,
    metadata: { deliverable_id: data.id },
  });

  revalidatePath('/deliverables');
  revalidatePath('/');
  return data;
}

export async function updateDeliverable(params: {
  orgId: string;
  deliverableId: string;
  title: string;
  type: string;
  dueDate: string;
}): Promise<{ success: true } | { error: string }> {
  await requireOrgAccess(params.orgId);
  const supabase = getSupabaseAdminClient();

  try {
    const { error } = await supabase
      .from('deliverables')
      .update({
        title: params.title.trim() || params.type,
        type: params.type,
        due_date: params.dueDate.trim() ? params.dueDate : null,
      })
      .eq('id', params.deliverableId)
      .eq('org_id', params.orgId);

    if (error) {
      Sentry.captureException(error);
      return { error: error.message || 'Unable to update deliverable' };
    }

    revalidatePath('/deliverables');
    revalidatePath('/');
    return { success: true };
  } catch (error) {
    Sentry.captureException(error);
    return { error: error instanceof Error ? error.message : 'Something went wrong' };
  }
}

export async function deleteDeliverable(params: {
  deliverableId: string;
  orgId: string;
}) {
  await requireOrgAccess(params.orgId);
  const supabase = getSupabaseAdminClient();

  const { error } = await supabase
    .from('deliverables')
    .update({ archived_at: new Date().toISOString() })
    .eq('id', params.deliverableId)
    .eq('org_id', params.orgId);

  if (error) {
    const err = new Error('Unable to delete deliverable');
    Sentry.captureException(err);
    throw err;
  }

  revalidatePath('/deliverables');
  revalidatePath('/');
}

export async function restoreDeliverable(params: {
  deliverableId: string;
  orgId: string;
}) {
  await requireOrgAccess(params.orgId);
  const supabase = getSupabaseAdminClient();

  const { error } = await supabase
    .from('deliverables')
    .update({ archived_at: null })
    .eq('id', params.deliverableId)
    .eq('org_id', params.orgId);

  if (error) {
    const err = new Error('Unable to restore deliverable');
    Sentry.captureException(err);
    throw err;
  }
  revalidatePath('/deliverables');
}

export async function updateDeliverableAssignee(params: {
  deliverableId: string;
  assigneeId: string | null;
  orgId: string;
}) {
  await requireOrgAccess(params.orgId);
  const supabase = getSupabaseAdminClient();

  const { error } = await supabase
    .from('deliverables')
    .update({ assignee_id: params.assigneeId })
    .eq('id', params.deliverableId)
    .eq('org_id', params.orgId);

  if (error) {
    const err = new Error('Unable to update assignee');
    Sentry.captureException(err);
    throw err;
  }
  revalidatePath('/deliverables');
}

export async function getMonthCloseOutData(orgId: string, month: Date) {
  await requireOrgAccess(orgId);
  const supabase = getSupabaseAdminClient();
  const startStr = `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, '0')}-01`;
  
  const endMonth = new Date(month.getFullYear(), month.getMonth() + 1, 1);
  const endStr = `${endMonth.getFullYear()}-${String(endMonth.getMonth() + 1).padStart(2, '0')}-01`;

  const { data, error } = await supabase
    .from('deliverables')
    .select('client_id, status, clients!inner(brand_name, retainer_amount)')
    .eq('org_id', orgId)
    .gte('month', startStr)
    .lt('month', endStr);

  if (error || !data) return [];

  type CloseOutRow = {
    client_id: string;
    status: string;
    clients: Pick<ClientRow, 'brand_name' | 'retainer_amount'>;
  };

  const byClient: Record<
    string,
    { total: number; published: number; brand_name: string; retainer_amount: number | null }
  > = {};

  (data as unknown as CloseOutRow[]).forEach((row) => {
    const id = row.client_id;
    if (!byClient[id]) {
      byClient[id] = {
        total: 0,
        published: 0,
        brand_name: row.clients.brand_name,
        retainer_amount: row.clients.retainer_amount,
      };
    }
    byClient[id].total += 1;
    if (row.status === 'published') {
      byClient[id].published += 1;
    }
  });

  return Object.entries(byClient).map(([clientId, v]) => ({
    clientId,
    ...v,
  }));
}

