"use client";

/**
 * Design: command-center archetype — centered modal for team member CRUD
 * Distinction: add/edit forms with standard label/input styling; member list with avatar
 * Rule-break: none — follows design.config interactive_states
 */

import React, { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  createTeamMember,
  updateTeamMember,
  deactivateTeamMember,
  reactivateTeamMember,
  getTeamMembersForOrg,
} from "@/lib/team/actions";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ClientAvatar } from "@/components/shared/ClientAvatar";
import type { TeamMemberRow } from "@/lib/database.types";
import { Pencil, UserPlus } from "lucide-react";
import { cn } from "@/lib/utils";

const ROLE_OPTIONS = [
  { value: "account_manager", label: "Account manager" },
  { value: "content_creator", label: "Content creator" },
  { value: "designer", label: "Designer" },
  { value: "strategist", label: "Strategist" },
  { value: "admin", label: "Admin" },
] as const;

const labelClass =
  "block text-[10px] uppercase tracking-wider font-medium text-txt-muted mb-1.5";
const inputClass =
  "bg-brand-navy border border-border rounded px-3 py-2 text-sm text-txt-primary placeholder:text-txt-hint focus:border-brand-mint focus:outline-none focus:ring-1 focus:ring-brand-mint/50 w-full";

type Member = Pick<
  TeamMemberRow,
  "id" | "name" | "email" | "role" | "active"
>;

