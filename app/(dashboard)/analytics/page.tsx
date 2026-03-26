import React from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { BarChart3 } from "lucide-react";
import { getCurrentOrg } from "@/lib/auth";
import { getVerticalConfig } from "@/config/verticals";
import { getAnalyticsMetrics, getRevenueByClient, getRenewalPipeline, getDeliveryRateByClient } from "@/lib/analytics/getAnalyticsData";
import { getMRRTrend } from "@/lib/dashboard/getHomeData";
import { AnalyticsSkeleton } from "@/components/shared/AnalyticsSkeleton";
import { EmptyState } from "@/components/shared/EmptyState";

const AnalyticsClient = dynamic(() => import("./AnalyticsClient"), {
  ssr: false,
  loading: () => <AnalyticsSkeleton />,
});

export default async function AnalyticsPage() {
  const org = await getCurrentOrg();

  const [metrics, mrrTrendResult, revenueByClient, renewalPipeline, deliveryRate] = await Promise.all([
    getAnalyticsMetrics(org.id),
    getMRRTrend(org.id),
    getRevenueByClient(org.id),
    getRenewalPipeline(org.id),
    getDeliveryRateByClient(org.id),
  ]);

  const mrrTrend = mrrTrendResult.points;
  const mrrTrendCurrentMonthLiveFallback = mrrTrendResult.currentMonthUsesLiveRetainers;

  const isEmptyAnalytics = metrics.active_clients === 0 && metrics.mrr === 0;

  if (isEmptyAnalytics) {
    return (
      <div className="flex flex-col gap-3 px-6 py-4">
        <header className="flex flex-col gap-2">
          <div>
            <h1 className="text-lg font-medium text-txt-primary">Analytics</h1>
            <p className="text-sm text-txt-muted">
              See the health of your business, not your clients&apos; social metrics.
            </p>
          </div>
        </header>
        <div className="flex min-h-[min(480px,70vh)] items-center justify-center rounded-lg border border-border bg-brand-navy px-6 py-16">
          <EmptyState
            icon={<BarChart3 className="h-10 w-10 text-txt-muted" />}
            title="No analytics yet"
            description="Add your first client and start tracking deliverables to see your metrics here."
            action={
              <Link href="/clients" className="text-sm text-brand-mint hover:underline">
                Go to Clients →
              </Link>
            }
          />
        </div>
      </div>
    );
  }

  const vertical = getVerticalConfig(org.vertical);

  return (
    <AnalyticsClient
      vertical={vertical}
      metrics={metrics}
      mrrTrend={mrrTrend}
      mrrTrendCurrentMonthLiveFallback={mrrTrendCurrentMonthLiveFallback}
      revenueByClient={revenueByClient}
      renewalPipeline={renewalPipeline}
      deliveryRate={deliveryRate}
    />
  );
}
