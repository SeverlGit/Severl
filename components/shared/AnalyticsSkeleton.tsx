import { Skeleton } from "@/components/ui/skeleton";

export function AnalyticsSkeleton() {
  return (
    <div className="flex flex-col gap-4 p-5 animate-pulse">
      <header className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-3 w-72" />
        </div>
        <div className="flex border border-border bg-brand-navy">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-8 w-12" />
          ))}
        </div>
      </header>
      <div className="grid gap-px bg-border-subtle md:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-brand-navy px-4 py-3.5">
            <Skeleton className="mb-2 h-3 w-24" />
            <Skeleton className="h-9 w-20" />
          </div>
        ))}
      </div>
      <div className="h-96 rounded-lg border border-border bg-brand-navy p-4">
        <Skeleton className="mb-4 h-4 w-32" />
        <div className="flex h-64 items-end gap-1">
          {[40, 55, 35, 70, 45, 60].map((pct, i) => (
            <Skeleton key={i} className="flex-1" style={{ height: `${pct}%` }} />
          ))}
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-lg border border-border bg-brand-navy p-4">
          <Skeleton className="mb-4 h-4 w-40" />
          <div className="flex flex-col gap-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-8 w-full" />
            ))}
          </div>
        </div>
        <div className="rounded-lg border border-border bg-brand-navy p-4">
          <Skeleton className="mb-4 h-4 w-40" />
          <div className="flex flex-col gap-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-8 w-full" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
