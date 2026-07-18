import { Menu as BaseMenu } from "@base-ui/react/menu";
import { ArrowUpRight, CircleDollarSign, FilePlus2, MoreHorizontal, RotateCcw, Settings2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

export function BaseActionMenu({ onEdit, onPaid, onDelete, onUpload, detailHref, canPay = false }: { onEdit: () => void; onPaid?: () => void; onDelete: () => void; onUpload?: () => void; detailHref?: string; canPay?: boolean }) {
  const navigate = useNavigate();
  const { t } = useTranslation();
  return <BaseMenu.Root><BaseMenu.Trigger className="icon-button" aria-label={t("common.moreActions")}><MoreHorizontal size={18} /></BaseMenu.Trigger><BaseMenu.Portal><BaseMenu.Positioner side="bottom" align="end"><BaseMenu.Popup className="base-menu"><BaseMenu.Item className="base-menu__item" onClick={onEdit}><Settings2 size={14} /> {t("common.edit")} {t("common.details")}</BaseMenu.Item>{canPay && onPaid && <BaseMenu.Item className="base-menu__item" onClick={onPaid}><CircleDollarSign size={14} /> {t("bills.markPaid")}</BaseMenu.Item>}{detailHref && <BaseMenu.Item className="base-menu__item" onClick={() => navigate(detailHref)}><ArrowUpRight size={14} /> {t("common.viewDetails")}</BaseMenu.Item>}{onUpload && <BaseMenu.Item className="base-menu__item" onClick={onUpload}><FilePlus2 size={14} /> {t("common.addFile")}</BaseMenu.Item>}<BaseMenu.Item className="base-menu__item base-menu__item--danger" onClick={onDelete}><RotateCcw size={14} /> {t("common.delete")}</BaseMenu.Item></BaseMenu.Popup></BaseMenu.Positioner></BaseMenu.Portal></BaseMenu.Root>;
}
