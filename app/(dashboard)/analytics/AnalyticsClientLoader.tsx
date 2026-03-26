"use client";

import dynamic from "next/dynamic";
import { AnalyticsSkeleton } from "@/components/shared/AnalyticsSkeleton";
import type { AnalyticsClientProps } from "./AnalyticsClient";

const AnalyticsClient = dynamic(() => import("./AnalyticsClient"), {
  ssr: false,
  loading: () => <AnalyticsSkeleton />,
});

export function AnalyticsClientLoader(props: AnalyticsClientProps) {
  return <AnalyticsClient {...props} />;
}
