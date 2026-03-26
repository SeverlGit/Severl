"use client";

import dynamic from "next/dynamic";
export const StatusBoardDynamic = dynamic(
  () => import("@/components/deliverables/StatusBoard").then((m) => m.StatusBoard),
  { ssr: false, loading: () => <div className="h-96 animate-pulse rounded-lg bg-brand-navy" /> },
);

export const CloseOutDialogDynamic = dynamic(
  () => import("@/components/deliverables/CloseOutDialog").then((m) => m.CloseOutDialog),
  { ssr: false, loading: () => null },
);
