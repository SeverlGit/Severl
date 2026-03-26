import * as Sentry from '@sentry/nextjs';
import { revalidatePath, revalidateTag } from 'next/cache';
import { NextResponse } from 'next/server';
import { getSupabaseAdminClient } from '@/lib/supabase/server';
import { fireEvent } from '@/lib/analytics/fireEvent';

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
    if (!token || token !== process.env.CRON_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = getSupabaseAdminClient();
    const todayISO = new Date().toISOString().slice(0, 10);

    const { data: invoices, error: queryError } = await supabase
      .from('invoices')
      .select('id, org_id, client_id, total')
      .eq('status', 'sent')
      .lt('due_date', todayISO);

    if (queryError) {
      throw queryError;
    }

    if (!invoices || invoices.length === 0) {
      return NextResponse.json({ updated: 0 }, { status: 200 });
    }

    const orgIds = [...new Set(invoices.map((inv) => inv.org_id))];
    const { data: orgs, error: orgsError } = await supabase
      .from('orgs')
      .select('id, vertical')
      .in('id', orgIds);

    if (orgsError) {
      throw orgsError;
    }

    const verticalByOrgId = new Map<string, 'smm_freelance' | 'smm_agency'>();
    for (const org of orgs ?? []) {
      verticalByOrgId.set(org.id, org.vertical as 'smm_freelance' | 'smm_agency');
    }

    const invoiceIds = invoices.map((inv) => inv.id);
    const { error: updateError } = await supabase
      .from('invoices')
      .update({ status: 'overdue' })
      .in('id', invoiceIds);

    if (updateError) {
      throw updateError;
    }

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

    return NextResponse.json({ updated: invoices.length }, { status: 200 });
  } catch (err) {
    Sentry.captureException(err);
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
