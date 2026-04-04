import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/billing/stripe';
import { getSupabaseAdminClient } from '@/lib/supabase/server';
import { syncPlanToClerkMetadata } from '@/lib/billing/sync-clerk-metadata';
import type { PlanTier } from '@/lib/database.types';
import { revalidateTag } from 'next/cache';
import * as Sentry from '@sentry/nextjs';
import Stripe from 'stripe';

export const runtime = 'nodejs';

// Map Stripe Price IDs from environment variables to internal PlanTier enums
function getPlanTierFromPriceId(priceId: string): PlanTier {
  if (priceId === process.env.STRIPE_PRICE_PRO) return 'pro';
  if (priceId === process.env.STRIPE_PRICE_ELITE) return 'elite';
  if (priceId === process.env.STRIPE_PRICE_AGENCY_BASE) return 'agency';
  return 'essential';
}

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get('stripe-signature');

  if (!signature || !process.env.STRIPE_WEBHOOK_SECRET) {
    return new NextResponse('Missing signature or webhook secret', { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (error: any) {
    console.error(`Webhook Error: ${error.message}`);
    return new NextResponse(`Webhook Error: ${error.message}`, { status: 400 });
  }

  const supabase = getSupabaseAdminClient();

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        
        // We passed orgId in client_reference_id during checkout creation
        const orgId = session.client_reference_id;
        const customerId = session.customer as string;

        if (!orgId) {
          throw new Error('No client_reference_id in checkout session');
        }

        // Retrieve the line items to find the plan tier
        const lineItems = await stripe.checkout.sessions.listLineItems(session.id);
        const priceId = lineItems.data[0]?.price?.id;
        
        if (!priceId) {
          throw new Error('No price ID found in checkout session line items');
        }

        const newTier = getPlanTierFromPriceId(priceId);

        // Update org in DB
        const { data: org, error } = await supabase
          .from('orgs')
          .update({
            plan_tier: newTier,
            stripe_customer_id: customerId,
            subscription_status: 'active',
          })
          .eq('id', orgId)
          .select('owner_id')
          .single();

        if (error || !org) throw error || new Error('Org not found');

        // Sync to clerk
        await syncPlanToClerkMetadata(org.owner_id, newTier);
        
        // Revalidate any cached data for this org
        revalidateTag(`dashboard-${orgId}`);
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;
        
        // Get the primary item price (assuming the first item is the base plan)
        const priceId = subscription.items.data[0]?.price?.id;
        if (!priceId) break;

        const newTier = getPlanTierFromPriceId(priceId);
        const status = subscription.status === 'active' || subscription.status === 'trialing' ? 'active' : 'past_due';

        const { data: org, error } = await supabase
          .from('orgs')
          .update({
            plan_tier: newTier,
            subscription_status: status,
          })
          .eq('stripe_customer_id', customerId)
          .select('id, owner_id')
          .single();

        if (error) {
          console.warn('Stripe customer updated but org not found in DB', customerId);
          break;
        }

        await syncPlanToClerkMetadata(org.owner_id, newTier);
        revalidateTag(`dashboard-${org.id}`);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        const { data: org, error } = await supabase
          .from('orgs')
          .update({
            plan_tier: 'essential',
            subscription_status: 'canceled',
          })
          .eq('stripe_customer_id', customerId)
          .select('id, owner_id')
          .single();

        if (error) break;

        await syncPlanToClerkMetadata(org.owner_id, 'essential');
        revalidateTag(`dashboard-${org.id}`);
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;

        await supabase
          .from('orgs')
          .update({ subscription_status: 'past_due' })
          .eq('stripe_customer_id', customerId);
        break;
      }
    }
  } catch (error) {
    Sentry.captureException(error);
    console.error('Error handling webhook event:', error);
    return new NextResponse('Webhook handler failed', { status: 500 });
  }

  return new NextResponse('OK', { status: 200 });
}
