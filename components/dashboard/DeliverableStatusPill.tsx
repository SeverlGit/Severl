"use client";

import React from "react";
import { StatusPill } from "@/components/shared/StatusPill";

type Props = {
  status: "not_started" | "in_progress" | "pending_approval" | "approved" | "published";
  label: string;
  className?: string;
};

export function DeliverableStatusPill({ status, label, className }: Props) {
  return <StatusPill status={status} label={label} className={className} />;
}
