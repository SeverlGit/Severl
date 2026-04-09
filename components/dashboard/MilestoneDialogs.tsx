"use client";

import React, { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogClose, DialogFooter } from "@/components/ui/dialog";
import { markUIMetaSeen } from "@/lib/onboarding-actions";
import type { OrgUIMeta } from "@/lib/database.types";
import type { UIMetrics } from "@/lib/tour-context";
import { PartyPopper, Users, FileText, CheckCircle2 } from "lucide-react";

type Milestone = {
  key: keyof OrgUIMeta;
  title: string;
  description: string;
  icon: React.ElementType;
  color: string;
};

// Check these in priority order
const MILESTONES: Milestone[] = [
  {
    key: "has_seen_first_client",
    title: "First client added!",
    description: "Awesome job. Now that you have a client, you can set up their monthly deliverables or generate your first retainer invoice.",
    icon: Users,
    color: "bg-success/15 text-success",
  },
  {
    key: "has_seen_first_deliverable",
    title: "First task tracked!",
    description: "You're getting organized. Drag and drop deliverables across the status board to easily track what's due.",
    icon: CheckCircle2,
    color: "bg-brand-rose-dim text-brand-rose-deep",
  },
  {
    key: "has_seen_first_invoice",
    title: "First invoice generated!",
    description: "Getting paid 💸. You can download this invoice as a PDF, or mark it as 'sent' and 'paid' to track your revenue.",
    icon: FileText,
    color: "bg-brand-plum-dim text-brand-plum-deep",
  },
];

type Props = {
  uiMeta: OrgUIMeta;
  metrics: UIMetrics;
};

export function MilestoneDialogs({ uiMeta, metrics }: Props) {
  const [activeMilestone, setActiveMilestone] = useState<Milestone | null>(null);

  // Evaluate which milestone (if any) should be shown
  useEffect(() => {
    // If the modal is already open, do not interrupt it
    if (activeMilestone) return;

    // Check conditions sequentially
    if (metrics.clients > 0 && !uiMeta.has_seen_first_client) {
      setActiveMilestone(MILESTONES[0]);
    } else if (metrics.deliverables > 0 && !uiMeta.has_seen_first_deliverable) {
      setActiveMilestone(MILESTONES[1]);
    } else if (metrics.invoices > 0 && !uiMeta.has_seen_first_invoice) {
      setActiveMilestone(MILESTONES[2]);
    }
  }, [metrics, uiMeta, activeMilestone]);

  const handleDismiss = async () => {
    if (!activeMilestone) return;
    const key = activeMilestone.key;
    setActiveMilestone(null);
    await markUIMetaSeen(key);
  };

  if (!activeMilestone) return null;

  const Icon = activeMilestone.icon;

  return (
    <Dialog open={!!activeMilestone} onOpenChange={(v) => { if (!v) handleDismiss(); }}>
      <DialogContent size="sm" className="p-6 text-center flex flex-col items-center">
        <div className="absolute -top-6 left-1/2 -translate-x-1/2 flex items-center justify-center h-14 w-14 rounded-full bg-panel border-4 border-panel shadow-md">
           <PartyPopper className="h-6 w-6 text-warning" />
        </div>

        <div className={`mt-4 flex h-12 w-12 items-center justify-center rounded-2xl mb-4 ${activeMilestone.color}`}>
          <Icon className="h-6 w-6" strokeWidth={2} />
        </div>
        
        <DialogTitle className="text-lg font-semibold text-txt-primary">
          {activeMilestone.title}
        </DialogTitle>
        <DialogDescription className="mt-2 text-[13px] leading-relaxed text-txt-muted max-w-[280px]">
          {activeMilestone.description}
        </DialogDescription>

        <DialogFooter className="mt-6 w-full border-t-0 p-0 sm:justify-center">
          <button
            onClick={handleDismiss}
            className="w-full rounded-md bg-success py-2.5 text-sm font-medium text-white transition-colors hover:bg-success/90"
          >
            Got it, let's go
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
