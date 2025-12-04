import { Card, CardContent, CardHeader } from "@/components/ui/card";

interface SkeletonLoaderProps {
  rows?: number;
  className?: string;
}

export function SkeletonLoader({
  rows = 5,
  className = "",
}: Readonly<SkeletonLoaderProps>) {
  return (
    <Card className={`w-full overflow-hidden ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between animate-pulse">
          <div className="h-7 w-40 bg-muted rounded" />
          <div className="h-5 w-24 bg-muted rounded sm:hidden" />
        </div>
        <div className="flex flex-col sm:flex-row gap-3 items-center mt-4">
          <div className="h-10 w-full sm:w-32 bg-muted rounded animate-pulse" />
          <div className="h-10 w-full sm:flex-1 bg-muted rounded animate-pulse" />
        </div>
      </CardHeader>
      <CardContent>
        {/* Desktop Header Skeleton */}
        <div className="hidden sm:grid grid-cols-12 gap-2 p-2 border-b mb-2">
          <div className="col-span-5 h-5 bg-muted rounded animate-pulse" />
          <div className="col-span-1 h-5 bg-muted rounded animate-pulse" />
          <div className="col-span-1 h-5 bg-muted rounded animate-pulse" />
          <div className="col-span-1 h-5 bg-muted rounded animate-pulse" />
          <div className="col-span-1 h-5 bg-muted rounded animate-pulse" />
          <div className="col-span-3 h-5 bg-muted rounded animate-pulse" />
        </div>

        {/* Rows */}
        <div className="space-y-2">
          {Array.from({ length: rows }).map((_, i) => (
            <div
              key={i}
              className="w-full rounded-lg border p-3 sm:p-2"
              style={{
                animationDelay: `${i * 100}ms`,
              }}
            >
              {/* Desktop Row */}
              <div className="hidden sm:grid grid-cols-12 gap-2 items-center">
                <div className="col-span-5 h-5 bg-muted rounded animate-pulse" />
                <div className="col-span-1 h-5 bg-muted rounded animate-pulse mx-auto w-12" />
                <div className="col-span-1 h-5 bg-muted rounded animate-pulse mx-auto w-16" />
                <div className="col-span-1 h-8 w-8 bg-muted rounded-full animate-pulse mx-auto" />
                <div className="col-span-1 h-8 w-8 bg-muted rounded-full animate-pulse mx-auto" />
                <div className="col-span-3 h-5 bg-muted rounded animate-pulse w-24" />
              </div>

              {/* Mobile Row */}
              <div className="sm:hidden flex flex-col gap-3">
                <div className="h-5 w-3/4 bg-muted rounded animate-pulse" />
                <div className="flex justify-between gap-2">
                  <div className="h-4 w-16 bg-muted rounded animate-pulse" />
                  <div className="h-4 w-16 bg-muted rounded animate-pulse" />
                </div>
                <div className="h-4 w-24 bg-muted rounded animate-pulse" />
                <div className="flex gap-2 pt-1">
                  <div className="h-9 flex-1 bg-muted rounded animate-pulse" />
                  <div className="h-9 flex-1 bg-muted rounded animate-pulse" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
