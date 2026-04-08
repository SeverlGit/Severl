import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from './route';
import { stripe } from '@/lib/billing/stripe';
import { getSupabaseAdminClient } from '@/lib/supabase/server';
import { syncPlanToClerkMetadata } from '@/lib/billing/sync-clerk-metadata';
import { NextRequest } from 'next/server';

// Mock dependencies
vi.mock('@/lib/billing/stripe', () => ({
  stripe: {
    webhooks: { constructEvent: vi.fn() },
    checkout: { sessions: { listLineItems: vi.fn() } },
  },
}));

vi.mock('@/lib/supabase/server', () => ({
  getSupabaseAdminClient: vi.fn(),
}));

vi.mock('@/lib/billing/sync-clerk-metadata', () => ({
  syncPlanToClerkMetadata: vi.fn(),
}));

// Mock next/cache
vi.mock('next/cache', () => ({
  revalidateTag: vi.fn(),
}));

describe('Stripe Webhook', () => {
  let mockSupabase: any;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test';
    process.env.STRIPE_PRICE_PRO = 'price_pro_123';

    mockSupabase = {
      from: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: { owner_id: 'user_123', id: 'org_123' }, error: null }),
    };

    (getSupabaseAdminClient as any).mockReturnValue(mockSupabase);
  });

  it('handles checkout.session.completed', async () => {
    const mockEvent = {
      type: 'checkout.session.completed',
      data: {
        object: {
          id: 'cs_test_123',
          client_reference_id: 'org_123',
          customer: 'cus_123',
        },
      },
    };

    (stripe.webhooks.constructEvent as any).mockReturnValue(mockEvent);
    (stripe.checkout.sessions.listLineItems as any).mockResolvedValue({
      data: [{ price: { id: 'price_pro_123' } }],
    });

    const req = new NextRequest('http://localhost/api/webhooks/stripe', {
      method: 'POST',
      headers: { 'stripe-signature': 'sig_test' },
      body: 'trigger',
    });

    const res = await POST(req);

    expect(res.status).toBe(200);
    expect(mockSupabase.update).toHaveBeenCalledWith({
      plan_tier: 'pro',
      stripe_customer_id: 'cus_123',
      subscription_status: 'active',
    });
    expect(mockSupabase.eq).toHaveBeenCalledWith('id', 'org_123');
    expect(syncPlanToClerkMetadata).toHaveBeenCalledWith('user_123', 'pro');
  });

  it('handles customer.subscription.deleted', async () => {
    const mockEvent = {
      type: 'customer.subscription.deleted',
      data: {
        object: { customer: 'cus_123' },
      },
    };

    (stripe.webhooks.constructEvent as any).mockReturnValue(mockEvent);

    const req = new NextRequest('http://localhost/api/webhooks/stripe', {
      method: 'POST',
      headers: { 'stripe-signature': 'sig_test' },
      body: 'trigger',
    });

    const res = await POST(req);

    expect(res.status).toBe(200);
    expect(mockSupabase.update).toHaveBeenCalledWith({
      plan_tier: 'essential',
      subscription_status: 'canceled',
    });
    expect(mockSupabase.eq).toHaveBeenCalledWith('stripe_customer_id', 'cus_123');
    expect(syncPlanToClerkMetadata).toHaveBeenCalledWith('user_123', 'essential');
  });

  it('handles customer.subscription.updated', async () => {
    const mockEvent = {
      type: 'customer.subscription.updated',
      data: {
        object: {
          customer: 'cus_123',
          status: 'active',
          items: {
            data: [{ price: { id: 'price_pro_123' } }],
          },
        },
      },
    };

    (stripe.webhooks.constructEvent as any).mockReturnValue(mockEvent);

    const req = new NextRequest('http://localhost/api/webhooks/stripe', {
      method: 'POST',
      headers: { 'stripe-signature': 'sig_test' },
      body: 'trigger',
    });

    const res = await POST(req);

    expect(res.status).toBe(200);
    expect(mockSupabase.update).toHaveBeenCalledWith({
      plan_tier: 'pro',
      subscription_status: 'active',
    });
    expect(mockSupabase.eq).toHaveBeenCalledWith('stripe_customer_id', 'cus_123');
    expect(syncPlanToClerkMetadata).toHaveBeenCalledWith('user_123', 'pro');
  });

  it('handles invoice.payment_failed', async () => {
    const mockEvent = {
      type: 'invoice.payment_failed',
      data: {
        object: {
          customer: 'cus_123',
        },
      },
    };

    (stripe.webhooks.constructEvent as any).mockReturnValue(mockEvent);
    
    // We expect the handler to fetch the org data
    mockSupabase.single.mockResolvedValue({ data: { owner_id: 'user_123', id: 'org_123', plan_tier: 'pro' }, error: null });

    const req = new NextRequest('http://localhost/api/webhooks/stripe', {
      method: 'POST',
      headers: { 'stripe-signature': 'sig_test' },
      body: 'trigger',
    });

    const res = await POST(req);

    expect(res.status).toBe(200);
    expect(mockSupabase.update).toHaveBeenCalledWith({ subscription_status: 'past_due' });
    expect(mockSupabase.eq).toHaveBeenCalledWith('stripe_customer_id', 'cus_123');
    expect(syncPlanToClerkMetadata).toHaveBeenCalledWith('user_123', 'pro');
  });
});
