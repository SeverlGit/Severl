'use client';

import React, { createContext, useContext } from 'react';
import type { PlanTier } from '@/lib/database.types';
import { TIER_LIMITS, type TierLimits } from '@/lib/billing/tier-definitions';

type PlanContextValue = {
  planTier: PlanTier;
  limits: TierLimits;
  clientsUsed: number;
  atClientLimit: boolean;
  // Derived capability flags — use these in UI instead of checking planTier directly
  canUsePaymentLinks: boolean;
  canExportCsv: boolean;
  canWhitelabelApprovals: boolean;
  canAutoRecurringInvoices: boolean;
  canAccessClientPortal: boolean;
  hasUnlimitedBrandGuideShares: boolean;
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

  const value: PlanContextValue = {
    planTier,
    limits,
    clientsUsed,
    atClientLimit,
    canUsePaymentLinks: limits.invoicePaymentLinks,
    canExportCsv: limits.invoiceCsvExport,
    canWhitelabelApprovals: limits.whitelabelApprovals,
    canAutoRecurringInvoices: limits.autoRecurringInvoices,
    canAccessClientPortal: limits.clientPortal,
    hasUnlimitedBrandGuideShares: limits.brandGuideSharesPerMonth === null,
  };

  return (
    <PlanContext.Provider value={value}>
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
