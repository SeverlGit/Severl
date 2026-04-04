import { getCurrentOrg } from '@/lib/auth';
import BillingClient from './BillingClient';

export default async function BillingPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string; canceled?: string }>;
}) {
  const [params, org] = await Promise.all([searchParams, getCurrentOrg()]);

  return (
    <BillingClient
      orgId={org.id}
      stripeCustomerId={org.stripe_customer_id}
      subscriptionStatus={org.subscription_status}
      checkoutSuccess={params.success === 'true'}
      checkoutCanceled={params.canceled === 'true'}
    />
  );
}
