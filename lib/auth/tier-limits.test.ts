import { describe, it, expect, vi, beforeEach } from 'vitest';
import { checkClientLimit, checkDeliverableLimit, TierLimitError, TIER_LIMITS } from './tier-limits';
import { getSupabaseAdminClient } from '@/lib/supabase/server';

// Mock the supabase server module
vi.mock('@/lib/supabase/server', () => ({
  getSupabaseAdminClient: vi.fn(),
}));

describe('Tier Limits Validation', () => {
  let mockSupabase: any;

  beforeEach(() => {
    vi.clearAllMocks();

    // Create a mock Supabase client chain
    mockSupabase = {
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      is: vi.fn().mockReturnThis(),
      single: vi.fn(),
    };

    (getSupabaseAdminClient as any).mockReturnValue(mockSupabase);
  });

  describe('checkClientLimit', () => {
    it('should allow adding a client if under the limit for essential tier', async () => {
      // Mock org query
      mockSupabase.single.mockResolvedValueOnce({ data: { plan_tier: 'essential' } });
      // Mock client count query
      mockSupabase.is.mockResolvedValueOnce({ count: 1 }); // 1 client currently, limit is 5

      await expect(checkClientLimit('org_123')).resolves.toBeUndefined();
    });

    it('should throw TierLimitError if at the limit for essential tier', async () => {
      // Mock org query
      mockSupabase.single.mockResolvedValue({ data: { plan_tier: 'essential' } });
      // Mock client count query
      mockSupabase.is.mockResolvedValue({ count: 5 }); // 5 clients currently, limit is 5

      await expect(checkClientLimit('org_123')).rejects.toThrow(TierLimitError);
      await expect(checkClientLimit('org_123')).rejects.toThrow(/ hit client limit for tier /);
    });

    it('should allow infinite clients for agency tier', async () => {
      // Mock org query
      mockSupabase.single.mockResolvedValueOnce({ data: { plan_tier: 'agency' } });
      // Mock client count query
      mockSupabase.is.mockResolvedValueOnce({ count: 9999 });

      await expect(checkClientLimit('org_123')).resolves.toBeUndefined();
    });
  });

  describe('checkDeliverableLimit', () => {
    it('should allow adding deliverable if under limit', async () => {
      // Mock org query
      mockSupabase.single.mockResolvedValueOnce({ data: { plan_tier: 'pro' } });
      // Mock deliverable count query
      mockSupabase.is.mockResolvedValueOnce({ count: 99 }); // Under 100 limit

      await expect(checkDeliverableLimit('org_123', new Date())).resolves.toBeUndefined();
    });

    it('should throw TierLimitError if at the limit', async () => {
      // Mock org query
      mockSupabase.single.mockResolvedValueOnce({ data: { plan_tier: 'pro' } });
      // Mock deliverable count query
      mockSupabase.is.mockResolvedValueOnce({ count: 100 }); // At 100 limit

      await expect(checkDeliverableLimit('org_123', new Date())).rejects.toThrow(TierLimitError);
    });
  });
});
