"use client";

import React, { useState, useTransition, useEffect, useOptimistic } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import type { AnyVerticalConfig } from "@/lib/vertical-config";
import type { InvoiceWithClient, BatchBillingClient } from "@/lib/database.types";
import type { InvoiceClientOption } from "@/lib/invoicing/getInvoicesData";
import { markInvoicePaid, voidInvoice, markInvoiceSent, createPaymentLink, exportInvoicesCsv } from "@/lib/invoicing/actions";
import { usePlan } from "@/lib/billing/plan-context";
import { useTour } from "@/lib/tour-context";
import { startInvoicesTour } from "@/lib/tour-guides";
import { UpgradePrompt } from "@/components/shared/UpgradePrompt";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";
import { Search, X, Receipt, ExternalLink, Link2, Download, CheckCircle2, AlertTriangle } from "lucide-react";
import { EmptyState } from "@/components/shared/EmptyState";
import { BatchBillingDialog } from "@/components/invoices/BatchBillingDialog";
import { CreateInvoiceDialog } from "@/components/invoices/CreateInvoiceDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";

const STATUS_TABS = ["all", "draft", "sent", "paid", "overdue", "voided"] as const;

const cardTransition = {
  duration: 0.3,
  ease: [0.16, 1, 0.3, 1] as [number, number, number, number],
};

const INVOICE_STATUS_CHIP: Record<string, string> = {
  paid: "bg-success/10 text-success",
  overdue: "bg-danger/10 text-danger",
  sent: "bg-warning/10 text-warning",
  draft: "bg-txt-muted/10 text-txt-muted",
  voided: "bg-txt-muted/10 text-txt-muted line-through",
};

type Props = {
  invoices: InvoiceWithClient[];
  summary: { collected_this_month: number; outstanding: number; overdue_total: number; active_retainers: number };
  counts: Record<string, number>;
  activeStatus: string;
  search: string;
  orgId: string;
  verticalSlug: "smm_freelance" | "smm_agency";
  vertical: AnyVerticalConfig;
  batchClients: BatchBillingClient[];
  invoiceClients: InvoiceClientOption[];
};

export type InvoicesClientProps = Props;

const EMPTY_MESSAGES: Record<string, { heading: string; body: string; cta?: { label: string; href: string } }> = {
  all: { heading: "No invoices yet.", body: "Close out a month to generate your first retainer invoices automatically.", cta: { label: "Go to deliverables →", href: "/deliverables" } },
  overdue: { heading: "No overdue invoices.", body: "Your billing is clean." },
  paid: { heading: "No paid invoices this period.", body: "" },
  draft: { heading: "No draft invoices.", body: "" },
  sent: { heading: "No invoices awaiting payment.", body: "" },
  voided: { heading: "No voided invoices.", body: "" },
};

