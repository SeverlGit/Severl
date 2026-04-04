'use client';

import React, { useEffect, useTransition } from 'react';
import { usePlan } from '@/lib/billing/plan-context';
import { createCheckoutSession, createPortalSession } from '@/lib/billing/actions';
import { toast } from 'sonner';
import { Check, CreditCard } from 'lucide-react';
import { cn } from '@/lib/utils';

type PlanCard = {
  tier: string;
  name: string;
  price: string;
  period?: string;
  description: string;
  features: string[];
  highlight?: boolean;
};

const plans: PlanCard[] = [
  {
    tier: 'essential',
    name: 'Essential',
    price: 'Free',
    description: 'Get started with the basics',
    features: ['2 clients', '15 deliverables / month', '500 MB storage', 'Community support'],
  },
  {
    tier: 'pro',
    name: 'Pro',
    price: '$29',
    period: '/mo',
    description: 'For growing freelancers',
    features: ['Up to 10 clients', '100 scheduled tasks / month', '10 GB Media Library Storage', 'Standard support'],
  },
  {
    tier: 'elite',
    name: 'Elite',
    price: '$79',
    period: '/mo',
    description: 'For busy freelancers and boutique studios',
    features: ['Unlimited clients', 'Unlimited scheduled tasks', '100 GB Content Storage', 'Priority support'],
    highlight: true,
  },
  {
    tier: 'agency',
    name: 'Agency',
    price: '$99',
    period: '/mo',
    description: 'For scaling agencies with teams',
    features: ['Unlimited clients', 'Unlimited deliverables', '500 GB Brand Asset Vault', 'Team management ($19/seat)', 'Premium support'],
  },
];

type Props = {
  orgId: string;
  stripeCustomerId: string | null;
  subscriptionStatus: string;
  checkoutSuccess: boolean;
  checkoutCanceled: boolean;
};

export default function BillingClient({
  orgId,
  stripeCustomerId,
  subscriptionStatus,
  checkoutSuccess,
  checkoutCanceled,
}: Props) {
  const { planTier } = usePlan();
  const [isPending, startTransition] = useTransition();
  const [loadingTier, setLoadingTier] = React.useState<string | null>(null);
  const [portalPending, setPortalPending] = React.useState(false);

  const isPastDue = subscriptionStatus === 'past_due';
  const hasBillingPortal = !!stripeCustomerId && planTier !== 'essential';

  useEffect(() => {
    if (checkoutSuccess) {
      toast.success("You're all set!", { description: 'Your plan has been upgraded successfully.' });
    } else if (checkoutCanceled) {
      toast.info('Checkout canceled', { description: 'No changes were made to your plan.' });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubscribe = (tier: string) => {
    setLoadingTier(tier);
    startTransition(async () => {
      try {
        const url = await createCheckoutSession({ orgId, tier });
        window.location.href = url;
      } catch (err: unknown) {
        toast.error('Checkout failed', {
          description: err instanceof Error ? err.message : 'Something went wrong.',
        });
        setLoadingTier(null);
      }
    });
  };

  const handlePortal = () => {
    setPortalPending(true);
    startTransition(async () => {
      try {
        const url = await createPortalSession({ orgId });
        window.location.href = url;
      } catch (err: unknown) {
        toast.error('Could not open billing portal', {
          description: err instanceof Error ? err.message : 'Something went wrong.',
        });
        setPortalPending(false);
      }
    });
  };

  return (
    <div className="mx-auto max-w-5xl px-6 py-8">
      {isPastDue && (
        <div className="mb-6 flex items-center gap-3 rounded-lg border border-danger/30 bg-danger-bg px-4 py-3 text-sm">
          <span className="font-medium text-danger">Payment past due.</span>
          <span className="text-danger/80">Update your payment method to keep access to your plan.</span>
          {hasBillingPortal && (
            <button
              onClick={handlePortal}
              className="ml-auto text-xs font-medium text-danger underline underline-offset-2"
            >
              Update payment
            </button>
          )}
        </div>
      )}

      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="font-display text-2xl font-medium text-txt-primary">Plans & Billing</h1>
          <p className="mt-2 text-sm text-txt-muted">
            You&apos;re on the{' '}
            <span className="rounded bg-surface-hover px-1.5 py-0.5 text-[11px] font-medium uppercase tracking-wider text-txt-primary">
              {planTier}
            </span>{' '}
            plan
          </p>
        </div>

        {hasBillingPortal && (
          <button
            onClick={handlePortal}
            disabled={portalPending || isPending}
            className="flex items-center gap-1.5 rounded-md border border-border bg-panel px-3 py-2 text-xs font-medium text-txt-secondary transition-colors hover:bg-surface-hover disabled:opacity-50"
          >
            <CreditCard className="h-3.5 w-3.5" />
            {portalPending ? 'Opening…' : 'Manage billing'}
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {plans.map((plan) => {
          const isCurrent = plan.tier === planTier;
          const isLoading = loadingTier === plan.tier && isPending;

          return (
            <div
              key={plan.tier}
              className={cn(
                'relative flex flex-col rounded-xl border bg-panel p-5',
                isCurrent
                  ? 'border-brand-rose ring-1 ring-brand-rose shadow-sm'
                  : plan.highlight
                  ? 'border-brand-rose/40'
                  : 'border-border',
              )}
            >
              {plan.highlight && !isCurrent && (
                <div className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-full">
                  <span className="block rounded-t rounded-b-none bg-brand-rose px-2.5 py-0.5 text-[9px] font-semibold uppercase tracking-widest text-white">
                    Popular
                  </span>
                </div>
              )}

              <div className="mb-4">
                <h3 className="text-sm font-semibold text-txt-primary">{plan.name}</h3>
                <p className="mt-1 min-h-[34px] text-xs text-txt-muted">{plan.description}</p>
              </div>

              <div className="mb-5">
                <span className="font-display text-3xl font-medium text-txt-primary">{plan.price}</span>
                {plan.period && <span className="text-sm text-txt-muted">{plan.period}</span>}
              </div>

              <ul className="flex-1 space-y-2.5">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-xs text-txt-secondary">
                    <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand-rose" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-6">
                {isCurrent ? (
                  <div className="w-full rounded-md border border-border bg-surface px-4 py-2 text-center text-xs font-medium text-txt-muted">
                    Current plan
                  </div>
                ) : plan.tier === 'essential' ? (
                  <div className="w-full rounded-md border border-border bg-surface px-4 py-2 text-center text-xs font-medium text-txt-hint">
                    Free tier
                  </div>
                ) : (
                  <button
                    className={cn(
                      'w-full rounded-md px-4 py-2 text-xs font-medium shadow-sm transition-colors disabled:opacity-60',
                      plan.highlight
                        ? 'bg-brand-rose text-white hover:bg-brand-rose-deep'
                        : 'bg-brand-rose/80 text-white hover:bg-brand-rose',
                    )}
                    disabled={isPending}
                    onClick={() => handleSubscribe(plan.tier)}
                  >
                    {isLoading ? 'Redirecting…' : `Upgrade to ${plan.name}`}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <p className="mt-8 text-center text-xs text-txt-hint">
        Payments processed securely by Stripe. Cancel anytime from your billing portal.
      </p>
    </div>
  );
}
