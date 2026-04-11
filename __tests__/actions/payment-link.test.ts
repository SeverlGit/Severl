import { describe, it, expect, vi, beforeEach } from 'vitest';

// ─── Mocks ───────────────────────────────────────────────────────────────────

vi.mock('@/lib/auth-guard', () => ({
  requireOrgAccess: vi.fn().mockResolvedValue('user_123'),
}));

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
}));

vi.mock('@sentry/nextjs', () => ({
  captureException: vi.fn(),
}));

vi.mock('@/lib/analytics/fireEvent', () => ({
  fireEvent: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@/lib/email/invoice-sent', () => ({
  sendInvoiceSentEmail: vi.fn().mockResolvedValue(undefined),
}));

// Stripe mock — createPaymentLink returns a predictable URL
vi.mock('@/lib/billing/stripe', () => ({
  stripe: {
    paymentLinks: {
      create: vi.fn().mockResolvedValue({
        id: 'plink_test123',
        url: 'https://buy.stripe.com/test_link',
      }),
    },
  },
}));

// Tier-limits mock — allow feature access by default
vi.mock('@/lib/auth/tier-limits', () => ({
  checkFeatureAccess: vi.fn().mockResolvedValue(undefined),
  TierLimitError: class TierLimitError extends Error {
    userMessage: string;
    constructor(msg: string, userMsg: string) {
      super(msg);
      this.name = 'TierLimitError';
      this.userMessage = userMsg;
    }
  },
}));

// ─── Supabase mock factory ────────────────────────────────────────────────────

type MockResult = { data?: unknown; error?: { message: string } | null };

const buildChain = (results: MockResult[]) => {
  let callCount = 0;
  const getResult = () => results[callCount++] ?? { data: null, error: null };

  const chain: Record<string, unknown> = {};
  const self = () => chain;
  chain.from = vi.fn().mockReturnValue(chain);
  chain.select = vi.fn().mockReturnValue(chain);
  chain.eq = vi.fn().mockReturnValue(chain);
  chain.order = vi.fn().mockReturnValue(chain);
  chain.update = vi.fn().mockReturnValue(chain);
  chain.maybeSingle = vi.fn().mockImplementation(getResult);
  chain.single = vi.fn().mockImplementation(getResult);
  // For exportInvoicesCsv the final call is awaiting the chain (not a method)
  chain.then = vi.fn().mockImplementation((resolve: (v: MockResult) => void) =>
    Promise.resolve(resolve(getResult()))
  );
  // Make the chain itself thenable so `await supabase.from(…).select(…)…` works
  Object.defineProperty(chain, Symbol.toStringTag, { value: 'Promise' });
  return chain;
};

vi.mock('@/lib/supabase/server', () => ({
  getSupabaseAdminClient: vi.fn(),
}));

import { getSupabaseAdminClient } from '@/lib/supabase/server';
import { createPaymentLink, exportInvoicesCsv } from '@/lib/invoicing/actions';
import { stripe } from '@/lib/billing/stripe';
import { checkFeatureAccess } from '@/lib/auth/tier-limits';

// ─── createPaymentLink ────────────────────────────────────────────────────────

