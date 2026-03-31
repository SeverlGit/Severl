'use client';

import React, { createContext, useContext } from 'react';
import type { PlanTier } from '@/lib/database.types';
import { TIER_LIMITS } from '@/lib/billing/tier-definitions';

type PlanContextValue = {
  planTier: PlanTier;
  limits: typeof TIER_LIMITS['essential'];
  clientsUsed: number;
  atClientLimit: boolean;
};

const PlanContext = createContext<PlanContextValue | null>(null);

type Props = {
  planTier: PlanTier;
  clientsUsed: number;
  children: React.ReactNode;
};

export function PlanProvider({ planTier, clientsUsed, children }: Props) {
  const limits = TIER_LIMITS[planTier];
  const atClientLimit = clientsUsed >= limits.clients;

  return (
    <PlanContext.Provider value={{ planTier, limits, clientsUsed, atClientLimit }}>
      {children}
    </PlanContext.Provider>
  );
}

export function usePlan() {
  const ctx = useContext(PlanContext);
  if (!ctx) {
    throw new Error('usePlan must be used within a PlanProvider');
  }
  return ctx;
}
