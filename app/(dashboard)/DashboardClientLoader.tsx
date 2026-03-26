"use client";

import dynamic from "next/dynamic";
import type { ComponentProps } from "react";
import { DashboardSkeleton } from "@/components/shared/DashboardSkeleton";

const DashboardClient = dynamic(
  () => import("@/components/dashboard/DashboardClient").then((m) => m.DashboardClient),
  { ssr: false, loading: () => <DashboardSkeleton /> },
);

export function DashboardClientLoader(props: ComponentProps<typeof DashboardClient>) {
  return <DashboardClient {...props} />;
}
