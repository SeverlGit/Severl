"use client";

import React, { useState } from "react";
import type { DeliverableWithClient } from "@/lib/database.types";
import type { AnyVerticalConfig } from "@/lib/vertical-config";
import { DeliverableEditDialog } from "./DeliverableRow";
import { DeliverableStatusPill } from "@/components/dashboard/DeliverableStatusPill";
import type { DeliverableStatus } from "@/lib/types";

type Props = {
  deliverables: DeliverableWithClient[];
  orgId: string;
  vertical: AnyVerticalConfig;
  currentMonth: Date;
};

/** Returns the 7 Date objects for the week containing `date` (Mon–Sun). */
function getWeekDays(date: Date): Date[] {
  const day = date.getDay(); // 0 = Sun
  const monday = new Date(date);
  monday.setDate(date.getDate() - ((day + 6) % 7));
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
}

/** Number of weeks in the calendar for a given month (Mon-anchored). */
function getCalendarWeeks(month: Date): Date[][] {
  const year = month.getFullYear();
  const m = month.getMonth();
  const firstDay = new Date(year, m, 1);
  const lastDay = new Date(year, m + 1, 0);

  const weeks: Date[][] = [];
  let current = new Date(firstDay);
  // Rewind to Monday of the first week
  const dow = current.getDay();
  current.setDate(current.getDate() - ((dow + 6) % 7));

  while (current <= lastDay || weeks.length === 0) {
    weeks.push(
      Array.from({ length: 7 }, (_, i) => {
        const d = new Date(current);
        d.setDate(current.getDate() + i);
        return d;
      })
    );
    current.setDate(current.getDate() + 7);
    if (weeks.length > 6) break; // safety
  }
  return weeks;
}

function toYMD(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const STATUS_DOT: Record<string, string> = {
  not_started: "bg-txt-hint",
  in_progress: "bg-brand-rose",
  pending_approval: "bg-warning",
  approved: "bg-success",
  published: "bg-success",
};

type EditTarget = {
  id: string;
  title: string;
  type: string;
  dueDate: string | null;
  publishDate: string | null;
};

export function CalendarView({ deliverables, orgId, vertical, currentMonth }: Props) {
  const [editTarget, setEditTarget] = useState<EditTarget | null>(null);

  const weeks = getCalendarWeeks(currentMonth);
  const today = toYMD(new Date());

  // Index deliverables by publish_date (fallback: due_date, then unscheduled)
  const byDate: Record<string, DeliverableWithClient[]> = {};
  const unscheduled: DeliverableWithClient[] = [];

  for (const d of deliverables) {
    const key = (d as any).publish_date ?? d.due_date;
    if (key) {
      if (!byDate[key]) byDate[key] = [];
      byDate[key].push(d);
    } else {
      unscheduled.push(d);
    }
  }

  const typeLabel = (type: string) =>
    vertical.deliverables.defaultDeliverableTypes.find((t) => t.key === type)?.label ?? type;

  const openEdit = (d: DeliverableWithClient) => {
    setEditTarget({
      id: d.id,
      title: d.title || typeLabel(d.type),
      type: d.type,
      dueDate: d.due_date,
      publishDate: (d as any).publish_date ?? null,
    });
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Calendar grid */}
      <div className="overflow-x-auto rounded-lg border border-border bg-surface">
        <table className="w-full min-w-[700px] table-fixed border-collapse text-[13px]">
          <thead>
            <tr>
              {DAY_LABELS.map((label) => (
                <th
                  key={label}
                  className="border-b border-border px-2 py-2 text-center text-[11px] font-semibold uppercase tracking-wider text-txt-muted"
                >
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {weeks.map((week, wi) => (
              <tr key={wi} className="align-top">
                {week.map((day, di) => {
                  const ymd = toYMD(day);
                  const isCurrentMonth = day.getMonth() === currentMonth.getMonth();
                  const isToday = ymd === today;
                  const items = byDate[ymd] ?? [];

                  return (
                    <td
                      key={di}
                      className={`min-h-[88px] border border-border px-1.5 py-1.5 align-top ${
                        isCurrentMonth ? "" : "bg-surface opacity-40"
                      }`}
                    >
                      {/* Day number */}
                      <div
                        className={`mb-1 flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-semibold ${
                          isToday
                            ? "bg-brand-rose text-white"
                            : "text-txt-muted"
                        }`}
                      >
                        {day.getDate()}
                      </div>

                      {/* Deliverable chips */}
                      <div className="flex flex-col gap-0.5">
                        {items.map((d) => (
                          <button
                            key={d.id}
                            type="button"
                            onClick={() => openEdit(d)}
                            className="flex items-center gap-1 rounded px-1 py-0.5 text-left text-[11px] text-txt-secondary transition-colors hover:bg-surface-hover hover:text-txt-primary"
                          >
                            <span
                              className={`inline-block h-1.5 w-1.5 shrink-0 rounded-full ${
                                STATUS_DOT[d.status] ?? "bg-border"
                              }`}
                            />
                            <span className="truncate">
                              {d.clients?.brand_name
                                ? `${d.clients.brand_name} · `
                                : ""}
                              {typeLabel(d.type)}
                            </span>
                          </button>
                        ))}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Unscheduled deliverables */}
      {unscheduled.length > 0 && (
        <div className="rounded-lg border border-border bg-surface px-4 py-3">
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-txt-muted">
            Unscheduled ({unscheduled.length})
          </p>
          <div className="flex flex-wrap gap-2">
            {unscheduled.map((d) => (
              <button
                key={d.id}
                type="button"
                onClick={() => openEdit(d)}
                className="flex items-center gap-1.5 rounded-md border border-border bg-border px-2 py-1 text-[12px] text-txt-secondary transition-colors hover:bg-surface-hover hover:text-txt-primary"
              >
                <span
                  className={`inline-block h-1.5 w-1.5 shrink-0 rounded-full ${
                    STATUS_DOT[d.status] ?? "bg-border"
                  }`}
                />
                {d.clients?.brand_name ? `${d.clients.brand_name} · ` : ""}
                {typeLabel(d.type)}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Edit dialog */}
      {editTarget && (
        <DeliverableEditDialog
          open
          onOpenChange={(open) => !open && setEditTarget(null)}
          deliverableId={editTarget.id}
          orgId={orgId}
          initialTitle={editTarget.title}
          initialType={editTarget.type}
          initialDueDate={editTarget.dueDate}
          initialPublishDate={editTarget.publishDate}
          vertical={vertical}
        />
      )}
    </div>
  );
}
