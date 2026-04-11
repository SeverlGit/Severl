"use client";

import React, { useState } from "react";
import { formatDistanceToNow, format } from "date-fns";
import {
  FileText,
  Image as ImageIcon,
  CheckCircle2,
  Clock,
  AlertCircle,
  ExternalLink,
  Package,
  Receipt,
  Activity,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type {
  PortalOrg,
  PortalClient as PortalClientType,
  PortalDeliverable,
  PortalInvoice,
  PortalActivity,
} from "@/lib/portal/getPortalData";
import type { BrandAssetRow } from "@/lib/database.types";

type Tab = "brand" | "approvals" | "invoices" | "activity";

const STATUS_LABEL: Record<string, string> = {
  not_started: "Not started",
  in_progress: "In progress",
  pending_approval: "Awaiting approval",
  approved: "Approved",
  published: "Published",
};

const STATUS_COLOR: Record<string, string> = {
  not_started: "text-txt-muted bg-surface-hover",
  in_progress: "text-warning bg-warning/10",
  pending_approval: "text-brand-rose bg-brand-rose-dim",
  approved: "text-success bg-success/10",
  published: "text-brand-plum bg-brand-plum-dim",
};

const INVOICE_STATUS_COLOR: Record<string, string> = {
  draft: "text-txt-muted",
  sent: "text-warning",
  paid: "text-success",
  overdue: "text-danger",
  voided: "text-txt-hint",
};

function formatCurrencyPortal(amount: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount);
}

// ─── Brand Tab ────────────────────────────────────────────────────────────────

