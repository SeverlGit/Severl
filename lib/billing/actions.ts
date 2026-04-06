'use server';

import { requireOrgAccess } from '@/lib/auth-guard';
import { stripe } from '@/lib/billing/stripe';
import { getSupabaseAdminClient } from '@/lib/supabase/server';
import { headers } from 'next/headers';
import * as Sentry from '@sentry/nextjs';

const PRICE_ID_MAP: Record<string, string | undefined> = {
  pro: process.env.STRIPE_PRICE_PRO ?? process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO,
  elite: process.env.STRIPE_PRICE_ELITE ?? process.env.NEXT_PUBLIC_STRIPE_PRICE_ELITE,
  agency: process.env.STRIPE_PRICE_AGENCY_BASE ?? process.env.NEXT_PUBLIC_STRIPE_PRICE_AGENCY_BASE,
};

async function getOrigin() {
  return (await headers()).get('origin') || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
}

async function resolveStripeCustomer(orgId: string): Promise<string> {
  const supabase = getSupabaseAdminClient();

  const { data: org, error: orgError } = await supabase
    .from('orgs')
    .select('stripe_customer_id, owner_id')
    .eq('id', orgId)
    .single();

  if (orgError || !org) throw new Error(`Organization not found: ${orgError?.message ?? 'no data'} (orgId=${orgId})`);

  if (org.stripe_customer_id) return org.stripe_customer_id;

  const stripeCustomer = await stripe.customers.create({
    metadata: { orgId, clerkUserId: org.owner_id },
  });

  await supabase
    .from('orgs')
    .update({ stripe_customer_id: stripeCustomer.id })
    .eq('id', orgId);

  return stripeCustomer.id;
}

type ActionResult<T> = { data: T; error?: never } | { data?: never; error: string };

export async function createCheckoutSession(params: {
  orgId: string;
  tier: string;
}): Promise<ActionResult<string>> {
  try {
    await requireOrgAccess(params.orgId);

    const priceId = PRICE_ID_MAP[params.tier];
    if (!priceId) {
      return { error: `No Stripe price configured for plan: ${params.tier}. Check STRIPE_PRICE_${params.tier.toUpperCase()} env var.` };
    }

    const [customer, origin] = await Promise.all([
      resolveStripeCustomer(params.orgId),
      getOrigin(),
    ]);

    const session = await stripe.checkout.sessions.create({
      customer,
      mode: 'subscription',
      client_reference_id: params.orgId,
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${origin}/billing?success=true`,
      cancel_url: `${origin}/billing?canceled=true`,
    });

    if (!session.url) return { error: 'Stripe did not return a checkout URL' };

    return { data: session.url };
  } catch (err) {
    console.error('[createCheckoutSession]', err);
    Sentry.captureException(err);
    return { error: err instanceof Error ? err.message : 'Unexpected error during checkout' };
  }
}

export async function createPortalSession(params: { orgId: string }): Promise<ActionResult<string>> {
  try {
    await requireOrgAccess(params.orgId);

    const supabase = getSupabaseAdminClient();
    const { data: org } = await supabase
      .from('orgs')
      .select('stripe_customer_id')
      .eq('id', params.orgId)
      .single();

    if (!org?.stripe_customer_id) {
      return { error: 'No billing account found for this organization' };
    }

    const origin = await getOrigin();

    const session = await stripe.billingPortal.sessions.create({
      customer: org.stripe_customer_id,
      return_url: `${origin}/billing`,
    });

    return { data: session.url };
  } catch (err) {
    console.error('[createPortalSession]', err);
    Sentry.captureException(err);
    return { error: err instanceof Error ? err.message : 'Unexpected error opening billing portal' };
  }
}
