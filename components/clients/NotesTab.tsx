"use client";

import React, { useMemo, useState, useTransition } from "react";
import { formatDistanceToNow } from "date-fns";
import { useUser } from "@clerk/nextjs";
import { createClientNote, deleteClientNote, updateClientNote } from "@/lib/clients/actions";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";
import { ClientAvatar } from "@/components/shared/ClientAvatar";
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
import { Pencil, Trash2 } from "lucide-react";

type Note = {
  id: string;
  author_id: string | null;
  body: string;
  created_at: string;
};

type Props = {
  clientId: string;
  orgId: string;
  notes: Note[];
};

export function NotesTab({ clientId, orgId, notes }: Props) {
  const [localNotes, setLocalNotes] = useState(notes);
  const [body, setBody] = useState("");
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editingBody, setEditingBody] = useState("");
  const [isPending, startTransition] = useTransition();
  const { user } = useUser();

  const noteById = useMemo(() => {
    const map = new Map<string, Note>();
    localNotes.forEach((n) => map.set(n.id, n));
    return map;
  }, [localNotes]);

  const handleSave = () => {
    if (!body.trim() || !user?.id) return;
    const newNote: Note = {
      id: `temp-${Date.now()}`,
      author_id: user.id,
      body: body.trim(),
      created_at: new Date().toISOString(),
    };
    setLocalNotes((prev) => [newNote, ...prev]);
    setBody("");
    startTransition(async () => {
      try {
        await createClientNote({ clientId, orgId, body: newNote.body });
        toast.success("Note saved");
      } catch {
        toast.error("Something went wrong", { description: "Please try again." });
      }
    });
  };

  const beginEdit = (note: Note) => {
    if (note.id.startsWith("temp-")) return;
    setEditingNoteId(note.id);
    setEditingBody(note.body);
  };

  const cancelEdit = () => {
    setEditingNoteId(null);
    setEditingBody("");
  };

  const commitEdit = () => {
    if (!editingNoteId) return;
    const original = noteById.get(editingNoteId);
    if (!original) return;
    const next = editingBody.trim();
    if (!next) return;

    setLocalNotes((prev) =>
      prev.map((n) => (n.id === editingNoteId ? { ...n, body: next } : n))
    );
    const noteId = editingNoteId;
    cancelEdit();

    startTransition(async () => {
      try {
        await updateClientNote({ orgId, clientId, noteId, content: next });
        toast.success("Note updated");
      } catch {
        // revert local on failure
        setLocalNotes((prev) =>
          prev.map((n) => (n.id === noteId ? { ...n, body: original.body } : n))
        );
        toast.error("Failed to update note");
      }
    });
  };

  const handleDelete = (note: Note) => {
    if (note.id.startsWith("temp-")) return;
    setLocalNotes((prev) => prev.filter((n) => n.id !== note.id));
    startTransition(async () => {
      try {
        await deleteClientNote({ orgId, noteId: note.id, clientId });
        toast.success("Note deleted");
      } catch {
        setLocalNotes((prev) => [note, ...prev]);
        toast.error("Failed to delete note");
      }
    });
  };

  const handleKeyDown: React.KeyboardEventHandler<HTMLTextAreaElement> = (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      handleSave();
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        {localNotes.length === 0 && (
          <div className="text-[14px] text-[rgba(255,255,255,0.35)]">
            No notes yet. Add context about this client.
          </div>
        )}
        {localNotes.map((note) => (
          <div key={note.id} className="group border-b border-border pb-3 last:border-b-0">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2">
                <ClientAvatar
                  name={note.author_id && user?.id && note.author_id === user.id ? (user.firstName ?? "You") : "Team"}
                  size="sm"
                />
                <span className="text-[12px] text-[rgba(255,255,255,0.35)]">
                  {formatDistanceToNow(new Date(note.created_at), { addSuffix: true })}
                </span>
              </div>

              {!note.id.startsWith("temp-") && (
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => beginEdit(note)}
                    className="opacity-0 transition-colors group-hover:opacity-100 text-txt-hint hover:text-txt-secondary"
                    aria-label="Edit note"
                    disabled={isPending}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <button
                        type="button"
                        className="opacity-0 transition-colors group-hover:opacity-100 text-txt-hint hover:text-danger"
                        aria-label="Delete note"
                        disabled={isPending}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete this note?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDelete(note)}
                          className="bg-danger text-white hover:bg-danger/90"
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              )}
            </div>

            <div className="mt-1.5">
              {editingNoteId === note.id ? (
                <Textarea
                  value={editingBody}
                  onChange={(e) => setEditingBody(e.target.value)}
                  onBlur={commitEdit}
                  onKeyDown={(e) => {
                    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
                      e.preventDefault();
                      commitEdit();
                    }
                    if (e.key === "Escape") {
                      e.preventDefault();
                      cancelEdit();
                    }
                  }}
                  rows={3}
                  className="font-sans text-[14px]"
                  autoFocus
                />
              ) : (
                <div className="text-[14px] leading-relaxed text-[rgba(255,255,255,0.60)]">
                  {note.body}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
      <div>
        <Textarea
          placeholder="Add a private note..."
          value={body}
          onChange={(e) => setBody(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={3}
        />
        <div className="mt-2 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={handleSave}
            disabled={isPending || !body.trim()}
            className="text-sm text-brand-rose transition-colors hover:underline disabled:pointer-events-none disabled:opacity-40"
          >
            Save
          </button>
          <span className="text-[12px] text-[rgba(255,255,255,0.35)]">Cmd+Enter to save</span>
        </div>
      </div>
    </div>
  );
}
