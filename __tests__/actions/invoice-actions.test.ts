import { describe, it, expect, vi, beforeEach } from 'vitest';

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

const createChainableMock = (finalResult: { data?: unknown; error?: { message: string } | null }) => {
  const chain = {
    from: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockResolvedValue(finalResult),
  };
  return chain;
};

vi.mock('@/lib/supabase/server', () => ({
  getSupabaseAdminClient: vi.fn(),
}));

import { requireOrgAccess } from '@/lib/auth-guard';
import { getSupabaseAdminClient } from '@/lib/supabase/server';
import { fireEvent } from '@/lib/analytics/fireEvent';
import { sendInvoiceSentEmail } from '@/lib/email/invoice-sent';
import { revalidatePath, revalidateTag } from 'next/cache';
import {
  markInvoicePaid,
  markInvoiceSent,
  voidInvoice,
} from '@/lib/invoicing/actions';

describe('markInvoicePaid', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(requireOrgAccess).mockResolvedValue('user_123');
  });

  it('calls requireOrgAccess with the provided orgId', async () => {
    const mockChain = createChainableMock({
      data: { id: 'inv_1', client_id: 'client_1', total: 500 },
      error: null,
    });
    vi.mocked(getSupabaseAdminClient).mockReturnValue(mockChain as any);

    await markInvoicePaid({
      invoiceId: 'inv_1',
      orgId: 'org_1',
      vertical: 'smm_freelance',
      paymentMethod: 'ach',
      paidDate: '2026-03-18',
    });

    expect(requireOrgAccess).toHaveBeenCalledWith('org_1');
  });

  it('updates the invoice status to paid with payment_method and paid_date', async () => {
    const mockChain = createChainableMock({
      data: { id: 'inv_1', client_id: 'client_1', total: 500 },
      error: null,
    });
    vi.mocked(getSupabaseAdminClient).mockReturnValue(mockChain as any);

    await markInvoicePaid({
      invoiceId: 'inv_1',
      orgId: 'org_1',
      vertical: 'smm_freelance',
      paymentMethod: 'ach',
      paidDate: '2026-03-18',
    });

    expect(mockChain.update).toHaveBeenCalledWith({
      status: 'paid',
      payment_method: 'ach',
      paid_date: '2026-03-18',
    });
  });

  it('fires both invoice.paid and payment.received events with correct amount and clientId', async () => {
    const mockChain = createChainableMock({
      data: { id: 'inv_1', client_id: 'client_1', total: 500 },
      error: null,
    });
    vi.mocked(getSupabaseAdminClient).mockReturnValue(mockChain as any);

    await markInvoicePaid({
      invoiceId: 'inv_1',
      orgId: 'org_1',
      vertical: 'smm_freelance',
      paymentMethod: 'ach',
      paidDate: '2026-03-18',
    });

    expect(fireEvent).toHaveBeenCalledTimes(2);
    expect(fireEvent).toHaveBeenNthCalledWith(1, {
      orgId: 'org_1',
      vertical: 'smm_freelance',
      eventType: 'invoice.paid',
      amount: 500,
      clientId: 'client_1',
      metadata: { invoice_id: 'inv_1' },
    });
    expect(fireEvent).toHaveBeenNthCalledWith(2, {
      orgId: 'org_1',
      vertical: 'smm_freelance',
      eventType: 'payment.received',
      amount: 500,
      clientId: 'client_1',
      metadata: { invoice_id: 'inv_1', payment_method: 'ach' },
    });
  });

  it('calls revalidateTag and revalidatePath', async () => {
    const mockChain = createChainableMock({
      data: { id: 'inv_1', client_id: 'client_1', total: 500 },
      error: null,
    });
    vi.mocked(getSupabaseAdminClient).mockReturnValue(mockChain as any);

    await markInvoicePaid({
      invoiceId: 'inv_1',
      orgId: 'org_1',
      vertical: 'smm_freelance',
      paymentMethod: 'ach',
      paidDate: '2026-03-18',
    });

    expect(revalidateTag).toHaveBeenCalledWith('dashboard-org_1');
    expect(revalidatePath).toHaveBeenCalledWith('/invoices');
  });

  it('throws when requireOrgAccess throws', async () => {
    vi.mocked(requireOrgAccess).mockRejectedValue(new Error('Forbidden'));

    await expect(
      markInvoicePaid({
        invoiceId: 'inv_1',
        orgId: 'org_1',
        vertical: 'smm_freelance',
        paymentMethod: 'ach',
        paidDate: '2026-03-18',
      })
    ).rejects.toThrow('Forbidden');
  });
});

