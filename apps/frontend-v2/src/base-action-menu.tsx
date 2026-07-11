import { Menu as BaseMenu } from "@base-ui/react/menu";
import { ArrowUpRight, CircleDollarSign, MoreHorizontal, RotateCcw, Settings2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

export function BaseActionMenu({ onEdit, onPaid, onDelete, detailHref, canPay = false }: { onEdit: () => void; onPaid?: () => void; onDelete: () => void; detailHref?: string; canPay?: boolean }) {
  const navigate = useNavigate();
  return <BaseMenu.Root><BaseMenu.Trigger className="icon-button" aria-label="More actions"><MoreHorizontal size={18} /></BaseMenu.Trigger><BaseMenu.Portal><BaseMenu.Positioner side="bottom" align="end"><BaseMenu.Popup className="base-menu"><BaseMenu.Item className="base-menu__item" onClick={onEdit}><Settings2 size={14} /> Edit details</BaseMenu.Item>{canPay && onPaid && <BaseMenu.Item className="base-menu__item" onClick={onPaid}><CircleDollarSign size={14} /> Mark as paid</BaseMenu.Item>}{detailHref && <BaseMenu.Item className="base-menu__item" onClick={() => navigate(detailHref)}><ArrowUpRight size={14} /> View details</BaseMenu.Item>}<BaseMenu.Item className="base-menu__item base-menu__item--danger" onClick={onDelete}><RotateCcw size={14} /> Delete</BaseMenu.Item></BaseMenu.Popup></BaseMenu.Positioner></BaseMenu.Portal></BaseMenu.Root>;
}
