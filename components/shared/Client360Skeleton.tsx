import { Skeleton } from "@/components/ui/skeleton";

export function Client360Skeleton() {
  return (
    <div className="flex flex-col gap-4 p-5 animate-pulse">
      <Skeleton className="h-4 w-32" />
      <header className="flex flex-col gap-3 rounded-lg border border-border bg-surface p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <Skeleton className="h-12 w-12 rounded-full" />
            <div className="flex flex-col gap-2">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-3 w-32" />
            </div>
          </div>
          <div className="flex flex-col items-end gap-1">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-3 w-28" />
          </div>
        </div>
      </header>
      <section className="grid gap-px rounded-lg border border-border bg-border-subtle md:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-surface px-4 py-3 first:rounded-l-lg last:rounded-r-lg">
            <Skeleton className="mb-2 h-3 w-20" />
            <Skeleton className="mb-1 h-4 w-16" />
            <Skeleton className="h-3 w-24" />
          </div>
        ))}
      </section>
      <section className="rounded-lg border border-border bg-surface p-4">
        <div className="mb-4 flex gap-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-9 w-20 rounded-md" />
          ))}
        </div>
        <div className="flex flex-col gap-3">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-24 w-3/4" />
        </div>
      </section>
    </div>
  );
}
