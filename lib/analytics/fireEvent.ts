'use server';

import { getSupabaseAdminClient } from '@/lib/supabase/server';

type EventType =
  | 'client.added'
  | 'client.tag_changed'
  | 'client.renewed'
  | 'client.churned'
  | 'deliverable.created'
  | 'deliverable.status_changed'
  | 'deliverable.completed'
  | 'invoice.created'
  | 'invoice.sent'
  | 'invoice.paid'
  | 'invoice.overdue'
  | 'invoice.voided'
  | 'payment.received'
  | 'payment.refunded'
  | 'retainer.batch_sent';

export async function fireEvent(params: {
  orgId: string;
  vertical: 'smm_freelance' | 'smm_agency';
  eventType: EventType;
  amount?: number;
  clientId?: string;
  metadata?: Record<string, unknown>;
}) {
  const supabase = getSupabaseAdminClient();

  const { error } = await supabase.from('events').insert({
    org_id: params.orgId,
    vertical: params.vertical,
    event_type: params.eventType,
    amount: params.amount ?? null,
    client_id: params.clientId ?? null,
    metadata: params.metadata ?? {},
  });

  if (error) {
    throw new Error(`Failed to fire event "${params.eventType}": ${error.message}`);
  }
}

