import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export function Page({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div
      className={cn(
        "mx-auto grid w-full max-w-[1200px] grid-cols-[minmax(0,1fr)] content-start gap-6 px-4 py-6 sm:px-8 sm:py-8",
        className,
      )}
    >
      {children}
    </div>
  );
}
