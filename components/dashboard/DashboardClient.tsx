"use client";

import React from "react";
import { motion } from "framer-motion";
import { PanelHeader } from "./PanelHeader";
import { Tag } from "@/components/shared/Tag";
import { EmptyState } from "@/components/shared/EmptyState";
import { Calendar, FolderOpen, Receipt } from "lucide-react";
import { StatsStrip } from "./StatsStrip";
import { TickerBar } from "./TickerBar";
import { AlertStrip } from "./AlertStrip";
import { DELIVERABLE_STATUS_COLORS, DELIVERABLE_STATUS_PCT, INVOICE_STATUS_COLORS } from "@/lib/constants";
import { cn, formatCurrency, daysUntil, renewalUrgency } from "@/lib/utils";
import type { DeliverableStatus } from "@/lib/types";
import type { MRRTrendPoint } from "@/lib/dashboard/getHomeData";
import type {
  RenewalClient,
  DeliverableWithClientForWeek,
  RecentInvoiceWithClient,
} from "@/lib/database.types";

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
  return (
    <a
      href={href}
      className={cn(
        "group flex flex-col gap-2 rounded-lg border p-4 transition-colors",
        done
          ? "border-brand-mint/30 bg-brand-mint/5"
          : "border-border bg-brand-navy hover:border-txt-hint hover:bg-surface-hover"
      )}
    >
      <div className="flex items-center gap-2">
        <span
          className={cn(
            "flex h-5 w-5 items-center justify-center rounded-full font-mono text-[10px] font-medium",
            done ? "bg-brand-mint text-brand-navy" : "bg-surface-hover text-txt-muted"
          )}
        >
          {done ? "✓" : step}
        </span>
        <span
          className={cn("text-sm font-medium", done ? "text-brand-mint" : "text-txt-primary")}
        >
          {title}
        </span>
      </div>
      <p className="text-xs leading-relaxed text-txt-muted">{description}</p>
      {!done && (
        <span className="text-xs text-brand-mint opacity-0 transition-opacity group-hover:opacity-100">
          Get started →
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
};

const ease = [0.16, 1, 0.3, 1] as const;

function RevenueBarChart({ data }: { data: MRRTrendPoint[] }) {
  const max = Math.max(...data.map((d) => d.mrr), 1);

  return (
    <div className="flex h-full items-end gap-[3px] px-1 pb-5 pt-2">
      {data.map((d, i) => {
        const pct = (d.mrr / max) * 100;
        const isLast = i === data.length - 1;
        const month = new Date(d.month).toLocaleDateString(undefined, { month: "short" });
        return (
          <div key={d.month} className="flex flex-1 flex-col items-center gap-1">
            <div className="flex w-full flex-1 items-end">
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: `${Math.max(pct, 2)}%` }}
                transition={{ duration: 0.6, ease, delay: i * 0.05 }}
                className={`w-full rounded-t-sm transition-colors ${
                  isLast
                    ? "bg-brand-mint shadow-[0_0_12px_rgba(110,231,183,0.25)]"
                    : "bg-brand-mint/15 hover:bg-brand-mint/30"
                }`}
                style={{ minHeight: 2 }}
              />
            </div>
            <span className={`font-mono text-[10px] tracking-wide ${isLast ? "text-brand-mint" : "text-txt-hint"}`}>
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
    tone === "red" ? "border-l-danger" : tone === "amber" ? "border-l-warning" : "border-l-brand-mint";
  const daysStr = diffDays < 0 ? "overdue" : `${diffDays}d`;

  return (
    <motion.div
      initial={{ opacity: 0, x: -4 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.25, ease: "easeOut", delay: index * 0.03 }}
      className={`flex items-center gap-2 border-b border-border border-l-2 ${borderClass} pl-2 pr-1 py-1.5 last:border-b-0`}
    >
      <span className="flex-1 truncate text-[12px] text-txt-secondary">{item.brand_name}</span>
      <span className="font-mono text-[11px] tabular-nums text-txt-muted">{daysStr}</span>
      <span className="font-mono text-[12px] tabular-nums text-txt-primary">
        {item.retainer_amount ? formatCurrency(Number(item.retainer_amount)) : "—"}
      </span>
    </motion.div>
  );
}

function DeliverableRow({ item, index }: { item: DeliverableWithClientForWeek; index: number }) {
  const code = (item.clients?.brand_name ?? "??").slice(0, 2).toUpperCase();
  const title = item.title || item.type || "Deliverable";

  const status = item.status as DeliverableStatus;
  const barColor = DELIVERABLE_STATUS_COLORS[status]?.color ?? "#888";
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
          className="flex h-5 w-5 shrink-0 items-center justify-center rounded font-mono text-[10px] font-medium"
          style={{ backgroundColor: `${barColor}15`, color: barColor }}
        >
          {code}
        </span>
        <span className="flex-1 truncate text-[12px] text-txt-secondary">{title}</span>
        <span className="font-mono text-[10px] tabular-nums text-txt-muted">{pct}%</span>
      </div>
      <div className="ml-7 h-[2px] overflow-hidden rounded-full bg-border">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${pct}%`, backgroundColor: barColor }}
        />
      </div>
    </motion.div>
  );
}

const INVOICE_STATUS_CHIP_BG: Record<string, string> = {
  paid: "bg-brand-mint/10 text-brand-mint",
  overdue: "bg-danger/10 text-danger",
  sent: "bg-warning/10 text-warning",
  draft: "bg-txt-muted/10 text-txt-muted",
  voided: "bg-txt-muted/10 text-txt-muted line-through",
};

function InvoiceRow({ item, index }: { item: RecentInvoiceWithClient; index: number }) {
  const color = INVOICE_STATUS_COLORS[item.status as keyof typeof INVOICE_STATUS_COLORS] ?? "#888";
  const chipClass = INVOICE_STATUS_CHIP_BG[item.status] ?? "bg-txt-muted/10 text-txt-muted";

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
        <span className="font-mono text-[10px] tabular-nums text-txt-hint">{item.invoice_number || "INV"}</span>
      </div>
      <span className="font-mono text-[13px] tabular-nums text-txt-primary">
        {formatCurrency(Number(item.total ?? 0))}
      </span>
      <span
        className={`text-[10px] font-medium uppercase tracking-wider shrink-0 rounded px-1.5 py-0.5 ${chipClass}`}
      >
        {item.status}
      </span>
    </motion.div>
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
      sparklineColor: "#6EE7B7",
    },
    {
      label: `Active ${clientsLabel}`,
      value: activeClients,
      format: "number" as const,
      delta: atRiskCount > 0 ? `${atRiskCount} at risk` : "all healthy",
      deltaTone: (atRiskCount > 0 ? "red" : "green") as "green" | "red",
      href: "/clients?filter=active",
      sparkline: clientSparkline,
      sparklineColor: "#6EE7B7",
    },
    {
      label: "Deliverables Behind",
      value: deliverablesBehind,
      format: deliverablesBehind === 0 ? "text" as const : "number" as const,
      displayValue: deliverablesBehind === 0 ? "On track" : undefined,
      delta: "this month",
      deltaTone: (deliverablesBehind === 0 ? "green" : "red") as "green" | "red",
      href: "/deliverables",
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
      <p className="mb-4 px-3 pt-4 text-sm text-txt-secondary">
        Good {timeOfDay}
        {firstName ? `, ${firstName}` : ""}
      </p>
      <div className="flex flex-col gap-1 px-3 pt-2">
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
      <StatsStrip stats={stats} />

      {isFirstRun ? (
        <>
          <div className="grid flex-1 grid-cols-1 gap-px overflow-hidden bg-border-subtle">
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, ease, delay: 0 }}
              className="flex flex-col border-t-2 border-brand-mint bg-brand-navy"
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
            <h3 className="mb-4 text-sm font-medium text-txt-secondary">Get started with Severl</h3>
            <div className="grid grid-cols-3 gap-4">
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
            className="col-span-2 flex flex-col bg-brand-navy"
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
            className="flex flex-col bg-brand-navy"
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
          className="flex flex-col bg-brand-navy"
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
          className="col-span-2 flex flex-col bg-brand-navy"
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

      {/* BriefingStrip: single-line action summary */}
      <div className="flex shrink-0 items-center gap-4 border-t border-border bg-brand-navy px-4 py-2">
        {overdue.count > 0 ||
        atRiskCount > 0 ||
        deliverablesBehind > 0 ? (
          <>
            {overdue.count > 0 && (
              <div className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-danger" />
                <span className="text-[12px] text-txt-secondary">
                  {overdue.count} invoice{overdue.count === 1 ? "" : "s"} overdue
                </span>
              </div>
            )}
            {atRiskCount > 0 && (
              <div className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-warning" />
                <span className="text-[12px] text-txt-secondary">
                  {atRiskCount} {clientsLabel.toLowerCase()} at risk
                </span>
              </div>
            )}
            {deliverablesBehind > 0 && (
              <div className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-danger" />
                <span className="text-[12px] text-txt-secondary">
                  {deliverablesBehind} deliverable{deliverablesBehind === 1 ? "" : "s"} behind
                </span>
              </div>
            )}
          </>
        ) : (
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-brand-mint" />
            <span className="text-[12px] text-txt-muted">All clear</span>
          </div>
        )}
      </div>

      <TickerBar items={tickerItems} />
    </div>
  );
}
