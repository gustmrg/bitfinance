import { Button } from "./button";

export interface PaginationProps {
  page: number;
  pageSize: number;
  totalRecords: number;
  onPageChange: (page: number) => Promise<void> | void;
}

export function Pagination({
  totalRecords,
  pageSize,
  onPageChange,
}: PaginationProps) {
  const pages = Math.ceil(totalRecords / pageSize) || 1;

  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-muted-foreground">
        Total de {totalRecords} item(s)
      </span>

      <div className="flex items-center gap-6 lg:gap-8">
        <div className="flex items-center gap-2">
          {Array.from({ length: pages }).map((_, index) => (
            <Button
              key={index}
              onClick={() => onPageChange(index + 1)}
              variant="outline"
              className="h-8 w-8 p-0"
            >
              {index + 1}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}
