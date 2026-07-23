import { RotateCcw } from "lucide-react";
import { useTranslation } from "react-i18next";

import { EmptyState } from "@/components/feedback/empty-state";
import { Button } from "@/components/ui/button";

export function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  const { t } = useTranslation();
  return (
    <EmptyState
      icon={RotateCcw}
      title={t("errors.attention")}
      description={message}
      action={
        <Button variant="secondary" onClick={onRetry}>
          {t("errors.tryAgain")}
        </Button>
      }
    />
  );
}
