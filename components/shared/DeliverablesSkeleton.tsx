import { Skeleton } from "@/components/ui/skeleton";

export function DeliverablesSkeleton() {
  return (
    <div className="flex flex-col gap-3 px-6 py-4">
      {/* Header: Month nav + view toggle */}
      <header className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <Skeleton className="h-7 w-7 rounded-full" />
          <Skeleton className="h-5 w-36" />
          <Skeleton className="h-7 w-7 rounded-full" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-8 w-28" />
        </div>
      </header>

      {/* Client sections */}
      {[1, 2, 3].map((section) => (
        <div
          key={section}
          className="rounded-lg border border-border bg-surface px-3 py-2"
          style={{ opacity: 1 - (section - 1) * 0.25 }}
        >
          {/* Section header */}
          <div className="flex w-full items-center justify-between py-1">
            <div className="flex items-center gap-2">
              <Skeleton className="h-3 w-3 rounded" />
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-5 w-14 rounded" />
              <Skeleton className="h-5 w-10 rounded" />
            </div>
            <div className="flex items-center gap-2">
              <Skeleton className="h-3.5 w-10" />
              <Skeleton className="h-[3px] w-24 rounded-full" />
            </div>
          </div>

          {/* Deliverable rows */}
          {section < 3 && (
            <div className="mt-2 flex flex-col gap-1.5">
              {[1, 2, 3, 4].slice(0, section === 1 ? 4 : 2).map((row) => (
                <div
                  key={row}
                  className="flex items-center gap-3 rounded-lg border border-border bg-surface px-3 py-2"
                >
                  <Skeleton className="w-28 h-3.5" />
                  <Skeleton className="flex-1 h-4" />
                  <Skeleton className="w-40 h-7 rounded" />
                  <Skeleton className="w-20 h-3.5" />
                  <div className="ml-1 flex gap-1">
                    <Skeleton className="h-4 w-4 rounded" />
                    <Skeleton className="h-4 w-4 rounded" />
                  </div>
                </div>
              ))}
              {/* Add row */}
              <div className="flex items-center gap-2 px-3 py-1.5">
                <Skeleton className="h-4 w-4 rounded" />
                <Skeleton className="h-3.5 w-32" />
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