describe('markInvoiceSent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(requireOrgAccess).mockResolvedValue('user_123');
  });

  it('calls requireOrgAccess with the provided orgId', async () => {
    const mockChain = createChainableMock({
      data: {
        id: 'inv_1',
        client_id: 'client_1',
        total: 500,
        invoice_number: 'INV-0001',
        due_date: '2026-04-01',
        billing_month: '2026-03-01',
      },
      error: null,
    });
    (mockChain as any).from.mockImplementation((table: string) => {
      if (table === 'invoices') {
        return {
          update: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          select: vi.fn().mockReturnThis(),
          maybeSingle: vi.fn().mockResolvedValue({
            data: {
              id: 'inv_1',
              client_id: 'client_1',
              total: 500,
              invoice_number: 'INV-0001',
              due_date: '2026-04-01',
              billing_month: '2026-03-01',
            },
            error: null,
          }),
        };
      }
      if (table === 'clients') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          maybeSingle: vi.fn().mockResolvedValue({
            data: { brand_name: 'Acme', contact_email: 'client@acme.com' },
            error: null,
          }),
        };
      }
      if (table === 'orgs') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          maybeSingle: vi.fn().mockResolvedValue({
            data: { name: 'My Business' },
            error: null,
          }),
        };
      }
      return {};
    });
    vi.mocked(getSupabaseAdminClient).mockReturnValue(mockChain as any);

    await markInvoiceSent({
      invoiceId: 'inv_1',
      orgId: 'org_1',
      vertical: 'smm_freelance',
    });

    expect(requireOrgAccess).toHaveBeenCalledWith('org_1');
  });

  it('updates the invoice status to sent', async () => {
    const updateChain = {
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({
        data: {
          id: 'inv_1',
          client_id: 'client_1',
          total: 500,
          invoice_number: 'INV-0001',
          due_date: '2026-04-01',
          billing_month: '2026-03-01',
        },
        error: null,
      }),
    };
    const fromMock = vi.fn((table: string) => {
      if (table === 'invoices') return updateChain;
      if (table === 'clients') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          maybeSingle: vi.fn().mockResolvedValue({
            data: { brand_name: 'Acme', contact_email: 'client@acme.com' },
            error: null,
          }),
        };
      }
      if (table === 'orgs') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          maybeSingle: vi.fn().mockResolvedValue({
            data: { name: 'My Business' },
            error: null,
          }),
        };
      }
      return {};
    });
    vi.mocked(getSupabaseAdminClient).mockReturnValue({ from: fromMock } as any);

    await markInvoiceSent({
      invoiceId: 'inv_1',
      orgId: 'org_1',
      vertical: 'smm_freelance',
    });

    expect(updateChain.update).toHaveBeenCalledWith({ status: 'sent' });
  });

  it('fires invoice.sent event', async () => {
    const updateChain = {
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({
        data: {
          id: 'inv_1',
          client_id: 'client_1',
          total: 500,
          invoice_number: 'INV-0001',
          due_date: '2026-04-01',
          billing_month: '2026-03-01',
        },
        error: null,
      }),
    };
    const fromMock = vi.fn((table: string) => {
      if (table === 'invoices') return updateChain;
      if (table === 'clients') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          maybeSingle: vi.fn().mockResolvedValue({
            data: { brand_name: 'Acme', contact_email: 'client@acme.com' },
            error: null,
          }),
        };
      }
      if (table === 'orgs') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          maybeSingle: vi.fn().mockResolvedValue({
            data: { name: 'My Business' },
            error: null,
          }),
        };
      }
      return {};
    });
    vi.mocked(getSupabaseAdminClient).mockReturnValue({ from: fromMock } as any);

    await markInvoiceSent({
      invoiceId: 'inv_1',
      orgId: 'org_1',
      vertical: 'smm_freelance',
    });

    expect(fireEvent).toHaveBeenCalledWith({
      orgId: 'org_1',
      vertical: 'smm_freelance',
      eventType: 'invoice.sent',
      amount: 500,
      clientId: 'client_1',
      metadata: { invoice_id: 'inv_1' },
    });
  });

  it('calls sendInvoiceSentEmail when client has contact_email', async () => {
    const updateChain = {
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({
        data: {
          id: 'inv_1',
          client_id: 'client_1',
          total: 500,
          invoice_number: 'INV-0001',
          due_date: '2026-04-01',
          billing_month: '2026-03-01',
        },
        error: null,
      }),
    };
    const fromMock = vi.fn((table: string) => {
      if (table === 'invoices') return updateChain;
      if (table === 'clients') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          maybeSingle: vi.fn().mockResolvedValue({
            data: { brand_name: 'Acme', contact_email: 'client@acme.com' },
            error: null,
          }),
        };
      }
      if (table === 'orgs') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          maybeSingle: vi.fn().mockResolvedValue({
            data: { name: 'My Business' },
            error: null,
          }),
        };
      }
      return {};
    });
    vi.mocked(getSupabaseAdminClient).mockReturnValue({ from: fromMock } as any);

    await markInvoiceSent({
      invoiceId: 'inv_1',
      orgId: 'org_1',
      vertical: 'smm_freelance',
    });

    expect(sendInvoiceSentEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'client@acme.com',
        clientName: 'Acme',
        invoiceNumber: 'INV-0001',
        total: 500,
        orgName: 'My Business',
      })
    );
    const call = vi.mocked(sendInvoiceSentEmail).mock.calls[0][0];
    expect(call.dueDate).toBeDefined();
    expect(typeof call.dueDate).toBe('string');
    expect(call.billingMonth).toBeDefined();
    expect(typeof call.billingMonth).toBe('string');
  });

  it('does NOT throw when email send fails', async () => {
    vi.mocked(sendInvoiceSentEmail).mockRejectedValue(new Error('Email failed'));
    const updateChain = {
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({
        data: {
          id: 'inv_1',
          client_id: 'client_1',
          total: 500,
          invoice_number: 'INV-0001',
          due_date: '2026-04-01',
          billing_month: '2026-03-01',
        },
        error: null,
      }),
    };
    const fromMock = vi.fn((table: string) => {
      if (table === 'invoices') return updateChain;
      if (table === 'clients') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          maybeSingle: vi.fn().mockResolvedValue({
            data: { brand_name: 'Acme', contact_email: 'client@acme.com' },
            error: null,
          }),
        };
      }
      if (table === 'orgs') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          maybeSingle: vi.fn().mockResolvedValue({
            data: { name: 'My Business' },
            error: null,
          }),
        };
      }
      return {};
    });
    vi.mocked(getSupabaseAdminClient).mockReturnValue({ from: fromMock } as any);

    const result = await markInvoiceSent({
      invoiceId: 'inv_1',
      orgId: 'org_1',
      vertical: 'smm_freelance',
    });

    expect(result).toBeDefined();
  });

  it('skips email when client has no contact_email', async () => {
    const updateChain = {
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({
        data: {
          id: 'inv_1',
          client_id: 'client_1',
          total: 500,
          invoice_number: 'INV-0001',
          due_date: '2026-04-01',
          billing_month: '2026-03-01',
        },
        error: null,
      }),
    };
    const fromMock = vi.fn((table: string) => {
      if (table === 'invoices') return updateChain;
      if (table === 'clients') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          maybeSingle: vi.fn().mockResolvedValue({
            data: { brand_name: 'Acme', contact_email: null },
            error: null,
          }),
        };
      }
      if (table === 'orgs') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          maybeSingle: vi.fn().mockResolvedValue({
            data: { name: 'My Business' },
            error: null,
          }),
        };
      }
      return {};
    });
    vi.mocked(getSupabaseAdminClient).mockReturnValue({ from: fromMock } as any);

    await markInvoiceSent({
      invoiceId: 'inv_1',
      orgId: 'org_1',
      vertical: 'smm_freelance',
    });

    expect(sendInvoiceSentEmail).not.toHaveBeenCalled();
  });
});

