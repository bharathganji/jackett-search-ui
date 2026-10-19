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
      <CardHeader className="p-3 sm:p-6 sm:pb-3 border-b border-border/20">
        <div className="flex flex-col gap-4 sm:gap-6">
          <div className="flex items-center justify-between">
            <div className="h-7 w-40 bg-muted rounded animate-pulse" />
            <div className="h-5 w-24 bg-muted rounded animate-pulse" />
          </div>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-center">
            <div className="flex w-full sm:w-auto gap-2">
              <div className="h-9 sm:h-10 w-full sm:w-32 bg-muted rounded-full animate-pulse flex-1 sm:flex-none" />
            </div>
            <div className="h-9 sm:h-10 w-full bg-muted rounded-full animate-pulse" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0 sm:p-2 sm:pt-0 mt-2 sm:mt-0">
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
        <div className="px-2 sm:px-0">
          {Array.from({ length: rows }).map((_, i) => (
            <div
              key={i}
              className="w-full rounded-xl border border-border/40 p-3 sm:p-2 mb-2"
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
