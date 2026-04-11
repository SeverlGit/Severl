import * as Sentry from '@sentry/nextjs';
import { revalidatePath, revalidateTag } from 'next/cache';
import { NextResponse } from 'next/server';
import { getSupabaseAdminClient } from '@/lib/supabase/server';
import { fireEvent } from '@/lib/analytics/fireEvent';
import { sendInvoiceReminderEmail } from '@/lib/email/invoice-reminder';
import { sendInvoiceOverdueEmail } from '@/lib/email/invoice-overdue';

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
    if (!token || token !== process.env.CRON_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = getSupabaseAdminClient();
    const todayISO = new Date().toISOString().slice(0, 10);
    const today = new Date(todayISO);

    // ── Step 1: Mark newly overdue invoices ───────────────────────────────────

    const { data: invoices, error: queryError } = await supabase
      .from('invoices')
      .select('id, org_id, client_id, total')
      .eq('status', 'sent')
      .lt('due_date', todayISO);

    if (queryError) throw queryError;

    if (invoices && invoices.length > 0) {
      const orgIds = [...new Set(invoices.map((inv) => inv.org_id))];
      const { data: orgs, error: orgsError } = await supabase
        .from('orgs')
        .select('id, vertical')
        .in('id', orgIds);

      if (orgsError) throw orgsError;

      const verticalByOrgId = new Map<string, 'smm_freelance' | 'smm_agency'>();
      for (const org of orgs ?? []) {
        verticalByOrgId.set(org.id, org.vertical as 'smm_freelance' | 'smm_agency');
      }

      const invoiceIds = invoices.map((inv) => inv.id);
      const { error: updateError } = await supabase
        .from('invoices')
        .update({ status: 'overdue' })
        .in('id', invoiceIds);

      if (updateError) throw updateError;

      for (const inv of invoices) {
        const vertical = verticalByOrgId.get(inv.org_id);
        if (vertical) {
          await fireEvent({
            orgId: inv.org_id,
            vertical,
            eventType: 'invoice.overdue',
            amount: Number(inv.total ?? 0),
            clientId: inv.client_id,
            metadata: { invoice_id: inv.id },
          });
        }
      }

      for (const orgId of orgIds) {
        revalidateTag(`dashboard-${orgId}`);
      }
      revalidatePath('/invoices');
    }

    // ── Step 2: Dunning — send reminder emails for aging overdue invoices ─────
    // Fetch all overdue invoices that haven't been fully dunned yet (stage < 2)

    const { data: overdueInvoices, error: overdueError } = await supabase
      .from('invoices')
      .select(`
        id, org_id, client_id, invoice_number, total, due_date,
        dunning_stage, stripe_payment_link_url,
        clients ( contact_email, brand_name ),
        orgs ( name )
      `)
      .eq('status', 'overdue')
      .lt('dunning_stage', 2);

    if (overdueError) {
      Sentry.captureException(overdueError);
    } else if (overdueInvoices && overdueInvoices.length > 0) {
      const nowMs = today.getTime();
      const DAY_MS = 86_400_000;

      for (const inv of overdueInvoices) {
        if (!inv.due_date) continue;

        const dueDate = new Date(inv.due_date);
        const daysOverdue = Math.floor((nowMs - dueDate.getTime()) / DAY_MS);
        const stage = inv.dunning_stage ?? 0;

        // Safe navigation — Supabase joins return objects for single FK
        const client = inv.clients as unknown as { contact_email: string | null; brand_name: string } | null;
        const org = inv.orgs as unknown as { name: string } | null;
        const contactEmail = client?.contact_email?.trim();

        if (!contactEmail) continue;

        let nextStage: number | null = null;

        if (daysOverdue >= 14 && stage < 2) {
          nextStage = 2;
          try {
            await sendInvoiceOverdueEmail({
              to: contactEmail,
              clientName: client?.brand_name ?? 'Client',
              invoiceNumber: inv.invoice_number,
              total: Number(inv.total ?? 0),
              dueDate: inv.due_date,
              orgName: org?.name ?? 'Your account manager',
              paymentLinkUrl: inv.stripe_payment_link_url ?? null,
            });
          } catch (emailErr) {
            Sentry.captureException(emailErr);
          }
        } else if (daysOverdue >= 7 && stage < 1) {
          nextStage = 1;
          try {
            await sendInvoiceReminderEmail({
              to: contactEmail,
              clientName: client?.brand_name ?? 'Client',
              invoiceNumber: inv.invoice_number,
              total: Number(inv.total ?? 0),
              dueDate: inv.due_date,
              orgName: org?.name ?? 'Your account manager',
              paymentLinkUrl: inv.stripe_payment_link_url ?? null,
            });
          } catch (emailErr) {
            Sentry.captureException(emailErr);
          }
        }

        if (nextStage !== null) {
          await supabase
            .from('invoices')
            .update({ dunning_stage: nextStage, dunning_sent_at: new Date().toISOString() })
            .eq('id', inv.id);
        }
      }
    }

    return NextResponse.json(
      { updated: invoices?.length ?? 0 },
      { status: 200 }
    );
  } catch (err) {
    Sentry.captureException(err);
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
