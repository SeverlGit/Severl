'use server';

import { requireOrgAccess } from '@/lib/auth-guard';
import { stripe } from '@/lib/billing/stripe';
import { getSupabaseAdminClient } from '@/lib/supabase/server';
import { headers } from 'next/headers';

export async function createCheckoutSession(params: {
  orgId: string;
  priceId: string;
}) {
  await requireOrgAccess(params.orgId);
  const supabase = getSupabaseAdminClient();

  const { data: org } = await supabase
    .from('orgs')
    .select('stripe_customer_id, owner_id')
    .eq('id', params.orgId)
    .single();

  if (!org) {
    throw new Error('Organization not found');
  }

  const origin = (await headers()).get('origin') || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  let customer = org.stripe_customer_id;
  
  if (!customer) {
    // Create customer if one doesn't exist
    // Get owner email from Clerk maybe?
    const stripeCustomer = await stripe.customers.create({
      metadata: {
        orgId: params.orgId,
        clerkUserId: org.owner_id,
      }
    });
    customer = stripeCustomer.id;

    await supabase.from('orgs').update({ stripe_customer_id: customer }).eq('id', params.orgId);
  }

  const session = await stripe.checkout.sessions.create({
    customer,
    mode: 'subscription',
    client_reference_id: params.orgId,
    payment_method_types: ['card'],
    line_items: [
      {
        price: params.priceId,
        quantity: 1,
      },
    ],
    success_url: `${origin}/billing?success=true`,
    cancel_url: `${origin}/billing?canceled=true`,
  });

  if (!session.url) {
    throw new Error('Failed to create checkout session URL');
  }

  return session.url;
}