describe('createPaymentLink', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (checkFeatureAccess as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
  });

  it('creates a Stripe Payment Link and returns the URL', async () => {
    const mockDb: any = {
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn()
        .mockResolvedValueOnce({
          data: {
            id: 'inv_1',
            invoice_number: 'INV-0001',
            total: 1500,
            status: 'sent',
            stripe_payment_link_url: null,
            stripe_payment_link_id: null,
            client_id: 'client_1',
          },
          error: null,
        })
        .mockResolvedValueOnce({ data: { brand_name: 'Acme Co' }, error: null }),
    };
    (getSupabaseAdminClient as any).mockReturnValue(mockDb);

    const result = await createPaymentLink({ invoiceId: 'inv_1', orgId: 'org_1' });

    expect(result).toEqual({ data: 'https://buy.stripe.com/test_link' });
    expect((stripe.paymentLinks.create as ReturnType<typeof vi.fn>)).toHaveBeenCalledOnce();
  });

  it('returns cached URL without calling Stripe if link already exists', async () => {
    const mockDb: any = {
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValueOnce({
        data: {
          id: 'inv_1',
          invoice_number: 'INV-0001',
          total: 1500,
          status: 'sent',
          stripe_payment_link_url: 'https://buy.stripe.com/existing',
          stripe_payment_link_id: 'plink_existing',
          client_id: 'client_1',
        },
        error: null,
      }),
    };
    (getSupabaseAdminClient as any).mockReturnValue(mockDb);

    const result = await createPaymentLink({ invoiceId: 'inv_1', orgId: 'org_1' });

    expect(result).toEqual({ data: 'https://buy.stripe.com/existing' });
    expect((stripe.paymentLinks.create as ReturnType<typeof vi.fn>)).not.toHaveBeenCalled();
  });

  it('returns error when invoice is not found', async () => {
    const mockDb: any = {
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValueOnce({ data: null, error: null }),
    };
    (getSupabaseAdminClient as any).mockReturnValue(mockDb);

    const result = await createPaymentLink({ invoiceId: 'bad_id', orgId: 'org_1' });

    expect(result).toEqual({ error: 'Invoice not found' });
    expect((stripe.paymentLinks.create as ReturnType<typeof vi.fn>)).not.toHaveBeenCalled();
  });

  it('returns error when invoice total is zero', async () => {
    const mockDb: any = {
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValueOnce({
        data: {
          id: 'inv_zero',
          invoice_number: 'INV-0002',
          total: 0,
          status: 'sent',
          stripe_payment_link_url: null,
          stripe_payment_link_id: null,
          client_id: 'client_1',
        },
        error: null,
      }),
    };
    (getSupabaseAdminClient as any).mockReturnValue(mockDb);

    const result = await createPaymentLink({ invoiceId: 'inv_zero', orgId: 'org_1' });

    expect(result).toEqual({ error: 'Invoice total must be greater than zero to generate a payment link' });
    expect((stripe.paymentLinks.create as ReturnType<typeof vi.fn>)).not.toHaveBeenCalled();
  });

  it('throws TierLimitError when org is on essential tier', async () => {
    const { TierLimitError } = await import('@/lib/auth/tier-limits');
    (checkFeatureAccess as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
      new TierLimitError('no access', 'Upgrade required')
    );

    await expect(
      createPaymentLink({ invoiceId: 'inv_1', orgId: 'org_essential' })
    ).rejects.toThrow('no access');
  });

  it('returns error when Stripe API fails', async () => {
    const mockDb: any = {
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn()
        .mockResolvedValueOnce({
          data: {
            id: 'inv_1',
            invoice_number: 'INV-0001',
            total: 500,
            status: 'sent',
            stripe_payment_link_url: null,
            stripe_payment_link_id: null,
            client_id: 'client_1',
          },
          error: null,
        })
        .mockResolvedValueOnce({ data: { brand_name: 'Acme Co' }, error: null }),
    };
    (getSupabaseAdminClient as any).mockReturnValue(mockDb);
    (stripe.paymentLinks.create as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
      new Error('Stripe API error')
    );

    const result = await createPaymentLink({ invoiceId: 'inv_1', orgId: 'org_1' });

    expect(result).toEqual({ error: 'Stripe API error' });
  });
});

// ─── exportInvoicesCsv ────────────────────────────────────────────────────────

describe('exportInvoicesCsv', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (checkFeatureAccess as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
  });

  it('returns a valid CSV string with header and data rows', async () => {
    const mockInvoices = [
      {
        invoice_number: 'INV-0001',
        total: 1500,
        status: 'paid',
        invoice_type: 'retainer',
        due_date: '2026-03-01',
        paid_date: '2026-03-05',
        billing_month: '2026-03-01',
        clients: { brand_name: 'Acme Co' },
      },
    ];

    const mockDb: any = {
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: mockInvoices, error: null }),
    };
    (getSupabaseAdminClient as any).mockReturnValue(mockDb);

    const result = await exportInvoicesCsv({ orgId: 'org_1' });

    expect('data' in result).toBe(true);
    if (!('data' in result)) return;

    const lines = result.data.split('\r\n');
    expect(lines[0]).toBe('Invoice #,Client,Type,Billing Month,Amount (USD),Status,Due Date,Paid Date');
    expect(lines[1]).toContain('INV-0001');
    expect(lines[1]).toContain('Acme Co');
    expect(lines[1]).toContain('1500.00');
    expect(lines[1]).toContain('paid');
  });

  it('returns a CSV with only the header when there are no invoices', async () => {
    const mockDb: any = {
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: [], error: null }),
    };
    (getSupabaseAdminClient as any).mockReturnValue(mockDb);

    const result = await exportInvoicesCsv({ orgId: 'org_1' });

    expect('data' in result).toBe(true);
    if (!('data' in result)) return;
    expect(result.data.trim()).toBe(
      'Invoice #,Client,Type,Billing Month,Amount (USD),Status,Due Date,Paid Date'
    );
  });

  it('wraps client names containing commas in double quotes', async () => {
    const mockInvoices = [
      {
        invoice_number: 'INV-0002',
        total: 500,
        status: 'sent',
        invoice_type: 'project',
        due_date: null,
        paid_date: null,
        billing_month: null,
        clients: { brand_name: 'Smith, Jones & Co' },
      },
    ];

    const mockDb: any = {
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: mockInvoices, error: null }),
    };
    (getSupabaseAdminClient as any).mockReturnValue(mockDb);

    const result = await exportInvoicesCsv({ orgId: 'org_1' });

    expect('data' in result).toBe(true);
    if (!('data' in result)) return;
    expect(result.data).toContain('"Smith, Jones & Co"');
  });

  it('throws TierLimitError when org is on essential tier', async () => {
    const { TierLimitError } = await import('@/lib/auth/tier-limits');
    (checkFeatureAccess as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
      new TierLimitError('no access', 'Upgrade required')
    );

    await expect(exportInvoicesCsv({ orgId: 'org_essential' })).rejects.toThrow('no access');
  });
});
