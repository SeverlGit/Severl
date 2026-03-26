import { Skeleton } from "@/components/ui/skeleton";

export function DashboardSkeleton() {
  return (
    <div className="flex h-full flex-col overflow-hidden animate-pulse">
      <div className="grid shrink-0 grid-cols-3 border-b border-border-subtle bg-brand-navy">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className={`px-4 py-2.5 ${i < 3 ? "border-r border-border-subtle" : ""}`}
          >
            <Skeleton className="mb-1 h-3 w-24" />
            <Skeleton className="h-8 w-20" />
          </div>
        ))}
      </div>
      <div className="grid flex-1 grid-cols-3 grid-rows-2 gap-px overflow-hidden bg-border-subtle">
        <div className="col-span-2 flex flex-col gap-2 bg-brand-navy p-3">
          <div className="flex justify-between">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-20" />
          </div>
          <div className="flex flex-1 items-end gap-1">
            {[40, 55, 35, 70, 45, 60].map((pct, i) => (
              <Skeleton key={i} className="flex-1" style={{ height: `${pct}%` }} />
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-2 bg-brand-navy p-3">
          <div className="flex justify-between">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-5 w-8 rounded-full" />
          </div>
          <div className="flex flex-1 flex-col gap-1">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-8 w-full" />
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-2 bg-brand-navy p-3">
          <div className="flex justify-between">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-5 w-16 rounded-full" />
          </div>
          <div className="flex flex-1 flex-col gap-1">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-2 bg-brand-navy p-3">
          <div className="flex justify-between">
            <Skeleton className="h-4 w-16" />
          </div>
          <div className="flex flex-1 flex-col gap-1">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-2 bg-brand-navy p-3">
          <div className="flex justify-between">
            <Skeleton className="h-4 w-20" />
          </div>
          <div className="flex flex-1 flex-col gap-1">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
