"use client";

import React from "react";
import { motion } from "framer-motion";
import { TrendingUp, PieChart, Calendar, BarChart3 } from "lucide-react";
import { EmptyState } from "@/components/shared/EmptyState";
import { useRouter, useSearchParams } from "next/navigation";
import type { AnyVerticalConfig } from "@/lib/vertical-config";
import type { MRRTrendPoint } from "@/lib/dashboard/getHomeData";
import type { RevenueByClientItem, DeliveryRateByClientItem } from "@/lib/database.types";
import type { ClientRow } from "@/lib/database.types";
import { formatCurrency, daysUntil, renewalUrgency } from "@/lib/utils";

const ease = [0.16, 1, 0.3, 1] as [number, number, number, number];

type RenewalPipelineItem = Pick<ClientRow, "id" | "brand_name" | "contract_renewal" | "retainer_amount">;

type Props = {
  vertical: AnyVerticalConfig;
  metrics: { mrr: number; active_clients: number; churn_rate: number; renewal_rate: number; avg_retainer: number; delivery_rate: number };
  mrrTrend: MRRTrendPoint[];
  mrrTrendCurrentMonthLiveFallback?: boolean;
  revenueByClient: RevenueByClientItem[];
  renewalPipeline: RenewalPipelineItem[];
  deliveryRate: DeliveryRateByClientItem[];
};

