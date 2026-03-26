export type VerticalSlug = 'smm_freelance' | 'smm_agency';

export type DeliverableStatus =
  | 'not_started'
  | 'in_progress'
  | 'pending_approval'
  | 'approved'
  | 'published';

export type ClientTag =
  | 'active'
  | 'at_risk'
  | 'paused'
  | 'churned'
  | 'prospect'
  | 'onboarding';

export type InvoiceStatus =
  | 'draft'
  | 'sent'
  | 'paid'
  | 'overdue'
  | 'voided';

export type InvoiceType = 'retainer' | 'project' | 'ad_spend';
