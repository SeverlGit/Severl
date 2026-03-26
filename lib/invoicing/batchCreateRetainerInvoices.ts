'use server';

import { format } from 'date-fns';
import * as Sentry from '@sentry/nextjs';
import { revalidatePath, revalidateTag } from 'next/cache';
import { getSupabaseAdminClient } from '@/lib/supabase/server';
import { fireEvent } from '@/lib/analytics/fireEvent';
import { requireOrgAccess } from '@/lib/auth-guard';
import { sendInvoiceSentEmail } from '@/lib/email/invoice-sent';
import type { ClientRow, InvoiceRow } from '@/lib/database.types';

export async function batchCreateRetainerInvoices(params: {
  orgId: string;
  vertical: 'smm_freelance' | 'smm_agency';
  month: Date;
  overrides?: Record<string, number>;
}) {
  await requireOrgAccess(params.orgId);
  const supabase = getSupabaseAdminClient();
  const billingMonth = new Date(params.month.getFullYear(), params.month.getMonth(), 1);

  const { data: clients, error: clientError } = await supabase
    .from('clients')
    .select('id, brand_name, retainer_amount, contact_email, tag, archived_at')
    .eq('org_id', params.orgId)
    .eq('tag', 'active')
    .is('archived_at', null);

  if (clientError || !clients) return [];

  const { data: existing } = await supabase
    .from('invoices')
    .select('client_id')
    .eq('org_id', params.orgId)
    .eq('billing_month', billingMonth.toISOString().slice(0, 10));

  const existingSet = new Set(
    (existing ?? []).map((i: Pick<InvoiceRow, 'client_id'>) => i.client_id)
  );

  const { data: lastInvoice } = await supabase
    .from('invoices')
    .select('invoice_number')
    .eq('org_id', params.orgId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  let seq = 1;
  if (lastInvoice?.invoice_number?.startsWith('INV-')) {
    const num = parseInt(lastInvoice.invoice_number.replace('INV-', ''), 10);
    if (!Number.isNaN(num)) seq = num + 1;
  }

  type ClientForBatch = Pick<ClientRow, 'id' | 'retainer_amount'>;
  const toInsert = (clients as ClientForBatch[])
    .filter((c) => (c.retainer_amount ?? 0) > 0 && !existingSet.has(c.id))
    .map((c) => {
      const amount =
        params.overrides && params.overrides[c.id] != null
          ? params.overrides[c.id]
          : c.retainer_amount;
      const invoiceNumber = `INV-${String(seq++).padStart(4, '0')}`;
      return {
        org_id: params.orgId,
        client_id: c.id,
        invoice_number: invoiceNumber,
        invoice_type: 'retainer',
        status: 'sent',
        total: amount,
        billing_month: billingMonth.toISOString().slice(0, 10),
        vertical: params.vertical,
      };
    });

  if (!toInsert.length) return [];

  const { data: created, error } = await supabase
    .from('invoices')
    .insert(toInsert)
    .select('id, client_id, total');

  if (error || !created) {
    const err = new Error('Unable to create invoices');
    Sentry.captureException(err);
    throw err;
  }

  const brandMap = new Map<string, string>();
  const contactMap = new Map<string, string>();
  for (const c of clients as { id: string; brand_name: string; retainer_amount: number | null; contact_email: string | null }[]) {
    if ((c.retainer_amount ?? 0) > 0 && !existingSet.has(c.id)) {
      brandMap.set(c.id, c.brand_name ?? 'Client');
      if (c.contact_email?.trim()) contactMap.set(c.id, c.contact_email.trim());
    }
  }

  const { data: org } = await supabase
    .from('orgs')
    .select('name')
    .eq('id', params.orgId)
    .maybeSingle();
  const orgName = org?.name ?? 'Your business';

  const lineItems = created.map((inv) => ({
    invoice_id: inv.id,
    description: `Monthly retainer — ${brandMap.get(inv.client_id) ?? 'Client'}`,
    quantity: 1,
    unit_price: inv.total ?? 0,
    total: inv.total ?? 0,
  }));

  const { error: lineItemError } = await supabase
    .from('invoice_line_items')
    .insert(lineItems);

  if (lineItemError) {
    Sentry.captureException(lineItemError);
  }

  let totalBilled = 0;
  const billingMonthLabel = format(new Date(billingMonth), 'MMMM yyyy');
  for (let i = 0; i < created.length; i++) {
    const inv = created[i];
    const ins = toInsert[i];
    totalBilled += inv.total ?? 0;
    await fireEvent({
      orgId: params.orgId,
      vertical: params.vertical,
      eventType: 'invoice.sent',
      amount: inv.total ?? 0,
      clientId: inv.client_id,
      metadata: { invoice_id: inv.id },
    });
    const contactEmail = contactMap.get(inv.client_id);
    if (contactEmail) {
      try {
        await sendInvoiceSentEmail({
          to: contactEmail,
          clientName: brandMap.get(inv.client_id) ?? 'Client',
          invoiceNumber: ins.invoice_number,
          total: inv.total ?? 0,
          dueDate: 'Upon receipt',
          billingMonth: billingMonthLabel,
          orgName,
        });
      } catch (emailErr) {
        Sentry.captureException(emailErr);
      }
    }
  }

  await fireEvent({
    orgId: params.orgId,
    vertical: params.vertical,
    eventType: 'retainer.batch_sent',
    amount: totalBilled,
    metadata: { month: billingMonth.toISOString().slice(0, 10), invoice_count: created.length },
  });

  revalidatePath('/invoices');
  revalidatePath('/');
  revalidateTag(`dashboard-${params.orgId}`);
  return created;
}

