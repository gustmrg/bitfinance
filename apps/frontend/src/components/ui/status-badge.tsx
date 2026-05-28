import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-md text-xs font-semibold px-2 py-1",
  {
    variants: {
      variant: {
        gray: "bg-gray-50 text-gray-600 ring-gray-500/10 dark:text-gray-400 dark:bg-gray-600/20",
        red: "bg-red-50 text-red-700 ring-red-600/10 dark:text-red-400 dark:bg-red-400/15",
        yellow:
          "bg-yellow-50 text-yellow-800 ring-yellow-600/20 dark:text-yellow-400 dark:bg-yellow-400/15",
        green:
          "bg-green-50 text-green-700 ring-green-600/20 dark:text-lime-300 dark:bg-lime-400/15",
        blue: "bg-blue-50 text-blue-700 ring-blue-700/10 dark:text-blue-400 dark:bg-blue-800/20",
        indigo:
          "bg-indigo-50 text-indigo-700 ring-indigo-700/10 dark:text-indigo-400 dark:bg-indigo-800/20",
        purple:
          "bg-purple-50 text-purple-700 ring-purple-700/10 dark:text-purple-400 dark:bg-purple-800/20",
        pink: "bg-pink-50 text-pink-700 ring-pink-700/10 dark:text-pink-400 dark:bg-pink-400/20",
        orange:
          "bg-orange-50 text-orange-700 ring-orange-700/10 dark:text-orange-400 dark:bg-orange-800/20",
      },
    },
    defaultVariants: {
      variant: "gray",
    },
  }
);

export interface StatusBadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function StatusBadge({ className, variant, ...props }: StatusBadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { StatusBadge, badgeVariants };
