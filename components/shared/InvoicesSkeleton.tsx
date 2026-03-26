import { Skeleton } from "@/components/ui/skeleton";

export function InvoicesSkeleton() {
  return (
    <div className="flex flex-col gap-4 p-5 animate-pulse">
      <header className="flex flex-col gap-2">
        <Skeleton className="h-5 w-24" />
        <Skeleton className="h-4 w-64" />
      </header>
      <div className="grid gap-px rounded-lg border border-border bg-border-subtle md:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-surface px-4 py-3.5 first:rounded-l-lg last:rounded-r-lg">
            <Skeleton className="mb-2 h-3 w-24" />
            <Skeleton className="h-6 w-20" />
          </div>
        ))}
      </div>
      <div className="rounded-lg border border-border bg-surface p-4">
        <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="h-9 w-16 rounded-md" />
            ))}
          </div>
          <Skeleton className="h-8 w-56" />
        </div>
        <div className="overflow-hidden rounded-lg border border-border">
          <div className="border-b border-border-subtle bg-surface px-3 py-3">
            <div className="flex gap-4">
              {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                <Skeleton key={i} className="h-3 w-16" />
              ))}
            </div>
          </div>
          <div className="flex flex-col">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="flex gap-4 border-b border-border-subtle px-3 py-3">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-12" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-14" />
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-12" />
                <Skeleton className="h-6 w-16" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
