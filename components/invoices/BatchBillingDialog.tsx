"use client";

/**
 * Design: command-center archetype — centered modal for batch invoice checklist
 * Distinction: single-column client list with checkboxes, editable amounts, total line
 * Rule-break: none — compact spacing, monospace amounts per design.config
 */

import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { batchCreateRetainerInvoices } from "@/lib/invoicing/batchCreateRetainerInvoices";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/utils";
import { Check } from "lucide-react";
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import type { BatchBillingClient } from "@/lib/database.types";

type Props = {
  orgId: string;
  verticalSlug: "smm_freelance" | "smm_agency";
  batchBillingLabel: string;
  clients: BatchBillingClient[];
};

export function BatchBillingDialog({
  orgId,
  verticalSlug,
  batchBillingLabel,
  clients,
}: Props) {
  const [open, setOpen] = useState(false);
  const [checked, setChecked] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {};
    clients.forEach((c) => {
      init[c.id] = true;
    });
    return init;
  });
  const [amounts, setAmounts] = useState<Record<string, number>>(() => {
    const init: Record<string, number> = {};
    clients.forEach((c) => {
      init[c.id] = c.retainer_amount ?? 0;
    });
    return init;
  });
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const selected = clients.filter((c) => checked[c.id]);
  const selectedCount = selected.length;
  const total = selected.reduce(
    (s, c) => s + (amounts[c.id] ?? c.retainer_amount ?? 0),
    0
  );
  const monthLabel = new Date().toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });

  const handleSend = () => {
    const overrides: Record<string, number> = {};
    selected.forEach((c) => {
      overrides[c.id] = amounts[c.id] ?? c.retainer_amount ?? 0;
    });
    startTransition(async () => {
      try {
        const created = await batchCreateRetainerInvoices({
          orgId,
          vertical: verticalSlug,
          month: new Date(),
          overrides,
        });
        toast.success(`${created.length} invoices sent`, {
          description: `$${total.toLocaleString()} for ${monthLabel}.`,
        });
        setOpen(false);
        router.refresh();
      } catch {
        toast.error("Something went wrong", { description: "Please try again." });
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          type="button"
          className="rounded bg-brand-mint px-4 py-2 text-sm font-medium text-brand-navy transition-colors hover:bg-brand-mint/90"
        >
          {batchBillingLabel}
        </button>
      </DialogTrigger>
      <DialogContent size="md">
        <DialogHeader>
          <DialogTitle>Send monthly invoices</DialogTitle>
          <DialogDescription>
            {monthLabel} · {clients.length} clients
          </DialogDescription>
        </DialogHeader>

        {clients.length === 0 ? (
          <div className="flex flex-col items-center gap-3 px-6 py-10 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full border border-brand-mint/20 bg-brand-mint/10">
              <Check className="h-5 w-5 text-brand-mint" />
            </div>
            <span className="text-base text-txt-primary">
              All clients invoiced for {monthLabel}.
            </span>
            <Button variant="link" onClick={() => setOpen(false)}>
              Close
            </Button>
          </div>
        ) : (
          <>
            <div className="space-y-2 px-6 py-4">
              {clients.map((c) => (
                <div
                  key={c.id}
                  className="flex items-center gap-3 py-2"
                >
                  <Checkbox
                    checked={checked[c.id] ?? false}
                    onCheckedChange={(v) =>
                      setChecked((p) => ({ ...p, [c.id]: !!v }))
                    }
                    aria-label={`Select ${c.brand_name}`}
                  />
                  <span className="flex-1 text-sm text-txt-secondary">
                    {c.brand_name}
                  </span>
                  <Input
                    type="number"
                    value={amounts[c.id] ?? c.retainer_amount ?? 0}
                    onChange={(e) =>
                      setAmounts((p) => ({
                        ...p,
                        [c.id]: Number(e.target.value) || 0,
                      }))
                    }
                    className="w-24 border-0 border-b border-border bg-transparent text-right font-mono tabular-nums"
                  />
                </div>
              ))}
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-border px-6 py-3">
              <span className="text-sm text-txt-muted">Total:</span>
              <span className="font-mono text-base font-medium tabular-nums text-txt-primary">
                {formatCurrency(total)}
              </span>
            </div>

            <DialogFooter>
              <span className="mr-auto text-xs text-txt-muted">
                {selectedCount} invoice{selectedCount !== 1 ? "s" : ""} selected
              </span>
              <DialogClose asChild>
                <button
                  type="button"
                  className="text-sm text-txt-muted transition-colors hover:text-txt-secondary"
                >
                  Cancel
                </button>
              </DialogClose>
              <button
                type="button"
                onClick={handleSend}
                disabled={isPending || selectedCount === 0}
                className="rounded bg-brand-mint px-4 py-2 text-sm font-medium text-brand-navy transition-colors hover:bg-brand-mint/90 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isPending
                  ? "···"
                  : `Send ${selectedCount} invoice${selectedCount !== 1 ? "s" : ""}`}
              </button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
