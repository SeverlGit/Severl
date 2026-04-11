import * as Sentry from '@sentry/nextjs';
import { revalidatePath, revalidateTag } from 'next/cache';
import { NextResponse } from 'next/server';
import { getSupabaseAdminClient } from '@/lib/supabase/server';
import { fireEvent } from '@/lib/analytics/fireEvent';
import { sendInvoiceSentEmail } from '@/lib/email/invoice-sent';
import { format } from 'date-fns';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
    if (!token || token !== process.env.CRON_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = getSupabaseAdminClient();
    const now = new Date();
    const todayUTCDay = now.getUTCDate();
    const billingMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
    const billingMonthStr = billingMonth.toISOString().slice(0, 10);
    const billingMonthLabel = format(billingMonth, 'MMMM yyyy');

    // Fetch orgs with auto-billing enabled for today's UTC day
    const { data: orgs, error: orgsError } = await supabase
      .from('orgs')
      .select('id, name, vertical, auto_billing_day')
      .eq('auto_billing_enabled', true)
      .eq('auto_billing_day', todayUTCDay);

    if (orgsError) throw orgsError;
    if (!orgs || orgs.length === 0) {
      return NextResponse.json({ processed: 0 }, { status: 200 });
    }

    let totalCreated = 0;

    for (const org of orgs) {
      try {
        // Fetch active clients with retainers
        const { data: clients, error: clientsError } = await supabase
          .from('clients')
          .select('id, brand_name, retainer_amount, contact_email')
          .eq('org_id', org.id)
          .eq('tag', 'active')
          .is('archived_at', null);

        if (clientsError || !clients) continue;

        // Skip clients already invoiced this month
        const { data: existing } = await supabase
          .from('invoices')
          .select('client_id')
          .eq('org_id', org.id)
          .eq('billing_month', billingMonthStr);

        const existingSet = new Set((existing ?? []).map((i: { client_id: string }) => i.client_id));

        const toInvoice = clients.filter(
          (c) => (c.retainer_amount ?? 0) > 0 && !existingSet.has(c.id)
        );

        if (!toInvoice.length) continue;

        // Generate invoice numbers sequentially from the org's last invoice
        const { data: lastInvoice } = await supabase
          .from('invoices')
          .select('invoice_number')
          .eq('org_id', org.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        let seq = 1;
        if (lastInvoice?.invoice_number?.startsWith('INV-')) {
          const num = parseInt(lastInvoice.invoice_number.replace('INV-', ''), 10);
          if (!Number.isNaN(num)) seq = num + 1;
        }

        const rows = toInvoice.map((c) => ({
          org_id: org.id,
          client_id: c.id,
          invoice_number: `INV-${String(seq++).padStart(4, '0')}`,
          invoice_type: 'retainer',
          status: 'sent',
          total: c.retainer_amount,
          billing_month: billingMonthStr,
          vertical: org.vertical,
        }));

        const { data: created, error: insertError } = await supabase
          .from('invoices')
          .insert(rows)
          .select('id, client_id, total, invoice_number');

        if (insertError || !created) {
          Sentry.captureException(insertError ?? new Error('auto-billing insert failed'));
          continue;
        }

        // Insert line items
        const brandMap = new Map(toInvoice.map((c) => [c.id, c.brand_name]));
        const contactMap = new Map(
          toInvoice.filter((c) => c.contact_email?.trim()).map((c) => [c.id, c.contact_email!.trim()])
        );

        await supabase.from('invoice_line_items').insert(
          created.map((inv: { id: string; client_id: string; total: number }) => ({
            invoice_id: inv.id,
            description: `Monthly retainer — ${brandMap.get(inv.client_id) ?? 'Client'}`,
            quantity: 1,
            unit_price: inv.total ?? 0,
            total: inv.total ?? 0,
          }))
        );

        // Fire events + send emails
        let totalBilled = 0;
        for (const inv of created) {
          totalBilled += inv.total ?? 0;
          await fireEvent({
            orgId: org.id,
            vertical: org.vertical as 'smm_freelance' | 'smm_agency',
            eventType: 'invoice.sent',
            amount: inv.total ?? 0,
            clientId: inv.client_id,
            metadata: { invoice_id: inv.id, auto_billing: true },
          });
          const contactEmail = contactMap.get(inv.client_id);
          if (contactEmail) {
            try {
              await sendInvoiceSentEmail({
                to: contactEmail,
                clientName: brandMap.get(inv.client_id) ?? 'Client',
                invoiceNumber: inv.invoice_number,
                total: inv.total ?? 0,
                dueDate: 'Upon receipt',
                billingMonth: billingMonthLabel,
                orgName: org.name,
              });
            } catch (emailErr) {
              Sentry.captureException(emailErr);
            }
          }
        }

        await fireEvent({
          orgId: org.id,
          vertical: org.vertical as 'smm_freelance' | 'smm_agency',
          eventType: 'retainer.batch_sent',
          amount: totalBilled,
          metadata: { month: billingMonthStr, invoice_count: created.length, auto_billing: true },
        });

        revalidatePath('/invoices');
        revalidatePath('/');
        revalidateTag(`dashboard-${org.id}`);
        totalCreated += created.length;
      } catch (orgErr) {
        Sentry.captureException(orgErr);
      }
    }

    return NextResponse.json({ processed: orgs.length, invoices_created: totalCreated }, { status: 200 });
  } catch (err) {
    Sentry.captureException(err);
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
