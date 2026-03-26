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

vi.mock('@/lib/supabase/server', () => ({
  getSupabaseAdminClient: vi.fn(),
}));

import { requireOrgAccess } from '@/lib/auth-guard';
import { getSupabaseAdminClient } from '@/lib/supabase/server';
import { fireEvent } from '@/lib/analytics/fireEvent';
import { batchCreateRetainerInvoices } from '@/lib/invoicing/batchCreateRetainerInvoices';

describe('batchCreateRetainerInvoices', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(requireOrgAccess).mockResolvedValue('user_123');
  });

  const createMockSupabase = (opts: {
    clients: { id: string; brand_name: string; retainer_amount: number; contact_email: string | null }[];
    existingInvoices?: { client_id: string }[];
    lastInvoiceNumber?: string | null;
    createdInvoices?: { id: string; client_id: string; total: number }[];
    insertInvoicesError?: { message: string };
    insertLineItemsError?: { message: string };
    orgName?: string;
  }) => {
    let callIndex = 0;
    const fromMock = vi.fn((table: string) => {
      if (table === 'clients') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          is: vi.fn().mockResolvedValue({
            data: opts.clients,
            error: null,
          }),
        };
      }
      if (table === 'invoices') {
        callIndex++;
        if (callIndex === 1) {
          const chain1: any = {};
          chain1.select = vi.fn().mockReturnValue(chain1);
          chain1.eq = vi.fn()
            .mockReturnValueOnce(chain1)
            .mockResolvedValueOnce({ data: opts.existingInvoices ?? [], error: null });
          return chain1;
        }
        if (callIndex === 2) {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            order: vi.fn().mockReturnThis(),
            limit: vi.fn().mockReturnThis(),
            maybeSingle: vi.fn().mockResolvedValue({
              data: opts.lastInvoiceNumber ? { invoice_number: opts.lastInvoiceNumber } : null,
              error: null,
            }),
          };
        }
        if (callIndex === 3) {
          if (opts.insertInvoicesError) {
            return {
              insert: vi.fn().mockReturnThis(),
              select: vi.fn().mockResolvedValue({
                data: null,
                error: opts.insertInvoicesError,
              }),
            };
          }
          return {
            insert: vi.fn().mockReturnThis(),
            select: vi.fn().mockResolvedValue({
              data: opts.createdInvoices ?? [],
              error: null,
            }),
          };
        }
        return {};
      }
      if (table === 'invoice_line_items') {
        return {
          insert: vi.fn().mockResolvedValue(
            opts.insertLineItemsError ? { error: opts.insertLineItemsError } : { error: null }
          ),
        };
      }
      if (table === 'orgs') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          maybeSingle: vi.fn().mockResolvedValue({
            data: opts.orgName ? { name: opts.orgName } : null,
            error: null,
          }),
        };
      }
      return {};
    });
    return { from: fromMock };
  };

  it('calls requireOrgAccess with the provided orgId', async () => {
    const mock = createMockSupabase({
      clients: [],
      createdInvoices: [],
    });
    vi.mocked(getSupabaseAdminClient).mockReturnValue(mock as any);

    await batchCreateRetainerInvoices({
      orgId: 'org_1',
      vertical: 'smm_freelance',
      month: new Date(2026, 2, 15),
    });

    expect(requireOrgAccess).toHaveBeenCalledWith('org_1');
  });

  it('creates one invoice per eligible client with status sent and type retainer', async () => {
    const mock = createMockSupabase({
      clients: [
        { id: 'c1', brand_name: 'Acme', retainer_amount: 500, contact_email: 'a@acme.com' },
        { id: 'c2', brand_name: 'Beta', retainer_amount: 750, contact_email: null },
      ],
      existingInvoices: [],
      lastInvoiceNumber: null,
      createdInvoices: [
        { id: 'inv1', client_id: 'c1', total: 500 },
        { id: 'inv2', client_id: 'c2', total: 750 },
      ],
      orgName: 'My Biz',
    });
    vi.mocked(getSupabaseAdminClient).mockReturnValue(mock as any);

    const result = await batchCreateRetainerInvoices({
      orgId: 'org_1',
      vertical: 'smm_freelance',
      month: new Date(2026, 2, 15),
    });

    expect(result).toHaveLength(2);
    const invoicesChain = mock.from.mock.results.find(
      (r: any) => r.value?.insert
    )?.value;
    expect(invoicesChain).toBeDefined();
    const insertCalls = (invoicesChain?.insert as any)?.mock?.calls ?? [];
    expect(insertCalls.length).toBe(1);
    const inserted = insertCalls[0][0];
    expect(inserted).toHaveLength(2);
    expect(inserted[0]).toMatchObject({
      status: 'sent',
      invoice_type: 'retainer',
      org_id: 'org_1',
      client_id: 'c1',
      total: 500,
    });
    expect(inserted[1]).toMatchObject({
      status: 'sent',
      invoice_type: 'retainer',
      org_id: 'org_1',
      client_id: 'c2',
      total: 750,
    });
  });

  it('invoice numbers are sequential - continues from last invoice', async () => {
    const mock = createMockSupabase({
      clients: [
        { id: 'c1', brand_name: 'Acme', retainer_amount: 500, contact_email: null },
      ],
      existingInvoices: [],
      lastInvoiceNumber: 'INV-0005',
      createdInvoices: [{ id: 'inv1', client_id: 'c1', total: 500 }],
      orgName: 'Biz',
    });
    vi.mocked(getSupabaseAdminClient).mockReturnValue(mock as any);

    await batchCreateRetainerInvoices({
      orgId: 'org_1',
      vertical: 'smm_freelance',
      month: new Date(2026, 2, 15),
    });

    const invoicesChain = mock.from.mock.results.find((r: any) => r.value?.insert)?.value;
    const inserted = (invoicesChain?.insert as any)?.mock?.calls[0][0];
    expect(inserted[0].invoice_number).toBe('INV-0006');
  });

  it('invoice total matches client retainer_amount', async () => {
    const mock = createMockSupabase({
      clients: [
        { id: 'c1', brand_name: 'Acme', retainer_amount: 1200, contact_email: null },
      ],
      existingInvoices: [],
      createdInvoices: [{ id: 'inv1', client_id: 'c1', total: 1200 }],
      orgName: 'Biz',
    });
    vi.mocked(getSupabaseAdminClient).mockReturnValue(mock as any);

    await batchCreateRetainerInvoices({
      orgId: 'org_1',
      vertical: 'smm_freelance',
      month: new Date(2026, 2, 15),
    });

    const invoicesChain = mock.from.mock.results.find((r: any) => r.value?.insert)?.value;
    const inserted = (invoicesChain?.insert as any)?.mock?.calls[0][0];
    expect(inserted[0].total).toBe(1200);
  });

  it('creates line item for each invoice with matching amount and description', async () => {
    const lineItemsInsert = vi.fn().mockResolvedValue({ error: null });
    const clients = [
      { id: 'c1', brand_name: 'Acme', retainer_amount: 500, contact_email: null },
    ];
    let invoiceCallCount = 0;
    const fromMock = vi.fn((table: string) => {
      if (table === 'clients') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          is: vi.fn().mockResolvedValue({ data: clients, error: null }),
        };
      }
      if (table === 'invoices') {
        invoiceCallCount++;
        if (invoiceCallCount === 1) {
          const chain1: any = {};
          chain1.select = vi.fn().mockReturnValue(chain1);
          chain1.eq = vi.fn()
            .mockReturnValueOnce(chain1)
            .mockResolvedValueOnce({ data: [], error: null });
          return chain1;
        }
        if (invoiceCallCount === 2) {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            order: vi.fn().mockReturnThis(),
            limit: vi.fn().mockReturnThis(),
            maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
          };
        }
        if (invoiceCallCount === 3) {
          return {
            insert: vi.fn().mockReturnThis(),
            select: vi.fn().mockResolvedValue({
              data: [{ id: 'inv1', client_id: 'c1', total: 500 }],
              error: null,
            }),
          };
        }
        return {};
      }
      if (table === 'invoice_line_items') {
        return { insert: lineItemsInsert };
      }
      if (table === 'orgs') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          maybeSingle: vi.fn().mockResolvedValue({ data: { name: 'Biz' }, error: null }),
        };
      }
      return {};
    });
    vi.mocked(getSupabaseAdminClient).mockReturnValue({ from: fromMock } as any);

    await batchCreateRetainerInvoices({
      orgId: 'org_1',
      vertical: 'smm_freelance',
      month: new Date(2026, 2, 15),
    });

    expect(lineItemsInsert).toHaveBeenCalled();
    const lineItems = lineItemsInsert.mock.calls[0][0];
    expect(lineItems).toHaveLength(1);
    expect(lineItems[0]).toMatchObject({
      invoice_id: 'inv1',
      quantity: 1,
      unit_price: 500,
      total: 500,
      description: expect.stringContaining('Acme'),
    });
  });

  it('fires invoice.sent event per invoice', async () => {
    const mock = createMockSupabase({
      clients: [
        { id: 'c1', brand_name: 'A', retainer_amount: 500, contact_email: null },
        { id: 'c2', brand_name: 'B', retainer_amount: 600, contact_email: null },
      ],
      existingInvoices: [],
      createdInvoices: [
        { id: 'inv1', client_id: 'c1', total: 500 },
        { id: 'inv2', client_id: 'c2', total: 600 },
      ],
      orgName: 'Biz',
    });
    vi.mocked(getSupabaseAdminClient).mockReturnValue(mock as any);

    await batchCreateRetainerInvoices({
      orgId: 'org_1',
      vertical: 'smm_freelance',
      month: new Date(2026, 2, 15),
    });

    const invoiceSentCalls = vi.mocked(fireEvent).mock.calls.filter(
      (c) => c[0].eventType === 'invoice.sent'
    );
    expect(invoiceSentCalls).toHaveLength(2);
    expect(invoiceSentCalls[0][0]).toMatchObject({
      orgId: 'org_1',
      eventType: 'invoice.sent',
      amount: 500,
      clientId: 'c1',
      metadata: { invoice_id: 'inv1' },
    });
    expect(invoiceSentCalls[1][0]).toMatchObject({
      eventType: 'invoice.sent',
      amount: 600,
      clientId: 'c2',
    });
  });

  it('fires one retainer.batch_sent event with total amount and count in metadata', async () => {
    const mock = createMockSupabase({
      clients: [
        { id: 'c1', brand_name: 'A', retainer_amount: 500, contact_email: null },
        { id: 'c2', brand_name: 'B', retainer_amount: 600, contact_email: null },
      ],
      existingInvoices: [],
      createdInvoices: [
        { id: 'inv1', client_id: 'c1', total: 500 },
        { id: 'inv2', client_id: 'c2', total: 600 },
      ],
      orgName: 'Biz',
    });
    vi.mocked(getSupabaseAdminClient).mockReturnValue(mock as any);

    await batchCreateRetainerInvoices({
      orgId: 'org_1',
      vertical: 'smm_freelance',
      month: new Date(2026, 2, 15),
    });

    const batchCalls = vi.mocked(fireEvent).mock.calls.filter(
      (c) => c[0].eventType === 'retainer.batch_sent'
    );
    expect(batchCalls).toHaveLength(1);
    expect(batchCalls[0][0]).toMatchObject({
      orgId: 'org_1',
      eventType: 'retainer.batch_sent',
      amount: 1100,
      metadata: expect.objectContaining({
        invoice_count: 2,
      }),
    });
  });

  it('skips clients that already have an invoice for the billing month', async () => {
    const mock = createMockSupabase({
      clients: [
        { id: 'c1', brand_name: 'A', retainer_amount: 500, contact_email: null },
        { id: 'c2', brand_name: 'B', retainer_amount: 600, contact_email: null },
      ],
      existingInvoices: [{ client_id: 'c1' }],
      createdInvoices: [{ id: 'inv2', client_id: 'c2', total: 600 }],
      orgName: 'Biz',
    });
    vi.mocked(getSupabaseAdminClient).mockReturnValue(mock as any);

    const result = await batchCreateRetainerInvoices({
      orgId: 'org_1',
      vertical: 'smm_freelance',
      month: new Date(2026, 2, 15),
    });

    expect(result).toHaveLength(1);
    const invoicesChain = mock.from.mock.results.find((r: any) => r.value?.insert)?.value;
    const inserted = (invoicesChain?.insert as any)?.mock?.calls[0][0];
    expect(inserted).toHaveLength(1);
    expect(inserted[0].client_id).toBe('c2');
  });

  it('throws when invoice insert fails', async () => {
    const mock = createMockSupabase({
      clients: [{ id: 'c1', brand_name: 'A', retainer_amount: 500, contact_email: null }],
      existingInvoices: [],
      createdInvoices: [],
      insertInvoicesError: { message: 'DB error' },
      orgName: 'Biz',
    });
    vi.mocked(getSupabaseAdminClient).mockReturnValue(mock as any);

    await expect(
      batchCreateRetainerInvoices({
        orgId: 'org_1',
        vertical: 'smm_freelance',
        month: new Date(2026, 2, 15),
      })
    ).rejects.toThrow('Unable to create invoices');
  });

  it('line item insert failure is non-fatal - logs to Sentry but does not throw', async () => {
    const { captureException } = await import('@sentry/nextjs');
    const lineItemsInsert = vi.fn().mockResolvedValue({ error: { message: 'Line item fail' } });
    const clients = [
      { id: 'c1', brand_name: 'Acme', retainer_amount: 500, contact_email: null },
    ];
    let invCount = 0;
    const fromMock = vi.fn((table: string) => {
      if (table === 'clients') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          is: vi.fn().mockResolvedValue({ data: clients, error: null }),
        };
      }
      if (table === 'invoices') {
        invCount++;
        if (invCount === 1) {
          const chain1: any = {};
          chain1.select = vi.fn().mockReturnValue(chain1);
          chain1.eq = vi.fn()
            .mockReturnValueOnce(chain1)
            .mockResolvedValueOnce({ data: [], error: null });
          return chain1;
        }
        if (invCount === 2) {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            order: vi.fn().mockReturnThis(),
            limit: vi.fn().mockReturnThis(),
            maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
          };
        }
        if (invCount === 3) {
          return {
            insert: vi.fn().mockReturnThis(),
            select: vi.fn().mockResolvedValue({
              data: [{ id: 'inv1', client_id: 'c1', total: 500 }],
              error: null,
            }),
          };
        }
        return {};
      }
      if (table === 'invoice_line_items') {
        return { insert: lineItemsInsert };
      }
      if (table === 'orgs') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          maybeSingle: vi.fn().mockResolvedValue({ data: { name: 'Biz' }, error: null }),
        };
      }
      return {};
    });
    vi.mocked(getSupabaseAdminClient).mockReturnValue({ from: fromMock } as any);

    const result = await batchCreateRetainerInvoices({
      orgId: 'org_1',
      vertical: 'smm_freelance',
      month: new Date(2026, 2, 15),
    });

    expect(result).toHaveLength(1);
    expect(captureException).toHaveBeenCalledWith(expect.anything());
  });
});
