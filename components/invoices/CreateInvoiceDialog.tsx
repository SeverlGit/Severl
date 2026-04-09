"use client";

import React, { useState, useTransition, useMemo } from "react";
import { useRouter } from "next/navigation";
import { createInvoice } from "@/lib/invoicing/actions";
import type { InvoiceClientOption } from "@/lib/invoicing/getInvoicesData";
import { toast } from "sonner";
import { useTour } from "@/lib/tour-context";
import { startCreateInvoiceTour } from "@/lib/tour-guides";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatCurrency } from "@/lib/utils";

type Props = {
  orgId: string;
  verticalSlug: "smm_freelance" | "smm_agency";
  clients: InvoiceClientOption[];
};

const labelClass =
  "block text-[10px] uppercase tracking-wider font-medium text-txt-muted mb-1.5";

function defaultBillingMonth(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function defaultDueDate(): string {
  const d = new Date();
  d.setDate(d.getDate() + 14);
  return d.toISOString().slice(0, 10);
}

function monthPickerToBillingMonthIso(ym: string): string {
  const [y, m] = ym.split("-").map((x) => parseInt(x, 10));
  if (!y || !m) return new Date().toISOString().slice(0, 10);
  return new Date(y, m - 1, 1).toISOString().slice(0, 10);
}

const INVOICE_TYPES: { value: "retainer" | "project" | "ad_spend"; label: string }[] = [
  { value: "retainer", label: "Retainer" },
  { value: "project", label: "Project" },
  { value: "ad_spend", label: "Ad spend" },
];

export function CreateInvoiceDialog({ orgId, verticalSlug, clients }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [clientId, setClientId] = useState("");
  const [invoiceType, setInvoiceType] = useState<"retainer" | "project" | "ad_spend">("project");
  const [amountStr, setAmountStr] = useState("");
  const [dueDate, setDueDate] = useState(defaultDueDate);
  const [billingMonth, setBillingMonth] = useState(defaultBillingMonth);
  const [description, setDescription] = useState("");
  const [isPending, startTransition] = useTransition();

  const { uiMeta, markLocalSeen } = useTour();

  React.useEffect(() => {
    if (open && !uiMeta.has_seen_first_invoice && clients.length > 0) {
      const t = setTimeout(() => {
        startCreateInvoiceTour(() => markLocalSeen("has_seen_first_invoice"));
      }, 300);
      return () => clearTimeout(t);
    }
  }, [open, uiMeta.has_seen_first_invoice, clients.length, markLocalSeen]);

  const amountPreview = useMemo(() => {
    const n = parseFloat(amountStr.replace(/,/g, ""));
    if (!Number.isFinite(n)) return null;
    return n;
  }, [amountStr]);

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (next && clients.length > 0) {
      setClientId(clients[0].id);
      setInvoiceType("project");
      setAmountStr("");
      setDueDate(defaultDueDate());
      setBillingMonth(defaultBillingMonth());
      setDescription("");
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(amountStr.replace(/,/g, ""));
    if (!clientId || !Number.isFinite(amount) || amount <= 0) {
      toast.error("Check client and amount");
      return;
    }
    startTransition(async () => {
      const result = await createInvoice({
        orgId,
        vertical: verticalSlug,
        clientId,
        invoiceType,
        amount,
        dueDate,
        billingMonth: monthPickerToBillingMonthIso(billingMonth),
        description: description.trim() || undefined,
      });
      if ("error" in result) {
        toast.error("Could not create invoice", { description: result.error });
        return;
      }
      toast.success("Invoice created");
      setOpen(false);
      router.refresh();
    });
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <button
          type="button"
          className="rounded bg-success px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-success/90"
        >
          Create invoice
        </button>
      </DialogTrigger>
      <DialogContent size="md">
        <DialogHeader>
          <DialogTitle>Create invoice</DialogTitle>
          <DialogDescription>Add a one-off draft invoice for a client.</DialogDescription>
        </DialogHeader>

        {clients.length === 0 ? (
          <div className="flex flex-col items-center gap-3 px-6 py-10 text-center">
            <p className="text-sm text-txt-secondary">No active clients yet. Add a client first.</p>
            <DialogClose asChild>
              <button
                type="button"
                className="text-sm text-txt-muted transition-colors hover:text-txt-secondary"
              >
                Close
              </button>
            </DialogClose>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 px-6 py-2">
            <div>
              <label className={labelClass} htmlFor="create-inv-client">
                Client
              </label>
              <Select value={clientId} onValueChange={setClientId}>
                <SelectTrigger id="form-invoice-client" aria-label="Client">
                  <SelectValue placeholder="Select client" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.brand_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className={labelClass} htmlFor="create-inv-type">
                Type
              </label>
              <Select
                value={invoiceType}
                onValueChange={(v) => setInvoiceType(v as typeof invoiceType)}
              >
                <SelectTrigger id="create-inv-type" aria-label="Invoice type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {INVOICE_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className={labelClass} htmlFor="create-inv-amount">
                Amount
              </label>
              <Input
                id="create-inv-amount"
                type="number"
                inputMode="decimal"
                min={0}
                step="0.01"
                placeholder="0.00"
                value={amountStr}
                onChange={(e) => setAmountStr(e.target.value)}
                className="border-border bg-surface font-mono tabular-nums"
              />
              {amountPreview != null && (
                <p className="mt-1 text-xs text-txt-muted">{formatCurrency(amountPreview)}</p>
              )}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className={labelClass} htmlFor="create-inv-due">
                  Due date
                </label>
                <Input
                  id="form-invoice-due"
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="border-border bg-surface"
                />
              </div>
              <div>
                <label className={labelClass} htmlFor="create-inv-month">
                  Billing month
                </label>
                <Input
                  id="create-inv-month"
                  type="month"
                  value={billingMonth}
                  onChange={(e) => setBillingMonth(e.target.value)}
                  className="border-border bg-surface"
                />
              </div>
            </div>

            <div>
              <label className={labelClass} htmlFor="create-inv-desc">
                Description <span className="normal-case text-txt-hint">(optional)</span>
              </label>
              <Textarea
                id="create-inv-desc"
                rows={3}
                placeholder="Shown on the line item"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="resize-none border-border bg-surface text-sm"
              />
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <DialogClose asChild>
                <button
                  type="button"
                  className="text-sm text-txt-muted transition-colors hover:text-txt-secondary"
                >
                  Cancel
                </button>
              </DialogClose>
              <button
                id="form-invoice-submit"
                type="submit"
                disabled={isPending || !clientId}
                className="rounded bg-success px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-success/90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isPending ? "···" : "Create invoice"}
              </button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
