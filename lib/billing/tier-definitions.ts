import type { PlanTier } from '@/lib/database.types';

export class TierLimitError extends Error {
  readonly userMessage: string;
  constructor(message: string, userMessage: string) {
    super(message);
    this.name = 'TierLimitError';
    this.userMessage = userMessage;
  }
}

export type TierLimits = {
  clients: number;
  deliverables: number;
  storageBytes: number;
  /** null = unlimited */
  brandGuideSharesPerMonth: number | null;
  whitelabelApprovals: boolean;
  invoicePaymentLinks: boolean;
  invoiceCsvExport: boolean;
  autoRecurringInvoices: boolean;
  analyticsLevel: 'basic' | 'full' | 'full_forecast';
  clientPortal: boolean;
};

export const TIER_LIMITS: Record<PlanTier, TierLimits> = {
  essential: {
    clients: 5,
    deliverables: 25,
    storageBytes: 500 * 1024 ** 2,
    brandGuideSharesPerMonth: 3,
    whitelabelApprovals: false,
    invoicePaymentLinks: false,
    invoiceCsvExport: false,
    autoRecurringInvoices: false,
    analyticsLevel: 'basic',
    clientPortal: false,
  },
  pro: {
    clients: 15,
    deliverables: 150,
    storageBytes: 10 * 1024 ** 3,
    brandGuideSharesPerMonth: null,
    whitelabelApprovals: false,
    invoicePaymentLinks: true,
    invoiceCsvExport: true,
    autoRecurringInvoices: false,
    analyticsLevel: 'full',
    clientPortal: false,
  },
  elite: {
    clients: Infinity,
    deliverables: Infinity,
    storageBytes: 100 * 1024 ** 3,
    brandGuideSharesPerMonth: null,
    whitelabelApprovals: true,
    invoicePaymentLinks: true,
    invoiceCsvExport: true,
    autoRecurringInvoices: true,
    analyticsLevel: 'full_forecast',
    clientPortal: false,
  },
  agency: {
    clients: Infinity,
    deliverables: Infinity,
    storageBytes: 500 * 1024 ** 3,
    brandGuideSharesPerMonth: null,
    whitelabelApprovals: true,
    invoicePaymentLinks: true,
    invoiceCsvExport: true,
    autoRecurringInvoices: true,
    analyticsLevel: 'full_forecast',
    clientPortal: true,
  },
};
