"use client";

import dynamic from "next/dynamic";
import type { ComponentProps } from "react";
import { AnalyticsSkeleton } from "@/components/shared/AnalyticsSkeleton";

const AnalyticsClient = dynamic(() => import("./AnalyticsClient"), {
  ssr: false,
  loading: () => <AnalyticsSkeleton />,
});

export function AnalyticsClientLoader(props: ComponentProps<typeof AnalyticsClient>) {
  return <AnalyticsClient {...props} />;
}
