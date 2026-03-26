import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock @clerk/nextjs/server
vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn(),
}));

// Mock next/navigation
vi.mock('next/navigation', () => ({
  redirect: vi.fn((url: string) => {
    throw new Error(`REDIRECT:${url}`);
  }),
}));

// Mock supabase admin client
vi.mock('@/lib/supabase/server', () => ({
  getSupabaseAdminClient: vi.fn(),
}));

import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { getSupabaseAdminClient } from '@/lib/supabase/server';
import { requireAuth, requireOrgAccess } from '@/lib/auth-guard';

describe('requireAuth', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns userId when authenticated', async () => {
    vi.mocked(auth).mockResolvedValue({ userId: 'user_123' } as any);
    const result = await requireAuth();
    expect(result).toBe('user_123');
  });

  it('redirects to /sign-in when not authenticated', async () => {
    vi.mocked(auth).mockResolvedValue({ userId: null } as any);
    await expect(requireAuth()).rejects.toThrow('REDIRECT:/sign-in');
    expect(redirect).toHaveBeenCalledWith('/sign-in');
  });
});

describe('requireOrgAccess', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockSupabase = {
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn(),
  };

  it('returns userId when user owns the org', async () => {
    vi.mocked(auth).mockResolvedValue({ userId: 'user_123' } as any);
    vi.mocked(getSupabaseAdminClient).mockReturnValue(mockSupabase as any);
    mockSupabase.single.mockResolvedValue({ data: { id: 'org_abc' }, error: null });

    const result = await requireOrgAccess('org_abc');
    expect(result).toBe('user_123');
  });

  it('throws Forbidden when user does not own the org', async () => {
    vi.mocked(auth).mockResolvedValue({ userId: 'user_123' } as any);
    vi.mocked(getSupabaseAdminClient).mockReturnValue(mockSupabase as any);
    mockSupabase.single.mockResolvedValue({ data: null, error: null });

    await expect(requireOrgAccess('org_other')).rejects.toThrow('Forbidden');
  });

  it('redirects when not authenticated', async () => {
    vi.mocked(auth).mockResolvedValue({ userId: null } as any);
    await expect(requireOrgAccess('org_abc')).rejects.toThrow('REDIRECT:/sign-in');
  });
});
