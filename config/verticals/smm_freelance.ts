export type VerticalMetricConfig = {
  key:
    | 'mrr'
    | 'active_clients'
    | 'churn_rate'
    | 'renewal_rate'
    | 'avg_retainer'
    | 'delivery_rate'
    | 'team_capacity';
  label: string;
  show: boolean;
};

export type VerticalConfig = {
  name: string;
  slug: 'smm_freelance';
  crm: {
    clientLabel: string;
    clientsLabel: string;
    clientEntity: string;
    contactLabel: string;
    rosterLabel: string;
    intakeFields: {
      key: string;
      label: string;
      type: 'multi_select' | 'key_value' | 'textarea' | 'tags' | 'text' | 'number' | 'currency';
      options?: string[];
    }[];
    profileSections: string[];
    atRiskTriggers: {
      noResponseDays: number;
      invoiceOverdueDays: number;
      renewalWarningDays: number;
    };
    tags: string[];
  };
  deliverables: {
    deliverableLabel: string;
    deliverablesLabel: string;
    monthlyViewLabel: string;
    statusLabels: Record<
      'not_started' | 'in_progress' | 'pending_approval' | 'approved' | 'published',
      string
    >;
    defaultDeliverableTypes: { key: string; label: string; icon: string }[];
    showAssignee: boolean;
  };
  invoicing: {
    invoiceLabel: string;
    retainerLabel: string;
    lineItemLabel: string;
    defaultDueDays: number;
    billingCycle: 'monthly';
    showAdSpendLine: boolean;
    showProjectLine?: boolean;
    defaultLineItems: { description: string; unitPrice: number | null }[];
    batchBillingLabel: string;
  };
  analytics: {
    metrics: VerticalMetricConfig[];
    revenueByClientChart: boolean;
    renewalPipelineWidget: boolean;
    teamCapacityWidget?: boolean;
  };
};

const smmFreelanceConfig: VerticalConfig = {
  name: 'Solo SMM',
  slug: 'smm_freelance',

  crm: {
    clientLabel: 'Client',
    clientsLabel: 'Clients',
    clientEntity: 'Brand',
    contactLabel: 'Contact',
    rosterLabel: 'Client roster',
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
      { key: 'do_not_post', label: "Don't post", type: 'textarea' },
    ],
    profileSections: ['overview', 'deliverables', 'invoices', 'brand_guide', 'notes'],
    atRiskTriggers: {
      noResponseDays: 14,
      invoiceOverdueDays: 7,
      renewalWarningDays: 30,
    },
    tags: ['active', 'at_risk', 'paused', 'churned', 'prospect'],
  },

  deliverables: {
    deliverableLabel: 'Deliverable',
    deliverablesLabel: 'Deliverables',
    monthlyViewLabel: 'This month',
    statusLabels: {
      not_started: 'Not started',
      in_progress: 'In progress',
      pending_approval: 'Awaiting approval',
      approved: 'Approved',
      published: 'Published',
    },
    defaultDeliverableTypes: [
      { key: 'feed_post', label: 'Feed post', icon: 'grid' },
      { key: 'reel', label: 'Reel', icon: 'video' },
      { key: 'story', label: 'Story', icon: 'circle' },
      { key: 'carousel', label: 'Carousel', icon: 'layers' },
      { key: 'tiktok', label: 'TikTok', icon: 'music' },
      { key: 'linkedin_post', label: 'LinkedIn post', icon: 'briefcase' },
      { key: 'monthly_report', label: 'Monthly report', icon: 'file' },
      { key: 'strategy_doc', label: 'Strategy doc', icon: 'compass' },
    ],
    showAssignee: false,
  },

  invoicing: {
    invoiceLabel: 'Invoice',
    retainerLabel: 'Retainer',
    lineItemLabel: 'Service',
    defaultDueDays: 7,
    billingCycle: 'monthly',
    showAdSpendLine: true,
    defaultLineItems: [
      { description: 'Monthly social media management', unitPrice: null },
      { description: 'Ad spend reimbursement', unitPrice: null },
      { description: 'Content creation (ad hoc)', unitPrice: null },
    ],
    batchBillingLabel: 'Send monthly invoices',
  },

  analytics: {
    metrics: [
      { key: 'mrr', label: 'Monthly recurring revenue', show: true },
      { key: 'active_clients', label: 'Active clients', show: true },
      { key: 'churn_rate', label: 'Churn rate', show: true },
      { key: 'renewal_rate', label: 'Renewal rate', show: true },
      { key: 'avg_retainer', label: 'Avg retainer value', show: true },
      { key: 'delivery_rate', label: 'Deliverable completion', show: true },
      { key: 'team_capacity', label: 'Team capacity', show: false },
    ],
    revenueByClientChart: true,
    renewalPipelineWidget: true,
  },
};

export default smmFreelanceConfig;

