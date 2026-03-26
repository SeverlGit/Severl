"use client";

/**
 * Design: command-center archetype — vertical timeline with colored event dots
 * Distinction: 1px vertical line, semantic dot colors by event type, mono timestamps,
 *   amount badges for payment events; avoids generic list-with-badges
 * Rule-break: none — follows design.config dense typography and semantic colors
 */

import React from "react";
import { motion } from "framer-motion";
import { format, formatDistanceToNow } from "date-fns";
import { Activity } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

type Event = {
  id?: string;
  event_type: string;
  amount: number | null;
  metadata: Record<string, unknown>;
  created_at: string;
};

type Props = {
  events: Event[];
};

function getEventDotColor(eventType: string): string {
  if (eventType.startsWith("client.")) return "bg-brand-mint";
  if (eventType.startsWith("deliverable.")) return "bg-purple-400";
  if (eventType.startsWith("invoice.")) return "bg-blue-400";
  if (eventType.startsWith("payment.")) return "bg-emerald-400";
  if (eventType.startsWith("retainer.")) return "bg-blue-400";
  return "bg-txt-muted";
}

function formatEventDescription(event: Event): string {
  const meta = event.metadata as Record<string, string> | undefined;
  const descriptions: Record<string, string> = {
    "client.added": "Client added",
    "client.tag_changed": `Status changed to ${meta?.new_tag ?? "unknown"}`,
    "client.renewed": "Contract renewed",
    "client.churned": "Client churned",
    "deliverable.created": `Deliverable created: ${meta?.title ?? ""}`.trim(),
    "deliverable.status_changed": `Deliverable ${meta?.new_status ?? "updated"}`,
    "deliverable.completed": "Deliverable completed",
    "invoice.created": "Invoice created",
    "invoice.sent": "Invoice sent",
    "invoice.paid": "Invoice paid",
    "invoice.overdue": "Invoice overdue",
    "invoice.voided": "Invoice voided",
    "payment.received": "Payment received",
    "payment.refunded": "Payment refunded",
    "retainer.batch_sent": "Monthly invoices sent",
  };
  return descriptions[event.event_type] ?? event.event_type.replace(/_/g, " ");
}

function formatRelativeTime(createdAt: string): string {
  const date = new Date(createdAt);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays >= 7 || diffDays < 0) {
    return format(date, "MMM d");
  }
  return formatDistanceToNow(date, { addSuffix: true });
}

export function ActivityTimeline({ events }: Props) {
  if (events.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <Activity className="mb-2 h-8 w-8 text-txt-hint" />
        <p className="text-sm text-txt-muted">No activity yet</p>
        <p className="mt-0.5 text-xs text-txt-hint">
          Events will appear as you work with this client.
        </p>
      </div>
    );
  }

  return (
    <div className="relative space-y-0">
      {events.map((event, i) => (
        <motion.div
          key={event.id ?? `${event.created_at}-${i}`}
          initial={{ opacity: 0, x: -6 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.25, ease: "easeOut", delay: i * 0.04 }}
          className="relative flex gap-3 py-2.5 pl-0"
        >
          {/* Connector: below this dot to bottom of row; omitted on last item */}
          {i < events.length - 1 && (
            <div
              className="pointer-events-none absolute bottom-0 left-[4px] top-[calc(0.625rem+0.375rem+9px)] z-0 w-px bg-border"
              aria-hidden
            />
          )}
          {/* Dot */}
          <div className="relative z-10 mt-1.5 flex-shrink-0">
            <span
              className={`block h-[9px] w-[9px] rounded-full ${getEventDotColor(event.event_type)}`}
            />
          </div>

          {/* Content */}
          <div className="min-w-0 flex-1">
            <p className="text-sm text-txt-secondary">
              {formatEventDescription(event)}
            </p>
            <p className="mt-0.5 font-mono text-[10px] text-txt-hint">
              {formatRelativeTime(event.created_at)}
            </p>
          </div>

          {/* Amount (if applicable) */}
          {event.amount != null && event.amount !== 0 && (
            <span
              className={`mt-1 font-mono text-[11px] tabular-nums shrink-0 ${
                event.event_type.includes("refund") ? "text-danger" : "text-brand-mint"
              }`}
            >
              {formatCurrency(event.amount)}
            </span>
          )}
        </motion.div>
      ))}
    </div>
  );
}
