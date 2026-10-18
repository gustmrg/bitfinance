import { Popover } from "@base-ui/react/popover";
import { CalendarDays, ChevronDown } from "lucide-react";
import { type FormEvent, useState } from "react";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router-dom";
import { Button } from "@/components/base/button";
import { buttonClasses } from "@/components/base/button-styles";
import { Field, Input } from "@/components/base/field";
import { useLocale } from "@/hooks/use-locale";

const dateParamPattern = /^\d{4}-\d{2}-\d{2}$/;

function toInput(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function currentMonthInputs() {
  const now = new Date();
  return {
    from: toInput(new Date(now.getFullYear(), now.getMonth(), 1)),
    to: toInput(new Date(now.getFullYear(), now.getMonth() + 1, 0)),
  };
}

function validDateInput(value: string | null) {
  if (!value || !dateParamPattern.test(value)) return null;
  return Number.isNaN(new Date(`${value}T12:00:00`).getTime()) ? null : value;
}

export function PeriodFilter({ onChange }: { onChange?: () => void }) {
  const { t } = useTranslation();
  const locale = useLocale();
  const [searchParams, setSearchParams] = useSearchParams();
  const defaults = currentMonthInputs();
  const selectedFrom = validDateInput(searchParams.get("from")) ?? defaults.from;
  const selectedTo = validDateInput(searchParams.get("to")) ?? defaults.to;
  const [open, setOpen] = useState(false);
  const [from, setFrom] = useState(selectedFrom);
  const [to, setTo] = useState(selectedTo);
  const isCurrentMonth = selectedFrom === defaults.from && selectedTo === defaults.to;
  const display = (value: string) =>
    new Intl.DateTimeFormat(locale, { day: "numeric", month: "short" }).format(
      new Date(`${value}T12:00:00`),
    );
  const label = isCurrentMonth
    ? new Intl.DateTimeFormat(locale, { month: "long", year: "numeric" }).format(
        new Date(`${selectedFrom}T12:00:00`),
      )
    : `${display(selectedFrom)} – ${display(selectedTo)}`;

  const update = (next: URLSearchParams) => {
    setSearchParams(next, { replace: true });
    onChange?.();
    setOpen(false);
  };
  const apply = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (from > to) return;
    const next = new URLSearchParams(searchParams);
    next.set("from", from);
    next.set("to", to);
    update(next);
  };
  const reset = () => {
    const next = new URLSearchParams(searchParams);
    next.delete("from");
    next.delete("to");
    setFrom(defaults.from);
    setTo(defaults.to);
    update(next);
  };

  return (
    <Popover.Root
      open={open}
      onOpenChange={(next) => {
        if (next) {
          setFrom(selectedFrom);
          setTo(selectedTo);
        }
        setOpen(next);
      }}
    >
      <Popover.Trigger
        aria-label={`${t("common.selectPeriod")}: ${label}`}
        className={buttonClasses({ variant: "secondary", className: "font-semibold" })}
      >
        <CalendarDays size={17} className="text-ink-muted" aria-hidden="true" />
        <span className="first-letter:uppercase">{label}</span>
        <ChevronDown size={15} className="text-ink-muted" aria-hidden="true" />
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Positioner sideOffset={8} align="start" collisionPadding={12} className="z-50">
          <Popover.Popup className="w-[min(calc(100vw-24px),340px)] rounded-card border border-line bg-surface p-5 font-sans text-ink shadow-xl outline-none">
            <form className="grid gap-4" onSubmit={apply}>
              <div className="grid gap-0.5">
                <Popover.Title className="m-0 text-base font-extrabold">
                  {t("common.choosePeriod")}
                </Popover.Title>
                <Popover.Description className="m-0 text-[13px] text-ink-muted">
                  {t("common.periodUpdated")}
                </Popover.Description>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label={t("common.from")}>
                  {(control) => (
                    <Input
                      {...control}
                      type="date"
                      value={from}
                      max={to}
                      onChange={(event) => setFrom(event.target.value)}
                      required
                    />
                  )}
                </Field>
                <Field
                  label={t("common.to")}
                  error={from > to ? t("common.endDateError") : undefined}
                >
                  {(control) => (
                    <Input
                      {...control}
                      type="date"
                      value={to}
                      min={from}
                      onChange={(event) => setTo(event.target.value)}
                      required
                    />
                  )}
                </Field>
              </div>
              <div className="flex justify-between gap-2">
                <Button variant="ghost" size="sm" onClick={reset}>
                  {t("common.thisMonth")}
                </Button>
                <Button type="submit" size="sm" disabled={from > to}>
                  {t("common.apply")}
                </Button>
              </div>
            </form>
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}
