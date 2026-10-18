import type { FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import type {
  Expense,
  ExpenseCategory,
  ExpenseInput,
  ExpenseStatus,
  PaymentMethod,
} from "@/api/expenses/expenses.types";
import { Button } from "@/components/base/button";
import { Dialog, DialogActions } from "@/components/base/dialog";
import { Field, Input, Textarea } from "@/components/base/field";
import { Select } from "@/components/base/select";
import { useExpenseMutations } from "@/hooks/mutations/use-expense-mutations";
import {
  categories,
  categoryLabels,
  paymentMethodLabels,
  paymentMethods,
} from "@/lib/finance-categories";
import { inputDate } from "@/lib/format";

export function ExpenseModal({
  expense,
  onClose,
  organizationId,
  userId,
}: {
  expense?: Expense;
  onClose: () => void;
  organizationId: string;
  userId: string;
}) {
  const { t } = useTranslation();
  const mutations = useExpenseMutations(organizationId);
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const paymentMethod = String(data.get("paymentMethod") ?? "unspecified");
    const input: ExpenseInput = {
      description: String(data.get("description") ?? ""),
      notes: String(data.get("notes") ?? ""),
      category: String(data.get("category") ?? "miscellaneous") as ExpenseCategory,
      amount: Number(data.get("amount") ?? 0),
      status: (expense?.status ?? "paid") as ExpenseStatus,
      paymentMethod: paymentMethod === "unspecified" ? "" : (paymentMethod as PaymentMethod),
      occurredAt: new Date(`${String(data.get("date"))}T12:00:00.000Z`).toISOString(),
    };
    const done = () => {
      toast.success(expense ? t("expenses.updated") : t("expenses.created"));
      onClose();
    };
    if (expense)
      mutations.update.mutate(
        { id: expense.id, input },
        { onSuccess: done, onError: (error) => toast.error(error.message) },
      );
    else
      mutations.create.mutate(
        { ...input, createdBy: userId },
        { onSuccess: done, onError: (error) => toast.error(error.message) },
      );
  };
  return (
    <Dialog
      open
      onOpenChange={(open) => !open && onClose()}
      title={expense ? t("expenses.edit") : t("expenses.add")}
      description={t("expenses.formDescription")}
    >
      <form className="grid gap-4" onSubmit={submit}>
        <Field label={t("common.description")}>
          {(control) => (
            <Input {...control} name="description" defaultValue={expense?.description} required />
          )}
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t("common.amount")}>
            {(control) => (
              <Input
                {...control}
                name="amount"
                type="number"
                inputMode="decimal"
                min="0"
                step="0.01"
                defaultValue={expense?.amount}
                required
              />
            )}
          </Field>
          <Field label={t("common.date")}>
            {(control) => (
              <Input
                {...control}
                name="date"
                type="date"
                defaultValue={
                  expense ? inputDate(expense.occurredAt) : inputDate(new Date().toISOString())
                }
                required
              />
            )}
          </Field>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t("common.category")}>
            {(control) => (
              <Select
                id={control.id}
                name="category"
                defaultValue={expense?.category ?? "food"}
                options={categories.map((value) => ({ value, label: t(categoryLabels[value]) }))}
              />
            )}
          </Field>
          <Field label={t("expenses.paymentMethod")}>
            {(control) => (
              <Select
                id={control.id}
                name="paymentMethod"
                defaultValue={expense?.paymentMethod ?? "unspecified"}
                options={[
                  { value: "unspecified", label: t("common.notSpecified") },
                  ...paymentMethods.map((value) => ({
                    value,
                    label: t(paymentMethodLabels[value]),
                  })),
                ]}
              />
            )}
          </Field>
        </div>
        <Field label={t("common.notes")}>
          {(control) => (
            <Textarea
              {...control}
              name="notes"
              maxLength={2000}
              rows={3}
              defaultValue={expense?.notes ?? ""}
              placeholder={t("common.notesPlaceholder")}
            />
          )}
        </Field>
        <DialogActions>
          <Button variant="ghost" onClick={onClose}>
            {t("common.cancel")}
          </Button>
          <Button type="submit" disabled={mutations.create.isPending || mutations.update.isPending}>
            {expense ? t("common.save") : t("expenses.add")}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
