"use client";

import React, { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { StatusDropdown } from "./StatusDropdown";
import {
  deleteDeliverable,
  restoreDeliverable,
  updateDeliverable,
  updateDeliverableAssignee,
  sendForApproval,
} from "@/lib/deliverables/actions";
import { toast } from "sonner";
import { Pencil, Send, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { AnyVerticalConfig } from "@/lib/vertical-config";
import type { DeliverableWithClient, TeamMemberRow } from "@/lib/database.types";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { ClientAvatar } from "@/components/shared/ClientAvatar";

export function DeliverableEditDialog({
  open,
  onOpenChange,
  deliverableId,
  orgId,
  initialTitle,
  initialType,
  initialDueDate,
  initialPublishDate,
  vertical,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  deliverableId: string;
  orgId: string;
  initialTitle: string;
  initialType: string;
  initialDueDate: string | null;
  initialPublishDate?: string | null;
  vertical: AnyVerticalConfig;
}) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [type, setType] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [publishDate, setPublishDate] = useState("");
  const [isPending, startTransition] = useTransition();

  const typeOptions = useMemo(() => {
    const base = vertical.deliverables.defaultDeliverableTypes;
    if (base.some((t) => t.key === initialType)) return base;
    return [{ key: initialType, label: initialType, icon: "" }, ...base];
  }, [vertical.deliverables.defaultDeliverableTypes, initialType]);

  useEffect(() => {
    if (open) {
      setTitle(initialTitle);
      setType(initialType);
      setDueDate(initialDueDate ? initialDueDate.slice(0, 10) : "");
      setPublishDate(initialPublishDate ? initialPublishDate.slice(0, 10) : "");
    }
  }, [open, initialTitle, initialType, initialDueDate, initialPublishDate]);

  const handleSave = () => {
    if (!type) return;
    startTransition(async () => {
      const result = await updateDeliverable({
        orgId,
        deliverableId,
        title: title.trim() || type,
        type,
        dueDate: dueDate.trim() ? dueDate : "",
        publishDate: publishDate.trim() ? publishDate : "",
      });
      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      toast.success("Deliverable updated");
      onOpenChange(false);
      router.refresh();
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="sm" className="gap-0 p-0">
        <DialogHeader>
          <DialogTitle>Edit deliverable</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-3 px-6 py-4">
          <div className="flex flex-col gap-1.5">
            <span className="text-[11px] font-medium uppercase tracking-wider text-txt-hint">Title</span>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="h-9 text-[13px]"
              placeholder={vertical.deliverables.deliverableLabel}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <span className="text-[11px] font-medium uppercase tracking-wider text-txt-hint">Type</span>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger className="h-9 text-[13px]" aria-label="Deliverable type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {typeOptions.map((t) => (
                  <SelectItem key={t.key} value={t.key}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <span className="text-[11px] font-medium uppercase tracking-wider text-txt-hint">Due date</span>
            <Input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="h-9 text-[13px]"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <span className="text-[11px] font-medium uppercase tracking-wider text-txt-hint">Publish date</span>
            <Input
              type="date"
              value={publishDate}
              onChange={(e) => setPublishDate(e.target.value)}
              className="h-9 text-[13px]"
            />
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="secondary" onClick={() => onOpenChange(false)} disabled={isPending}>
            Cancel
          </Button>
          <Button type="button" onClick={handleSave} disabled={isPending || !type}>
            {isPending ? "Saving…" : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

type Props = {
  deliverable: DeliverableWithClient;
  orgId: string;
  vertical: AnyVerticalConfig;
  verticalSlug: "smm_freelance" | "smm_agency";
  index: number;
  teamMembers?: Pick<TeamMemberRow, "id" | "name" | "email" | "role">[];
};

export function DeliverableRow({ deliverable, orgId, vertical, verticalSlug, index, teamMembers }: Props) {
  const [editOpen, setEditOpen] = useState(false);
  const [isDeleting, startDeleteTransition] = useTransition();
  const [isSending, startSending] = useTransition();

  const isResend = deliverable.status === "pending_approval" && !!deliverable.approval_sent_at;
  const showSendButton = deliverable.status === "in_progress" || isResend;

  const handleSend = () => {
    startSending(async () => {
      const result = await sendForApproval(deliverable.id, orgId);
      if ("error" in result) {
        toast.error("Could not send for approval", { description: result.error });
        return;
      }
      if (result.data.contactEmail) {
        toast.success(isResend ? "Approval request resent" : "Approval request sent", {
          description: `Sent to ${result.data.contactEmail}`,
        });
      } else {
        navigator.clipboard.writeText(result.data.approvalUrl).catch(() => {});
        toast.success("Link copied", { description: "No email on file — share the link manually." });
      }
    });
  };

  const handleDelete = () => {
    startDeleteTransition(async () => {
      try {
        await deleteDeliverable({ deliverableId: deliverable.id, orgId });
        toast.success("Deliverable deleted", {
          action: { label: "Undo", onClick: () => restoreDeliverable({ deliverableId: deliverable.id, orgId }) },
          duration: 5000,
        });
      } catch { toast.error("Something went wrong", { description: "Please try again." }); }
    });
  };

  const typeLabel =
    vertical.deliverables.defaultDeliverableTypes.find((t) => t.key === deliverable.type)?.label ??
    deliverable.type;
  const title = deliverable.title || typeLabel;
  const editTitle = deliverable.title || typeLabel;
  const dueDateLabel = deliverable.due_date
    ? (() => {
        const [y, m, d] = (deliverable.due_date as string).split('-');
        return new Date(Number(y), Number(m) - 1, Number(d)).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
      })()
    : 'No due date';
  const isPastDue = deliverable.due_date && new Date(deliverable.due_date) < new Date() && deliverable.status !== "published";
  const leftBorderClass =
    deliverable.status === "pending_approval"
      ? "border-l-2 border-l-[rgba(250,204,21,0.25)]"
      : isPastDue
      ? "border-l-2 border-l-[rgba(248,113,113,0.25)]"
      : "";

  return (
    <motion.div
      initial={{ opacity: 0, x: -6 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.25, ease: "easeOut", delay: index * 0.04 }}
      className={`group flex items-center gap-3 rounded-lg border border-border bg-surface px-3 py-2 text-[14px] text-txt-secondary transition-colors hover:bg-[#F0EBE3] ${leftBorderClass}`}
    >
      <div className="w-28 text-[12px] font-medium uppercase tracking-[0.05em] text-txt-hint">
        {typeLabel}
      </div>
      <div className="flex-1 text-txt-primary">{title}</div>
      <div className="w-40">
        <StatusDropdown
          deliverableId={deliverable.id}
          orgId={orgId}
          verticalSlug={verticalSlug}
          status={deliverable.status}
        />
      </div>
      <div className={`w-24 font-mono text-[12px] tabular-nums ${isPastDue ? "text-danger" : "text-txt-muted"}`}>
        {dueDateLabel}
      </div>
      {vertical.deliverables.showAssignee && (
        <AssigneePicker
          deliverableId={deliverable.id}
          orgId={orgId}
          currentName={deliverable.team_members?.name}
          currentId={deliverable.assignee_id ?? undefined}
          teamMembers={teamMembers ?? []}
        />
      )}

      <div className="ml-1 flex shrink-0 items-center gap-0.5">
        {showSendButton && (
          <button
            type="button"
            disabled={isSending}
            onClick={handleSend}
            className="flex items-center gap-1 text-[11px] font-medium text-brand-rose opacity-0 transition-opacity group-hover:opacity-100 focus:opacity-100 focus:outline-none hover:text-brand-rose-deep disabled:opacity-40 rounded px-1"
            aria-label={isResend ? "Resend approval request" : "Send for approval"}
          >
            <Send className="h-3 w-3" />
            {isSending ? "…" : isResend ? "Resend" : "Send"}
          </button>
        )}
        <button
          type="button"
          onClick={() => setEditOpen(true)}
          className="text-txt-muted opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100 focus:opacity-100 focus:outline-none focus-visible:ring-1 focus-visible:ring-brand-rose/50 rounded hover:text-txt-secondary"
          aria-label="Edit deliverable"
        >
          <Pencil className="h-3.5 w-3.5" />
        </button>
        <AlertDialog>
        <AlertDialogTrigger asChild>
          <button
            type="button"
            disabled={isDeleting}
            className="text-txt-muted opacity-0 transition-opacity group-hover:opacity-100 focus:opacity-100 focus:outline-none focus-visible:ring-1 focus-visible:ring-danger/50 rounded hover:text-danger disabled:opacity-40"
            aria-label="Delete deliverable"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this deliverable?</AlertDialogTitle>
            <AlertDialogDescription>
              {title} will be permanently removed. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={isDeleting}>
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      </div>

      <DeliverableEditDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        deliverableId={deliverable.id}
        orgId={orgId}
        initialTitle={editTitle}
        initialType={deliverable.type}
        initialDueDate={deliverable.due_date}
        initialPublishDate={(deliverable as any).publish_date ?? null}
        vertical={vertical}
      />
    </motion.div>
  );
}

function AssigneePicker({ deliverableId, orgId, currentName, currentId, teamMembers }: {
  deliverableId: string;
  orgId: string;
  currentName?: string;
  currentId?: string;
  teamMembers: Pick<TeamMemberRow, "id" | "name">[];
}) {
  const [, startT] = React.useTransition();
  const [open, setOpen] = React.useState(false);

  const assign = (id: string | null, name: string) => {
    setOpen(false);
    startT(async () => {
      try {
        await updateDeliverableAssignee({ deliverableId, assigneeId: id, orgId });
        toast.success(`Assigned to ${name}`);
      } catch {
        toast.error("Something went wrong");
      }
    });
  };

  return (
    <div className="w-32">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            className="flex items-center gap-1.5 text-[12px] text-txt-muted transition-colors hover:text-txt-secondary"
            onClick={(e) => e.stopPropagation()}
          >
            {currentName ? (
              <>
                <ClientAvatar name={currentName} size="sm" tag="active" />
                <span className="truncate">{currentName}</span>
              </>
            ) : (
              <span className="text-[rgba(255,255,255,0.25)]">+ Assign</span>
            )}
          </button>
        </PopoverTrigger>
        <PopoverContent align="end" className="w-48 p-1">
          {teamMembers.map((m) => (
            <button
              key={m.id}
              type="button"
              className="flex w-full items-center gap-2 rounded-[5px] px-2 py-1.5 text-left text-[13px] text-txt-secondary transition-colors hover:bg-[#F0EBE3] hover:text-txt-primary"
              onClick={() => assign(m.id, m.name)}
            >
              <ClientAvatar name={m.name} size="sm" />
              {m.name}
            </button>
          ))}
          {currentId && (
            <>
              <div className="my-1 h-px bg-border" />
              <button
                type="button"
                className="flex w-full items-center px-2 py-1.5 text-left text-[13px] text-txt-muted transition-colors hover:text-txt-primary"
                onClick={() => assign(null, "nobody")}
              >
                Unassign
              </button>
            </>
          )}
        </PopoverContent>
      </Popover>
    </div>
  );
}
