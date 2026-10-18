import type { ReactNode } from "react";
import { Card } from "@/components/base/card";

export function CenterCard({
  icon,
  title,
  description,
  children,
}: {
  icon?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <main className="grid flex-1 place-items-center px-4 py-10">
      <Card className="grid w-full max-w-md gap-5">
        <div className="grid gap-2">
          {icon && (
            <span className="mb-1 inline-grid size-12 place-items-center rounded-control bg-brand-soft text-brand-ink">
              {icon}
            </span>
          )}
          <h1 className="m-0 text-2xl font-extrabold tracking-[-0.03em]">{title}</h1>
          {description && <p className="m-0 text-sm text-ink-muted">{description}</p>}
        </div>
        {children}
      </Card>
    </main>
  );
}
