import { type ReactNode } from "react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

interface OpenStateProps {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export interface AdaptiveModalProps extends OpenStateProps {
  trigger?: ReactNode;
  title?: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  contentClassName?: string;
  headerClassName?: string;
  bodyClassName?: string;
  footer?: ReactNode;
  footerClassName?: string;
}

export function AdaptiveModal({
  open,
  defaultOpen,
  onOpenChange,
  trigger,
  title,
  description,
  children,
  contentClassName,
  headerClassName,
  bodyClassName,
  footer,
  footerClassName,
}: AdaptiveModalProps) {
  const isMobile = useIsMobile();

  const shouldRenderHeader = Boolean(title || description);

  if (isMobile) {
    return (
      <Drawer open={open} defaultOpen={defaultOpen} onOpenChange={onOpenChange}>
        {trigger ? <DrawerTrigger asChild>{trigger}</DrawerTrigger> : null}
        <DrawerContent className={cn("max-h-[90vh]", contentClassName)}>
          <div className="flex max-h-[calc(90vh-1rem)] flex-col">
            {shouldRenderHeader ? (
              <DrawerHeader className={headerClassName}>
                {title ? <DrawerTitle>{title}</DrawerTitle> : null}
                {description ? (
                  <DrawerDescription>{description}</DrawerDescription>
                ) : null}
              </DrawerHeader>
            ) : null}

            <div className={cn("overflow-y-auto px-4 pb-4", bodyClassName)}>
              {children}
            </div>

            {footer ? (
              <DrawerFooter className={footerClassName}>{footer}</DrawerFooter>
            ) : null}
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} defaultOpen={defaultOpen} onOpenChange={onOpenChange}>
      {trigger ? <DialogTrigger asChild>{trigger}</DialogTrigger> : null}
      <DialogContent className={contentClassName}>
        {shouldRenderHeader ? (
          <DialogHeader className={headerClassName}>
            {title ? <DialogTitle>{title}</DialogTitle> : null}
            {description ? (
              <DialogDescription>{description}</DialogDescription>
            ) : null}
          </DialogHeader>
        ) : null}

        <div className={bodyClassName}>{children}</div>

        {footer ? <DialogFooter className={footerClassName}>{footer}</DialogFooter> : null}
      </DialogContent>
    </Dialog>
  );
}

export interface AdaptiveConfirmProps extends OpenStateProps {
  trigger?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  cancelLabel: ReactNode;
  confirmLabel: ReactNode;
  onConfirm: () => void;
  confirmClassName?: string;
  cancelClassName?: string;
  contentClassName?: string;
  headerClassName?: string;
  footerClassName?: string;
}

export function AdaptiveConfirm({
  open,
  defaultOpen,
  onOpenChange,
  trigger,
  title,
  description,
  cancelLabel,
  confirmLabel,
  onConfirm,
  confirmClassName,
  cancelClassName,
  contentClassName,
  headerClassName,
  footerClassName,
}: AdaptiveConfirmProps) {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <Drawer open={open} defaultOpen={defaultOpen} onOpenChange={onOpenChange}>
        {trigger ? <DrawerTrigger asChild>{trigger}</DrawerTrigger> : null}
        <DrawerContent className={cn("max-h-[90vh]", contentClassName)}>
          <DrawerHeader className={headerClassName}>
            <DrawerTitle>{title}</DrawerTitle>
            {description ? <DrawerDescription>{description}</DrawerDescription> : null}
          </DrawerHeader>
          <DrawerFooter className={footerClassName}>
            <DrawerClose asChild>
              <Button variant="outline" className={cancelClassName}>
                {cancelLabel}
              </Button>
            </DrawerClose>
            <DrawerClose asChild>
              <Button className={confirmClassName} onClick={onConfirm}>
                {confirmLabel}
              </Button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <AlertDialog open={open} defaultOpen={defaultOpen} onOpenChange={onOpenChange}>
      {trigger ? <AlertDialogTrigger asChild>{trigger}</AlertDialogTrigger> : null}
      <AlertDialogContent className={contentClassName}>
        <AlertDialogHeader className={headerClassName}>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          {description ? (
            <AlertDialogDescription>{description}</AlertDialogDescription>
          ) : null}
        </AlertDialogHeader>
        <AlertDialogFooter className={footerClassName}>
          <AlertDialogCancel className={cancelClassName}>{cancelLabel}</AlertDialogCancel>
          <AlertDialogAction className={confirmClassName} onClick={onConfirm}>
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