export default function AnalyticsClient({
  vertical,
  metrics,
  mrrTrend,
  mrrTrendCurrentMonthLiveFallback = false,
  revenueByClient,
  renewalPipeline,
  deliveryRate,
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const period = searchParams.get("period") ?? "6m";

  const periods = [
    { key: "1m", label: "1M" },
    { key: "3m", label: "3M" },
    { key: "6m", label: "6M" },
    { key: "12m", label: "12M" },
  ];

  const metricsToShow = vertical.analytics.metrics.filter((m) => m.show);

  const metricValue = (key: string): string => {
    switch (key) {
      case "mrr": return formatCurrency(metrics.mrr);
      case "active_clients": return String(metrics.active_clients);
      case "churn_rate": return `${metrics.churn_rate}%`;
      case "renewal_rate": return `${metrics.renewal_rate}%`;
      case "avg_retainer": return formatCurrency(metrics.avg_retainer);
      case "delivery_rate": return `${metrics.delivery_rate}%`;
      default: return "—";
    }
  };

  const maxRevenue = Math.max(...revenueByClient.map((c) => c.retainer_amount ?? 0), 1);

  return (
    <div className="flex flex-col gap-3 px-6 py-4">
      <header className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-lg font-medium text-txt-primary">Analytics</h1>
          <p className="text-sm text-txt-muted">See the health of your business, not your clients&apos; social metrics.</p>
        </div>
        <div className="flex gap-1 font-mono text-xs">
          {periods.map((opt) => {
            const isActive = period === opt.key;
            return (
              <button
                key={opt.key}
                onClick={() => router.push(`/analytics?period=${opt.key}`)}
                className={`rounded px-3 py-1 font-mono text-xs font-medium transition-colors ${isActive ? "bg-brand-mint text-brand-navy" : "border border-border bg-transparent text-txt-muted hover:text-txt-secondary"}`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </header>

      <section className="flex flex-col gap-3">
        <div className="grid gap-px bg-border-subtle md:grid-cols-3">
          {metricsToShow.slice(0, 3).map((metric, index) => (
            <motion.div key={metric.key} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, ease, delay: index * 0.06 }} className="bg-brand-navy px-5 py-4">
              <div className="text-[10px] font-medium uppercase tracking-wider text-txt-muted">{metric.label}</div>
              <div className="mt-1 font-mono text-4xl font-medium tabular-nums text-txt-primary">{metricValue(metric.key)}</div>
            </motion.div>
          ))}
        </div>
        <div className="grid gap-px bg-border-subtle md:grid-cols-3">
          {metricsToShow.slice(3).map((metric, index) => (
            <motion.div key={metric.key} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, ease, delay: (index + 3) * 0.06 }} className="bg-brand-navy px-4 py-3.5">
              <div className="text-[10px] font-medium uppercase tracking-wider text-txt-muted">{metric.label}</div>
              <div className="mt-1 font-mono text-2xl font-medium tabular-nums text-txt-primary">{metricValue(metric.key)}</div>
            </motion.div>
          ))}
        </div>

        <div className="grid gap-3 md:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
          <motion.section initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, ease }} className="rounded-md border border-border bg-brand-navy px-4 py-4">
            <h2 className="mb-3 text-[12px] font-medium text-txt-secondary">MRR trend</h2>
            {mrrTrend.length === 0 ? (
              <div className="flex h-[220px] items-center justify-center px-2">
                <EmptyState
                  icon={<TrendingUp strokeWidth={1.25} />}
                  title="No MRR trend yet"
                  description="No revenue data yet — create and send invoices to track MRR trends."
                  className="max-w-sm"
                />
              </div>
            ) : (
              <>
                <div className="flex h-[220px] items-end gap-[3px] px-1 pb-5 pt-2">
                  {mrrTrend.map((d, i) => {
                    const max = Math.max(...mrrTrend.map((p) => p.mrr), 1);
                    const pct = (d.mrr / max) * 100;
                    const isLast = i === mrrTrend.length - 1;
                    const month = new Date(d.month).toLocaleDateString(undefined, { month: "short" });
                    return (
                      <div key={d.month} className="flex flex-1 flex-col items-center gap-1">
                        <div className="flex w-full flex-1 items-end">
                          <motion.div
                            initial={{ height: 0 }}
                            animate={{ height: `${Math.max(pct, 2)}%` }}
                            transition={{ duration: 0.6, ease, delay: i * 0.05 }}
                            className={`w-full rounded-t-sm transition-colors ${isLast ? "bg-brand-mint shadow-[0_0_8px_rgba(110,231,183,0.30)]" : "bg-brand-mint/15 hover:bg-brand-mint/30"}`}
                            style={{ minHeight: 2 }}
                          />
                        </div>
                        <span className={`font-mono text-[10px] tracking-wide ${isLast ? "text-brand-mint" : "text-txt-hint"}`}>{month}</span>
                      </div>
                    );
                  })}
                </div>
                {mrrTrendCurrentMonthLiveFallback && (
                  <p className="mt-1 text-xs text-txt-muted">
                    Current month reflects active retainer amounts. Historical months reflect recorded payments.
                  </p>
                )}
              </>
            )}
          </motion.section>

          {vertical.analytics.revenueByClientChart && (
            <motion.section initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, ease }} className="rounded-md border border-border bg-brand-navy px-4 py-4">
              <h2 className="mb-3 text-[12px] font-medium text-txt-secondary">Revenue by {vertical.crm.clientLabel.toLowerCase()}</h2>
              {revenueByClient.length === 0 ? (
                <div className="flex h-[220px] items-center justify-center">
                  <EmptyState
                    icon={<PieChart strokeWidth={1.25} />}
                    title="No revenue by client"
                    description="Revenue by client will appear here."
                  />
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {revenueByClient.map((c) => {
                    const rev = c.retainer_amount ?? 0;
                    const widthPct = (rev / maxRevenue) * 100;
                    const opacity = maxRevenue > 0 ? 0.3 + 0.7 * (rev / maxRevenue) : 0.3;
                    return (
                      <div key={c.id} className="flex items-center gap-2">
                        <span className="min-w-0 flex-1 truncate text-[14px] text-txt-secondary">{c.brand_name}</span>
                        <div className="h-[6px] min-w-[60px] flex-1 rounded-full bg-border">
                          <div className="h-full rounded-full bg-brand-mint" style={{ width: `${widthPct}%`, opacity }} />
                        </div>
                        <span className="w-20 shrink-0 text-right font-mono text-[13px] tabular-nums text-txt-primary">{formatCurrency(rev)}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </motion.section>
          )}
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          {vertical.analytics.renewalPipelineWidget && (
            <motion.section initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, ease }} className="rounded-md border border-border bg-brand-navy px-4 py-4">
              <h2 className="mb-3 text-[12px] font-medium text-txt-secondary">Renewal pipeline</h2>
              {renewalPipeline.length === 0 ? (
                <div className="flex h-[180px] items-center justify-center">
                  <EmptyState
                    icon={<Calendar strokeWidth={1.25} />}
                    title="No renewals due"
                    description="No renewals in the next 90 days. Renewals will appear when contract end dates are near."
                  />
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {renewalPipeline.map((c) => {
                    const days = daysUntil(c.contract_renewal);
                    const tone = renewalUrgency(days);
                    const toneClass = tone === "red" ? "tag-red" : tone === "amber" ? "tag-amber" : "tag-green";
                    return (
                      <div key={c.id} className={`${toneClass} flex items-center justify-between rounded-[5px] !text-[12px] !font-normal !normal-case !tracking-normal px-3 py-2`}>
                        <span>{c.brand_name}</span>
                        <div className="flex items-center gap-3">
                          <span className="font-mono text-[13px] tabular-nums opacity-60">{days}d</span>
                          <span className="font-mono text-[14px] tabular-nums">{formatCurrency(c.retainer_amount ?? 0)}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </motion.section>
          )}

          <motion.section initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, ease }} className="rounded-md border border-border bg-brand-navy px-4 py-4">
            <h2 className="mb-3 text-[12px] font-medium text-txt-secondary">Delivery completion</h2>
            {deliveryRate.length === 0 ? (
              <div className="flex h-[180px] items-center justify-center">
                <EmptyState
                  icon={<BarChart3 strokeWidth={1.25} />}
                  title="No deliverables tracked"
                  description="No deliverables tracked this month yet. Complete deliverables to see completion rates."
                />
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {deliveryRate.map((c) => {
                  const color = c.pct >= 90 ? "bg-brand-mint" : c.pct >= 70 ? "bg-warning" : "bg-danger";
                  return (
                    <div key={c.id} className="flex items-center gap-2">
                      <span className="w-24 truncate text-[14px] text-txt-secondary">{c.brand_name}</span>
                      <div className="h-[6px] flex-1 rounded-full bg-border">
                        <div className={`h-full rounded-full ${color}`} style={{ width: `${c.pct}%` }} />
                      </div>
                      <span className="font-mono text-[13px] tabular-nums text-txt-muted">{c.pct}%</span>
                    </div>
                  );
                })}
              </div>
            )}
          </motion.section>
        </div>
      </section>
    </div>
  );
}
