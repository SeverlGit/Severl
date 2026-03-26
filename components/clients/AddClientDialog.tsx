"use client";

/**
 * Design: command-center archetype — centered modal for form-heavy intake
 * Distinction: 2-column grid in wide dialog, not cramped slide-out; platform chips
 *   with accent border on selected; labels per AP-K4 (uppercase, muted, tracking)
 * Rule-break: none — follows design.config interactive_states and token usage
 */

import React, { useState, useTransition } from "react";
import type { AnyVerticalConfig } from "@/lib/vertical-config";
import { createClient } from "@/lib/clients/actions";
import { toast } from "sonner";
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
import { cn } from "@/lib/utils";

type Props = {
  orgId: string;
  verticalSlug: "smm_freelance" | "smm_agency";
  verticalConfig: AnyVerticalConfig;
  trigger?: React.ReactNode;
};

const labelClass =
  "block text-[10px] uppercase tracking-wider font-medium text-txt-muted mb-1.5";
const inputClass =
  "bg-brand-navy border border-border rounded px-3 py-2 text-sm text-txt-primary placeholder:text-txt-hint focus:border-brand-mint focus:outline-none focus:ring-1 focus:ring-brand-mint/50 w-full";

export function AddClientDialog({ orgId, verticalSlug, verticalConfig, trigger }: Props) {
  const [open, setOpen] = useState(false);
  const [brandName, setBrandName] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [platforms, setPlatforms] = useState<string[]>([]);
  const [retainer, setRetainer] = useState("");
  const [contractStart, setContractStart] = useState("");
  const [contractRenewal, setContractRenewal] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const platformsField = verticalConfig.crm.intakeFields.find(
    (f) => f.key === "platforms"
  );
  const platformsOptions: string[] = platformsField?.options ?? [];

  const togglePlatform = (p: string) => {
    setPlatforms((prev) =>
      prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]
    );
  };

  const resetForm = () => {
    setBrandName("");
    setContactName("");
    setContactEmail("");
    setPlatforms([]);
    setRetainer("");
    setContractStart("");
    setContractRenewal("");
    setError(null);
  };

  const handleSubmit = () => {
    if (!brandName.trim() || !contactName.trim() || !contactEmail.trim()) return;
    setError(null);
    startTransition(async () => {
      try {
        await createClient({
          orgId,
          vertical: verticalSlug,
          data: {
            brand_name: brandName.trim(),
            contact_name: contactName.trim(),
            contact_email: contactEmail.trim(),
            platforms,
            retainer_amount: retainer ? Number(retainer) : null,
            contract_start: contractStart || null,
            contract_renewal: contractRenewal || null,
            account_manager_id: null,
            vertical_data: {},
          },
        });
        toast.success("Client added", {
          description: `${brandName.trim()} added to your roster.`,
        });
        setOpen(false);
        resetForm();
      } catch (e) {
        setError(
          e instanceof Error ? e.message : "Something went wrong. Please try again."
        );
        toast.error("Something went wrong", { description: "Please try again." });
      }
    });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (!v) resetForm();
      }}
    >
      <DialogTrigger asChild>
        {trigger ?? (
          <button
            type="button"
            className="rounded bg-brand-mint px-4 py-2 text-sm font-medium text-brand-navy transition-colors hover:bg-brand-mint/90"
          >
            Add {verticalConfig.crm.clientLabel.toLowerCase()}
          </button>
        )}
      </DialogTrigger>
      <DialogContent size="lg">
        <DialogHeader>
          <DialogTitle>Add {verticalConfig.crm.clientLabel}</DialogTitle>
          <DialogDescription>
            Fill in the details below to add a new{" "}
            {verticalConfig.crm.clientLabel.toLowerCase()}.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-4 px-6 py-4">
          <div className="col-span-2">
            <label className={labelClass}>Brand name *</label>
            <Input
              autoFocus
              value={brandName}
              onChange={(e) => setBrandName(e.target.value)}
              placeholder="e.g. Acme Corp"
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>
              {verticalConfig.crm.contactLabel} name *
            </label>
            <Input
              value={contactName}
              onChange={(e) => setContactName(e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>
              {verticalConfig.crm.contactLabel} email *
            </label>
            <Input
              type="email"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
              className={inputClass}
            />
          </div>

          <div className="col-span-2">
            <label className={labelClass}>Platforms</label>
            <div className="flex flex-wrap gap-1.5">
              {platformsOptions.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => togglePlatform(p)}
                  className={cn(
                    "rounded border px-2.5 py-1 text-xs font-medium uppercase tracking-wider transition-colors",
                    platforms.includes(p)
                      ? "border-brand-mint bg-brand-mint/15 text-brand-mint"
                      : "border-border bg-transparent text-txt-muted hover:border-txt-hint"
                  )}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          <div className="col-span-2">
            <label className={labelClass}>Retainer amount</label>
            <div className="flex items-center gap-1.5">
              <span className="text-sm text-txt-muted">$</span>
              <Input
                type="number"
                value={retainer}
                onChange={(e) => setRetainer(e.target.value)}
                className={cn(inputClass, "flex-1")}
              />
              <span className="text-xs text-txt-muted">/mo</span>
            </div>
          </div>

          <div>
            <label className={labelClass}>Contract start</label>
            <Input
              type="date"
              value={contractStart}
              onChange={(e) => setContractStart(e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Contract renewal</label>
            <Input
              type="date"
              value={contractRenewal}
              onChange={(e) => setContractRenewal(e.target.value)}
              className={inputClass}
            />
          </div>

          {error && <p className="col-span-2 text-[13px] text-danger">{error}</p>}
        </div>

        <DialogFooter>
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
            onClick={handleSubmit}
            disabled={
              isPending ||
              !brandName.trim() ||
              !contactName.trim() ||
              !contactEmail.trim()
            }
            className="rounded bg-brand-mint px-4 py-2 text-sm font-medium text-brand-navy transition-colors hover:bg-brand-mint/90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPending ? "···" : `Add ${verticalConfig.crm.clientLabel.toLowerCase()}`}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