export default function InvoicesClient({
  invoices,
  summary,
  counts,
  activeStatus,
  search,
  orgId,
  verticalSlug,
  vertical,
  batchClients,
  invoiceClients,
}: Props) {
  const router = useRouter();
  const { canUsePaymentLinks, canExportCsv } = usePlan();
  const { uiMeta, markLocalSeen } = useTour();
  const [searchValue, setSearchValue] = useState(search);
  const [isPending, startTransition] = useTransition();
  const [optimisticInvoices, updateOptimistic] = useOptimistic(
    invoices,
    (state: InvoiceWithClient[], { id, newStatus }: { id: string; newStatus: string }) =>
      state.map((inv) =>
        inv.id === id ? { ...inv, status: newStatus as InvoiceWithClient['status'] } : inv
      ),
  );
  const [markPaidInvoice, setMarkPaidInvoice] = useState<InvoiceWithClient | null>(null);
  const [voidConfirm, setVoidConfirm] = useState<InvoiceWithClient | null>(null);
  const [paymentMethod, setPaymentMethod] = useState("bank_transfer");
  const [paidDate, setPaidDate] = useState(new Date().toISOString().slice(0, 10));

  useEffect(() => {
    if (!uiMeta.has_seen_invoices_tour && (canUsePaymentLinks || canExportCsv)) {
      const t = setTimeout(() => {
        startInvoicesTour(() => markLocalSeen("has_seen_invoices_tour"));
      }, 700);
      return () => clearTimeout(t);
    }
  }, [uiMeta.has_seen_invoices_tour, canUsePaymentLinks, canExportCsv]);

  useEffect(() => {
    const timer = setTimeout(() => {
      const params = new URLSearchParams();
      if (activeStatus !== "all") params.set("status", activeStatus);
      if (searchValue) params.set("search", searchValue);
      const qs = params.toString();
      router.push(`/invoices${qs ? `?${qs}` : ""}`);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchValue]);

  const handleMarkPaid = () => {
    if (!markPaidInvoice) return;
    const inv = markPaidInvoice;
    setMarkPaidInvoice(null);
    startTransition(async () => {
      updateOptimistic({ id: inv.id, newStatus: "paid" });
      try {
        await markInvoicePaid({ invoiceId: inv.id, orgId, vertical: verticalSlug, paymentMethod, paidDate });
        toast.success("Invoice marked as paid", { description: `${inv.clients?.brand_name} · ${inv.invoice_number} · ${formatCurrency(inv.total ?? 0)}` });
        router.refresh();
      } catch { toast.error("Something went wrong", { description: "Please try again." }); router.refresh(); }
    });
  };

  const handleVoid = () => {
    if (!voidConfirm) return;
    const inv = voidConfirm;
    setVoidConfirm(null);
    startTransition(async () => {
      updateOptimistic({ id: inv.id, newStatus: "voided" });
      try {
        await voidInvoice({ invoiceId: inv.id, orgId, vertical: verticalSlug });
        toast.success("Invoice voided", { description: `${inv.invoice_number} voided.` });
        router.refresh();
      } catch { toast.error("Something went wrong", { description: "Please try again." }); router.refresh(); }
    });
  };

  const handleSend = (invoiceId: string) => {
    startTransition(async () => {
      try {
        await markInvoiceSent({ invoiceId, orgId, vertical: verticalSlug });
        toast.success("Invoice sent");
        router.refresh();
      } catch { toast.error("Something went wrong", { description: "Please try again." }); }
    });
  };

  const [paymentLinkPending, setPaymentLinkPending] = useState<string | null>(null);
  const handleCopyPaymentLink = async (inv: InvoiceWithClient) => {
    setPaymentLinkPending(inv.id);
    try {
      // If a payment link already exists on the invoice, copy it directly
      if (inv.stripe_payment_link_url) {
        await navigator.clipboard.writeText(inv.stripe_payment_link_url);
        toast.success("Payment link copied", { description: `Send to ${inv.clients?.brand_name ?? "client"} to collect payment.` });
        return;
      }
      const result = await createPaymentLink({ invoiceId: inv.id, orgId });
      if ("error" in result) {
        toast.error("Could not create payment link", { description: result.error });
        return;
      }
      await navigator.clipboard.writeText(result.data);
      toast.success("Payment link copied", { description: `Send to ${inv.clients?.brand_name ?? "client"} to collect payment.` });
      router.refresh(); // reflect stripe_payment_link_url on the invoice row
    } catch {
      toast.error("Clipboard access denied", { description: "Copy the link from the invoice page instead." });
    } finally {
      setPaymentLinkPending(null);
    }
  };

  const [exportPending, setExportPending] = useState(false);
  const handleExportCsv = async () => {
    setExportPending(true);
    try {
      const result = await exportInvoicesCsv({ orgId });
      if ("error" in result) {
        toast.error("Export failed", { description: result.error });
        return;
      }
      const blob = new Blob([result.data], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `severl-invoices-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("Invoices exported");
    } catch {
      toast.error("Export failed", { description: "Please try again." });
    } finally {
      setExportPending(false);
    }
  };

  const navigateTab = (status: string) => {
    const params = new URLSearchParams();
    if (status !== "all") params.set("status", status);
    if (searchValue) params.set("search", searchValue);
    const qs = params.toString();
    router.push(`/invoices${qs ? `?${qs}` : ""}`);
  };

  const emptyState = EMPTY_MESSAGES[activeStatus] ?? EMPTY_MESSAGES.all;

  return (
    <div className="flex flex-col gap-4 px-6 py-4">
      <header className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-lg font-medium text-txt-primary">Invoices</h1>
          <p className="text-sm text-txt-muted">Track retainer billing, status, and cash collection.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {canExportCsv ? (
            <Button
              id="tour-invoice-export"
              variant="ghost"
              size="sm"
              onClick={handleExportCsv}
              disabled={exportPending}
              className="h-8 gap-1.5 text-txt-muted hover:text-txt-primary"
            >
              <Download className="h-3.5 w-3.5" />
              {exportPending ? "Exporting…" : "Export CSV"}
            </Button>
          ) : (
            <UpgradePrompt featureName="CSV export" requiredTier="pro" compact />
          )}
          <CreateInvoiceDialog orgId={orgId} verticalSlug={verticalSlug} clients={invoiceClients} />
          <BatchBillingDialog orgId={orgId} verticalSlug={verticalSlug} batchBillingLabel={vertical.invoicing.batchBillingLabel} clients={batchClients} />
        </div>
      </header>

      <div className="grid gap-px rounded-lg border border-border bg-border-subtle md:grid-cols-4">
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ ...cardTransition, delay: 0 }} className="border-l-2 border-success bg-surface first:rounded-l-lg px-4 py-3.5">
          <div className="text-[10px] font-medium uppercase tracking-wider text-txt-muted">MRR collected</div>
          <div className={`mt-1 font-mono text-2xl font-medium tabular-nums ${summary.collected_this_month > 0 ? "text-success" : "text-txt-muted"}`}>{formatCurrency(summary.collected_this_month)}</div>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ ...cardTransition, delay: 0.06 }} className="bg-surface px-4 py-3.5">
          <div className="text-[10px] font-medium uppercase tracking-wider text-txt-muted">Outstanding</div>
          <div className="mt-1 font-mono text-2xl font-medium tabular-nums text-txt-primary">{formatCurrency(summary.outstanding)}</div>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ ...cardTransition, delay: 0.12 }} className="border-l-2 border-l-danger bg-surface px-4 py-3.5">
          <div className="text-[10px] font-medium uppercase tracking-wider text-txt-muted">Overdue</div>
          <div className={`mt-1 font-mono text-2xl font-medium tabular-nums ${summary.overdue_total > 0 ? "text-danger" : "text-txt-muted"}`}>{formatCurrency(summary.overdue_total)}</div>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ ...cardTransition, delay: 0.18 }} className="bg-surface last:rounded-r-lg px-4 py-3.5">
          <div className="text-[10px] font-medium uppercase tracking-wider text-txt-muted">Active retainers</div>
          <div className="mt-1 font-mono text-2xl font-medium tabular-nums text-txt-primary">{summary.active_retainers}</div>
        </motion.div>
      </div>

      <div className="rounded-lg border border-border bg-surface p-4">
        <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <Tabs value={activeStatus} onValueChange={navigateTab}>
            <TabsList className="border-b border-border-subtle">
              {STATUS_TABS.map((status) => {
                const label = status === "all" ? "All" : status[0].toUpperCase() + status.slice(1);
                const count = counts[status] ?? 0;
                return (
                  <TabsTrigger key={status} value={status} className="text-sm font-medium text-txt-muted transition-colors hover:text-txt-secondary data-[state=active]:border-b-2 data-[state=active]:border-success data-[state=active]:text-success data-[state=active]:-mb-px">
                    {label}
                    {count > 0 && <Badge variant="muted" className="ml-1.5 font-mono text-[10px] tabular-nums">{count}</Badge>}
                  </TabsTrigger>
                );
              })}
            </TabsList>
          </Tabs>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[rgba(160,152,144,0.75)]" />
            <Input
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              placeholder="Search invoices..."
              className="h-8 w-56 pl-8 font-sans text-[13px] placeholder:text-[rgba(160,152,144,0.75)]"
            />
            {searchValue && (
              <button type="button" onClick={() => setSearchValue("")} className="absolute right-2 top-1/2 -translate-y-1/2 text-txt-muted transition-colors hover:text-txt-primary text-[rgba(160,152,144,0.75)]" aria-label="Clear search">
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        <div className="overflow-hidden rounded-lg border border-border">
          <table className="min-w-full border-collapse text-[13px]">
            <thead className="border-b border-border-subtle bg-surface text-left text-[10px] font-medium uppercase tracking-wider text-txt-hint">
              <tr>
                <th className="px-3 py-3 font-medium">#</th>
                <th className="px-3 py-3 font-medium">{vertical.crm.clientLabel}</th>
                <th className="px-3 py-3 font-medium">Type</th>
                <th className="px-3 py-3 font-medium">Billing month</th>
                <th className="px-3 py-3 font-medium text-right">Amount</th>
                <th className="px-3 py-3 font-medium">Due</th>
                <th className="px-3 py-3 font-medium">Status</th>
                <th className="px-3 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {invoices.length === 0 && (
                <tr>
                  <td className="px-3 py-16 text-center align-middle" colSpan={8}>
                    <EmptyState
                      icon={<Receipt strokeWidth={1.25} />}
                      title={emptyState.heading}
                      description={emptyState.body}
                      action={emptyState.cta}
                    />
                  </td>
                </tr>
              )}
              {optimisticInvoices.map((inv, idx) => {
                const isOverdue = inv.status === "overdue";
                const billingLabel = inv.billing_month
                  ? (() => { const [y, m] = inv.billing_month.split('-'); return new Date(Number(y), Number(m) - 1, 1).toLocaleDateString(undefined, { month: 'long', year: 'numeric' }); })()
                  : "—";
                const dueLabel = inv.due_date
                  ? (() => { const [y, m, d] = inv.due_date.split('-'); return new Date(Number(y), Number(m) - 1, Number(d)).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }); })()
                  : "—";
                return (
                  <motion.tr key={inv.id} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.25, ease: "easeOut", delay: idx * 0.03 }} className={`border-b border-border-subtle transition-colors hover:bg-surface ${isOverdue ? "border-l-2 border-l-danger" : ""}`}>
                    <td className="px-3 py-3 font-mono text-[12px] tabular-nums text-txt-muted">{inv.invoice_number || "—"}</td>
                    <td className="px-3 py-3 text-[14px] text-txt-primary">{inv.clients?.brand_name ?? "—"}</td>
                    <td className="px-3 py-3"><Badge variant="muted" className="capitalize">{inv.invoice_type ?? "—"}</Badge></td>
                    <td className="px-3 py-3 font-mono text-[13px] tabular-nums text-txt-muted">{billingLabel}</td>
                    <td className="px-3 py-3 text-right font-mono text-[13px] tabular-nums text-txt-primary">{formatCurrency(inv.total ?? 0)}</td>
                    <td className={`px-3 py-3 font-mono text-[13px] tabular-nums ${isOverdue ? "text-danger" : "text-txt-muted"}`}>{dueLabel}</td>
                    <td className="px-3 py-3">
                      <span className={`inline-block text-[10px] font-medium uppercase tracking-wider rounded px-1.5 py-0.5 ${INVOICE_STATUS_CHIP[inv.status] ?? "bg-txt-muted/10 text-txt-muted"}`}>
                        {inv.status}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-8 px-2 text-txt-muted hover:text-txt-primary"
                          aria-label="View printable invoice"
                          onClick={() => window.open(`/api/invoices/${inv.id}`, "_blank")}
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                        </Button>
                        {inv.status === "draft" && <>
                          <Button
                            variant="link"
                            size="sm"
                            onClick={() => handleSend(inv.id)}
                            disabled={isPending}
                            className="disabled:opacity-50"
                          >
                            {isPending ? 'Sending…' : 'Mark sent'}
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => setVoidConfirm(inv)} className="border border-danger/40 text-danger hover:bg-danger/10 hover:border-danger/70">Void</Button>
                        </>}
                        {inv.status === "sent" && <>
                          {canUsePaymentLinks ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              disabled={paymentLinkPending === inv.id}
                              onClick={() => handleCopyPaymentLink(inv)}
                              className="h-8 gap-1 px-2 text-txt-muted hover:text-brand-rose"
                              title={inv.stripe_payment_link_url ? "Copy payment link" : "Generate payment link"}
                            >
                              <Link2 className="h-3.5 w-3.5" />
                              {paymentLinkPending === inv.id ? "…" : inv.stripe_payment_link_url ? "Copy link" : "Pay link"}
                            </Button>
                          ) : null}
                          <Button variant="success" size="sm" onClick={() => setMarkPaidInvoice(inv)}>Mark paid</Button>
                          <Button variant="ghost" size="sm" onClick={() => setVoidConfirm(inv)} className="border border-danger/40 text-danger hover:bg-danger/10 hover:border-danger/70">Void</Button>
                        </>}
                        {inv.status === "overdue" && <>
                          {canUsePaymentLinks ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              disabled={paymentLinkPending === inv.id}
                              onClick={() => handleCopyPaymentLink(inv)}
                              className="h-8 gap-1 px-2 text-txt-muted hover:text-brand-rose"
                              title={inv.stripe_payment_link_url ? "Copy payment link" : "Generate payment link"}
                            >
                              <Link2 className="h-3.5 w-3.5" />
                              {paymentLinkPending === inv.id ? "…" : inv.stripe_payment_link_url ? "Copy link" : "Pay link"}
                            </Button>
                          ) : null}
                          <Button variant="success" size="sm" onClick={() => setMarkPaidInvoice(inv)}>Mark paid</Button>
                          <Button variant="ghost" size="sm" onClick={() => setVoidConfirm(inv)} className="border border-danger/40 text-danger hover:bg-danger/10 hover:border-danger/70">Void</Button>
                        </>}
                        {inv.status === "paid" && <span className="text-[12px] text-txt-muted">Paid</span>}
                        {inv.status === "voided" && <span className="text-[12px] text-txt-muted">Voided</span>}
                      </div>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <Sheet open={!!markPaidInvoice} onOpenChange={(v) => { if (!v) setMarkPaidInvoice(null); }}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2 text-success">
              <CheckCircle2 className="h-5 w-5" />
              Mark as paid
            </SheetTitle>
            <SheetDescription>
              <span className="font-medium text-txt-primary">{formatCurrency(markPaidInvoice?.total ?? 0)}</span>
              {" "}from{" "}
              <span className="font-medium text-txt-primary">{markPaidInvoice?.clients?.brand_name}</span>
              {" "}· {markPaidInvoice?.invoice_number}
            </SheetDescription>
          </SheetHeader>
          <div className="flex flex-col gap-4 px-5 py-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[12px] font-medium uppercase tracking-[0.06em] text-txt-hint">Payment method</label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger aria-label="Payment method">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bank_transfer">Bank transfer</SelectItem>
                  <SelectItem value="credit_card">Credit card</SelectItem>
                  <SelectItem value="paypal">PayPal</SelectItem>
                  <SelectItem value="stripe">Stripe</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[12px] font-medium uppercase tracking-[0.06em] text-txt-hint">Date paid</label>
              <Input type="date" value={paidDate} onChange={(e) => setPaidDate(e.target.value)} />
            </div>
          </div>
          <SheetFooter>
            <Button variant="ghost" onClick={() => setMarkPaidInvoice(null)}>Cancel</Button>
            <Button variant="success" disabled={isPending} onClick={handleMarkPaid}>
              {isPending ? 'Confirming…' : 'Confirm payment'}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <AlertDialog open={!!voidConfirm} onOpenChange={(v) => { if (!v) setVoidConfirm(null); }}>
        <AlertDialogContent className="border-danger/40">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-danger/10">
              <AlertTriangle className="h-5 w-5 text-danger" />
            </div>
            <AlertDialogHeader>
              <AlertDialogTitle className="text-danger">Void {voidConfirm?.invoice_number}?</AlertDialogTitle>
              <AlertDialogDescription>
                This is permanent and cannot be undone.{" "}
                <span className="font-medium text-txt-primary">{formatCurrency(voidConfirm?.total ?? 0)}</span>
                {" "}from{" "}
                <span className="font-medium text-txt-primary">{voidConfirm?.clients?.brand_name}</span>
                {" "}will be removed from your outstanding balance and cannot be re-activated.
              </AlertDialogDescription>
            </AlertDialogHeader>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleVoid} disabled={isPending} className="bg-danger hover:bg-danger/90 text-white">
              {isPending ? "Voiding…" : "Yes, void this invoice"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
