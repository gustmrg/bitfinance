import { AlertDialog } from "@base-ui/react/alert-dialog";
import { Dialog as BaseDialog } from "@base-ui/react/dialog";
import { X } from "lucide-react";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/cn";
import { Button } from "./button";

const backdropClasses =
  "fixed inset-0 z-40 bg-black/45 transition-opacity data-ending-style:opacity-0 data-starting-style:opacity-0";

const popupClasses = cn(
  "fixed left-1/2 top-1/2 z-50 grid max-h-[calc(100dvh-32px)] w-[min(calc(100vw-32px),480px)] -translate-x-1/2 -translate-y-1/2 gap-5 overflow-y-auto",
  "rounded-card border border-line bg-surface p-6 text-ink shadow-xl outline-none",
  "transition-all data-ending-style:scale-95 data-ending-style:opacity-0 data-starting-style:scale-95 data-starting-style:opacity-0",
);

export function Dialog({
  open,
  onOpenChange,
  title,
  description,
  wide = false,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: ReactNode;
  description?: ReactNode;
  wide?: boolean;
  children: ReactNode;
}) {
  const { t } = useTranslation();
  return (
    <BaseDialog.Root open={open} onOpenChange={onOpenChange}>
      <BaseDialog.Portal>
        <BaseDialog.Backdrop className={backdropClasses} />
        <BaseDialog.Popup className={cn(popupClasses, wide && "w-[min(calc(100vw-32px),720px)]")}>
          <div className="flex items-start justify-between gap-4">
            <div className="grid gap-1">
              <BaseDialog.Title className="m-0 text-lg font-extrabold tracking-tight">
                {title}
              </BaseDialog.Title>
              {description && (
                <BaseDialog.Description className="m-0 text-sm text-ink-muted">
                  {description}
                </BaseDialog.Description>
              )}
            </div>
            <BaseDialog.Close
              aria-label={t("common.close")}
              className="-mr-2 -mt-2 inline-grid size-11 shrink-0 cursor-pointer place-items-center rounded-control text-ink-muted hover:bg-surface-muted focus-visible:outline-2 focus-visible:outline-brand"
            >
              <X size={18} aria-hidden="true" />
            </BaseDialog.Close>
          </div>
          {children}
        </BaseDialog.Popup>
      </BaseDialog.Portal>
    </BaseDialog.Root>
  );
}

export function DialogActions({ children }: { children: ReactNode }) {
  return <div className="flex flex-wrap justify-end gap-2">{children}</div>;
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  tone = "danger",
  pending = false,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: ReactNode;
  description?: ReactNode;
  confirmLabel: string;
  tone?: "danger" | "primary";
  pending?: boolean;
  onConfirm: () => void;
}) {
  const { t } = useTranslation();
  return (
    <AlertDialog.Root open={open} onOpenChange={onOpenChange}>
      <AlertDialog.Portal>
        <AlertDialog.Backdrop className={backdropClasses} />
        <AlertDialog.Popup className={popupClasses}>
          <div className="grid gap-1">
            <AlertDialog.Title className="m-0 text-lg font-extrabold tracking-tight">
              {title}
            </AlertDialog.Title>
            {description && (
              <AlertDialog.Description className="m-0 text-sm text-ink-muted">
                {description}
              </AlertDialog.Description>
            )}
          </div>
          <DialogActions>
            <AlertDialog.Close
              disabled={pending}
              render={<Button variant="ghost">{t("common.cancel")}</Button>}
            />
            <Button
              variant={tone === "danger" ? "danger" : "primary"}
              disabled={pending}
              onClick={onConfirm}
            >
              {confirmLabel}
            </Button>
          </DialogActions>
        </AlertDialog.Popup>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}
