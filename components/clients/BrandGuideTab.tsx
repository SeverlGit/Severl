"use client";

import React, { useEffect, useRef, useState, useTransition } from "react";
import type { AnyVerticalConfig } from "@/lib/vertical-config";
import type { BrandAssetRow } from "@/lib/database.types";
import { updateClientBrandGuide, generateBrandGuideToken, uploadBrandAsset, deleteBrandAsset } from "@/lib/clients/actions";
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
import { Download, FileText, Link2, RotateCcw, Trash2, Upload } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

type Props = {
  clientId: string;
  orgId: string;
  vertical: AnyVerticalConfig;
  verticalData: Record<string, any>;
  brandGuideToken: string | null;
  brandAssets?: BrandAssetRow[];
  viewCount?: number;
  lastViewedAt?: string | null;
};

const ASSET_TYPE_OPTIONS: { value: BrandAssetRow['type']; label: string }[] = [
  { value: 'logo', label: 'Logo' },
  { value: 'font', label: 'Font' },
  { value: 'image', label: 'Image' },
  { value: 'color_palette', label: 'Color palette' },
  { value: 'other', label: 'Other' },
];

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

function buildPdfUrl(token: string): string {
  const base =
    typeof window !== "undefined"
      ? window.location.origin
      : (process.env.NEXT_PUBLIC_APP_URL ?? "");
  return `${base}/api/brand/${token}/pdf`;
}

function formatFileSize(bytes: number | null): string {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function BrandGuideTab({ clientId, orgId, vertical, verticalData, brandGuideToken, brandAssets: initialAssets = [], viewCount = 0, lastViewedAt }: Props) {
  const [localData, setLocalData] = useState(() => normalizeForForm(vertical, verticalData));
  const [localToken, setLocalToken] = useState<string | null>(brandGuideToken);
  const [isPending, startTransition] = useTransition();
  const [isSharing, startSharing] = useTransition();
  const [assets, setAssets] = useState<BrandAssetRow[]>(initialAssets);
  const [isUploading, startUpload] = useTransition();
  const [uploadType, setUploadType] = useState<BrandAssetRow['type']>('logo');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setLocalData(normalizeForForm(vertical, verticalData));
  }, [vertical, verticalData]);

  useEffect(() => {
    setLocalToken(brandGuideToken);
  }, [brandGuideToken]);

  useEffect(() => {
    setAssets(initialAssets);
  }, [initialAssets]);

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

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);
    formData.append("clientId", clientId);
    formData.append("orgId", orgId);
    formData.append("type", uploadType);
    formData.append("name", file.name.replace(/\.[^.]+$/, ""));

    startUpload(async () => {
      const result = await uploadBrandAsset(formData);
      if ("error" in result) {
        toast.error("Upload failed", { description: result.error });
      } else {
        setAssets((prev) => [...prev, result.data]);
        toast.success("Asset uploaded");
      }
      if (fileInputRef.current) fileInputRef.current.value = "";
    });
  };

  const handleDeleteAsset = (assetId: string) => {
    startTransition(async () => {
      const result = await deleteBrandAsset({ assetId, clientId, orgId });
      if ("error" in result) {
        toast.error("Could not delete asset");
      } else {
        setAssets((prev) => prev.filter((a) => a.id !== assetId));
        toast.success("Asset deleted");
      }
    });
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
          {viewCount > 0 && (
            <span className="text-[11px] text-txt-muted">
              · {viewCount} view{viewCount !== 1 ? "s" : ""}
              {lastViewedAt && (
                <> · Last viewed {formatDistanceToNow(new Date(lastViewedAt), { addSuffix: true })}</>
              )}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {localToken ? (
            <>
              <a
                href={buildPdfUrl(localToken)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 rounded-md border border-border bg-panel px-3 py-1.5 text-xs font-medium text-txt-muted transition-colors hover:bg-surface-hover"
                title="Download PDF"
              >
                <Download className="h-3 w-3" />
                PDF
              </a>
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

      {/* Brand Assets */}
      <div className="flex flex-col gap-3 rounded-lg border border-border bg-surface p-4">
        <div className="flex items-center justify-between">
          <h3 className="text-[12px] font-medium uppercase tracking-[0.06em] text-txt-hint">
            Brand assets
          </h3>
          <div className="flex items-center gap-2">
            <select
              value={uploadType}
              onChange={(e) => setUploadType(e.target.value as BrandAssetRow['type'])}
              className="rounded border border-border bg-panel px-2 py-1 text-[11px] text-txt-secondary"
            >
              {ASSET_TYPE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="flex items-center gap-1.5 rounded-md border border-border bg-panel px-3 py-1.5 text-[11px] font-medium text-txt-secondary transition-colors hover:bg-surface-hover disabled:opacity-50"
            >
              <Upload className="h-3 w-3" />
              {isUploading ? "Uploading…" : "Upload"}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept="image/*,.pdf,.ttf,.otf,.woff,.woff2"
              onChange={handleFileUpload}
            />
          </div>
        </div>

        {assets.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-6 text-center">
            <FileText className="h-8 w-8 text-txt-hint" />
            <p className="text-[12px] text-txt-muted">No assets yet. Upload logos, fonts, or images.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
            {assets.map((asset) => (
              <div
                key={asset.id}
                className="group relative flex flex-col gap-1 rounded-md border border-border bg-panel p-3"
              >
                {/* Preview */}
                {asset.file_url && (asset.type === "logo" || asset.type === "image") ? (
                  <div className="mb-1 flex h-16 items-center justify-center overflow-hidden rounded">
                    <img
                      src={asset.file_url}
                      alt={asset.name}
                      className="max-h-16 max-w-full object-contain"
                    />
                  </div>
                ) : (
                  <div className="mb-1 flex h-16 items-center justify-center rounded bg-surface-hover">
                    <FileText className="h-6 w-6 text-txt-hint" />
                  </div>
                )}
                <a
                  href={asset.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="truncate text-[11px] font-medium text-txt-secondary hover:text-brand-rose"
                >
                  {asset.name}
                </a>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-txt-hint capitalize">{asset.type.replace("_", " ")}</span>
                  {asset.file_size && (
                    <span className="text-[10px] text-txt-hint">{formatFileSize(asset.file_size)}</span>
                  )}
                </div>
                <button
                  onClick={() => handleDeleteAsset(asset.id)}
                  className="absolute right-1.5 top-1.5 hidden rounded p-0.5 text-txt-hint transition-colors hover:bg-danger/10 hover:text-danger group-hover:flex"
                  title="Delete asset"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
