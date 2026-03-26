import type { DeliverableStatus, InvoiceStatus } from './types';

export const DELIVERABLE_STATUS_COLORS: Record<DeliverableStatus, { color: string; bg: string; border: string }> = {
  not_started: { color: '#6b7280', bg: 'transparent', border: 'transparent' },
  in_progress: { color: '#6EE7B7', bg: 'rgba(110,231,183,0.10)', border: 'rgba(110,231,183,0.25)' },
  pending_approval: { color: '#facc15', bg: 'rgba(250,204,21,0.10)', border: 'rgba(250,204,21,0.25)' },
  approved: { color: '#6EE7B7', bg: 'rgba(110,231,183,0.10)', border: 'rgba(110,231,183,0.20)' },
  published: { color: '#6EE7B7', bg: 'rgba(110,231,183,0.10)', border: 'rgba(110,231,183,0.20)' },
};

export const DELIVERABLE_STATUS_PCT: Record<DeliverableStatus, number> = {
  not_started: 0,
  in_progress: 40,
  pending_approval: 70,
  approved: 90,
  published: 100,
};

export const INVOICE_STATUS_COLORS: Record<InvoiceStatus, string> = {
  paid: '#6EE7B7',
  overdue: '#f87171',
  sent: '#facc15',
  draft: '#888',
  voided: '#888',
};
