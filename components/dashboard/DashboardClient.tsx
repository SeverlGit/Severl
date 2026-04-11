"use client";

import React from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { PanelHeader } from "./PanelHeader";
import { Tag } from "@/components/shared/Tag";
import { EmptyState } from "@/components/shared/EmptyState";
import { Calendar, FolderOpen, Receipt, Plus, FileText } from "lucide-react";
import { StatsStrip } from "./StatsStrip";
import { TickerBar } from "./TickerBar";
import { AlertStrip } from "./AlertStrip";
import { DELIVERABLE_STATUS_PCT, INVOICE_STATUS_COLORS } from "@/lib/constants";
import { cn, formatCurrency, daysUntil, renewalUrgency } from "@/lib/utils";
import type { DeliverableStatus } from "@/lib/types";
import type { MRRTrendPoint } from "@/lib/dashboard/getHomeData";
import type {
  RenewalClient,
  DeliverableWithClientForWeek,
  RecentInvoiceWithClient,
} from "@/lib/database.types";
import type { ChurnRiskItem } from "@/lib/dashboard/getHomeData";

// Local hex palette for progress bars / inline color badges
const DELIVERABLE_BAR_COLORS: Record<DeliverableStatus, string> = {
  not_started:      "#A09890",
  in_progress:      "#6B6178",
  pending_approval: "#B5803A",
  approved:         "#C4909A",
  published:        "#5A8A6A",
};

function GettingStartedCard({
  step,
  title,
  description,
  href,
  done,
}: {
  step: number;
  title: string;
  description: string;
  href: string;
  done: boolean;
}) {
  const numeralColor = done ? "text-brand-rose-mid" : step === 1 ? "text-brand-rose-mid" : "text-border-strong";

  return (
    <a
      href={href}
      className={cn(
        "group flex flex-col gap-2 rounded-xl border p-4 transition-colors",
        done
          ? "border-brand-rose/25 bg-brand-rose-dim"
          : "border-border bg-surface hover:border-brand-rose/25 hover:bg-brand-rose-dim"
      )}
    >
      <span className={`font-display font-light text-[28px] leading-none ${numeralColor}`}>
        {done ? "✓" : step}
      </span>
      <span className="font-sans font-semibold text-[12px] tracking-tight text-txt-primary">
        {title}
      </span>
      <p className="font-sans text-[11px] font-normal leading-relaxed text-txt-muted">{description}</p>
      {!done && (
        <span className="self-end text-sm text-brand-rose opacity-0 transition-opacity group-hover:opacity-100">
          →
        </span>
      )}
    </a>
  );
}

type Props = {
  firstName: string;
  mrr: number;
  activeClients: number;
  deliverablesBehind: number;
  atRiskCount: number;
  overdue: { count: number; total: number };
  renewalsCount: number;
  mrrTrend: MRRTrendPoint[];
  mrrDelta: number;
  mrrDeltaPct: string;
  avgRetainer: number;
  renewalsList: RenewalClient[];
  deliverablesWeek: DeliverableWithClientForWeek[];
  recentInvoices: RecentInvoiceWithClient[];
  clientsLabel: string;
  mrrSparkline: number[];
  clientSparkline: number[];
  churnRiskScores?: ChurnRiskItem[];
};

export type DashboardClientProps = Props;

const ease = [0.16, 1, 0.3, 1] as const;

