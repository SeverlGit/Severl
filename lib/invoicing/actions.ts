'use server';

import { format } from 'date-fns';
import * as Sentry from '@sentry/nextjs';
import { revalidatePath, revalidateTag } from 'next/cache';
import { getSupabaseAdminClient } from '@/lib/supabase/server';
import { requireOrgAccess } from '@/lib/auth-guard';
import { fireEvent } from '@/lib/analytics/fireEvent';
import { sendInvoiceSentEmail } from '@/lib/email/invoice-sent';

export async function markInvoicePaid(params: {
  invoiceId: string;
  orgId: string;
  vertical: 'smm_freelance' | 'smm_agency';
  paymentMethod: string;
  paidDate: string;
}) {
  await requireOrgAccess(params.orgId);
  const supabase = getSupabaseAdminClient();

  const { data, error } = await supabase
    .from('invoices')
    .update({ status: 'paid', payment_method: params.paymentMethod, paid_date: params.paidDate })
    .eq('id', params.invoiceId)
    .eq('org_id', params.orgId)
    .select('id, client_id, total')
    .maybeSingle();

  if (error || !data) {
    const err = new Error('Unable to mark invoice as paid');
    Sentry.captureException(err);
    throw err;
  }

  await fireEvent({
    orgId: params.orgId,
    vertical: params.vertical,
    eventType: 'invoice.paid',
    amount: data.total ?? 0,
    clientId: data.client_id,
    metadata: { invoice_id: data.id },
  });

  await fireEvent({
    orgId: params.orgId,
    vertical: params.vertical,
    eventType: 'payment.received',
    amount: data.total ?? 0,
    clientId: data.client_id,
    metadata: { invoice_id: data.id, payment_method: params.paymentMethod },
  });

  revalidatePath('/invoices');
  revalidatePath('/');
  revalidatePath('/analytics');
  revalidateTag(`dashboard-${params.orgId}`);
  return data;
}

export async function voidInvoice(params: {
  invoiceId: string;
  orgId: string;
  vertical: 'smm_freelance' | 'smm_agency';
}) {
  await requireOrgAccess(params.orgId);
  const supabase = getSupabaseAdminClient();

  const { data, error } = await supabase
    .from('invoices')
    .update({ status: 'voided' })
    .eq('id', params.invoiceId)
    .eq('org_id', params.orgId)
    .select('id, client_id, total')
    .maybeSingle();

  if (error || !data) {
    const err = new Error('Unable to void invoice');
    Sentry.captureException(err);
    throw err;
  }

  await fireEvent({
    orgId: params.orgId,
    vertical: params.vertical,
    eventType: 'invoice.voided',
    clientId: data.client_id,
    metadata: { invoice_id: data.id },
  });

  revalidatePath('/invoices');
  revalidatePath('/');
  revalidatePath('/analytics');
  return data;
}

export async function markInvoiceSent(params: {
  invoiceId: string;
  orgId: string;
  vertical: 'smm_freelance' | 'smm_agency';
}) {
  await requireOrgAccess(params.orgId);
  const supabase = getSupabaseAdminClient();

  const { data, error } = await supabase
    .from('invoices')
    .update({ status: 'sent' })
    .eq('id', params.invoiceId)
    .eq('org_id', params.orgId)
    .select('id, client_id, total, invoice_number, due_date, billing_month')
    .maybeSingle();

  if (error || !data) {
    const err = new Error('Unable to send invoice');
    Sentry.captureException(err);
    throw err;
  }

  await fireEvent({
    orgId: params.orgId,
    vertical: params.vertical,
    eventType: 'invoice.sent',
    amount: data.total ?? 0,
    clientId: data.client_id,
    metadata: { invoice_id: data.id },
  });

  try {
    const [{ data: client }, { data: org }] = await Promise.all([
      supabase
        .from('clients')
        .select('brand_name, contact_email')
        .eq('id', data.client_id)
        .maybeSingle(),
      supabase
        .from('orgs')
        .select('name')
        .eq('id', params.orgId)
        .maybeSingle(),
    ]);
    if (client?.contact_email?.trim() && org?.name) {
      await sendInvoiceSentEmail({
        to: client.contact_email,
        clientName: client.brand_name ?? 'Client',
        invoiceNumber: data.invoice_number,
        total: data.total ?? 0,
        dueDate: data.due_date ? format(new Date(data.due_date), 'MMM d, yyyy') : 'Upon receipt',
        billingMonth: data.billing_month
          ? format(new Date(data.billing_month), 'MMMM yyyy')
          : '—',
        orgName: org.name,
      });
    }
  } catch (emailErr) {
    Sentry.captureException(emailErr);
  }

  revalidatePath('/invoices');
  return data;
}

