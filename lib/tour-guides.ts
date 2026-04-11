"use client";

import { driver } from "driver.js";
import "driver.js/dist/driver.css";
import { markUIMetaSeen } from "@/lib/onboarding-actions";

export const brandTheme = {
  animate: true,
  smoothScroll: true,
  overlayOpacity: 0.55,
  stagePadding: 6,
  stageRadius: 6,
  allowClose: false,
  nextBtnText: "Next →",
  prevBtnText: "← Prev",
  doneBtnText: "Got it",
  showProgress: true,
};

/**
 * Triggers the main dashboard welcome tour.
 */
export function startMainTour() {
  const tour = driver({
    ...brandTheme,
    allowClose: true,
    onDestroyStarted: () => {
      // Called when user clicks close or finishes the tour
      tour.destroy();
      markUIMetaSeen("has_seen_tour");
    },
    steps: [
      {
        element: "#tour-nav-dashboard",
        popover: {
          title: "Welcome to Severl",
          description: "This is your central command. You'll see revenue trends and active retainer metrics here.",
          side: "right",
          align: "start"
        }
      },
      {
        element: "#tour-nav-clients",
        popover: {
          title: "Client Roster",
          description: "Add clients and configure their monthly retainer amounts here.",
          side: "right",
          align: "start"
        }
      },
      {
        element: "#tour-nav-deliverables",
        popover: {
          title: "Track Work",
          description: "A drag and drop status board to track what's owed to each client this month.",
          side: "right",
          align: "start"
        }
      },
      {
        element: "#tour-nav-invoices",
        popover: {
          title: "Billing & Invoices",
          description: "Generate, send, and collect on retainer invoices. Add Stripe payment links for card payments, export to CSV for accounting, and auto-send invoices on a recurring schedule.",
          side: "right",
          align: "start"
        }
      },
      {
        element: "#tour-nav-analytics",
        popover: {
          title: "Business Health",
          description: "Track MRR trends, renewal pipeline, delivery rates, capacity per client, and 90-day revenue forecasts. Churn risk scores surface which clients need attention.",
          side: "right",
          align: "start"
        }
      },
      {
        element: "#tour-nav-settings",
        popover: {
          title: "Settings & Options",
          description: "Configure currency, invoice defaults, display density, auto-billing schedule, and agency branding for client-facing approval pages.",
          side: "right",
          align: "end"
        }
      }
    ]
  });

  tour.drive();
}

/**
 * Triggers the guide for adding a new client.
 */
export function startAddClientTour(onComplete: () => void) {
  const tour = driver({
    ...brandTheme,
    allowClose: true,
    onDestroyStarted: () => {
      tour.destroy();
      onComplete(); // Tells AddClientDialog we don't need to trigger it again
      markUIMetaSeen("has_seen_first_client");
    },
    steps: [
      {
        element: "#form-client-brand",
        popover: {
          title: "Add your first client",
          description: "Enter the brand or company name.",
          side: "right",
          align: "center"
        }
      },
      {
        element: "#form-client-retainer",
        popover: {
          title: "Monthly Retainer",
          description: "If they pay you a fixed monthly fee, enter it here. This will be automatically pulled into your invoices.",
          side: "right",
          align: "center"
        }
      },
      {
        element: "#form-client-submit",
        popover: {
          title: "Finish Setup",
          description: "Once created, they'll appear on your roster and metrics will begin tracking.",
          side: "top",
          align: "end"
        }
      }
    ]
  });

  tour.drive();
}

/**
 * Triggers the contextual analytics tour (capacity + forecast).
 * Call when user visits /analytics and hasn't seen it yet.
 */
