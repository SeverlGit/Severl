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
          title: "Automate Billing",
          description: "Generate and send invoices. Retainers can be billed out in batches.",
          side: "right",
          align: "start"
        }
      },
      {
        element: "#tour-nav-settings",
        popover: {
          title: "Settings & Options",
          description: "Configure your currency, invoice defaults, display density, and account details.",
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