export async function createInvoice(params: {
  orgId: string;
  vertical: 'smm_freelance' | 'smm_agency';
  clientId: string;
  invoiceType: 'retainer' | 'project' | 'ad_spend';
  amount: number;
  dueDate: string;
  billingMonth: string;
  description?: string;
}): Promise<{ success: true } | { error: string }> {
  await requireOrgAccess(params.orgId);
  const supabase = getSupabaseAdminClient();

  try {
    if (!Number.isFinite(params.amount) || params.amount <= 0) {
      return { error: 'Amount must be greater than zero' };
    }

    const { data: clientRow, error: clientErr } = await supabase
      .from('clients')
      .select('id, brand_name')
      .eq('id', params.clientId)
      .eq('org_id', params.orgId)
      .eq('tag', 'active')
      .is('archived_at', null)
      .maybeSingle();

    if (clientErr || !clientRow) {
      return { error: 'Client not found' };
    }

    const { data: lastInvoice } = await supabase
      .from('invoices')
      .select('invoice_number')
      .eq('org_id', params.orgId)
      .order('invoice_number', { ascending: false })
      .limit(1)
      .maybeSingle();

    let seq = 1;
    if (lastInvoice?.invoice_number?.startsWith('INV-')) {
      const num = parseInt(lastInvoice.invoice_number.replace('INV-', ''), 10);
      if (!Number.isNaN(num)) seq = num + 1;
    }
    const nextInvoiceNumber = `INV-${String(seq).padStart(4, '0')}`;

    const clientName = clientRow.brand_name ?? 'Client';

    const { data, error } = await supabase
      .from('invoices')
      .insert({
        org_id: params.orgId,
        client_id: params.clientId,
        invoice_number: nextInvoiceNumber,
        invoice_type: params.invoiceType,
        total: params.amount,
        due_date: params.dueDate,
        billing_month: params.billingMonth,
        status: 'draft',
        vertical: params.vertical,
      })
      .select()
      .single();

    if (error || !data) {
      Sentry.captureException(error ?? new Error('createInvoice insert failed'));
      return { error: error?.message ?? 'Unable to create invoice' };
    }

    const lineDesc =
      params.description?.trim() || `${params.invoiceType} — ${clientName}`;

    const { error: lineErr } = await supabase.from('invoice_line_items').insert({
      invoice_id: data.id,
      description: lineDesc,
      quantity: 1,
      unit_price: params.amount,
      total: params.amount,
    });

    if (lineErr) {
      await supabase.from('invoices').delete().eq('id', data.id);
      Sentry.captureException(lineErr);
      return { error: 'Unable to create invoice line item' };
    }

    await fireEvent({
      orgId: params.orgId,
      vertical: params.vertical,
      eventType: 'invoice.created',
      amount: params.amount,
      clientId: params.clientId,
      metadata: { invoice_id: data.id, invoice_number: nextInvoiceNumber },
    });

    revalidatePath('/invoices');
    revalidatePath('/');
    revalidatePath('/analytics');
    revalidateTag(`dashboard-${params.orgId}`);
    return { success: true };
  } catch (error) {
    Sentry.captureException(error);
    return { error: error instanceof Error ? error.message : 'Something went wrong' };
  }
}
