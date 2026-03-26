"use client";

/**
 * Design: command-center archetype — centered modal for month close-out
 * Distinction: 3-step flow (delivery review → invoice review → success); per-client table
 * Rule-break: none — framer-motion per config, monospace for amounts
 */

import React, { useState, useTransition } from "react";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { batchCreateRetainerInvoices } from "@/lib/invoicing/batchCreateRetainerInvoices";
import { toast } from "sonner";
import * as Sentry from "@sentry/nextjs";
import { Check } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";

type CloseOutClient = {
  clientId: string;
  brand_name: string;
  total: number;
  published: number;
  retainer_amount: number | null;
};

type Props = {
  orgId: string;
  month: Date;
  verticalSlug: "smm_freelance" | "smm_agency";
  closeOutData: CloseOutClient[];
};

export function CloseOutDialog({
  orgId,
  month,
  verticalSlug,
  closeOutData,
}: Props) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [acknowledged, setAcknowledged] = useState<Record<string, boolean>>({});
  const [isPending, startTransition] = useTransition();
  const [invoiceAmounts, setInvoiceAmounts] = useState<Record<string, number>>(
    () => {
      const initial: Record<string, number> = {};
      closeOutData.forEach((row) => {
        if (row.retainer_amount != null && row.retainer_amount > 0) {
          initial[row.clientId] = row.retainer_amount;
        }
      });
      return initial;
    }
  );
  const [totalBilled, setTotalBilled] = useState(0);
  const [invoiceCount, setInvoiceCount] = useState(0);
  const router = useRouter();

  const monthLabel = format(month, "MMMM yyyy");
  const underDelivered = closeOutData.filter((c) => c.published < c.total);
  const allAcknowledged =
    underDelivered.length === 0 ||
    underDelivered.every((c) => acknowledged[c.clientId]);
  const invoiceClients = closeOutData.filter(
    (c) => (c.retainer_amount ?? 0) > 0
  );
  const totalAmount = invoiceClients.reduce(
    (sum, c) => sum + (invoiceAmounts[c.clientId] ?? c.retainer_amount ?? 0),
    0
  );

  const handleSendInvoices = () => {
    startTransition(async () => {
      try {
        const overrides: Record<string, number> = {};
        invoiceClients.forEach((c) => {
          overrides[c.clientId] =
            invoiceAmounts[c.clientId] ?? c.retainer_amount ?? 0;
        });

        const created = await batchCreateRetainerInvoices({
          orgId,
          vertical: verticalSlug,
          month,
          overrides,
        });

        setInvoiceCount(created.length);
        const billed = created.reduce(
          (sum, inv: { total?: number }) => sum + (inv.total ?? 0),
          0
        );
        setTotalBilled(billed);
        setStep(3);
        toast.success(`${monthLabel} closed out`, {
          description: `$${billed.toLocaleString()} billed across ${created.length} clients.`,
        });
        router.refresh();
      } catch (e) {
        toast.error("Failed to send invoices. Please try again.");
        Sentry.captureException(e);
      }
    });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (!v) setStep(1);
      }}
    >
      <DialogTrigger asChild>
        <button
          type="button"
          className="rounded bg-brand-mint px-4 py-2 text-sm font-medium text-brand-navy transition-colors hover:bg-brand-mint/90"
        >
          Close out {monthLabel}
        </button>
      </DialogTrigger>
      <DialogContent size="lg">
        <DialogHeader>
          <DialogTitle>
            {step === 1
              ? `Close out ${monthLabel}`
              : step === 2
                ? "Review invoices"
                : `${format(month, "MMMM")} closed out.`}
          </DialogTitle>
          <DialogDescription>
            {step === 1
              ? "Review what was delivered before sending invoices."
              : step === 2
                ? `${invoiceClients.length} invoices for ${monthLabel}`
                : `$${totalBilled.toLocaleString()} billed across ${invoiceCount} clients.`}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          <AnimatePresence mode="popLayout">
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="flex flex-col gap-3"
              >
                {closeOutData.map((row, index) => {
                  const pct =
                    row.total === 0
                      ? 0
                      : Math.round((row.published / row.total) * 100);
                  const needsAck = pct < 100;
                  return (
                    <motion.div
                      key={row.clientId}
                      initial={{ opacity: 0, x: -6 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{
                        duration: 0.25,
                        ease: "easeOut",
                        delay: index * 0.04,
                      }}
                      className={`flex items-center justify-between rounded-lg border px-3 py-2.5 ${
                        needsAck
                          ? "border-[rgba(250,204,21,0.25)] bg-[rgba(250,204,21,0.06)]"
                          : "border-border bg-brand-navy"
                      }`}
                    >
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-txt-primary">
                          {row.brand_name}
                        </span>
                        <span className="font-mono text-xs tabular-nums text-txt-muted">
                          Delivered {row.published} of {row.total} · {pct}%
                        </span>
                      </div>
                      {needsAck ? (
                        <label className="flex items-center gap-2 text-xs text-warning">
                          <Checkbox
                            checked={acknowledged[row.clientId] ?? false}
                            onCheckedChange={(checked) =>
                              setAcknowledged((prev) => ({
                                ...prev,
                                [row.clientId]: !!checked,
                              }))
                            }
                          />
                          <span>Acknowledge</span>
                        </label>
                      ) : (
                        <Check className="h-4 w-4 text-brand-mint" />
                      )}
                    </motion.div>
                  );
                })}
                <div className="mt-2 flex justify-end">
                  <Button
                    disabled={!allAcknowledged}
                    onClick={() => setStep(2)}
                  >
                    Review invoices →
                  </Button>
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="flex flex-col gap-3"
              >
                {invoiceClients.map((row) => (
                  <div
                    key={row.clientId}
                    className="flex items-center justify-between rounded-lg border border-border bg-brand-navy px-3 py-2.5"
                  >
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-txt-primary">
                        {row.brand_name}
                      </span>
                      <span className="text-xs text-txt-muted">
                        Billing {monthLabel}
                      </span>
                    </div>
                    <Input
                      type="number"
                      className="w-28 border-0 border-b border-border bg-transparent text-right font-mono tabular-nums"
                      value={
                        invoiceAmounts[row.clientId] ?? row.retainer_amount ?? 0
                      }
                      onChange={(e) =>
                        setInvoiceAmounts((prev) => ({
                          ...prev,
                          [row.clientId]: Number(e.target.value || 0),
                        }))
                      }
                    />
                  </div>
                ))}
                <div className="mt-2 border-t border-border pt-3 text-right text-sm font-medium text-txt-primary">
                  Total:{" "}
                  <span className="font-mono tabular-nums">
                    ${totalAmount.toLocaleString()}
                  </span>
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <Button variant="ghost" onClick={() => setStep(1)}>
                    ← Back
                  </Button>
                  <Button onClick={handleSendInvoices} disabled={isPending}>
                    {isPending ? "···" : `Send ${invoiceClients.length} invoice${invoiceClients.length !== 1 ? "s" : ""}`}
                  </Button>
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="flex flex-col items-center gap-4 py-6 text-center"
              >
                <motion.div
                  className="flex h-14 w-14 items-center justify-center rounded-full border border-brand-mint/20 bg-brand-mint/10"
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                >
                  <Check className="h-6 w-6 text-brand-mint" />
                </motion.div>
                <div className="flex flex-col gap-3">
                  <Button
                    variant="link"
                    onClick={() => {
                      setOpen(false);
                      router.push("/invoices");
                    }}
                  >
                    View invoices →
                  </Button>
                  <Button
                    onClick={() => {
                      setOpen(false);
                      setStep(1);
                    }}
                  >
                    Done
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </DialogContent>
    </Dialog>
  );
}