describe('voidInvoice', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(requireOrgAccess).mockResolvedValue('user_123');
  });

  it('calls requireOrgAccess with the provided orgId', async () => {
    const mockChain = createChainableMock({
      data: { id: 'inv_1', client_id: 'client_1', total: 500 },
      error: null,
    });
    vi.mocked(getSupabaseAdminClient).mockReturnValue(mockChain as any);

    await voidInvoice({
      invoiceId: 'inv_1',
      orgId: 'org_1',
      vertical: 'smm_freelance',
    });

    expect(requireOrgAccess).toHaveBeenCalledWith('org_1');
  });

  it('updates the invoice status to voided', async () => {
    const mockChain = createChainableMock({
      data: { id: 'inv_1', client_id: 'client_1', total: 500 },
      error: null,
    });
    vi.mocked(getSupabaseAdminClient).mockReturnValue(mockChain as any);

    await voidInvoice({
      invoiceId: 'inv_1',
      orgId: 'org_1',
      vertical: 'smm_freelance',
    });

    expect(mockChain.update).toHaveBeenCalledWith({ status: 'voided' });
  });

  it('fires invoice.voided event', async () => {
    const mockChain = createChainableMock({
      data: { id: 'inv_1', client_id: 'client_1', total: 500 },
      error: null,
    });
    vi.mocked(getSupabaseAdminClient).mockReturnValue(mockChain as any);

    await voidInvoice({
      invoiceId: 'inv_1',
      orgId: 'org_1',
      vertical: 'smm_freelance',
    });

    expect(fireEvent).toHaveBeenCalledWith({
      orgId: 'org_1',
      vertical: 'smm_freelance',
      eventType: 'invoice.voided',
      clientId: 'client_1',
      metadata: { invoice_id: 'inv_1' },
    });
  });

  it('revalidates /invoices, /, and /analytics', async () => {
    const mockChain = createChainableMock({
      data: { id: 'inv_1', client_id: 'client_1', total: 500 },
      error: null,
    });
    vi.mocked(getSupabaseAdminClient).mockReturnValue(mockChain as any);

    await voidInvoice({
      invoiceId: 'inv_1',
      orgId: 'org_1',
      vertical: 'smm_freelance',
    });

    expect(revalidatePath).toHaveBeenCalledWith('/invoices');
    expect(revalidatePath).toHaveBeenCalledWith('/');
    expect(revalidatePath).toHaveBeenCalledWith('/analytics');
  });
});
