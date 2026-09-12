import { ArrowUpRight } from "lucide-react";
import { FormEvent, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import {
  Bill,
  BillCategory,
  BillFrequency,
  BillInput,
  BillSeriesType,
  BillStatus,
} from "@/api/bills/bills.types";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";
import { inputDate } from "@/lib/format";
import { useBillMutations } from "@/hooks/mutations/use-bill-mutations";
import { categories, categoryLabels } from "@/lib/finance-categories";

const statusOptions: BillStatus[] = ["created", "upcoming", "due", "overdue", "paid", "cancelled"];

export function BillModal({
  bill,
  onClose,
  organizationId,
}: {
  bill?: Bill;
  onClose: () => void;
  organizationId: string;
}) {
  const { t } = useTranslation();
  const mutations = useBillMutations(organizationId);
  const [series, setSeries] = useState<"one-time" | BillSeriesType>("one-time");
  const [status, setStatus] = useState<BillStatus>(bill?.status ?? "upcoming");
  const isPaid = status === "paid";
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const selectedStatus = (String(data.get("status") ?? "") || "upcoming") as BillStatus;
    const paid = selectedStatus === "paid";
    const paymentDateRaw = String(data.get("paymentDate") ?? "");
    const amountPaidRaw = String(data.get("amountPaid") ?? "").trim();
    const input: Omit<BillInput, "frequency" | "installments"> = {
      description: String(data.get("description") ?? ""),
      notes: String(data.get("notes") ?? ""),
      category: String(data.get("category") ?? "miscellaneous") as BillCategory,
      status: selectedStatus,
      dueDate: new Date(`${String(data.get("date"))}T12:00:00.000Z`).toISOString(),
      paymentDate:
        paid && paymentDateRaw ? new Date(`${paymentDateRaw}T12:00:00.000Z`).toISOString() : null,
      amountDue: Number(data.get("amount") ?? 0),
      amountPaid: paid
        ? amountPaidRaw === ""
          ? Number(data.get("amount") ?? 0)
          : Number(amountPaidRaw)
        : null,
    };
    const done = () => {
      toast.success(bill ? t("bills.updated") : t("bills.created"));
      onClose();
    };
    if (bill)
      mutations.update.mutate(
        { id: bill.id, input },
        { onSuccess: done, onError: (error) => toast.error(error.message) },
      );
    else
      mutations.create.mutate(
        {
          ...input,
          frequency:
            series === "one-time"
              ? null
              : (String(data.get("frequency") ?? "monthly") as BillFrequency),
          installments: series === "installment" ? Number(data.get("installments") ?? 1) : null,
        },
        {
          onSuccess: done,
          onError: (error) => toast.error(error.message),
        },
      );
  };
  return (
    <Modal
      title={bill ? t("bills.edit") : t("bills.add")}
      description={t("bills.formDescription")}
      onClose={onClose}
    >
      <form className="modal-form" onSubmit={submit}>
        <label>
          <span>{t("common.description")}</span>
          <input name="description" defaultValue={bill?.description} required />
        </label>
        <div className="form-grid">
          <label>
            <span>{t("common.category")}</span>
            <Select
              name="category"
              defaultValue={bill?.category ?? "housing"}
              options={categories.map((value) => ({ value, label: t(categoryLabels[value]) }))}
            />
          </label>
          <label>
            <span>{t("common.amount")}</span>
            <input
              name="amount"
              type="number"
              min="0"
              step="0.01"
              defaultValue={bill?.amountDue}
              required
            />
          </label>
        </div>
        <label>
          <span>{t("bills.dueDate")}</span>
          <input
            name="date"
            type="date"
            defaultValue={bill ? inputDate(bill.dueDate) : inputDate(new Date().toISOString())}
            required
          />
        </label>
        {(bill || series === "one-time") && (
          <label>
            <span>{t("bills.status")}</span>
            <Select
              name="status"
              value={status}
              onValueChange={setStatus}
              options={statusOptions.map((value) => ({ value, label: t(`statuses.${value}`) }))}
            />
          </label>
        )}
        {(bill || series === "one-time") && isPaid && (
          <div className="form-grid">
            <label>
              <span>{t("bills.paymentDate")}</span>
              <input
                name="paymentDate"
                type="date"
                defaultValue={
                  bill?.status === "paid" && bill.paymentDate
                    ? inputDate(bill.paymentDate)
                    : inputDate(new Date().toISOString())
                }
              />
            </label>
            <label>
              <span>{t("bills.amountPaid")}</span>
              <input
                name="amountPaid"
                type="number"
                min="0"
                step="0.01"
                defaultValue={bill?.amountPaid ?? bill?.amountDue}
              />
            </label>
          </div>
        )}
        {!bill && (
          <>
            <label>
              <span>{t("common.schedule")}</span>
              <Select<"one-time" | BillSeriesType>
                name="series"
                value={series}
                onValueChange={setSeries}
                options={[
                  { value: "one-time", label: t("bills.oneTime") },
                  { value: "recurring", label: t("bills.recurring") },
                  { value: "installment", label: t("bills.installment") },
                ]}
              />
            </label>
            <label>
              <span>{t("common.frequency")}</span>
              <Select
                name="frequency"
                defaultValue="monthly"
                options={[
                  { value: "daily", label: t("bills.daily") },
                  { value: "weekly", label: t("bills.weekly") },
                  { value: "monthly", label: t("bills.monthly") },
                  { value: "annually", label: t("bills.annually") },
                ]}
              />
            </label>
            <label>
              <span>{t("common.installments")}</span>
              <input name="installments" type="number" min="1" />
            </label>
          </>
        )}
        <label>
          <span>{t("common.notes")}</span>
          <textarea
            name="notes"
            maxLength={2000}
            rows={4}
            defaultValue={bill?.notes ?? ""}
            placeholder={t("common.notesPlaceholder")}
          />
        </label>
        <div className="modal-form__actions">
          <Button type="button" variant="ghost" onClick={onClose}>
            {t("common.cancel")}
          </Button>
          <Button type="submit" disabled={mutations.create.isPending || mutations.update.isPending}>
            {t("common.save")} <ArrowUpRight size={16} />
          </Button>
        </div>
      </form>
    </Modal>
  );
}
