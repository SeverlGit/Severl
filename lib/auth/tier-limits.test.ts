import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  checkClientLimit,
  checkDeliverableLimit,
  checkFeatureAccess,
  checkBrandGuideShareLimit,
  TierLimitError,
  TIER_LIMITS,
} from './tier-limits';
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

  // ─── TIER_LIMITS shape ───────────────────────────────────────────────────
  describe('TIER_LIMITS shape', () => {
    it('essential has 5 client limit', () => {
      expect(TIER_LIMITS.essential.clients).toBe(5);
    });

    it('pro has 15 client limit', () => {
      expect(TIER_LIMITS.pro.clients).toBe(15);
    });

    it('essential has 25 deliverable limit', () => {
      expect(TIER_LIMITS.essential.deliverables).toBe(25);
    });

    it('pro has 150 deliverable limit', () => {
      expect(TIER_LIMITS.pro.deliverables).toBe(150);
    });

    it('elite and agency have Infinity clients', () => {
      expect(TIER_LIMITS.elite.clients).toBe(Infinity);
      expect(TIER_LIMITS.agency.clients).toBe(Infinity);
    });

    it('essential does not have invoice payment links', () => {
      expect(TIER_LIMITS.essential.invoicePaymentLinks).toBe(false);
    });

    it('pro and above have invoice payment links', () => {
      expect(TIER_LIMITS.pro.invoicePaymentLinks).toBe(true);
      expect(TIER_LIMITS.elite.invoicePaymentLinks).toBe(true);
      expect(TIER_LIMITS.agency.invoicePaymentLinks).toBe(true);
    });

    it('only elite and agency have white-label approvals', () => {
      expect(TIER_LIMITS.essential.whitelabelApprovals).toBe(false);
      expect(TIER_LIMITS.pro.whitelabelApprovals).toBe(false);
      expect(TIER_LIMITS.elite.whitelabelApprovals).toBe(true);
      expect(TIER_LIMITS.agency.whitelabelApprovals).toBe(true);
    });

    it('only agency has client portal', () => {
      expect(TIER_LIMITS.essential.clientPortal).toBe(false);
      expect(TIER_LIMITS.pro.clientPortal).toBe(false);
      expect(TIER_LIMITS.elite.clientPortal).toBe(false);
      expect(TIER_LIMITS.agency.clientPortal).toBe(true);
    });

    it('essential has 3 brand guide shares per month', () => {
      expect(TIER_LIMITS.essential.brandGuideSharesPerMonth).toBe(3);
    });

    it('pro, elite, agency have unlimited brand guide shares (null)', () => {
      expect(TIER_LIMITS.pro.brandGuideSharesPerMonth).toBeNull();
      expect(TIER_LIMITS.elite.brandGuideSharesPerMonth).toBeNull();
      expect(TIER_LIMITS.agency.brandGuideSharesPerMonth).toBeNull();
    });
  });

  // ─── checkClientLimit ────────────────────────────────────────────────────
  describe('checkClientLimit', () => {
    it('allows adding a client if under the essential limit', async () => {
      mockSupabase.single.mockResolvedValueOnce({ data: { plan_tier: 'essential' } });
      mockSupabase.is.mockResolvedValueOnce({ count: 1 }); // 1/5

      await expect(checkClientLimit('org_123')).resolves.toBeUndefined();
    });

    it('throws TierLimitError when at the essential limit (5)', async () => {
      mockSupabase.single.mockResolvedValue({ data: { plan_tier: 'essential' } });
      mockSupabase.is.mockResolvedValue({ count: 5 }); // 5/5

      await expect(checkClientLimit('org_123')).rejects.toThrow(TierLimitError);
      await expect(checkClientLimit('org_123')).rejects.toThrow(/ hit client limit for tier /);
    });

    it('throws TierLimitError when at the pro limit (15)', async () => {
      mockSupabase.single.mockResolvedValue({ data: { plan_tier: 'pro' } });
      mockSupabase.is.mockResolvedValue({ count: 15 }); // 15/15

      await expect(checkClientLimit('org_123')).rejects.toThrow(TierLimitError);
    });

    it('allows infinite clients for agency tier even at 9999', async () => {
      mockSupabase.single.mockResolvedValueOnce({ data: { plan_tier: 'agency' } });
      mockSupabase.is.mockResolvedValueOnce({ count: 9999 });

      await expect(checkClientLimit('org_123')).resolves.toBeUndefined();
    });

    it('allows infinite clients for elite tier', async () => {
      mockSupabase.single.mockResolvedValueOnce({ data: { plan_tier: 'elite' } });
      mockSupabase.is.mockResolvedValueOnce({ count: 9999 });

      await expect(checkClientLimit('org_123')).resolves.toBeUndefined();
    });
  });

  // ─── checkDeliverableLimit ───────────────────────────────────────────────
  describe('checkDeliverableLimit', () => {
    it('allows adding deliverable if under pro limit (150)', async () => {
      mockSupabase.single.mockResolvedValueOnce({ data: { plan_tier: 'pro' } });
      mockSupabase.is.mockResolvedValueOnce({ count: 99 });

      await expect(checkDeliverableLimit('org_123', new Date())).resolves.toBeUndefined();
    });

    it('throws TierLimitError when at the pro deliverable limit (150)', async () => {
      mockSupabase.single.mockResolvedValueOnce({ data: { plan_tier: 'pro' } });
      mockSupabase.is.mockResolvedValueOnce({ count: 150 });

      await expect(checkDeliverableLimit('org_123', new Date())).rejects.toThrow(TierLimitError);
    });

    it('allows infinite deliverables for elite tier', async () => {
      mockSupabase.single.mockResolvedValueOnce({ data: { plan_tier: 'elite' } });
      mockSupabase.is.mockResolvedValueOnce({ count: 9999 });

      await expect(checkDeliverableLimit('org_123', new Date())).resolves.toBeUndefined();
    });
  });

  // ─── checkFeatureAccess ──────────────────────────────────────────────────
  describe('checkFeatureAccess', () => {
    it('allows invoicePaymentLinks on pro tier', async () => {
      mockSupabase.single.mockResolvedValueOnce({ data: { plan_tier: 'pro' } });

      await expect(
        checkFeatureAccess('org_123', 'invoicePaymentLinks', 'pro')
      ).resolves.toBeUndefined();
    });

    it('throws TierLimitError for invoicePaymentLinks on essential', async () => {
      mockSupabase.single.mockResolvedValueOnce({ data: { plan_tier: 'essential' } });

      await expect(
        checkFeatureAccess('org_123', 'invoicePaymentLinks', 'pro')
      ).rejects.toThrow(TierLimitError);
    });

    it('allows whitelabelApprovals on elite', async () => {
      mockSupabase.single.mockResolvedValueOnce({ data: { plan_tier: 'elite' } });

      await expect(
        checkFeatureAccess('org_123', 'whitelabelApprovals', 'elite')
      ).resolves.toBeUndefined();
    });

    it('throws TierLimitError for whitelabelApprovals on pro', async () => {
      mockSupabase.single.mockResolvedValueOnce({ data: { plan_tier: 'pro' } });

      await expect(
        checkFeatureAccess('org_123', 'whitelabelApprovals', 'elite')
      ).rejects.toThrow(TierLimitError);
    });

    it('allows clientPortal on agency', async () => {
      mockSupabase.single.mockResolvedValueOnce({ data: { plan_tier: 'agency' } });

      await expect(
        checkFeatureAccess('org_123', 'clientPortal', 'agency')
      ).resolves.toBeUndefined();
    });

    it('throws TierLimitError for clientPortal on elite', async () => {
      mockSupabase.single.mockResolvedValueOnce({ data: { plan_tier: 'elite' } });

      await expect(
        checkFeatureAccess('org_123', 'clientPortal', 'agency')
      ).rejects.toThrow(TierLimitError);
    });
  });

  // ─── checkBrandGuideShareLimit ───────────────────────────────────────────
  describe('checkBrandGuideShareLimit', () => {
    it('returns { used: 0, limit: null } for pro tier (unlimited)', async () => {
      mockSupabase.single.mockResolvedValueOnce({
        data: { plan_tier: 'pro', ui_meta: {} },
      });

      const result = await checkBrandGuideShareLimit('org_123');
      expect(result).toEqual({ used: 0, limit: null });
    });

    it('returns correct count for essential tier with existing shares', async () => {
      const now = new Date();
      const monthKey = `brand_guide_shares_${now.getFullYear()}_${String(now.getMonth() + 1).padStart(2, '0')}`;
      mockSupabase.single.mockResolvedValueOnce({
        data: { plan_tier: 'essential', ui_meta: { [monthKey]: 2 } },
      });

      const result = await checkBrandGuideShareLimit('org_123');
      expect(result).toEqual({ used: 2, limit: 3 });
    });

    it('throws TierLimitError when essential share limit (3) is reached', async () => {
      const now = new Date();
      const monthKey = `brand_guide_shares_${now.getFullYear()}_${String(now.getMonth() + 1).padStart(2, '0')}`;
      mockSupabase.single.mockResolvedValueOnce({
        data: { plan_tier: 'essential', ui_meta: { [monthKey]: 3 } },
      });

      await expect(checkBrandGuideShareLimit('org_123')).rejects.toThrow(TierLimitError);
    });

    it('returns 0 used when no shares made yet for essential', async () => {
      mockSupabase.single.mockResolvedValueOnce({
        data: { plan_tier: 'essential', ui_meta: {} },
      });

      const result = await checkBrandGuideShareLimit('org_123');
      expect(result).toEqual({ used: 0, limit: 3 });
    });
  });
});
