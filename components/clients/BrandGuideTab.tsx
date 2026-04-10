"use client";

import React, { useEffect, useState, useTransition } from "react";
import type { AnyVerticalConfig } from "@/lib/vertical-config";
import { updateClientBrandGuide, generateBrandGuideToken } from "@/lib/clients/actions";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
import { cn } from "@/lib/utils";
import { Link2, RotateCcw } from "lucide-react";

type Props = {
  clientId: string;
  orgId: string;
  vertical: AnyVerticalConfig;
  verticalData: Record<string, any>;
  brandGuideToken: string | null;
};

function normalizeForForm(vertical: AnyVerticalConfig, data: Record<string, any>): Record<string, any> {
  const out = { ...data };
  for (const field of vertical.crm.intakeFields) {
    if (field.type === "tags" && Array.isArray(out[field.key])) {
      out[field.key] = (out[field.key] as string[]).join(", ");
    }
  }
  return out;
}

function buildShareUrl(token: string): string {
  const base =
    typeof window !== "undefined"
      ? window.location.origin
      : (process.env.NEXT_PUBLIC_APP_URL ?? "");
  return `${base}/brand/${token}`;
}

export function BrandGuideTab({ clientId, orgId, vertical, verticalData, brandGuideToken }: Props) {
  const [localData, setLocalData] = useState(() => normalizeForForm(vertical, verticalData));
  const [localToken, setLocalToken] = useState<string | null>(brandGuideToken);
  const [isPending, startTransition] = useTransition();
  const [isSharing, startSharing] = useTransition();

  useEffect(() => {
    setLocalData(normalizeForForm(vertical, verticalData));
  }, [vertical, verticalData]);

  useEffect(() => {
    setLocalToken(brandGuideToken);
  }, [brandGuideToken]);

  const saveField = (fieldKey: string) => {
    const field = vertical.crm.intakeFields.find((f) => f.key === fieldKey);
    if (!field || field.type === "multi_select" || field.type === "key_value") return;

    const raw = localData[fieldKey];
    let value: unknown = raw;
    if (field.type === "tags") {
      value =
        typeof raw === "string"
          ? raw
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean)
          : [];
    }

    startTransition(async () => {
      try {
        await updateClientBrandGuide({ clientId, orgId, field: fieldKey, value });
        toast.success("Saved");
      } catch {
        toast.error("Something went wrong", { description: "Please try again." });
      }
    });
  };

  const handleShare = () => {
    startSharing(async () => {
      const result = await generateBrandGuideToken({ clientId, orgId });
      if ("error" in result) {
        toast.error("Could not generate link", { description: result.error });
        return;
      }
      setLocalToken(result.data);
      try {
        await navigator.clipboard.writeText(buildShareUrl(result.data));
        toast.success("Link copied", { description: "Share it with your client." });
      } catch {
        toast.success("Link generated", {
          description: buildShareUrl(result.data),
        });
      }
    });
  };

  const handleCopy = () => {
    if (!localToken) return;
    navigator.clipboard
      .writeText(buildShareUrl(localToken))
      .then(() => toast.success("Link copied"))
      .catch(() => toast.info("Link", { description: buildShareUrl(localToken!) }));
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Share bar */}
      <div className="flex items-center justify-between rounded-lg border border-border bg-surface px-4 py-3">
        <div className="flex items-center gap-2">
          <Link2 className="h-4 w-4 text-brand-rose" />
          <span className="text-sm font-medium text-txt-primary">Shareable brand guide</span>
          {localToken && (
            <span className="rounded bg-surface-hover px-1.5 py-0.5 text-[10px] font-medium text-txt-muted">
              Active
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {localToken ? (
            <>
              <button
                onClick={handleCopy}
                className="rounded-md border border-border bg-panel px-3 py-1.5 text-xs font-medium text-txt-secondary transition-colors hover:bg-surface-hover"
              >
                Copy link
              </button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <button
                    disabled={isSharing}
                    className="flex items-center gap-1.5 rounded-md border border-border bg-panel px-3 py-1.5 text-xs font-medium text-txt-muted transition-colors hover:bg-surface-hover disabled:opacity-50"
                  >
                    <RotateCcw className="h-3 w-3" />
                    Regenerate
                  </button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Regenerate share link?</AlertDialogTitle>
                    <AlertDialogDescription>
                      The previous link will stop working immediately. Anyone who bookmarked it
                      will need the new link.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleShare}
                      className="bg-brand-rose text-white hover:bg-brand-rose-deep"
                    >
                      Regenerate
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </>
          ) : (
            <button
              onClick={handleShare}
              disabled={isSharing}
              className="rounded-md bg-brand-rose px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-brand-rose-deep disabled:opacity-50"
            >
              {isSharing ? "Generating…" : "Share with client"}
            </button>
          )}
        </div>
      </div>

      {/* Fields grid */}
      <div
        className={cn(
          "grid gap-4 md:grid-cols-2",
          isPending && "pointer-events-none opacity-50",
        )}
      >
        {vertical.crm.intakeFields.map((field) => {
          const value = localData[field.key];
          const label = (
            <label className="text-[12px] font-medium uppercase tracking-[0.06em] text-txt-hint">
              {field.label}
            </label>
          );

          const card = "flex flex-col gap-2 rounded-lg border border-border bg-surface p-4";

          if (field.type === "multi_select" || field.type === "key_value") {
            return (
              <div key={field.key} className={card}>
                {label}
                <div className="text-[14px] text-txt-muted">
                  {Array.isArray(value) && value.length ? value.join(", ") : "—"}
                </div>
              </div>
            );
          }

          if (field.type === "tags") {
            const display = typeof value === "string" ? value : "";
            return (
              <div key={field.key} className={card}>
                {label}
                <Input
                  placeholder="comma, separated, tags"
                  value={display}
                  disabled={isPending}
                  onChange={(e) =>
                    setLocalData((prev) => ({ ...prev, [field.key]: e.target.value }))
                  }
                  onBlur={() => saveField(field.key)}
                />
              </div>
            );
          }

          if (field.type === "textarea") {
            return (
              <div key={field.key} className={card}>
                {label}
                <Textarea
                  className="min-h-[80px]"
                  value={value ?? ""}
                  disabled={isPending}
                  onChange={(e) =>
                    setLocalData((prev) => ({ ...prev, [field.key]: e.target.value }))
                  }
                  onBlur={() => saveField(field.key)}
                />
              </div>
            );
          }

          return (
            <div key={field.key} className={card}>
              {label}
              <Input
                value={value ?? ""}
                disabled={isPending}
                onChange={(e) =>
                  setLocalData((prev) => ({ ...prev, [field.key]: e.target.value }))
                }
                onBlur={() => saveField(field.key)}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
