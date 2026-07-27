import { ArrowUpRight } from "lucide-react";
import { FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import {
  Expense,
  ExpenseCategory,
  ExpenseInput,
  ExpenseStatus,
  PaymentMethod,
} from "@/api/expenses/expenses.types";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";
import { inputDate } from "@/lib/format";
import { useExpenseMutations } from "@/hooks/mutations/use-expense-mutations";
import {
  categories,
  categoryLabels,
  paymentMethodLabels,
  paymentMethods,
} from "@/lib/finance-categories";

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
    <Modal
      title={expense ? t("expenses.edit") : t("expenses.add")}
      description={t("expenses.formDescription")}
      onClose={onClose}
    >
      <form className="modal-form" onSubmit={submit}>
        <label>
          <span>{t("common.description")}</span>
          <input name="description" defaultValue={expense?.description} required />
        </label>
        <div className="form-grid">
          <label>
            <span>{t("common.category")}</span>
            <Select
              name="category"
              defaultValue={expense?.category ?? "food"}
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
              defaultValue={expense?.amount}
              required
            />
          </label>
        </div>
        <label>
          <span>{t("common.date")}</span>
          <input
            name="date"
            type="date"
            defaultValue={
              expense ? inputDate(expense.occurredAt) : inputDate(new Date().toISOString())
            }
            required
          />
        </label>
        <label>
          <span>{t("expenses.paymentMethod")}</span>
          <Select
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
        </label>
        <label>
          <span>{t("common.notes")}</span>
          <textarea
            name="notes"
            maxLength={2000}
            rows={4}
            defaultValue={expense?.notes ?? ""}
            placeholder={t("common.notesPlaceholder")}
          />
        </label>
        <div className="modal-form__actions">
          <Button type="button" variant="ghost" onClick={onClose}>
            {t("common.cancel")}
          </Button>
          <Button type="submit" disabled={mutations.create.isPending || mutations.update.isPending}>
            {expense ? t("common.save") : t("expenses.add")} <ArrowUpRight size={16} />
          </Button>
        </div>
      </form>
    </Modal>
  );
}
