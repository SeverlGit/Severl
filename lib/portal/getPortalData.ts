import { getSupabaseAdminClient } from '@/lib/supabase/server';
import type {
  OrgRow,
  ClientRow,
  DeliverableRow,
  InvoiceRow,
  EventRow,
  BrandAssetRow,
} from '@/lib/database.types';

export type PortalOrg = Pick<OrgRow, 'id' | 'name' | 'logo_url' | 'vertical'>;
export type PortalClient = Pick<
  ClientRow,
  | 'id'
  | 'brand_name'
  | 'contact_name'
  | 'contact_email'
  | 'retainer_amount'
  | 'contract_renewal'
  | 'vertical_data'
  | 'tag'
>;
export type PortalDeliverable = Pick<
  DeliverableRow,
  | 'id'
  | 'title'
  | 'type'
  | 'status'
  | 'due_date'
  | 'approval_token'
  | 'approval_sent_at'
  | 'approved_at'
  | 'approval_notes'
>;
export type PortalInvoice = Pick<
  InvoiceRow,
  | 'id'
  | 'invoice_number'
  | 'status'
  | 'total'
  | 'due_date'
  | 'paid_date'
  | 'billing_month'
  | 'stripe_payment_link_url'
  | 'created_at'
>;
export type PortalActivity = Pick<EventRow, 'event_type' | 'amount' | 'metadata' | 'created_at'>;

export type PortalData = {
  org: PortalOrg;
  client: PortalClient;
  brandAssets: BrandAssetRow[];
  pendingDeliverables: PortalDeliverable[];
  invoices: PortalInvoice[];
  activity: PortalActivity[];
};

/**
 * getPortalData — resolves an org + client from portal tokens and fetches all
 * portal sections in parallel. No auth required; security is token-based.
 *
 * Token lookup enforces org scoping: the client_portal_tokens row stores both
 * the client's token and the org_id, so a token can only ever expose one client
 * within the org that created it.
 */
export async function getPortalData(
  orgToken: string,
  clientToken: string,
): Promise<PortalData | null> {
  const supabase = getSupabaseAdminClient();

  // 1. Resolve org by public_token
  const { data: org, error: orgError } = await supabase
    .from('orgs')
    .select('id, name, logo_url, vertical')
    .eq('public_token', orgToken)
    .maybeSingle();

  if (orgError || !org) return null;

  // 2. Resolve client portal token scoped to this org
  const { data: portalToken, error: tokenError } = await supabase
    .from('client_portal_tokens')
    .select('id, client_id')
    .eq('token', clientToken)
    .eq('org_id', org.id)
    .maybeSingle();

  if (tokenError || !portalToken) return null;

  const clientId = portalToken.client_id;

  // 3. Update last_accessed_at (fire-and-forget — non-blocking, non-fatal)
  void supabase
    .from('client_portal_tokens')
    .update({ last_accessed_at: new Date().toISOString() })
    .eq('id', portalToken.id);

  // 4. Fetch client profile
  const { data: client, error: clientError } = await supabase
    .from('clients')
    .select(
      'id, brand_name, contact_name, contact_email, retainer_amount, contract_renewal, vertical_data, tag',
    )
    .eq('id', clientId)
    .eq('org_id', org.id)
    .maybeSingle();

  if (clientError || !client) return null;

  // 5. Parallel fetch all portal sections
  const [assetsResult, deliverablesResult, invoicesResult, activityResult] = await Promise.all([
    supabase
      .from('brand_assets')
      .select('id, client_id, org_id, name, type, file_url, file_size, created_at')
      .eq('client_id', clientId)
      .eq('org_id', org.id)
      .order('created_at', { ascending: false }),

    supabase
      .from('deliverables')
      .select(
        'id, title, type, status, due_date, approval_token, approval_sent_at, approved_at, approval_notes',
      )
      .eq('client_id', clientId)
      .eq('org_id', org.id)
      .in('status', ['pending_approval', 'in_progress', 'not_started'])
      .is('archived_at', null)
      .order('due_date', { ascending: true })
      .limit(20),

    supabase
      .from('invoices')
      .select(
        'id, invoice_number, status, total, due_date, paid_date, billing_month, stripe_payment_link_url, created_at',
      )
      .eq('client_id', clientId)
      .eq('org_id', org.id)
      .order('created_at', { ascending: false })
      .limit(24),

    supabase
      .from('events')
      .select('event_type, amount, metadata, created_at')
      .eq('client_id', clientId)
      .eq('org_id', org.id)
      .order('created_at', { ascending: false })
      .limit(5),
  ]);

  return {
    org: org as PortalOrg,
    client: client as PortalClient,
    brandAssets: (assetsResult.data ?? []) as BrandAssetRow[],
    pendingDeliverables: (deliverablesResult.data ?? []) as PortalDeliverable[],
    invoices: (invoicesResult.data ?? []) as PortalInvoice[],
    activity: (activityResult.data ?? []) as PortalActivity[],
  };
}
