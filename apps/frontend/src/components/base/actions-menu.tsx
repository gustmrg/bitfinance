import { Menu } from "@base-ui/react/menu";
import { MoreVertical } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export type MenuAction = {
  label: string;
  icon?: ReactNode;
  onSelect: () => void;
  tone?: "danger";
};

export function ActionsMenu({ label, actions }: { label: string; actions: MenuAction[] }) {
  return (
    <Menu.Root>
      <Menu.Trigger
        aria-label={label}
        className="inline-grid size-10 shrink-0 cursor-pointer place-items-center rounded-control text-ink-muted hover:bg-surface-muted hover:text-ink focus-visible:outline-2 focus-visible:outline-brand"
      >
        <MoreVertical size={18} aria-hidden="true" />
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Positioner
          side="bottom"
          align="end"
          sideOffset={4}
          collisionPadding={12}
          className="z-50"
        >
          <Menu.Popup className="min-w-52 rounded-control border border-line bg-surface p-1 font-sans shadow-xl outline-none">
            {actions.map((action) => (
              <Menu.Item
                key={action.label}
                onClick={action.onSelect}
                className={cn(
                  "flex h-10 cursor-pointer items-center gap-2.5 rounded-[8px] px-3 text-sm font-semibold outline-none data-highlighted:bg-surface-muted",
                  action.tone === "danger" ? "text-danger" : "text-ink",
                )}
              >
                {action.icon}
                {action.label}
              </Menu.Item>
            ))}
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  );
}
