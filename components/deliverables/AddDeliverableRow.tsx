"use client";

import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useVerticalConfig } from "@/lib/vertical-config";
import { createDeliverable } from "@/lib/deliverables/actions";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Props = {
  orgId: string;
  clientId: string;
  month: string;
  verticalSlug: "smm_freelance" | "smm_agency";
};

export function AddDeliverableRow({ orgId, clientId, month, verticalSlug }: Props) {
  const vertical = useVerticalConfig();
  const router = useRouter();
  const [type, setType] = useState(vertical.deliverables.defaultDeliverableTypes[0]?.key ?? "");
  const [title, setTitle] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleAdd = () => {
    if (!type) return;
    // Parse YYYY-MM-DD (or YYYY-MM) as local calendar month — avoid UTC shift from `new Date(isoString)`
    const monthDate = (() => {
      const parts = month.split("-").map(Number);
      const y = parts[0];
      const mo = parts[1];
      if (Number.isFinite(y) && Number.isFinite(mo) && mo >= 1 && mo <= 12) {
        return new Date(y, mo - 1, 1);
      }
      return new Date();
    })();
    setError(null);
    startTransition(async () => {
      try {
        await createDeliverable({ orgId, clientId, month: monthDate, type, title, dueDate: dueDate || null, vertical: verticalSlug });
        toast.success("Deliverable added");
        setTitle("");
        setDueDate("");
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to add deliverable");
        toast.error("Something went wrong", { description: "Please try again." });
      }
    });
  };

  return (
    <div className="mt-1.5 flex items-center gap-2 rounded-lg border border-dashed border-border px-3 py-2">
      <Select value={type} onValueChange={setType}>
        <SelectTrigger className="h-8 w-[140px] text-[12px]" aria-label="Deliverable type">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {vertical.deliverables.defaultDeliverableTypes.map((t) => (
            <SelectItem key={t.key} value={t.key}>{t.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder={vertical.deliverables.deliverableLabel}
        className="h-8 flex-1 text-[13px]"
      />
      <Input
        type="date"
        value={dueDate}
        onChange={(e) => setDueDate(e.target.value)}
        className="h-8 w-[130px] text-[13px]"
      />
      <Button size="sm" disabled={isPending} onClick={handleAdd}>
        {isPending ? "···" : "Add"}
      </Button>
      {error && <span className="text-[12px] text-danger">{error}</span>}
    </div>
  );
}
