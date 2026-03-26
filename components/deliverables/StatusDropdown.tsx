"use client";

import React, { useTransition } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useVerticalConfig } from "@/lib/vertical-config";
import { updateDeliverableStatus } from "@/lib/deliverables/actions";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Props = {
  deliverableId: string;
  orgId: string;
  verticalSlug: "smm_freelance" | "smm_agency";
  status: "not_started" | "in_progress" | "pending_approval" | "approved" | "published";
};

const STATUS_KEYS = [
  "not_started",
  "in_progress",
  "pending_approval",
  "approved",
  "published",
] as const;

const statusDot: Record<string, string> = {
  not_started: "bg-txt-hint",
  in_progress: "bg-[#6EE7B7]",
  pending_approval: "bg-[#facc15]",
  approved: "bg-[#6EE7B7]",
  published: "bg-[#6EE7B7]",
};

export function StatusDropdown({ deliverableId, orgId, verticalSlug, status }: Props) {
  const vertical = useVerticalConfig();
  const router = useRouter();
  const [current, setCurrent] = React.useState(status);
  const [isPending, startTransition] = useTransition();

  const handleChange = (next: string) => {
    const prev = current;
    const nextStatus = next as Props["status"];
    setCurrent(nextStatus);
    startTransition(async () => {
      try {
        await updateDeliverableStatus({
          deliverableId,
          newStatus: nextStatus,
          orgId,
          vertical: verticalSlug,
        });
        toast.success(`Status updated to ${vertical.deliverables.statusLabels[nextStatus]}`);
        router.refresh();
      } catch {
        setCurrent(prev);
        toast.error("Something went wrong", { description: "Please try again." });
      }
    });
  };

  return (
    <motion.div
      key={current}
      animate={{ scale: [1, 1.03, 1] }}
      transition={{ duration: 0.2 }}
      className="inline-flex"
    >
      <Select value={current} onValueChange={handleChange} disabled={isPending}>
        <SelectTrigger className="h-7 w-[150px] text-[12px]" aria-label="Deliverable status">
          <div className="flex items-center gap-2">
            <span className={`h-2 w-2 rounded-full ${statusDot[current]}`} />
            <SelectValue />
          </div>
        </SelectTrigger>
        <SelectContent>
          {STATUS_KEYS.map((key) => (
            <SelectItem key={key} value={key}>
              <div className="flex items-center gap-2">
                <span className={`h-2 w-2 rounded-full ${statusDot[key]}`} />
                {vertical.deliverables.statusLabels[key]}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </motion.div>
  );
}
