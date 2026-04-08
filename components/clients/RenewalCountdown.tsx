"use client";

import React, { useTransition } from "react";
import { differenceInDays, addDays } from "date-fns";
import { updateClientRenewal } from "@/lib/clients/actions";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

type Props = {
  clientId: string;
  orgId: string;
  contractRenewal: string;
};

export function RenewalCountdown({ clientId, orgId, contractRenewal }: Props) {
  const [isPending, startTransition] = useTransition();
  const renewalDate = new Date(contractRenewal);
  const days = differenceInDays(renewalDate, new Date());

  const handleMarkRenewed = () => {
    const next = addDays(new Date(), 365);
    startTransition(async () => {
      try {
        await updateClientRenewal({ clientId, orgId, newDate: next.toISOString().slice(0, 10) });
        toast.success("Renewal updated", { description: "Contract renewed for 12 months." });
      } catch {
        toast.error("Something went wrong", { description: "Please try again." });
      }
    });
  };

  if (days > 30) {
    return (
      <div className="text-[14px] text-txt-muted">
        {days} days until renewal
      </div>
    );
  }

  if (days >= 14) {
    return (
      <div className="rounded-lg border border-warning/20 bg-warning-bg px-4 py-3 text-[14px] text-warning">
        {days} days until renewal — consider reaching out.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-danger/20 bg-danger-bg px-4 py-3 text-[14px] text-danger">
      <div>Renewal in {days} days.</div>
      <Button size="sm" disabled={isPending} onClick={handleMarkRenewed}>
        Mark as renewed
      </Button>
    </div>
  );
}
