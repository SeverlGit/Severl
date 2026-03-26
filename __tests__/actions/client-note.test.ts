import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  redirect: vi.fn((url: string) => {
    throw new Error(`REDIRECT:${url}`);
  }),
}));

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

vi.mock('@/lib/supabase/server', () => ({
  getSupabaseAdminClient: vi.fn(),
}));

import { auth } from '@clerk/nextjs/server';
import { getSupabaseAdminClient } from '@/lib/supabase/server';
import { createClientNote } from '@/lib/clients/actions';

describe('createClientNote', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const createMockSupabase = () => {
    const insertMock = vi.fn().mockResolvedValue({ error: null });
    const singleMock = vi.fn();
    const fromMock = vi.fn((table: string) => {
      if (table === 'orgs') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: singleMock,
        };
      }
      if (table === 'client_notes') {
        return { insert: insertMock };
      }
      return {};
    });
    return { from: fromMock, _insertMock: insertMock, _singleMock: singleMock };
  };

  it('uses server-derived userId as author_id, not client-supplied value', async () => {
    vi.mocked(auth).mockResolvedValue({ userId: 'user_real' } as any);
    const mockSupabase = createMockSupabase();
    vi.mocked(getSupabaseAdminClient).mockReturnValue(mockSupabase as any);
    mockSupabase._singleMock.mockResolvedValue({ data: { id: 'org_1' }, error: null });

    await createClientNote({
      clientId: 'client_1',
      orgId: 'org_1',
      body: 'Test note',
    });

    const insertCalls = mockSupabase._insertMock.mock.calls;
    expect(insertCalls.length).toBe(1);
    const insertedData = insertCalls[0][0];
    expect(insertedData.author_id).toBe('user_real');
    expect(insertedData).not.toHaveProperty('authorId');
  });

  it('rejects when user does not own the org', async () => {
    vi.mocked(auth).mockResolvedValue({ userId: 'user_evil' } as any);
    const mockSupabase = createMockSupabase();
    vi.mocked(getSupabaseAdminClient).mockReturnValue(mockSupabase as any);
    mockSupabase._singleMock.mockResolvedValue({ data: null, error: null });

    await expect(
      createClientNote({
        clientId: 'client_1',
        orgId: 'org_not_mine',
        body: 'Malicious note',
      })
    ).rejects.toThrow('Forbidden');
  });
});
