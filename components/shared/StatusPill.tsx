"use client";

import React from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { INVOICE_STATUS_COLORS } from "@/lib/constants";
import type { DeliverableStatus, InvoiceStatus } from "@/lib/types";

type DeliverableProps = {
  variant?: "deliverable";
  status: DeliverableStatus;
  label: string;
  className?: string;
};

type InvoiceProps = {
  variant: "invoice";
  status: InvoiceStatus;
  label: string;
  className?: string;
};

export type StatusPillProps = DeliverableProps | InvoiceProps;

const statusVariant: Record<DeliverableStatus, "muted" | "green" | "amber"> = {
  not_started: "muted",
  in_progress: "green",
  pending_approval: "amber",
  approved: "green",
  published: "green",
};

export function StatusPill(props: StatusPillProps) {
  if (props.variant === "invoice") {
    const color = INVOICE_STATUS_COLORS[props.status];
    return (
      <span
        className={cn(
          "inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-medium capitalize",
          props.className,
        )}
        style={{ color, borderColor: `${color}55` }}
      >
        {props.label}
      </span>
    );
  }

  const { status, label, className } = props;
  return (
    <Badge variant={statusVariant[status]} className={cn(className)}>
      {label}
    </Badge>
  );
}