type Props = {
  orgId: string;
  teamMembers?: Member[];
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

export function TeamManagementDialog({
  orgId,
  teamMembers: teamMembersProp,
  open: openProp,
  onOpenChange: onOpenChangeProp,
}: Props) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled =
    openProp !== undefined && onOpenChangeProp !== undefined;
  const open = isControlled ? openProp : internalOpen;
  const setOpen = (v: boolean) => {
    if (isControlled) onOpenChangeProp!(v);
    else setInternalOpen(v);
  };

  const [members, setMembers] = useState<Member[]>(teamMembersProp ?? []);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [addName, setAddName] = useState("");
  const [addEmail, setAddEmail] = useState("");
  const [addRole, setAddRole] = useState<string>("account_manager");
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editRole, setEditRole] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  useEffect(() => {
    if (teamMembersProp !== undefined) {
      setMembers(teamMembersProp);
    }
  }, [teamMembersProp]);

  useEffect(() => {
    if (!open) return;
    if (teamMembersProp !== undefined) return;
    let cancelled = false;
    setLoadingMembers(true);
    getTeamMembersForOrg(orgId)
      .then((data) => {
        if (!cancelled) setMembers(data);
      })
      .catch(() => {
        toast.error("Could not load team members");
      })
      .finally(() => {
        if (!cancelled) setLoadingMembers(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, orgId, teamMembersProp]);

  const refetchIfStandalone = () => {
    if (teamMembersProp === undefined) {
      getTeamMembersForOrg(orgId).then(setMembers);
    }
  };

  const resetAddForm = () => {
    setAddName("");
    setAddEmail("");
    setAddRole("account_manager");
    setShowAddForm(false);
    setError(null);
  };

  const startEdit = (
    m: Pick<TeamMemberRow, "id" | "name" | "email" | "role" | "active">
  ) => {
    setEditingId(m.id);
    setEditName(m.name);
    setEditEmail(m.email);
    setEditRole(m.role);
    setError(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setError(null);
  };

  const handleAdd = () => {
    if (!addName.trim() || !addEmail.trim() || !addRole.trim()) {
      setError("Name, email, and role are required.");
      return;
    }
    setError(null);
    startTransition(async () => {
      try {
        await createTeamMember({
          orgId,
          name: addName.trim(),
          email: addEmail.trim(),
          role: addRole,
        });
        toast.success("Team member added", {
          description: `${addName.trim()} has been added.`,
        });
        resetAddForm();
        router.refresh();
        refetchIfStandalone();
      } catch (e) {
        setError(
          e instanceof Error ? e.message : "Failed to add team member."
        );
        toast.error("Something went wrong", { description: "Please try again." });
      }
    });
  };

  const handleUpdate = () => {
    if (
      !editingId ||
      !editName.trim() ||
      !editEmail.trim() ||
      !editRole.trim()
    )
      return;
    setError(null);
    startTransition(async () => {
      try {
        await updateTeamMember({
          orgId,
          memberId: editingId,
          name: editName.trim(),
          email: editEmail.trim(),
          role: editRole,
        });
        toast.success("Team member updated", {
          description: `${editName.trim()} has been updated.`,
        });
        cancelEdit();
        router.refresh();
        refetchIfStandalone();
      } catch (e) {
        setError(
          e instanceof Error ? e.message : "Failed to update team member."
        );
        toast.error("Something went wrong", { description: "Please try again." });
      }
    });
  };

  const handleDeactivate = (memberId: string, name: string) => {
    startTransition(async () => {
      try {
        await deactivateTeamMember({ orgId, memberId });
        toast.success("Team member deactivated", {
          description: `${name} has been deactivated.`,
        });
        router.refresh();
        refetchIfStandalone();
      } catch {
        toast.error("Something went wrong", { description: "Please try again." });
      }
    });
  };

  const handleReactivate = (memberId: string, name: string) => {
    startTransition(async () => {
      try {
        await reactivateTeamMember({ orgId, memberId });
        toast.success("Team member reactivated", {
          description: `${name} is active again.`,
        });
        router.refresh();
        refetchIfStandalone();
      } catch {
        toast.error("Something went wrong", { description: "Please try again." });
      }
    });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (!v) {
          resetAddForm();
          cancelEdit();
        }
      }}
    >
      {!isControlled && (
        <DialogTrigger asChild>
          <Button variant="terminal" size="sm">
            Manage Team
          </Button>
        </DialogTrigger>
      )}
      <DialogContent size="md">
        <DialogHeader>
          <DialogTitle>Team members</DialogTitle>
          <DialogDescription>
            Add, edit, or deactivate team members. Inactive members won&apos;t
            appear in assignee dropdowns.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <h3 className="text-[10px] uppercase tracking-wider font-medium text-txt-muted">
              Members
            </h3>
            <Button
              variant="terminal"
              size="sm"
              onClick={() => {
                setShowAddForm(true);
                cancelEdit();
              }}
              disabled={showAddForm}
            >
              <UserPlus className="mr-1.5 h-3.5 w-3.5" />
              Add member
            </Button>
          </div>

          {showAddForm && (
            <div className="rounded-lg border border-border bg-brand-navy p-4">
              <h4 className="mb-3 text-[13px] font-medium text-txt-secondary">
                New member
              </h4>
              <div className="flex flex-col gap-3">
                <div>
                  <label className={labelClass}>Name *</label>
                  <Input
                    value={addName}
                    onChange={(e) => setAddName(e.target.value)}
                    placeholder="e.g. Jane Doe"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Email *</label>
                  <Input
                    type="email"
                    value={addEmail}
                    onChange={(e) => setAddEmail(e.target.value)}
                    placeholder="jane@agency.com"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Role *</label>
                  <Select value={addRole} onValueChange={setAddRole}>
                    <SelectTrigger className={inputClass}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ROLE_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={resetAddForm}
                    disabled={isPending}
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleAdd}
                    disabled={
                      isPending ||
                      !addName.trim() ||
                      !addEmail.trim()
                    }
                  >
                    {isPending ? "···" : "Add"}
                  </Button>
                </div>
              </div>
            </div>
          )}

          <div className="flex flex-col gap-1">
            {loadingMembers && teamMembersProp === undefined ? (
              <p className="py-6 text-center text-sm text-txt-muted">Loading team…</p>
            ) : members.length === 0 && !showAddForm ? (
              <p className="py-6 text-center text-sm text-txt-muted">
                No team members yet. Add one above.
              </p>
            ) : (
              members.map((m) => (
                <div
                  key={m.id}
                  className="rounded-lg border border-border bg-brand-navy px-3 py-2.5"
                >
                  {editingId === m.id ? (
                    <div className="flex flex-col gap-3">
                      <div>
                        <label className={labelClass}>Name</label>
                        <Input
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className={cn(inputClass, "h-8")}
                        />
                      </div>
                      <div>
                        <label className={labelClass}>Email</label>
                        <Input
                          type="email"
                          value={editEmail}
                          onChange={(e) => setEditEmail(e.target.value)}
                          className={cn(inputClass, "h-8")}
                        />
                      </div>
                      <div>
                        <label className={labelClass}>Role</label>
                        <Select value={editRole} onValueChange={setEditRole}>
                          <SelectTrigger className={cn(inputClass, "h-8")}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {ROLE_OPTIONS.map((opt) => (
                              <SelectItem key={opt.value} value={opt.value}>
                                {opt.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={cancelEdit}
                          disabled={isPending}
                        >
                          Cancel
                        </Button>
                        <Button
                          size="sm"
                          onClick={handleUpdate}
                          disabled={
                            isPending ||
                            !editName.trim() ||
                            !editEmail.trim() ||
                            !editRole.trim()
                          }
                        >
                          {isPending ? "···" : "Save"}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3">
                      <ClientAvatar
                        name={m.name}
                        tag={m.active ? "active" : "churned"}
                        size="sm"
                      />
                      <div className="flex flex-1 flex-col gap-0.5">
                        <span
                          className={cn(
                            "text-sm font-medium",
                            m.active ? "text-txt-primary" : "text-txt-muted"
                          )}
                        >
                          {m.name}
                        </span>
                        <span className="text-xs text-txt-muted">
                          {m.email}
                        </span>
                        <span className="text-[11px] uppercase tracking-[0.04em] text-txt-hint">
                          {ROLE_OPTIONS.find((o) => o.value === m.role)
                            ?.label ?? m.role}
                        </span>
                      </div>
                      {!m.active && (
                        <span className="rounded-md border border-border-hover bg-brand-navy px-2 py-0.5 text-[11px] text-txt-hint">
                          Inactive
                        </span>
                      )}
                      <div className="flex items-center gap-1.5">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0"
                          onClick={() => startEdit(m)}
                          disabled={!!editingId}
                          aria-label="Edit"
                        >
                          <Pencil className="h-3 w-3" />
                        </Button>
                        {m.active ? (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="danger"
                                size="sm"
                                className="h-7 text-[11px]"
                                disabled={isPending}
                              >
                                Deactivate
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>
                                  Deactivate {m.name}?
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  This will remove them from all assignee dropdowns. Their existing assignments will be preserved. You can reactivate them later.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDeactivate(m.id, m.name)}
                                  className="bg-danger text-white hover:bg-danger/90"
                                >
                                  Deactivate
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        ) : (
                          <Button
                            variant="terminal"
                            size="sm"
                            className="h-7 text-[11px]"
                            onClick={() => handleReactivate(m.id, m.name)}
                            disabled={isPending}
                          >
                            Reactivate
                          </Button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          {error && <p className="text-[13px] text-danger">{error}</p>}
        </div>
      </DialogContent>
    </Dialog>
  );
}
