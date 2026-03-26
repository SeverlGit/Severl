"use client";

import dynamic from "next/dynamic";
import type { CloseOutDialogProps } from "@/components/deliverables/CloseOutDialog";
import type { StatusBoardProps } from "@/components/deliverables/StatusBoard";

const StatusBoard = dynamic(
  () => import("@/components/deliverables/StatusBoard").then((m) => m.StatusBoard),
  { ssr: false, loading: () => <div className="h-96 animate-pulse rounded-lg bg-surface" /> },
);

const CloseOutDialog = dynamic(
  () => import("@/components/deliverables/CloseOutDialog").then((m) => m.CloseOutDialog),
  { ssr: false, loading: () => null },
);

export function StatusBoardDynamic(props: StatusBoardProps) {
  return <StatusBoard {...props} />;
}

export function CloseOutDialogDynamic(props: CloseOutDialogProps) {
  return <CloseOutDialog {...props} />;
}
