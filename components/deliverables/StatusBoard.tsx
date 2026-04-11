"use client";

import React, { useState } from "react";
import {
  DndContext,
  closestCenter,
  type DragEndEvent,
  useDroppable,
} from "@dnd-kit/core";
import { useTransition } from "react";
import { useVerticalConfig, type AnyVerticalConfig } from "@/lib/vertical-config";
import type { DeliverableWithClient } from "@/lib/database.types";
import { DeliverableCard } from "./DeliverableCard";
import { EmptyState } from "@/components/shared/EmptyState";
import { FolderOpen, Send, CheckSquare, Square } from "lucide-react";
import { updateDeliverableStatus } from "@/lib/deliverables/actions";
import { sendBatchApproval } from "@/lib/deliverables/batch-approval-actions";
import { toast } from "sonner";

type Props = {
  orgId: string;
  verticalSlug: "smm_freelance" | "smm_agency";
  deliverables: DeliverableWithClient[];
};

export type StatusBoardProps = Props;

const STATUS_KEYS = [
  "not_started",
  "in_progress",
  "pending_approval",
  "approved",
  "published",
] as const;

function Column({
  id,
  label,
  isWithClient,
  items,
  vertical,
  orgId,
  dragDisabled,
  selected,
  onToggleSelect,
}: {
  id: string;
  label: string;
  isWithClient?: boolean;
  items: DeliverableWithClient[];
  vertical: AnyVerticalConfig;
  orgId: string;
  dragDisabled: boolean;
  selected: Set<string>;
  onToggleSelect: (id: string) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id });

  const baseHeader =
    "flex items-center justify-between border-b border-border px-2.5 py-2";
  const headerClass = isWithClient
    ? `${baseHeader} bg-warning-bg text-warning border-b-2 border-warning/20`
    : baseHeader;

  const badge =
    "ml-1 rounded-full bg-border px-2 py-0.5 text-[13px] text-txt-secondary";

  const zoneBase =
    "flex flex-col gap-2 rounded-b-lg px-2.5 py-2 min-h-[400px] transition-colors border border-border border-t-0";
  const zoneClass = isOver
    ? `${zoneBase} bg-surface border-2 border-dashed border-border-strong`
    : items.length === 0
    ? `${zoneBase} bg-surface`
    : `${zoneBase} bg-surface`;

  return (
    <div className="flex flex-col rounded-lg">
      <div className={headerClass}>
        <span className="text-[13px] font-medium">
          {isWithClient ? "With client" : label}
        </span>
        <span className={badge}>{items.length}</span>
      </div>
      <div ref={setNodeRef} className={zoneClass}>
        {items.length === 0 ? (
          <EmptyState
            icon={<FolderOpen strokeWidth={1.25} />}
            title="No deliverables"
            description={`No deliverables in ${label.toLowerCase()}.`}
            action={{ label: "Add deliverable", href: "/deliverables" }}
            className="flex-1 py-8"
          />
        ) : (
        items.map((d) => (
          <div key={d.id} className="relative">
            {d.status === "in_progress" && (
              <button
                type="button"
                onClick={() => onToggleSelect(d.id)}
                className="absolute left-2 top-2 z-20 text-txt-hint opacity-0 transition-opacity hover:text-brand-rose group-hover:opacity-100 focus:opacity-100"
                aria-label={selected.has(d.id) ? "Deselect" : "Select for batch"}
              >
                {selected.has(d.id) ? (
                  <CheckSquare className="h-3.5 w-3.5 text-brand-rose" />
                ) : (
                  <Square className="h-3.5 w-3.5" />
                )}
              </button>
            )}
            <DeliverableCard
              id={d.id}
              orgId={orgId}
              brandName={d.clients?.brand_name ?? "Unknown"}
              type={d.type}
              title={d.title}
              status={d.status}
              dueDate={d.due_date}
              publishDate={(d as any).publish_date ?? null}
              assigneeName={d.team_members?.name}
              approvalSentAt={d.approval_sent_at ?? null}
              contactEmail={d.clients?.contact_email ?? null}
              revisionRound={(d as any).revision_round ?? 0}
              vertical={vertical}
              dragDisabled={dragDisabled}
            />
          </div>
        ))
        )}
      </div>
    </div>
  );
}

