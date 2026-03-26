"use client";

import dynamic from "next/dynamic";
import { DashboardSkeleton } from "@/components/shared/DashboardSkeleton";
import type { DashboardClientProps } from "@/components/dashboard/DashboardClient";

const DashboardClient = dynamic(
  () => import("@/components/dashboard/DashboardClient").then((m) => m.DashboardClient),
  { ssr: false, loading: () => <DashboardSkeleton /> },
);

export function DashboardClientLoader(props: DashboardClientProps) {
  return <DashboardClient {...props} />;
}
