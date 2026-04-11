'use server';

import { format } from 'date-fns';
import * as Sentry from '@sentry/nextjs';
import { revalidatePath, revalidateTag } from 'next/cache';
import { getSupabaseAdminClient } from '@/lib/supabase/server';
import { requireOrgAccess } from '@/lib/auth-guard';
import { fireEvent } from '@/lib/analytics/fireEvent';
import { sendInvoiceSentEmail } from '@/lib/email/invoice-sent';
import { stripe } from '@/lib/billing/stripe';
import { checkFeatureAccess } from '@/lib/auth/tier-limits';

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

/**
 * createPaymentLink — generates a Stripe Payment Link for an invoice (Pro+ feature).
 *
 * If a payment link already exists for this invoice (stripe_payment_link_id is set),
 * the existing URL is returned without creating a new Stripe object.
 *
 * Edge cases handled:
 * - Invoice not found or belongs to a different org → error
 * - Invoice total is 0 or negative → error (Stripe requires positive amounts)
 * - Stripe API failure → error returned, exception captured in Sentry
 * - Essential tier → TierLimitError thrown by checkFeatureAccess
 */
export async function createPaymentLink(params: {
  invoiceId: string;
  orgId: string;
}): Promise<{ data: string } | { error: string }> {
  try {
    await requireOrgAccess(params.orgId);
    await checkFeatureAccess(params.orgId, 'invoicePaymentLinks', 'pro');

    const supabase = getSupabaseAdminClient();

    // Fetch invoice with existing payment link state
    const { data: invoice, error: invErr } = await supabase
      .from('invoices')
      .select('id, invoice_number, total, status, stripe_payment_link_url, stripe_payment_link_id, client_id')
      .eq('id', params.invoiceId)
      .eq('org_id', params.orgId)
      .maybeSingle();

    if (invErr || !invoice) {
      return { error: 'Invoice not found' };
    }

    // Return cached URL if already generated — avoids duplicate Stripe objects
    if (invoice.stripe_payment_link_url && invoice.stripe_payment_link_id) {
      return { data: invoice.stripe_payment_link_url };
    }

    const totalCents = Math.round(Number(invoice.total ?? 0) * 100);
    if (totalCents <= 0) {
      return { error: 'Invoice total must be greater than zero to generate a payment link' };
    }

    // Fetch client name for the Stripe line item label
    const { data: client } = await supabase
      .from('clients')
      .select('brand_name')
      .eq('id', invoice.client_id)
      .maybeSingle();

    const productName = `Invoice ${invoice.invoice_number}${client?.brand_name ? ` — ${client.brand_name}` : ''}`;

    const paymentLink = await stripe.paymentLinks.create({
      line_items: [
        {
          price_data: {
            currency: 'usd',
            unit_amount: totalCents,
            product_data: { name: productName },
          },
          quantity: 1,
        },
      ],
      after_completion: {
        type: 'redirect',
        redirect: {
          url: `${process.env.NEXT_PUBLIC_APP_URL ?? 'https://app.severl.app'}/invoices?paid=1`,
        },
      },
    });

    // Persist the link to avoid creating duplicates on future calls
    await supabase
      .from('invoices')
      .update({
        stripe_payment_link_url: paymentLink.url,
        stripe_payment_link_id: paymentLink.id,
      })
      .eq('id', params.invoiceId)
      .eq('org_id', params.orgId);

    revalidatePath('/invoices');
    return { data: paymentLink.url };
  } catch (error) {
    // Re-throw TierLimitError so the client can handle it distinctly
    if (error instanceof Error && error.name === 'TierLimitError') throw error;
    Sentry.captureException(error);
    return { error: error instanceof Error ? error.message : 'Failed to create payment link' };
  }
}

/**
 * exportInvoicesCsv — returns all invoices for an org as a CSV string (Pro+ feature).
 *
 * Column order: Invoice #, Client, Type, Billing Month, Amount, Status, Due Date, Paid Date
 */
export async function exportInvoicesCsv(params: {
  orgId: string;
}): Promise<{ data: string } | { error: string }> {
  try {
    await requireOrgAccess(params.orgId);
    await checkFeatureAccess(params.orgId, 'invoiceCsvExport', 'pro');

    const supabase = getSupabaseAdminClient();

    const { data: invoices, error } = await supabase
      .from('invoices')
      .select('invoice_number, total, status, invoice_type, due_date, paid_date, billing_month, clients(brand_name)')
      .eq('org_id', params.orgId)
      .order('created_at', { ascending: false });

    if (error) {
      Sentry.captureException(error);
      return { error: 'Failed to fetch invoices for export' };
    }

    const header = ['Invoice #', 'Client', 'Type', 'Billing Month', 'Amount (USD)', 'Status', 'Due Date', 'Paid Date'];

    const rows = (invoices ?? []).map((inv) => {
      const client = inv.clients as unknown as { brand_name: string } | null;
      const billingMonth = inv.billing_month
        ? format(new Date(inv.billing_month), 'MMM yyyy')
        : '';
      const dueDate = inv.due_date
        ? format(new Date(inv.due_date), 'yyyy-MM-dd')
        : '';
      const paidDate = inv.paid_date
        ? format(new Date(inv.paid_date), 'yyyy-MM-dd')
        : '';
      // Wrap fields containing commas or quotes in double quotes
      const safe = (v: string) =>
        v.includes(',') || v.includes('"') || v.includes('\n')
          ? `"${v.replace(/"/g, '""')}"`
          : v;
      return [
        safe(inv.invoice_number ?? ''),
        safe(client?.brand_name ?? ''),
        safe(inv.invoice_type ?? ''),
        safe(billingMonth),
        String(Number(inv.total ?? 0).toFixed(2)),
        safe(inv.status ?? ''),
        safe(dueDate),
        safe(paidDate),
      ].join(',');
    });

    const csv = [header.join(','), ...rows].join('\r\n');
    return { data: csv };
  } catch (error) {
    if (error instanceof Error && error.name === 'TierLimitError') throw error;
    Sentry.captureException(error);
    return { error: error instanceof Error ? error.message : 'Export failed' };
  }
}
