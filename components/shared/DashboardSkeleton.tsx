import { Skeleton } from "@/components/ui/skeleton";

function SkeletonStatCard({ accentLeft = false }: { accentLeft?: boolean }) {
  return (
    <div
      className={`relative overflow-hidden rounded-xl border border-border bg-surface p-4 ${
        accentLeft ? "border-l-2 border-l-border-strong" : ""
      }`}
    >
      <Skeleton className="mb-2 h-2.5 w-20" />
      <Skeleton className="h-9 w-28" />
      <Skeleton className="mt-1.5 h-3 w-16" />
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="flex h-full flex-col overflow-auto">
      {/* Stats strip */}
      <div className="grid shrink-0 grid-cols-3 gap-3 px-4 py-3">
        <SkeletonStatCard accentLeft />
        <SkeletonStatCard />
        <SkeletonStatCard />
      </div>

      {/* Main grid */}
      <div className="grid flex-1 grid-cols-3 grid-rows-2 gap-px overflow-hidden bg-border-subtle">
        {/* Revenue chart — col-span-2 */}
        <div className="col-span-2 flex flex-col gap-2 bg-surface p-3">
          <div className="flex justify-between">
            <Skeleton className="h-3.5 w-24" />
            <Skeleton className="h-3.5 w-16" />
          </div>
          <div className="flex flex-1 items-end gap-1 pt-2">
            {[38, 52, 44, 70, 55, 62, 48].map((pct, i) => (
              <Skeleton key={i} className="flex-1 rounded-sm" style={{ height: `${pct}%` }} />
            ))}
          </div>
          <div className="flex justify-between pt-1">
            {[1, 2, 3, 4, 5, 6, 7].map((i) => (
              <Skeleton key={i} className="h-2.5 w-6" />
            ))}
          </div>
        </div>

        {/* Client list */}
        <div className="flex flex-col gap-2 bg-surface p-3">
          <div className="flex justify-between">
            <Skeleton className="h-3.5 w-16" />
            <Skeleton className="h-5 w-8 rounded-full" />
          </div>
          <div className="flex flex-1 flex-col gap-1.5">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center gap-2" style={{ opacity: 1 - (i - 1) * 0.15 }}>
                <Skeleton className="h-7 w-7 shrink-0 rounded-full" />
                <div className="flex flex-1 flex-col gap-1">
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-2.5 w-16" />
                </div>
                <Skeleton className="h-5 w-12 rounded" />
              </div>
            ))}
          </div>
        </div>

        {/* Quick actions */}
        <div className="flex flex-col gap-2 bg-surface p-3">
          <Skeleton className="h-3.5 w-28" />
          <div className="grid grid-cols-2 gap-1.5 pt-1">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-8 w-full rounded-md" />
            ))}
          </div>
          <div className="mt-2 flex flex-col gap-1.5">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-2" style={{ opacity: 1 - (i - 1) * 0.2 }}>
                <Skeleton className="h-1.5 w-1.5 shrink-0 rounded-full" />
                <Skeleton className="h-3 flex-1" />
              </div>
            ))}
          </div>
        </div>

        {/* Recent invoices */}
        <div className="col-span-2 flex flex-col gap-2 bg-surface p-3">
          <div className="flex justify-between">
            <Skeleton className="h-3.5 w-28" />
            <Skeleton className="h-3.5 w-16" />
          </div>
          <div className="flex flex-col gap-1.5">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center gap-3 py-1" style={{ opacity: 1 - (i - 1) * 0.15 }}>
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-3 flex-1" />
                <Skeleton className="h-5 w-12 rounded" />
                <Skeleton className="h-3 w-12" />
              </div>
            ))}
          </div>
        </div>

        {/* Renewals */}
        <div className="flex flex-col gap-2 bg-surface p-3">
          <Skeleton className="h-3.5 w-20" />
          <div className="flex flex-1 flex-col gap-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex flex-col gap-1" style={{ opacity: 1 - (i - 1) * 0.2 }}>
                <Skeleton className="h-3 w-28" />
                <Skeleton className="h-2 w-20" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
