'use server';

import { requireOrgAccess } from '@/lib/auth-guard';
import { stripe } from '@/lib/billing/stripe';
import { getSupabaseAdminClient } from '@/lib/supabase/server';
import { headers } from 'next/headers';
import * as Sentry from '@sentry/nextjs';
import { syncPlanToClerkMetadata } from '@/lib/billing/sync-clerk-metadata';
import type { PlanTier } from '@/lib/database.types';
import { revalidateTag } from 'next/cache';

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

export async function restorePurchases(orgId: string): Promise<ActionResult<{ tier: string }>> {
  try {
    await requireOrgAccess(orgId);

    const supabase = getSupabaseAdminClient();
    const { data: org, error: orgError } = await supabase
      .from('orgs')
      .select('stripe_customer_id, owner_id')
      .eq('id', orgId)
      .single();

    if (orgError || !org) {
      return { error: 'Organization not found' };
    }

    let customerId = org.stripe_customer_id;

    // Fast-path recovery if customer was checked out but not linked properly
    if (!customerId) {
      const searchRes = await stripe.customers.search({
        query: `metadata['orgId']:'${orgId}'`,
      });
      if (searchRes.data.length > 0) {
        customerId = searchRes.data[0].id;
        await supabase.from('orgs').update({ stripe_customer_id: customerId }).eq('id', orgId);
      } else {
        return { error: 'No Stripe customer found for this organization. You may not have an active subscription.' };
      }
    }

    // Find the current active subscription on Stripe
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: 'active',
      expand: ['data.items.data.price'],
    });

    if (subscriptions.data.length === 0) {
      return { error: 'No active subscriptions found in Stripe.' };
    }

    // If they have multiple for some reason, use the newest
    const activeSubs = subscriptions.data.sort((a, b) => b.created - a.created);
    const primarySub = activeSubs[0];

    const knownBasePrices = new Set([
      PRICE_ID_MAP.pro,
      PRICE_ID_MAP.elite,
      PRICE_ID_MAP.agency,
    ].filter(Boolean));

    const basePriceItem = primarySub.items.data.find(item => knownBasePrices.has(item.price.id));
    const priceId = basePriceItem?.price?.id;

    if (!priceId) {
      return { error: 'Found an active Stripe subscription, but it does not match standard platform tiers.' };
    }

    // Map the resolved priceId to the internal PlanTier
    let newTier: PlanTier = 'essential';
    for (const [key, val] of Object.entries(PRICE_ID_MAP)) {
      if (val === priceId) {
        newTier = key as PlanTier;
        break;
      }
    }

    // Force sync the recovered tier back down to OS and Clerk
    await supabase
      .from('orgs')
      .update({
        plan_tier: newTier,
        subscription_status: 'active',
      })
      .eq('id', orgId);

    await syncPlanToClerkMetadata(org.owner_id, newTier);
    revalidateTag(`dashboard-${orgId}`);

    return { data: { tier: newTier } };
  } catch (err) {
    console.error('[restorePurchases]', err);
    Sentry.captureException(err);
    return { error: err instanceof Error ? err.message : 'Unexpected error during purchase restoration.' };
  }
}
