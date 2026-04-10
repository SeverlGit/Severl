import type { PlanTier } from '@/lib/database.types';

export class TierLimitError extends Error {
  readonly userMessage: string;
  constructor(message: string, userMessage: string) {
    super(message);
    this.name = 'TierLimitError';
    this.userMessage = userMessage;
  }
}

export const TIER_LIMITS: Record<
  PlanTier,
  { clients: number; deliverables: number; storageBytes: number; }
> = {
  essential: { clients: 5,        deliverables: 25,       storageBytes: 500 * 1024 ** 2 },
  pro:       { clients: 10,       deliverables: 100,      storageBytes: 10 * 1024 ** 3  },
  elite:     { clients: Infinity, deliverables: Infinity, storageBytes: 100 * 1024 ** 3 },
  agency:    { clients: Infinity, deliverables: Infinity, storageBytes: 500 * 1024 ** 3 },
};
