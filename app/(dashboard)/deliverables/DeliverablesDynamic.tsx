"use client";

import dynamic from "next/dynamic";
import type { CloseOutDialogProps } from "@/components/deliverables/CloseOutDialog";
import type { StatusBoardProps } from "@/components/deliverables/StatusBoard";
import type { DeliverableWithClient } from "@/lib/database.types";
import type { AnyVerticalConfig } from "@/lib/vertical-config";

const StatusBoard = dynamic(
  () => import("@/components/deliverables/StatusBoard").then((m) => m.StatusBoard),
  { ssr: false, loading: () => <div className="h-96 animate-pulse rounded-lg bg-surface" /> },
);

const CloseOutDialog = dynamic(
  () => import("@/components/deliverables/CloseOutDialog").then((m) => m.CloseOutDialog),
  { ssr: false, loading: () => null },
);

const CalendarView = dynamic(
  () => import("@/components/deliverables/CalendarView").then((m) => m.CalendarView),
  { ssr: false, loading: () => <div className="h-96 animate-pulse rounded-lg bg-surface" /> },
);

export function StatusBoardDynamic(props: StatusBoardProps) {
  return <StatusBoard {...props} />;
}

export function CloseOutDialogDynamic(props: CloseOutDialogProps) {
  return <CloseOutDialog {...props} />;
}

export function CalendarViewDynamic(props: {
  deliverables: DeliverableWithClient[];
  orgId: string;
  vertical: AnyVerticalConfig;
  monthStr: string;
}) {
  return <CalendarView {...props} />;
}
