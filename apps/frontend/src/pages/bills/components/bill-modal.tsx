import { type FormEvent, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import type {
  Bill,
  BillCategory,
  BillFrequency,
  BillInput,
  BillSeriesType,
  BillStatus,
} from "@/api/bills/bills.types";
import { Button } from "@/components/base/button";
import { Dialog, DialogActions } from "@/components/base/dialog";
import { Field, Input, Textarea } from "@/components/base/field";
import { Select } from "@/components/base/select";
import { useBillMutations } from "@/hooks/mutations/use-bill-mutations";
import { categories, categoryLabels } from "@/lib/finance-categories";
import { inputDate } from "@/lib/format";

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
  const showStatus = Boolean(bill) || series === "one-time";
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
        { onSuccess: done, onError: (error) => toast.error(error.message) },
      );
  };
  return (
    <Dialog
      open
      onOpenChange={(open) => !open && onClose()}
      title={bill ? t("bills.edit") : t("bills.add")}
      description={t("bills.formDescription")}
    >
      <form className="grid gap-4" onSubmit={submit}>
        <Field label={t("common.description")}>
          {(control) => (
            <Input {...control} name="description" defaultValue={bill?.description} required />
          )}
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t("common.category")}>
            {(control) => (
              <Select
                id={control.id}
                name="category"
                defaultValue={bill?.category ?? "housing"}
                options={categories.map((value) => ({ value, label: t(categoryLabels[value]) }))}
              />
            )}
          </Field>
          <Field label={t("common.amount")}>
            {(control) => (
              <Input
                {...control}
                name="amount"
                type="number"
                inputMode="decimal"
                min="0"
                step="0.01"
                defaultValue={bill?.amountDue}
                required
              />
            )}
          </Field>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t("bills.dueDate")}>
            {(control) => (
              <Input
                {...control}
                name="date"
                type="date"
                defaultValue={bill ? inputDate(bill.dueDate) : inputDate(new Date().toISOString())}
                required
              />
            )}
          </Field>
          {showStatus && (
            <Field label={t("bills.status")}>
              {(control) => (
                <Select
                  id={control.id}
                  name="status"
                  value={status}
                  onValueChange={setStatus}
                  options={statusOptions.map((value) => ({
                    value,
                    label: t(`statuses.${value}`),
                  }))}
                />
              )}
            </Field>
          )}
        </div>
        {showStatus && isPaid && (
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={t("bills.paymentDate")}>
              {(control) => (
                <Input
                  {...control}
                  name="paymentDate"
                  type="date"
                  defaultValue={
                    bill?.status === "paid" && bill.paymentDate
                      ? inputDate(bill.paymentDate)
                      : inputDate(new Date().toISOString())
                  }
                />
              )}
            </Field>
            <Field label={t("bills.amountPaid")}>
              {(control) => (
                <Input
                  {...control}
                  name="amountPaid"
                  type="number"
                  inputMode="decimal"
                  min="0"
                  step="0.01"
                  defaultValue={bill?.amountPaid ?? bill?.amountDue}
                />
              )}
            </Field>
          </div>
        )}
        {!bill && (
          <div className="grid gap-4 rounded-control bg-surface-muted p-4 sm:grid-cols-3">
            <Field label={t("common.schedule")}>
              {(control) => (
                <Select<"one-time" | BillSeriesType>
                  id={control.id}
                  name="series"
                  value={series}
                  onValueChange={setSeries}
                  options={[
                    { value: "one-time", label: t("bills.oneTime") },
                    { value: "recurring", label: t("bills.recurring") },
                    { value: "installment", label: t("bills.installment") },
                  ]}
                />
              )}
            </Field>
            {series !== "one-time" && (
              <Field label={t("common.frequency")}>
                {(control) => (
                  <Select
                    id={control.id}
                    name="frequency"
                    defaultValue="monthly"
                    options={[
                      { value: "daily", label: t("bills.daily") },
                      { value: "weekly", label: t("bills.weekly") },
                      { value: "monthly", label: t("bills.monthly") },
                      { value: "annually", label: t("bills.annually") },
                    ]}
                  />
                )}
              </Field>
            )}
            {series === "installment" && (
              <Field label={t("bills.installmentCount")}>
                {(control) => (
                  <Input
                    {...control}
                    name="installments"
                    type="number"
                    inputMode="numeric"
                    min="1"
                    required
                  />
                )}
              </Field>
            )}
          </div>
        )}
        <Field label={t("common.notes")}>
          {(control) => (
            <Textarea
              {...control}
              name="notes"
              maxLength={2000}
              rows={3}
              defaultValue={bill?.notes ?? ""}
              placeholder={t("common.notesPlaceholder")}
            />
          )}
        </Field>
        <DialogActions>
          <Button variant="ghost" onClick={onClose}>
            {t("common.cancel")}
          </Button>
          <Button type="submit" disabled={mutations.create.isPending || mutations.update.isPending}>
            {t("common.save")}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