export function startAnalyticsTour(onComplete: () => void) {
  const tour = driver({
    ...brandTheme,
    allowClose: true,
    onDestroyStarted: () => {
      tour.destroy();
      onComplete();
      markUIMetaSeen("has_seen_analytics_tour");
    },
    steps: [
      {
        popover: {
          title: "Analytics v2",
          description: "Your dashboard now includes capacity metrics, churn risk scores, and a 90-day revenue forecast — not just raw MRR.",
          side: "over",
          align: "center",
        },
      },
      {
        element: "#tour-analytics-capacity",
        popover: {
          title: "Capacity — $/deliverable",
          description: "See how much each client is worth per deliverable. Spot under- and over-serviced accounts at a glance.",
          side: "top",
          align: "start",
        },
      },
      {
        element: "#tour-analytics-forecast",
        popover: {
          title: "90-day MRR Forecast",
          description: "Projected revenue accounting for at-risk renewals. Clients with a high churn score reduce the forecast for months their contract expires.",
          side: "top",
          align: "start",
        },
      },
    ],
  });

  tour.drive();
}

/**
 * Triggers the contextual invoices feature tour (payment links + CSV export).
 * Call when user visits /invoices and hasn't seen it yet.
 */
export function startInvoicesTour(onComplete: () => void) {
  const tour = driver({
    ...brandTheme,
    allowClose: true,
    onDestroyStarted: () => {
      tour.destroy();
      onComplete();
      markUIMetaSeen("has_seen_invoices_tour");
    },
    steps: [
      {
        element: "#tour-invoice-export",
        popover: {
          title: "Export to CSV",
          description: "Download all invoices as a CSV for your accountant or bookkeeping software. Available on Pro and above.",
          side: "bottom",
          align: "end",
        },
      },
      {
        popover: {
          title: "Stripe Payment Links",
          description: "Open any invoice and use 'Generate payment link' to create a Stripe-hosted checkout URL. Paste it into your email and clients can pay by card instantly. Available on Pro and above.",
          side: "over",
          align: "center",
        },
      },
      {
        popover: {
          title: "Auto-Dunning",
          description: "Overdue invoices automatically receive a friendly reminder at 7 days and a firmer follow-up at 14 days — both with a payment link attached. No manual chasing needed.",
          side: "over",
          align: "center",
        },
      },
    ],
  });

  tour.drive();
}

/**
 * Triggers the client portal tour for a specific client page.
 * Call when user visits /clients/[id] and hasn't seen it yet (Agency plan only).
 */
export function startClientPortalTour(onComplete: () => void) {
  const tour = driver({
    ...brandTheme,
    allowClose: true,
    onDestroyStarted: () => {
      tour.destroy();
      onComplete();
      markUIMetaSeen("has_seen_portal_tour");
    },
    steps: [
      {
        element: "#tour-client-portal",
        popover: {
          title: "Client Portal",
          description: "Generate a private link for this client. They'll see their brand guide, pending approvals, invoices, and recent activity — all in one branded page.",
          side: "bottom",
          align: "start",
        },
      },
    ],
  });

  tour.drive();
}

/**
 * Triggers the guide for creating an invoice.
 */
export function startCreateInvoiceTour(onComplete: () => void) {
  const tour = driver({
    ...brandTheme,
    allowClose: true,
    onDestroyStarted: () => {
      tour.destroy();
      onComplete();
      markUIMetaSeen("has_seen_first_invoice");
    },
    steps: [
      {
        element: "#form-invoice-client",
        popover: {
          title: "Draft an Invoice",
          description: "Select the client. If they have a retainer, their amount will automatically populate as a line item.",
          side: "left",
          align: "start"
        }
      },
      {
        element: "#form-invoice-due",
        popover: {
          title: "Due Date",
          description: "Set when the payment is expected. Overdue invoices are highlighted in red.",
          side: "left",
          align: "start"
        }
      },
      {
        element: "#form-invoice-submit",
        popover: {
          title: "Create Draft",
          description: "Creates a draft invoice. You can preview the client-facing PDF before marking it as sent.",
          side: "top",
          align: "end"
        }
      }
    ]
  });

  tour.drive();
}
