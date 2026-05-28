import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Paperclip } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";

import type { Expense } from "../types";

interface ExpenseDetailsContentProps {
  expense: Expense;
  onDeleteDocument: (documentId: string) => Promise<void> | void;
  onDownloadDocument: (documentId: string, fileName: string) => Promise<void> | void;
}

export function ExpenseDetailsContent({
  expense,
  onDeleteDocument,
  onDownloadDocument,
}: ExpenseDetailsContentProps) {
  const { t } = useTranslation();

  const renderStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <StatusBadge variant="yellow">{t("labels.pending")}</StatusBadge>;
      case "paid":
        return <StatusBadge variant="green">{t("labels.paid")}</StatusBadge>;
      case "cancelled":
        return <StatusBadge variant="red">{t("labels.cancelled")}</StatusBadge>;
      default:
        return <StatusBadge variant="indigo">{t("labels.created")}</StatusBadge>;
    }
  };

  return (
    <div className="border-t border-gray-100">
      <dl className="divide-y divide-gray-100">
        <div className="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
          <dt className="text-sm font-medium leading-6 text-gray-900">
            {t("labels.description")}
          </dt>
          <dd className="mt-1 text-sm leading-6 text-gray-700 sm:col-span-2 sm:mt-0">
            {expense.description}
          </dd>
        </div>
        <div className="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
          <dt className="text-sm font-medium leading-6 text-gray-900">
            {t("labels.category")}
          </dt>
          <dd className="mt-1 text-sm capitalize leading-6 text-gray-700 sm:col-span-2 sm:mt-0">
            {expense.category}
          </dd>
        </div>
        <div className="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
          <dt className="text-sm font-medium leading-6 text-gray-900">
            {t("labels.status")}
          </dt>
          <dd className="mt-1 text-sm leading-6 text-gray-700 sm:col-span-2 sm:mt-0">
            {renderStatusBadge(expense.status)}
          </dd>
        </div>
        <div className="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
          <dt className="text-sm font-medium leading-6 text-gray-900">
            {t("labels.date")}
          </dt>
          <dd className="mt-1 text-sm leading-6 text-gray-700 sm:col-span-2 sm:mt-0">
            {format(new Date(expense.occurredAt), "Pp", { locale: ptBR })}
          </dd>
        </div>
        <div className="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
          <dt className="text-sm font-medium leading-6 text-gray-900">
            {t("labels.amount")}
          </dt>
          <dd className="mt-1 text-sm leading-6 text-gray-700 sm:col-span-2 sm:mt-0">
            {`$${expense.amount.toFixed(2)}`}
          </dd>
        </div>
        <div className="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
          <dt className="text-sm font-medium leading-6 text-gray-900">
            {t("labels.createdBy")}
          </dt>
          <dd className="mt-1 text-sm leading-6 text-gray-700 sm:col-span-2 sm:mt-0">
            {expense.createdBy}
          </dd>
        </div>

        {expense.documents && expense.documents.length > 0 ? (
          <div className="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
            <dt className="text-sm font-medium leading-6 text-gray-900">
              {t("labels.attachments")}
            </dt>
            <dd className="mt-2 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
              <ul
                role="list"
                className="divide-y divide-gray-100 rounded-md border border-gray-200"
              >
                {expense.documents.map((document) => (
                  <li
                    key={document.id}
                    className="flex items-center justify-between py-4 pl-4 pr-5 text-sm leading-6"
                  >
                    <div className="flex w-0 flex-1 items-center">
                      <Paperclip
                        aria-hidden="true"
                        className="h-5 w-5 flex-shrink-0 text-gray-400"
                      />
                      <div className="ml-4 flex min-w-0 flex-1 gap-2">
                        <span className="truncate font-medium">{document.fileName}</span>
                      </div>
                    </div>
                    <div className="ml-4 flex items-center gap-2 flex-shrink-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDownloadDocument(document.id, document.fileName)}
                        className="font-medium text-blue-700 hover:text-blue-500"
                      >
                        {t("labels.download")}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDeleteDocument(document.id)}
                        className="font-medium text-red-700 hover:text-red-500"
                      >
                        {t("labels.delete")}
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            </dd>
          </div>
        ) : null}
      </dl>
    </div>
  );
}
