import { Skeleton } from "@/components/ui/skeleton";

export function ClientsSkeleton() {
  return (
    <div className="flex flex-col gap-3 px-6 py-4">
      {/* Header */}
      <header className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-5 w-28" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-9 w-32" />
      </header>

      {/* Filter bar */}
      <div className="flex flex-col gap-2 rounded-md border border-border bg-surface px-3.5 py-3.5">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          {/* Search */}
          <Skeleton className="h-8 w-56" />
          {/* Tag filters */}
          <div className="flex gap-3">
            {["All", "Active", "At risk", "Prospect", "Paused"].map((tag) => (
              <Skeleton key={tag} className="h-7 w-14" />
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="mt-2 overflow-hidden rounded-lg border border-border">
          {/* Header row */}
          <div className="flex gap-4 border-b border-border bg-surface px-3 py-2.5">
            {["Brand", "Tag", "Platforms", "Retainer", "Renewal", ""].map((h, i) => (
              <Skeleton key={i} className={`h-3 ${i === 0 ? "w-28" : i === 5 ? "w-10 ml-auto" : "w-16"}`} />
            ))}
          </div>
          {/* Rows */}
          {[1, 2, 3, 4, 5, 6, 7].map((i) => (
            <div
              key={i}
              className="flex items-center gap-4 border-b border-border px-3 py-2.5 last:border-0"
              style={{ opacity: 1 - i * 0.1 }}
            >
              {/* Brand cell */}
              <div className="flex items-center gap-2.5" style={{ minWidth: 200 }}>
                <Skeleton className="h-8 w-8 rounded-full" />
                <div className="flex flex-col gap-1.5">
                  <Skeleton className="h-3.5 w-28" />
                  <Skeleton className="h-3 w-36" />
                </div>
              </div>
              {/* Tag */}
              <Skeleton className="h-7 w-[120px]" />
              {/* Platforms */}
              <div className="flex gap-1">
                <Skeleton className="h-5 w-12 rounded" />
                <Skeleton className="h-5 w-16 rounded" />
              </div>
              {/* Retainer */}
              <Skeleton className="ml-auto h-4 w-16" />
              {/* Renewal */}
              <Skeleton className="h-4 w-20" />
              {/* Action */}
              <Skeleton className="h-5 w-10" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
