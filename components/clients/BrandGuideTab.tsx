"use client";

import React, { useEffect, useState, useTransition } from "react";
import type { AnyVerticalConfig } from "@/lib/vertical-config";
import { updateClientBrandGuide } from "@/lib/clients/actions";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

type Props = {
  clientId: string;
  orgId: string;
  vertical: AnyVerticalConfig;
  verticalData: Record<string, any>;
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

export function BrandGuideTab({ clientId, orgId, vertical, verticalData }: Props) {
  const [localData, setLocalData] = useState(() => normalizeForForm(vertical, verticalData));
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setLocalData(normalizeForForm(vertical, verticalData));
  }, [vertical, verticalData]);

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

  return (
    <div
      className={cn(
        "grid gap-4 md:grid-cols-2",
        isPending && "pointer-events-none opacity-50",
      )}
    >
      {vertical.crm.intakeFields.map((field) => {
        const value = localData[field.key];
        const label = (
          <label className="text-[12px] font-medium uppercase tracking-[0.06em] text-[rgba(255,255,255,0.35)]">
            {field.label}
          </label>
        );

        const card = "flex flex-col gap-2 rounded-lg border border-border bg-surface p-4";

        if (field.type === "multi_select" || field.type === "key_value") {
          return (
            <div key={field.key} className={card}>
              {label}
              <div className="text-[14px] text-[rgba(255,255,255,0.60)]">
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
  );
}
