import type { VerticalMetricConfig, VerticalConfig as FreelanceVerticalConfig } from './smm_freelance';

export type VerticalConfig = Omit<FreelanceVerticalConfig, 'slug'> & {
  slug: 'smm_agency';
  crm: FreelanceVerticalConfig['crm'] & {
    showAccountManager: boolean;
  };
  deliverables: FreelanceVerticalConfig['deliverables'] & {
    capacityTracking: boolean;
  };
  analytics: {
    metrics: VerticalMetricConfig[];
    revenueByClientChart: boolean;
    renewalPipelineWidget: boolean;
    teamCapacityWidget: boolean;
  };
};

const smmAgencyConfig: VerticalConfig = {
  name: 'SMM Agency',
  slug: 'smm_agency',

  crm: {
    clientLabel: 'Account',
    clientsLabel: 'Accounts',
    clientEntity: 'Brand account',
    contactLabel: 'Client contact',
    rosterLabel: 'Account roster',
    intakeFields: [
      {
        key: 'platforms',
        label: 'Platforms',
        type: 'multi_select',
        options: ['Instagram', 'TikTok', 'LinkedIn', 'X', 'Facebook', 'YouTube', 'Pinterest'],
      },
      { key: 'handles', label: 'Account handles', type: 'key_value' },
      { key: 'brand_voice', label: 'Brand voice', type: 'textarea' },
      { key: 'content_pillars', label: 'Content pillars', type: 'tags' },
      { key: 'approval_contact', label: 'Approves content', type: 'text' },
      { key: 'approval_sla_days', label: 'Approval SLA (days)', type: 'number' },
      { key: 'do_not_post', label: "Don't post", type: 'textarea' },
      { key: 'monthly_budget', label: 'Monthly ad budget', type: 'currency' },
    ],
    profileSections: ['overview', 'deliverables', 'invoices', 'brand_guide', 'team', 'notes'],
    atRiskTriggers: {
      noResponseDays: 10,
      invoiceOverdueDays: 7,
      renewalWarningDays: 45,
    },
    tags: ['active', 'at_risk', 'paused', 'churned', 'prospect', 'onboarding'],
    showAccountManager: true,
  },

  deliverables: {
    deliverableLabel: 'Deliverable',
    deliverablesLabel: 'Deliverables',
    monthlyViewLabel: 'This month',
    statusLabels: {
      not_started: 'Not started',
      in_progress: 'In progress',
      pending_approval: 'With client',
      approved: 'Client approved',
      published: 'Live',
    },
    defaultDeliverableTypes: [
      { key: 'feed_post', label: 'Feed post', icon: 'grid' },
      { key: 'reel', label: 'Reel', icon: 'video' },
      { key: 'story', label: 'Story', icon: 'circle' },
      { key: 'carousel', label: 'Carousel', icon: 'layers' },
      { key: 'tiktok', label: 'TikTok', icon: 'music' },
      { key: 'linkedin_post', label: 'LinkedIn post', icon: 'briefcase' },
      { key: 'paid_ad', label: 'Paid ad', icon: 'target' },
      { key: 'monthly_report', label: 'Monthly report', icon: 'file' },
      { key: 'strategy_doc', label: 'Strategy doc', icon: 'compass' },
    ],
    showAssignee: true,
    capacityTracking: true,
  },

  invoicing: {
    invoiceLabel: 'Invoice',
    retainerLabel: 'Retainer',
    lineItemLabel: 'Service',
    defaultDueDays: 14,
    billingCycle: 'monthly',
    showAdSpendLine: true,
    showProjectLine: true,
    defaultLineItems: [
      { description: 'Monthly account management retainer', unitPrice: null },
      { description: 'Content creation — ad hoc', unitPrice: null },
      { description: 'Paid social management fee', unitPrice: null },
      { description: 'Ad spend reimbursement', unitPrice: null },
    ],
    batchBillingLabel: 'Run monthly billing',
  },

  analytics: {
    metrics: [
      { key: 'mrr', label: 'Monthly recurring revenue', show: true },
      { key: 'active_clients', label: 'Active accounts', show: true },
      { key: 'churn_rate', label: 'Churn rate', show: true },
      { key: 'renewal_rate', label: 'Renewal rate', show: true },
      { key: 'avg_retainer', label: 'Avg retainer value', show: true },
      { key: 'delivery_rate', label: 'Deliverable completion', show: true },
      { key: 'team_capacity', label: 'Team capacity', show: false },
    ],
    revenueByClientChart: true,
    renewalPipelineWidget: true,
    teamCapacityWidget: true,
  },
};

export default smmAgencyConfig;

