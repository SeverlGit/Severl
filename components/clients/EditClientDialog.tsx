"use client";

/**
 * Design: command-center archetype — edit modal mirrors AddClientDialog
 * Distinction: pre-populated fields + 2-column grid for fast scanning/editing
 * Rule-break: none — uses existing tokens and compact density
 */

import React, { useEffect, useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { updateClient } from "@/lib/clients/actions";
import { useVerticalConfig } from "@/lib/vertical-config";

type EditClientDialogProps = {
  client: {
    id: string;
    brand_name: string;
    contact_name: string;
    contact_email: string;
    platforms: string[];
    retainer_amount: number | null;
    contract_start: string | null;
    contract_renewal: string | null;
  };
  orgId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const labelClass =
  "block text-[10px] uppercase tracking-wider font-medium text-txt-muted mb-1.5";
const inputClass =
  "bg-brand-navy border border-border rounded px-3 py-2 text-sm text-txt-primary placeholder:text-txt-hint focus:border-brand-mint focus:outline-none focus:ring-1 focus:ring-brand-mint/50 w-full";

function toDateInputValue(date: string | null): string {
  if (!date) return "";
  // Accept ISO timestamps or YYYY-MM-DD.
  return date.slice(0, 10);
}

export function EditClientDialog({ client, orgId, open, onOpenChange }: EditClientDialogProps) {
  const vertical = useVerticalConfig();
  const [isPending, startTransition] = useTransition();

  const platformsOptions = useMemo(() => {
    const platformsField = vertical.crm.intakeFields.find((f) => f.key === "platforms");
    return (platformsField?.options ?? []) as string[];
  }, [vertical.crm.intakeFields]);

  const [brandName, setBrandName] = useState(client.brand_name ?? "");
  const [contactName, setContactName] = useState(client.contact_name ?? "");
  const [contactEmail, setContactEmail] = useState(client.contact_email ?? "");
  const [platforms, setPlatforms] = useState<string[]>(client.platforms ?? []);
  const [retainer, setRetainer] = useState(
    client.retainer_amount != null ? String(client.retainer_amount) : ""
  );
  const [contractStart, setContractStart] = useState(toDateInputValue(client.contract_start));
  const [contractRenewal, setContractRenewal] = useState(toDateInputValue(client.contract_renewal));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setBrandName(client.brand_name ?? "");
    setContactName(client.contact_name ?? "");
    setContactEmail(client.contact_email ?? "");
    setPlatforms(client.platforms ?? []);
    setRetainer(client.retainer_amount != null ? String(client.retainer_amount) : "");
    setContractStart(toDateInputValue(client.contract_start));
    setContractRenewal(toDateInputValue(client.contract_renewal));
    setError(null);
  }, [open, client]);

  const togglePlatform = (p: string) => {
    setPlatforms((prev) => (prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]));
  };

  const handleSubmit = () => {
    if (!brandName.trim() || !contactName.trim() || !contactEmail.trim()) return;
    setError(null);
    startTransition(async () => {
      try {
        await updateClient({
          orgId,
          clientId: client.id,
          brand_name: brandName.trim(),
          contact_name: contactName.trim(),
          contact_email: contactEmail.trim(),
          platforms,
          retainer_amount: retainer ? Number(retainer) : null,
          contract_start: contractStart || null,
          contract_renewal: contractRenewal || null,
        });
        toast.success("Client updated");
        onOpenChange(false);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to update client.");
        toast.error("Failed to update client");
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="lg">
        <DialogHeader>
          <DialogTitle>Edit {vertical.crm.clientLabel}</DialogTitle>
          <DialogDescription>Update client details.</DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-4 px-6 py-4">
          <div className="col-span-2">
            <label className={labelClass}>Brand name *</label>
            <Input
              autoFocus
              value={brandName}
              onChange={(e) => setBrandName(e.target.value)}
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>{vertical.crm.contactLabel} name *</label>
            <Input
              value={contactName}
              onChange={(e) => setContactName(e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>{vertical.crm.contactLabel} email *</label>
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
              {(platformsOptions.length ? platformsOptions : platforms).map((p) => (
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
              {platformsOptions.length === 0 && platforms.length === 0 && (
                <span className="text-xs text-txt-hint">No platforms configured.</span>
              )}
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
            {isPending ? "···" : "Save changes"}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

