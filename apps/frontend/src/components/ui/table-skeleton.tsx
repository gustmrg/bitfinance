import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface TableSkeletonProps {
  columns?: number;
  rows?: number;
}

export function TableSkeleton({ columns = 5, rows = 5 }: TableSkeletonProps) {
  return (
    <Card>
      <CardContent className="p-0">
        <div className="p-4">
          <div className="flex gap-4 border-b pb-3">
            {Array.from({ length: columns }).map((_, i) => (
              <Skeleton key={i} className="h-4 w-24" />
            ))}
          </div>
          <div className="space-y-4 pt-4">
            {Array.from({ length: rows }).map((_, row) => (
              <div key={row} className="flex items-center gap-4">
                {Array.from({ length: columns }).map((_, col) => (
                  <Skeleton key={col} className="h-4 flex-1" />
                ))}
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