function RevenueBarChart({ data }: { data: MRRTrendPoint[] }) {
  const max = Math.max(...data.map((d) => d.mrr), 1);

  return (
    <div className="flex h-full items-end gap-[3px] px-1 pb-5 pt-2">
      {data.map((d, i) => {
        const pct = (d.mrr / max) * 100;
        const isLast = i === data.length - 1;
        const month = (() => {
          const [y, m] = d.month.split('-');
          return new Date(Number(y), Number(m) - 1, 1).toLocaleDateString(undefined, { month: "short" });
        })();
        return (
          <div key={d.month} className="flex flex-1 flex-col items-center gap-1">
            <div className="flex w-full flex-1 items-end">
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: `${Math.max(pct, 2)}%` }}
                transition={{ duration: 0.6, ease, delay: i * 0.05 }}
                className={`w-full rounded-t transition-colors ${
                  isLast
                    ? "bg-brand-rose opacity-80"
                    : "bg-border-strong/50 hover:bg-border-strong"
                }`}
                style={{ minHeight: 2 }}
              />
            </div>
            <span
              className={`font-sans text-[9px] tabular-nums ${
                isLast ? "font-medium text-brand-rose-deep" : "text-txt-hint"
              }`}
            >
              {month}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function RenewalRow({ item, index }: { item: RenewalClient; index: number }) {
  const diffDays = daysUntil(item.contract_renewal);
  const tone = renewalUrgency(diffDays);
  const borderClass =
    tone === "red" ? "border-l-danger" : tone === "amber" ? "border-l-warning" : "border-l-success";
  const daysStr = diffDays < 0 ? "overdue" : `${diffDays}d`;

  return (
    <motion.div
      initial={{ opacity: 0, x: -4 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.25, ease: "easeOut", delay: index * 0.03 }}
      className={`flex items-center gap-2 border-b border-border border-l-2 ${borderClass} pl-2 pr-1 py-1.5 last:border-b-0`}
    >
      <span className="flex-1 truncate text-[12px] text-txt-secondary">{item.brand_name}</span>
      <span className="font-sans text-[11px] tabular-nums text-txt-muted">{daysStr}</span>
      <span className="font-sans text-[12px] tabular-nums text-txt-primary">
        {item.retainer_amount ? formatCurrency(Number(item.retainer_amount)) : "—"}
      </span>
    </motion.div>
  );
}

function DeliverableRow({ item, index }: { item: DeliverableWithClientForWeek; index: number }) {
  const code = (item.clients?.brand_name ?? "??").slice(0, 2).toUpperCase();
  const title = item.title || item.type || "Deliverable";

  const status = item.status as DeliverableStatus;
  const barColor = DELIVERABLE_BAR_COLORS[status] ?? "#A09890";
  const pct = DELIVERABLE_STATUS_PCT[status] ?? 0;

  return (
    <motion.div
      initial={{ opacity: 0, x: -4 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.25, ease: "easeOut", delay: index * 0.03 }}
      className="flex flex-col gap-1 py-1"
    >
      <div className="flex items-center gap-2">
        <span
          className="flex h-5 w-5 shrink-0 items-center justify-center rounded font-sans text-[10px] font-medium"
          style={{ backgroundColor: `${barColor}20`, color: barColor }}
        >
          {code}
        </span>
        <span className="flex-1 truncate text-[12px] text-txt-secondary">{title}</span>
        <span className="font-sans text-[10px] tabular-nums text-txt-muted">{pct}%</span>
      </div>
      <div className="ml-7 h-[2px] overflow-hidden rounded-full bg-border-subtle">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${pct}%`, backgroundColor: barColor }}
        />
      </div>
    </motion.div>
  );
}

const INVOICE_STATUS_CHIP_BG: Record<string, string> = {
  paid:   "bg-success-bg text-success",
  overdue:"bg-danger-bg text-danger",
  sent:   "bg-warning-bg text-warning",
  draft:  "bg-surface-hover text-txt-muted",
  voided: "bg-surface-hover text-txt-muted line-through",
};

function InvoiceRow({ item, index }: { item: RecentInvoiceWithClient; index: number }) {
  const color = INVOICE_STATUS_COLORS[item.status as keyof typeof INVOICE_STATUS_COLORS] ?? "#A09890";
  const chipClass = INVOICE_STATUS_CHIP_BG[item.status] ?? "bg-surface-hover text-txt-muted";

  return (
    <motion.div
      initial={{ opacity: 0, x: -4 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.25, ease: "easeOut", delay: index * 0.03 }}
      className="flex items-center gap-2 border-b border-border py-1.5 pl-1 pr-1 last:border-b-0"
    >
      <span
        className="h-4 w-[3px] shrink-0 rounded-full"
        style={{ backgroundColor: color }}
      />
      <div className="flex flex-1 flex-col truncate">
        <span className="text-[12px] text-txt-secondary">{item.clients?.brand_name ?? "—"}</span>
        <span className="font-sans text-[10px] tabular-nums text-txt-hint">{item.invoice_number || "INV"}</span>
      </div>
      <span className="font-sans text-[13px] tabular-nums text-txt-primary">
        {formatCurrency(Number(item.total ?? 0))}
      </span>
      <span
        className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider ${chipClass}`}
      >
        {item.status}
      </span>
    </motion.div>
  );
}

function BusinessPulse({
  mrr,
  deliverablesBehind,
  deliverablesWeek,
  renewalsCount,
  overdue,
  recentInvoices,
  churnRiskScores = [],
}: Pick<Props, "mrr" | "deliverablesBehind" | "deliverablesWeek" | "renewalsCount" | "overdue" | "recentInvoices" | "churnRiskScores">) {
  const mrrPct = Math.min((mrr / 10000) * 100, 100);
  const deliveryTotal = Math.max(deliverablesWeek.length, 1);
  const deliveryPct = Math.max(0, Math.min(100, ((deliveryTotal - deliverablesBehind) / deliveryTotal) * 100));
  const renewalPct = Math.min(renewalsCount * 25, 100);
  const outstandingPct = Math.min((overdue.total / 5000) * 100, 100);

  const healthBars = [
    { label: "MRR",         pct: mrrPct,         fillClass: "bg-brand-rose",      value: `$${mrr.toLocaleString()}` },
    { label: "Delivery",    pct: deliveryPct,    fillClass: "bg-success",          value: `${Math.round(deliveryPct)}%` },
    { label: "Renewal",     pct: renewalPct,     fillClass: "bg-brand-plum-mid",   value: `${renewalsCount} due` },
    { label: "Outstanding", pct: outstandingPct, fillClass: "bg-border-strong",    value: overdue.total > 0 ? `$${overdue.total.toLocaleString()}` : "Clear" },
  ];

  return (
    <div className="flex flex-col overflow-y-auto">
      <div className="border-b border-border px-4 py-3">
        <span className="font-sans text-[10px] font-semibold uppercase tracking-[0.10em] text-txt-muted">
          Business Pulse
        </span>
      </div>

      <div className="flex flex-col gap-3 px-4 py-3">
        {healthBars.map((bar) => (
          <div key={bar.label} className="flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <span className="font-sans text-[10px] text-txt-muted">{bar.label}</span>
              <span className="font-sans text-[10px] font-medium tabular-nums text-txt-secondary">
                {bar.value}
              </span>
            </div>
            <div className="h-[3px] overflow-hidden rounded-full bg-border-subtle">
              <div
                className={`h-full rounded-full transition-all duration-700 ${bar.fillClass}`}
                style={{ width: `${bar.pct}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      {churnRiskScores.length > 0 && (
        <div className="border-t border-border px-4 py-3">
          <span className="mb-2 block font-sans text-[10px] font-semibold uppercase tracking-[0.10em] text-txt-muted">
            Churn risk
          </span>
          <div className="flex flex-col gap-1.5">
            {churnRiskScores.map((c) => {
              const riskColor =
                c.score >= 75 ? "text-danger" : c.score >= 50 ? "text-warning" : "text-txt-muted";
              const dotColor =
                c.score >= 75 ? "bg-danger" : c.score >= 50 ? "bg-warning" : "bg-success";
              return (
                <Link
                  key={c.clientId}
                  href={`/clients/${c.clientId}`}
                  className="flex items-center justify-between gap-2 hover:opacity-80 transition-opacity"
                >
                  <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${dotColor}`} />
                  <span className="flex-1 truncate text-[11px] text-txt-secondary">{c.name}</span>
                  <span className={`font-mono text-[10px] font-medium tabular-nums ${riskColor}`}>
                    {c.score}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {recentInvoices.length > 0 && (
        <div className="border-t border-border px-4 py-3">
          <span className="mb-2 block font-sans text-[10px] font-semibold uppercase tracking-[0.10em] text-txt-muted">
            Recent
          </span>
          <div className="flex flex-col gap-1.5">
            {recentInvoices.slice(0, 3).map((inv) => (
              <div key={inv.id} className="flex items-center justify-between">
                <span className="flex-1 truncate text-[11px] text-txt-secondary">
                  {inv.clients?.brand_name ?? "—"}
                </span>
                <span className="ml-2 font-sans text-[10px] tabular-nums text-txt-muted">
                  {formatCurrency(Number(inv.total ?? 0))}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-auto flex flex-col gap-2 border-t border-border px-4 py-4">
        <Link
          href="/clients"
          className="flex h-8 items-center justify-center gap-1.5 rounded-md bg-brand-rose text-[11px] font-medium text-white transition-colors hover:bg-brand-rose-deep"
        >
          <Plus className="h-3 w-3" />
          New Client
        </Link>
        <Link
          href="/invoices"
          className="flex h-8 items-center justify-center gap-1.5 rounded-md bg-surface-hover text-[11px] font-medium text-txt-secondary transition-colors hover:bg-border"
        >
          <FileText className="h-3 w-3" />
          New Invoice
        </Link>
      </div>
    </div>
  );
}

export function DashboardClient({
  firstName,
  mrr,
  activeClients,
  deliverablesBehind,
  atRiskCount,
  overdue,
  renewalsCount,
  mrrTrend,
  mrrDelta,
  mrrDeltaPct,
  avgRetainer,
  renewalsList,
  deliverablesWeek,
  recentInvoices,
  clientsLabel,
  mrrSparkline,
  clientSparkline,
  churnRiskScores = [],
}: Props) {
  const hours = new Date().getHours();
  const timeOfDay = hours < 12 ? "morning" : hours < 17 ? "afternoon" : "evening";

  const stats = [
    {
      label: "Monthly Recurring Revenue",
      value: mrr,
      format: "currency" as const,
      delta: mrrDelta >= 0 ? `+$${mrrDelta.toLocaleString()}` : `-$${Math.abs(mrrDelta).toLocaleString()}`,
      deltaTone: (mrrDelta >= 0 ? "green" : "red") as "green" | "red",
      href: "/analytics",
      sparkline: mrrSparkline,
      sparklineColor: "#C4909A",
      accentClass: "bg-brand-rose",
    },
    {
      label: `Active ${clientsLabel}`,
      value: activeClients,
      format: "number" as const,
      delta: atRiskCount > 0 ? `${atRiskCount} at risk` : "all healthy",
      deltaTone: (atRiskCount > 0 ? "red" : "green") as "green" | "red",
      href: "/clients?filter=active",
      sparkline: clientSparkline,
      sparklineColor: "#9B92A8",
      accentClass: "bg-brand-plum-mid",
    },
    {
      label: "Deliverables Behind",
      value: deliverablesBehind,
      format: deliverablesBehind === 0 ? ("text" as const) : ("number" as const),
      displayValue: deliverablesBehind === 0 ? "On track" : undefined,
      delta: "this month",
      deltaTone: (deliverablesBehind === 0 ? "green" : "red") as "green" | "red",
      href: "/deliverables",
      accentClass: "bg-success",
    },
  ];

  const tickerItems = [
    { label: "MRR", value: `$${mrr.toLocaleString()}`, delta: `${mrrDeltaPct}%`, deltaTone: (mrrDelta >= 0 ? "green" : "red") as "green" | "red" },
    { label: "ARR proj", value: `$${(mrr * 12).toLocaleString()}` },
    { label: "Avg retainer", value: `$${avgRetainer.toLocaleString()}` },
    { label: "Renewals", value: String(renewalsCount), deltaTone: (renewalsCount > 0 ? "amber" : "neutral") as "amber" | "neutral" },
    { label: "Outstanding", value: `$${overdue.total.toLocaleString()}`, deltaTone: (overdue.total > 0 ? "red" : "neutral") as "red" | "neutral" },
  ];

  const urgencyTone: "red" | "amber" | "green" = renewalsList.some(
    (r) => r.contract_renewal && daysUntil(r.contract_renewal) < 14
  )
    ? "red"
    : renewalsList.length > 0
      ? "amber"
      : "green";

  const isFirstRun =
    deliverablesWeek.length === 0 &&
    recentInvoices.length === 0 &&
    renewalsList.length === 0;

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Greeting */}
      <div className="px-4 pb-2 pt-4">
        <h1 className="font-display font-light italic text-[22px] tracking-tight text-txt-primary">
          {firstName ? (
            <>
              Good {timeOfDay},{" "}
              <span className="not-italic font-normal text-brand-rose-deep">{firstName}</span>
            </>
          ) : (
            <>Good {timeOfDay}</>
          )}
        </h1>
      </div>

      {/* Alerts */}
      <div className="flex flex-col gap-1 px-4 pb-2">
        <AlertStrip
          show={overdue.count > 0}
          tone="danger"
          message={`${overdue.count} invoice${overdue.count === 1 ? "" : "s"} overdue — $${overdue.total.toLocaleString()} outstanding`}
          href="/invoices?status=overdue"
          linkLabel="View invoices →"
        />
        <AlertStrip
          show={atRiskCount > 0}
          tone="warning"
          message={`${atRiskCount} ${clientsLabel.toLowerCase()} flagged at risk`}
          href="/clients?filter=at_risk"
          linkLabel="View →"
        />
        <AlertStrip
          show={renewalsCount > 0}
          tone="info"
          message={`${renewalsCount} retainer${renewalsCount === 1 ? "" : "s"} renewing in the next 30 days`}
          href="/analytics"
          linkLabel="View →"
        />
      </div>

      {/* KPI cards */}
      <StatsStrip stats={stats} />

      {/* Main content + Business Pulse sidebar */}
      <div className="flex flex-1 overflow-hidden">
        {/* Main panels column */}
        <div className="flex flex-1 flex-col overflow-hidden">
          {isFirstRun ? (
            <>
              <div className="grid flex-1 grid-cols-1 gap-px overflow-hidden bg-border-subtle">
                <motion.div
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, ease, delay: 0 }}
                  className="flex flex-col border-t-2 border-brand-rose bg-surface"
                >
                  <PanelHeader
                    title="Revenue"
                    value={`${formatCurrency(mrr)}/mo`}
                    delta={`${mrrDelta >= 0 ? "+" : ""}${mrrDeltaPct}%`}
                    deltaTone={mrrDelta >= 0 ? "green" : "red"}
                  />
                  <div className="flex-1 overflow-hidden px-3 pb-1">
                    <RevenueBarChart data={mrrTrend} />
                  </div>
                </motion.div>
              </div>
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease, delay: 0.1 }}
                className="shrink-0 border-t border-border px-6 py-6"
              >
                <h3 className="mb-4 font-sans text-sm font-medium text-txt-secondary">
                  Get started with Severl
                </h3>
                <div className="grid grid-cols-3 gap-2">
                  <GettingStartedCard
                    step={1}
                    title="Add your first client"
                    description="Set up a brand account with retainer details and platforms."
                    href="/clients"
                    done={activeClients > 0}
                  />
                  <GettingStartedCard
                    step={2}
                    title="Create deliverables"
                    description="Track monthly content deliverables for each client."
                    href="/deliverables"
                    done={deliverablesWeek.length > 0}
                  />
                  <GettingStartedCard
                    step={3}
                    title="Send your first invoice"
                    description="Close out a month to generate retainer invoices."
                    href="/invoices"
                    done={recentInvoices.length > 0}
                  />
                </div>
              </motion.div>
            </>
          ) : (
            <div className="grid flex-1 grid-cols-3 grid-rows-2 gap-px overflow-hidden bg-border-subtle">
              {/* Panel 1: Revenue (spans 2 cols) */}
              <motion.div
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, ease, delay: 0 }}
                className="col-span-2 flex flex-col bg-surface"
              >
                <PanelHeader
                  title="Revenue"
                  value={`$${mrr.toLocaleString()}/mo`}
                  delta={`${mrrDelta >= 0 ? "+" : ""}${mrrDeltaPct}%`}
                  deltaTone={mrrDelta >= 0 ? "green" : "red"}
                />
                <div className="flex-1 overflow-hidden px-3 pb-1">
                  <RevenueBarChart data={mrrTrend} />
                </div>
              </motion.div>

              {/* Panel 2: Renewals */}
              <motion.div
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, ease, delay: 0.05 }}
                className="flex flex-col bg-surface"
              >
                <PanelHeader title="Renewals">
                  <Tag tone={urgencyTone}>{renewalsList.length}</Tag>
                </PanelHeader>
                <div className="flex-1 overflow-y-auto px-3 py-2">
                  {renewalsList.length === 0 ? (
                    <EmptyState
                      icon={<Calendar strokeWidth={1.25} />}
                      title="No renewals due"
                      description="No contract renewals in the next 30 days."
                      className="py-6"
                    />
                  ) : (
                    renewalsList.map((item, i) => (
                      <RenewalRow key={item.id} item={item} index={i} />
                    ))
                  )}
                </div>
              </motion.div>

              {/* Panel 3: Deliverables */}
              <motion.div
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, ease, delay: 0.1 }}
                className="flex flex-col bg-surface"
              >
                <PanelHeader title="Deliverables">
                  <Tag tone={deliverablesBehind > 0 ? "red" : "green"}>
                    {deliverablesBehind > 0 ? `${deliverablesBehind} behind` : "on track"}
                  </Tag>
                </PanelHeader>
                <div className="flex-1 overflow-y-auto px-3 py-2">
                  {deliverablesWeek.length === 0 ? (
                    <EmptyState
                      icon={<FolderOpen strokeWidth={1.25} />}
                      title="Nothing due this week"
                      description="Deliverables due this week will appear here."
                      action={{ label: "View board →", href: "/deliverables" }}
                      className="py-6"
                    />
                  ) : (
                    deliverablesWeek.slice(0, 8).map((item, i) => (
                      <DeliverableRow key={item.id} item={item} index={i} />
                    ))
                  )}
                </div>
              </motion.div>

              {/* Panel 4: Invoices (spans 2 cols on bottom row) */}
              <motion.div
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, ease, delay: 0.15 }}
                className="col-span-2 flex flex-col bg-surface"
              >
                <PanelHeader title="Invoices">
                  {overdue.total > 0 && (
                    <Tag tone="red">${overdue.total.toLocaleString()} due</Tag>
                  )}
                </PanelHeader>
                <div className="flex-1 overflow-y-auto px-3 py-2">
                  {recentInvoices.length === 0 ? (
                    <EmptyState
                      icon={<Receipt strokeWidth={1.25} />}
                      title="No invoices yet"
                      description="Close out a month to generate retainer invoices."
                      action={{ label: "Go to invoices →", href: "/invoices" }}
                      className="py-6"
                    />
                  ) : (
                    recentInvoices.map((item, i) => (
                      <InvoiceRow key={item.id} item={item} index={i} />
                    ))
                  )}
                </div>
              </motion.div>
            </div>
          )}

          {/* Briefing strip */}
          <div className="flex shrink-0 items-center gap-4 border-t border-border bg-panel px-4 py-2">
            {overdue.count > 0 || atRiskCount > 0 || deliverablesBehind > 0 ? (
              <>
                {overdue.count > 0 && (
                  <Link href="/invoices?status=overdue" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                    <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-danger" />
                    <span className="text-[12px] text-txt-secondary">
                      {overdue.count} invoice{overdue.count === 1 ? '' : 's'} overdue
                    </span>
                  </Link>
                )}
                {atRiskCount > 0 && (
                  <Link href="/clients?filter=at_risk" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                    <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-warning" />
                    <span className="text-[12px] text-txt-secondary">
                      {atRiskCount} {clientsLabel.toLowerCase()} at risk
                    </span>
                  </Link>
                )}
                {deliverablesBehind > 0 && (
                  <Link href="/deliverables" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                    <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-danger" />
                    <span className="text-[12px] text-txt-secondary">
                      {deliverablesBehind} deliverable{deliverablesBehind === 1 ? '' : 's'} behind
                    </span>
                  </Link>
                )}
              </>
            ) : (
              <div className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-success" />
                <span className="text-[12px] text-txt-muted">All clear</span>
              </div>
            )}
          </div>
        </div>

        {/* Business Pulse right panel — lg+ only */}
        <aside className="hidden w-[240px] shrink-0 flex-col border-l border-border bg-panel lg:flex">
          <BusinessPulse
            mrr={mrr}
            deliverablesBehind={deliverablesBehind}
            deliverablesWeek={deliverablesWeek}
            renewalsCount={renewalsCount}
            overdue={overdue}
            recentInvoices={recentInvoices}
            churnRiskScores={churnRiskScores}
          />
        </aside>
      </div>

      <TickerBar items={tickerItems} />
    </div>
  );
}
