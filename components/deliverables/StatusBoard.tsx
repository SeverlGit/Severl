"use client";

import React from "react";
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
import { FolderOpen } from "lucide-react";
import { updateDeliverableStatus } from "@/lib/deliverables/actions";

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
}: {
  id: string;
  label: string;
  isWithClient?: boolean;
  items: DeliverableWithClient[];
  vertical: AnyVerticalConfig;
  orgId: string;
  dragDisabled: boolean;
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
          <DeliverableCard
            key={d.id}
            id={d.id}
            orgId={orgId}
            brandName={d.clients?.brand_name ?? "Unknown"}
            type={d.type}
            title={d.title}
            status={d.status}
            dueDate={d.due_date}
            assigneeName={d.team_members?.name}
            vertical={vertical}
            dragDisabled={dragDisabled}
          />
        ))
        )}
      </div>
    </div>
  );
}

export function StatusBoard({ orgId, verticalSlug, deliverables }: Props) {
  const vertical = useVerticalConfig();
  const [isPending, startTransition] = useTransition();

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

  return (
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
          />
        ))}
      </div>
    </DndContext>
  );
}