function BrandTab({
  client,
  brandAssets,
}: {
  client: PortalClientType;
  brandAssets: BrandAssetRow[];
}) {
  const fields = (client.vertical_data ?? {}) as Record<string, string>;
  const fieldEntries = Object.entries(fields).filter(([, v]) => Boolean(v));
  const imageAssets = brandAssets.filter((a) => a.type === "logo" || a.type === "image");
  const otherAssets = brandAssets.filter((a) => a.type !== "logo" && a.type !== "image");

  return (
    <div className="space-y-6">
      {/* Brand info */}
      {fieldEntries.length > 0 && (
        <div>
          <h3 className="text-[11px] uppercase tracking-wider font-medium text-txt-muted mb-3">
            Brand information
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {fieldEntries.map(([key, value]) => (
              <div
                key={key}
                className="rounded-lg border border-border bg-surface p-3"
              >
                <p className="text-[10px] uppercase tracking-wider text-txt-muted mb-1">
                  {key.replace(/_/g, " ")}
                </p>
                <p className="text-[13px] text-txt-primary whitespace-pre-wrap">{value}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Brand assets */}
      {brandAssets.length > 0 && (
        <div>
          <h3 className="text-[11px] uppercase tracking-wider font-medium text-txt-muted mb-3">
            Brand assets
          </h3>
          {imageAssets.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-3">
              {imageAssets.map((asset) => (
                <a
                  key={asset.id}
                  href={asset.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group relative rounded-lg border border-border bg-surface overflow-hidden aspect-video flex items-center justify-center hover:border-brand-rose/40 transition-colors"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={asset.file_url}
                    alt={asset.name}
                    className="object-contain w-full h-full p-2"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                  <ExternalLink className="absolute bottom-1.5 right-1.5 h-3 w-3 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                </a>
              ))}
            </div>
          )}
          {otherAssets.length > 0 && (
            <div className="space-y-1.5">
              {otherAssets.map((asset) => (
                <a
                  key={asset.id}
                  href={asset.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2.5 rounded-lg border border-border bg-surface px-3 py-2.5 text-[13px] text-txt-primary hover:border-brand-rose/40 hover:text-brand-rose transition-colors"
                >
                  <FileText className="h-4 w-4 text-txt-muted shrink-0" />
                  <span className="flex-1 truncate">{asset.name}</span>
                  <ExternalLink className="h-3 w-3 text-txt-hint shrink-0" />
                </a>
              ))}
            </div>
          )}
        </div>
      )}

      {fieldEntries.length === 0 && brandAssets.length === 0 && (
        <p className="text-[13px] text-txt-muted">No brand information has been added yet.</p>
      )}
    </div>
  );
}

// ─── Approvals Tab ────────────────────────────────────────────────────────────

function ApprovalsTab({ deliverables }: { deliverables: PortalDeliverable[] }) {
  const pending = deliverables.filter((d) => d.status === "pending_approval");
  const other = deliverables.filter((d) => d.status !== "pending_approval");

  return (
    <div className="space-y-6">
      {pending.length > 0 && (
        <div>
          <h3 className="text-[11px] uppercase tracking-wider font-medium text-txt-muted mb-3">
            Awaiting your approval
          </h3>
          <div className="space-y-2">
            {pending.map((d) => (
              <div
                key={d.id}
                className="flex items-center justify-between gap-3 rounded-lg border border-brand-rose/30 bg-brand-rose-dim px-4 py-3"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-medium text-txt-primary truncate">{d.title}</p>
                  <p className="text-[11px] text-txt-muted mt-0.5 capitalize">{d.type.replace(/_/g, " ")}</p>
                </div>
                {d.approval_token && (
                  <a
                    href={`/approve/${d.approval_token}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 shrink-0 rounded-md bg-brand-rose px-3 py-1.5 text-[12px] font-medium text-white hover:bg-brand-rose-deep transition-colors"
                  >
                    Review
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {other.length > 0 && (
        <div>
          <h3 className="text-[11px] uppercase tracking-wider font-medium text-txt-muted mb-3">
            Active deliverables
          </h3>
          <div className="space-y-1.5">
            {other.map((d) => (
              <div
                key={d.id}
                className="flex items-center justify-between gap-3 rounded-lg border border-border bg-surface px-4 py-3"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] text-txt-primary truncate">{d.title}</p>
                  <p className="text-[11px] text-txt-muted mt-0.5 capitalize">{d.type.replace(/_/g, " ")}</p>
                </div>
                <span
                  className={cn(
                    "shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-medium",
                    STATUS_COLOR[d.status] ?? "text-txt-muted bg-surface-hover"
                  )}
                >
                  {STATUS_LABEL[d.status] ?? d.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {deliverables.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <CheckCircle2 className="h-8 w-8 text-success mb-3" />
          <p className="text-[13px] text-txt-muted">No deliverables pending approval.</p>
        </div>
      )}
    </div>
  );
}

// ─── Invoices Tab ─────────────────────────────────────────────────────────────

function InvoicesTab({ invoices }: { invoices: PortalInvoice[] }) {
  if (invoices.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Receipt className="h-8 w-8 text-txt-muted mb-3" />
        <p className="text-[13px] text-txt-muted">No invoices yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {invoices.map((inv) => (
        <div
          key={inv.id}
          className="flex items-center justify-between gap-3 rounded-lg border border-border bg-surface px-4 py-3"
        >
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p className="text-[13px] font-medium text-txt-primary">{inv.invoice_number}</p>
              <span
                className={cn(
                  "text-[11px] font-medium capitalize",
                  INVOICE_STATUS_COLOR[inv.status] ?? "text-txt-muted"
                )}
              >
                {inv.status}
              </span>
            </div>
            <p className="text-[11px] text-txt-muted mt-0.5">
              {inv.billing_month
                ? format(new Date(inv.billing_month), "MMMM yyyy")
                : inv.due_date
                ? `Due ${format(new Date(inv.due_date), "MMM d, yyyy")}`
                : format(new Date(inv.created_at), "MMM d, yyyy")}
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <span className="font-mono text-[14px] font-medium text-txt-primary">
              {formatCurrencyPortal(Number(inv.total))}
            </span>
            {inv.stripe_payment_link_url && inv.status !== "paid" && inv.status !== "voided" && (
              <a
                href={inv.stripe_payment_link_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 rounded-md bg-success px-2.5 py-1 text-[11px] font-medium text-white hover:bg-success/90 transition-colors"
              >
                Pay
                <ExternalLink className="h-2.5 w-2.5" />
              </a>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Activity Tab ─────────────────────────────────────────────────────────────

const EVENT_LABEL: Record<string, string> = {
  "client.added": "Client added",
  "client.tag_changed": "Status updated",
  "client.renewed": "Contract renewed",
  "deliverable.created": "Deliverable created",
  "deliverable.status_changed": "Deliverable updated",
  "deliverable.completed": "Deliverable completed",
  "invoice.created": "Invoice created",
  "invoice.sent": "Invoice sent",
  "invoice.paid": "Invoice paid",
  "invoice.overdue": "Invoice overdue",
  "retainer.batch_sent": "Invoices sent",
};

function ActivityTab({ activity }: { activity: PortalActivity[] }) {
  if (activity.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Activity className="h-8 w-8 text-txt-muted mb-3" />
        <p className="text-[13px] text-txt-muted">No recent activity.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {activity.map((event, i) => (
        <div
          key={i}
          className="flex items-start gap-3 rounded-lg border border-border bg-surface px-4 py-3"
        >
          <div className="mt-0.5 h-1.5 w-1.5 rounded-full bg-brand-rose/60 shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="text-[13px] text-txt-primary">
              {EVENT_LABEL[event.event_type] ?? event.event_type}
            </p>
            <p className="text-[11px] text-txt-muted mt-0.5">
              {formatDistanceToNow(new Date(event.created_at), { addSuffix: true })}
            </p>
          </div>
          {event.amount != null && event.amount > 0 && (
            <span className="font-mono text-[12px] text-txt-secondary shrink-0">
              {formatCurrencyPortal(Number(event.amount))}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

type Props = {
  org: PortalOrg;
  client: PortalClientType;
  brandAssets: BrandAssetRow[];
  pendingDeliverables: PortalDeliverable[];
  invoices: PortalInvoice[];
  activity: PortalActivity[];
};

export function PortalClient({
  org,
  client,
  brandAssets,
  pendingDeliverables,
  invoices,
  activity,
}: Props) {
  const [tab, setTab] = useState<Tab>("brand");

  const pendingCount = pendingDeliverables.filter((d) => d.status === "pending_approval").length;
  const overdueCount = invoices.filter((inv) => inv.status === "overdue").length;

  const TABS: { id: Tab; label: string; icon: React.ElementType; badge?: number }[] = [
    { id: "brand", label: "Brand guide", icon: ImageIcon },
    { id: "approvals", label: "Approvals", icon: CheckCircle2, badge: pendingCount || undefined },
    { id: "invoices", label: "Invoices", icon: Receipt, badge: overdueCount || undefined },
    { id: "activity", label: "Activity", icon: Activity },
  ];

  return (
    <div className="min-h-screen bg-[#f9f5f3]">
      {/* Header */}
      <header className="border-b border-border bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {org.logo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={org.logo_url} alt={org.name} className="h-8 w-auto object-contain" />
            ) : (
              <div className="h-8 w-8 rounded-md bg-brand-rose/20 flex items-center justify-center">
                <span className="text-[13px] font-bold text-brand-rose">
                  {org.name.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            <div>
              <p className="text-[13px] font-medium text-txt-primary">{org.name}</p>
              <p className="text-[11px] text-txt-muted">Client portal</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[14px] font-medium text-txt-primary">{client.brand_name}</p>
            {client.retainer_amount && (
              <p className="text-[11px] text-txt-muted">
                {formatCurrencyPortal(Number(client.retainer_amount))}/mo retainer
              </p>
            )}
          </div>
        </div>
      </header>

      {/* Tab bar */}
      <div className="border-b border-border bg-white/60 sticky top-[65px] z-10">
        <div className="max-w-3xl mx-auto px-4">
          <nav className="flex gap-0">
            {TABS.map(({ id, label, icon: Icon, badge }) => (
              <button
                key={id}
                type="button"
                onClick={() => setTab(id)}
                className={cn(
                  "relative flex items-center gap-1.5 px-4 py-3 text-[13px] font-medium transition-colors border-b-2",
                  tab === id
                    ? "border-brand-rose text-brand-rose"
                    : "border-transparent text-txt-muted hover:text-txt-secondary"
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
                {badge ? (
                  <span className="ml-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-brand-rose text-[9px] font-bold text-white">
                    {badge}
                  </span>
                ) : null}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Content */}
      <main className="max-w-3xl mx-auto px-4 py-6">
        {/* Status alerts */}
        {overdueCount > 0 && tab !== "invoices" && (
          <div className="mb-4 flex items-center gap-2.5 rounded-lg border border-danger/30 bg-danger/5 px-4 py-3">
            <AlertCircle className="h-4 w-4 text-danger shrink-0" />
            <p className="text-[13px] text-danger">
              You have {overdueCount} overdue invoice{overdueCount > 1 ? "s" : ""}.{" "}
              <button
                type="button"
                onClick={() => setTab("invoices")}
                className="underline font-medium"
              >
                View
              </button>
            </p>
          </div>
        )}

        {tab === "brand" && <BrandTab client={client} brandAssets={brandAssets} />}
        {tab === "approvals" && <ApprovalsTab deliverables={pendingDeliverables} />}
        {tab === "invoices" && <InvoicesTab invoices={invoices} />}
        {tab === "activity" && <ActivityTab activity={activity} />}
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-6 mt-12">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <p className="text-[11px] text-txt-hint">
            Powered by{" "}
            <span className="font-medium text-txt-muted">Severl</span>
          </p>
        </div>
      </footer>
    </div>
  );
}
