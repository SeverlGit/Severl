import { getSupabaseAdminClient } from '@/lib/supabase/server';
import { stripe } from './stripe';
import * as Sentry from '@sentry/nextjs';

export async function syncStripeTeamSeat(orgId: string): Promise<void> {
  const supabase = getSupabaseAdminClient();

  // 1. Check if org is Agency and has a Stripe subscription
  const { data: org, error: orgError } = await supabase
    .from('orgs')
    .select('plan_tier, stripe_customer_id')
    .eq('id', orgId)
    .single();

  if (orgError) {
    Sentry.captureException(orgError);
    return;
  }

  if (org.plan_tier !== 'agency' || !org.stripe_customer_id) {
    return; // nothing to sync
  }

  try {
    // 2. Count active team members for this org
    const { count, error: countError } = await supabase
      .from('team_members')
      .select('id', { count: 'exact', head: true })
      .eq('org_id', orgId)
      .eq('active', true);

    if (countError) throw countError;
    const activeSeats = count || 0;

    // 3. Find the active subscription for this customer in Stripe
    const subscriptions = await stripe.subscriptions.list({
      customer: org.stripe_customer_id,
      status: 'active',
      limit: 1,
    });

    if (subscriptions.data.length === 0) {
      console.warn(`No active Stripe subscription found for customer ${org.stripe_customer_id}`);
      return;
    }

    const sub = subscriptions.data[0];

    // Assuming Option A: single subscription where quantity = active team members.
    // We update the quantity of the subscription item representing the 'seats'.
    // Here we update the first subscription item. In a more complex setup, 
    // we would explicitly look for the subscription item with the `STRIPE_PRICE_AGENCY_SEAT` price.
    const seatItem = sub.items.data.find(item => item.price.id === process.env.STRIPE_PRICE_AGENCY_SEAT);

    if (!seatItem) {
      console.warn(`No seat price item found on subscription ${sub.id}`);
      return;
    }

    if (seatItem.quantity !== activeSeats) {
      await stripe.subscriptionItems.update(seatItem.id, {
        quantity: activeSeats,
      });
      console.log(`Updated stripe subscription item ${seatItem.id} quantity to ${activeSeats}`);
    }
  } catch (error) {
    Sentry.captureException(error);
    console.error('Failed to sync Stripe team seat quantity', error);
  }
}
