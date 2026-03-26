import type { ClientTag, DeliverableStatus, InvoiceStatus } from './types';

export const DELIVERABLE_STATUS_COLORS: Record<DeliverableStatus, string> = {
  not_started:      'tag-muted',
  in_progress:      'tag-plum',
  pending_approval: 'tag-amber',
  approved:         'tag-rose',
  published:        'tag-green',
};

export const DELIVERABLE_STATUS_PCT: Record<DeliverableStatus, number> = {
  not_started:      0,
  in_progress:      40,
  pending_approval: 70,
  approved:         90,
  published:        100,
};

export const INVOICE_STATUS_COLORS: Record<InvoiceStatus, string> = {
  paid:   '#5A8A6A',
  overdue:'#C05A48',
  sent:   '#B5803A',
  draft:  '#A09890',
  voided: '#A09890',
};

export const CLIENT_TAG_COLORS: Record<ClientTag, string> = {
  prospect:   'tag-muted',
  onboarding: 'tag-plum',
  active:     'tag-green',
  at_risk:    'tag-amber',
  paused:     'tag-muted',
  churned:    'tag-red',
};