export function StatusBoard({ orgId, verticalSlug, deliverables }: Props) {
  const vertical = useVerticalConfig();
  const [isPending, startTransition] = useTransition();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [isSendingBatch, startBatchTransition] = useTransition();

  const byStatus: Record<string, DeliverableWithClient[]> = {
    not_started: [],
    in_progress: [],
    pending_approval: [],
    approved: [],
    published: [],
  };

  for (const d of deliverables) {
    if (byStatus[d.status]) {
      byStatus[d.status].push(d);
    }
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    const deliverableId = active.id as string;
    const newStatus = over.id as (typeof STATUS_KEYS)[number];
    const current = deliverables.find((d) => d.id === deliverableId);
    if (!current || current.status === newStatus) return;

    startTransition(async () => {
      await updateDeliverableStatus({
        deliverableId,
        newStatus,
        orgId,
        vertical: verticalSlug,
      });
    });
  };

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Only in_progress deliverables are eligible for batch send
  const selectedInProgress = deliverables.filter(
    (d) => selected.has(d.id) && d.status === "in_progress"
  );

  // All selected must be the same client
  const selectedClientIds = new Set(selectedInProgress.map((d) => d.client_id));
  const canBatchSend = selectedInProgress.length >= 2 && selectedClientIds.size === 1;

  const handleBatchSend = () => {
    startBatchTransition(async () => {
      const result = await sendBatchApproval({
        deliverableIds: selectedInProgress.map((d) => d.id),
        orgId,
      });
      if ("error" in result) {
        toast.error("Could not send batch approval", { description: result.error });
        return;
      }
      if (result.data.contactEmail) {
        toast.success("Batch approval sent", {
          description: `Sent to ${result.data.contactEmail}`,
        });
      } else {
        navigator.clipboard.writeText(result.data.batchUrl).catch(() => {});
        toast.success("Batch link copied", {
          description: "No email on file — share the link manually.",
        });
      }
      setSelected(new Set());
    });
  };

  return (
    <div className="flex flex-col gap-3">
      {/* Batch action toolbar */}
      {selected.size > 0 && (
        <div className="flex items-center justify-between rounded-md border border-border bg-surface px-3 py-2">
          <span className="text-[13px] text-txt-secondary">
            {selected.size} selected
            {!canBatchSend && selectedInProgress.length >= 2 && selectedClientIds.size > 1 && (
              <span className="ml-1 text-txt-muted">(must be the same client)</span>
            )}
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSelected(new Set())}
              className="text-[12px] text-txt-muted hover:text-txt-secondary"
            >
              Clear
            </button>
            {canBatchSend && (
              <button
                type="button"
                disabled={isSendingBatch}
                onClick={handleBatchSend}
                className="flex items-center gap-1.5 rounded-md bg-brand-rose px-3 py-1.5 text-[12px] font-medium text-white hover:bg-brand-rose-deep disabled:opacity-50"
              >
                <Send className="h-3 w-3" />
                {isSendingBatch ? "Sending…" : "Send batch for approval"}
              </button>
            )}
          </div>
        </div>
      )}

      <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-5">
          {STATUS_KEYS.map((statusKey) => (
            <Column
              key={statusKey}
              id={statusKey}
              label={vertical.deliverables.statusLabels[statusKey]}
              isWithClient={statusKey === "pending_approval"}
              items={byStatus[statusKey]}
              vertical={vertical}
              orgId={orgId}
              dragDisabled={isPending}
              selected={selected}
              onToggleSelect={toggleSelect}
            />
          ))}
        </div>
      </DndContext>
    </div>
  );
}

