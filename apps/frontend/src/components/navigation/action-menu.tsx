import { MoreHorizontal } from "lucide-react";
import { lazy, Suspense } from "react";
import { useTranslation } from "react-i18next";
import { IconButton } from "@/components/ui/icon-button";

export function ActionMenu({
  onEdit,
  onPaid,
  onDelete,
  onUpload,
  detailHref,
  canPay = false,
}: {
  onEdit: () => void;
  onPaid?: () => void;
  onDelete: () => void;
  onUpload?: () => void;
  detailHref?: string;
  canPay?: boolean;
}) {
  const { t } = useTranslation();
  return (
    <Suspense
      fallback={
        <IconButton label={t("common.moreActions")}>
          <MoreHorizontal size={18} />
        </IconButton>
      }
    >
      <LazyActionMenu
        onEdit={onEdit}
        onPaid={onPaid}
        onDelete={onDelete}
        onUpload={onUpload}
        detailHref={detailHref}
        canPay={canPay}
      />
    </Suspense>
  );
}

const LazyActionMenu = lazy(async () => {
  const module = await import("@/components/navigation/action-menu-content");
  return { default: module.BaseActionMenu };
});
