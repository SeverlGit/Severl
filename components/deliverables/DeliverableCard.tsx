"use client";

import React, { useState } from "react";
import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import type { AnyVerticalConfig } from "@/lib/vertical-config";
import type { DeliverableStatus } from "@/lib/types";
import { DeliverableStatusPill } from "@/components/dashboard/DeliverableStatusPill";
import { DeliverableEditDialog } from "./DeliverableRow";
import { Pencil } from "lucide-react";

type Props = {
  id: string;
  orgId: string;
  brandName: string;
  type: string;
  title: string;
  status: string;
  dueDate?: string | null;
  assigneeName?: string | null;
  vertical: AnyVerticalConfig;
  /** When true, drag-and-drop is disabled (e.g. during status update). */
  dragDisabled?: boolean;
};

export function DeliverableCard({
  id,
  orgId,
  brandName,
  type,
  title,
  status,
  dueDate,
  assigneeName,
  vertical,
  dragDisabled = false,
}: Props) {
  const [editOpen, setEditOpen] = useState(false);
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id,
    disabled: dragDisabled,
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    cursor: isDragging ? "grabbing" : "grab",
  } as React.CSSProperties;

  const typeLabel =
    vertical.deliverables.defaultDeliverableTypes.find((t) => t.key === type)?.label ??
    type;

  const displayTitle = title || typeLabel;
  const isPastDue = dueDate && new Date(dueDate) < new Date();

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      className={`group relative rounded-lg border border-border bg-brand-navy text-[13px] text-txt-secondary transition-colors ${
        isDragging ? "scale-[1.02] opacity-50" : "hover:border-border-hover"
      }`}
    >
      <button
        type="button"
        className="absolute right-2 top-2 z-10 rounded p-0.5 text-txt-hint opacity-0 transition-opacity hover:text-txt-secondary group-hover:opacity-100"
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => {
          e.stopPropagation();
          setEditOpen(true);
        }}
        aria-label="Edit deliverable"
      >
        <Pencil className="h-3.5 w-3.5" />
      </button>
      <div {...listeners} className="cursor-grab px-3 py-2 active:cursor-grabbing">
        <div className="mb-1 flex items-center justify-between">
          <span className="max-w-[130px] truncate text-[14px] text-txt-muted">
            {brandName}
          </span>
        </div>
        <div className="mb-1 flex items-center gap-1">
          <span className="rounded-md border border-border bg-border px-1.5 py-0.5 text-[14px] text-txt-secondary">
            {typeLabel}
          </span>
          <DeliverableStatusPill status={status as DeliverableStatus} label={status} />
        </div>
        <div className="line-clamp-2 text-[14px] text-txt-primary">{displayTitle}</div>
        <div className="mt-1 flex items-center justify-between">
          <span
            className={`text-[14px] ${
              isPastDue ? "text-danger" : "text-txt-muted"
            }`}
          >
            {dueDate
              ? new Date(dueDate).toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                })
              : "No due date"}
          </span>
          {vertical.deliverables.showAssignee && assigneeName && (
            <span className="text-[14px] text-txt-muted">{assigneeName}</span>
          )}
        </div>
      </div>
      <DeliverableEditDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        deliverableId={id}
        orgId={orgId}
        initialTitle={displayTitle}
        initialType={type}
        initialDueDate={dueDate ?? null}
        vertical={vertical}
      />
    </div>
  );
}
