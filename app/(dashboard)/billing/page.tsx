'use client';

import React, { useTransition } from 'react';
import { usePlan } from '@/lib/billing/plan-context';
import { createCheckoutSession } from '@/lib/billing/actions';
import { useAuth } from '@clerk/nextjs';
import { toast } from 'sonner';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTopbarDetailTitle } from '@/components/dashboard/TopbarTitleContext';

const plans = [
  {
    tier: 'pro',
    name: 'Pro',
    price: '$29',
    description: 'For growing freelancers',
    priceIdEnv: 'NEXT_PUBLIC_STRIPE_PRICE_PRO',
    limits: { clients: 10, deliverables: 100, storage: '10 GB' },
    features: ['Up to 10 clients', '100 deliverables / month', '10 GB Asset Storage', 'Standard Support']
  },
  {
    tier: 'elite',
    name: 'Elite',
    price: '$79',
    description: 'For busy freelancers and boutique studios',
    priceIdEnv: 'NEXT_PUBLIC_STRIPE_PRICE_ELITE',
    limits: { clients: 'Unlimited', deliverables: 'Unlimited', storage: '100 GB' },
    features: ['Unlimited clients', 'Unlimited deliverables', '100 GB Asset Storage', 'Priority Support']
  },
  {
    tier: 'agency',
    name: 'Agency',
    price: '$99',
    description: 'For scaling agencies with teams',
    priceIdEnv: 'NEXT_PUBLIC_STRIPE_PRICE_AGENCY_BASE',
    limits: { clients: 'Unlimited', deliverables: 'Unlimited', storage: '500 GB' },
    features: ['Unlimited clients', 'Unlimited deliverables', '500 GB Asset Storage', 'Team Management ($19/seat)', 'Premium Support']
  }
];

export default function BillingPage() {
  const { planTier } = usePlan();
  const { orgId } = useAuth();
  const [isPending, startTransition] = useTransition();

  React.useEffect(() => {
    // We can use the Topbar context but the component might not be mounted inside the details provider so we just rely on static title
  }, []);

  const handleSubscribe = (envKey: string) => {
    if (!orgId) return;
    
    // In actual production, you'd pass the actual price ID from public env var.
    // E.g. process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO.
    const priceId = process.env[envKey] || '';
    
    if (!priceId) {
      toast.error('Billing is not configured', { description: 'Missing Stripe Price ID' });
      return;
    }

    startTransition(async () => {
      try {
        const url = await createCheckoutSession({ orgId, priceId });
        window.location.href = url;
      } catch (err: any) {
        toast.error('Checkout failed', { description: err.message });
      }
    });
  };

  return (
    <div className="mx-auto max-w-5xl px-6 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-display font-medium text-txt-primary">Plans & Billing</h1>
        <p className="mt-2 text-sm text-txt-muted">
          Your current plan is <span className="font-medium text-txt-primary uppercase tracking-wider text-[11px] bg-surface-hover px-1.5 py-0.5 rounded">{planTier}</span>
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((plan) => {
          const isCurrent = plan.tier === planTier;
          return (
            <div key={plan.tier} className={cn(
              "rounded-xl border p-6 flex flex-col bg-panel",
              isCurrent ? "border-brand-rose ring-1 ring-brand-rose shadow-sm" : "border-border"
            )}>
              <div className="mb-4">
                <h3 className="text-lg font-medium text-txt-primary">{plan.name}</h3>
                <p className="text-sm text-txt-muted mt-1 min-h-[40px]">{plan.description}</p>
              </div>
              
              <div className="mb-6">
                <span className="text-3xl font-display font-medium">{plan.price}</span>
                <span className="text-txt-muted text-sm">/mo</span>
              </div>

              <div className="flex-1">
                <ul className="space-y-3">
                  {plan.features.map(feature => (
                    <li key={feature} className="flex items-start gap-2 text-sm text-txt-secondary">
                      <Check className="h-4 w-4 text-brand-rose shrink-0 mt-0.5" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-8">
                <button
                  className={cn(
                    "w-full py-2 px-4 rounded-md text-sm font-medium transition-colors",
                    isCurrent 
                      ? "bg-surface text-txt-muted border border-border cursor-default"
                      : "bg-brand-rose text-white hover:bg-brand-rose/90 shadow-sm"
                  )}
                  disabled={isCurrent || isPending}
                  onClick={() => handleSubscribe(plan.priceIdEnv)}
                >
                  {isCurrent ? 'Current Plan' : isPending ? 'Loading...' : 'Upgrade plan'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
