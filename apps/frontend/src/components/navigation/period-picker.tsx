import { CalendarDays, ChevronRight } from "lucide-react";
import { type FormEvent, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";

const dateParamPattern = /^\d{4}-\d{2}-\d{2}$/;

function currentMonthInputs() {
  const now = new Date();
  const from = new Date(now.getFullYear(), now.getMonth(), 1);
  const to = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  const input = (date: Date) =>
    `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  return { from: input(from), to: input(to) };
}

function validDateInput(value: string | null) {
  if (!value || !dateParamPattern.test(value)) return null;
  const date = new Date(`${value}T12:00:00`);
  return Number.isNaN(date.getTime()) ? null : value;
}

export function PeriodPicker({ onChange }: { onChange?: () => void } = {}) {
  const { i18n } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const defaults = currentMonthInputs();
  const selectedFrom = validDateInput(searchParams.get("from")) ?? defaults.from;
  const selectedTo = validDateInput(searchParams.get("to")) ?? defaults.to;
  const [open, setOpen] = useState(false);
  const [from, setFrom] = useState(selectedFrom);
  const [to, setTo] = useState(selectedTo);
  const root = useRef<HTMLDivElement>(null);
  const locale = i18n.language === "pt-BR" ? "pt-BR" : "en-US";
  const display = (value: string) =>
    new Intl.DateTimeFormat(locale, { month: "short", day: "numeric" }).format(
      new Date(`${value}T12:00:00`),
    );

  useEffect(() => {
    if (!open) return;
    const close = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", close);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("pointerdown", close);
      document.removeEventListener("keydown", escape);
    };
  }, [open]);

  const toggle = () => {
    if (!open) {
      setFrom(selectedFrom);
      setTo(selectedTo);
    }
    setOpen((value) => !value);
  };
  const apply = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (from > to) return;
    const next = new URLSearchParams(searchParams);
    next.set("from", from);
    next.set("to", to);
    setSearchParams(next, { replace: true });
    onChange?.();
    setOpen(false);
  };
  const reset = () => {
    const next = new URLSearchParams(searchParams);
    next.delete("from");
    next.delete("to");
    setSearchParams(next, { replace: true });
    setFrom(defaults.from);
    setTo(defaults.to);
    onChange?.();
    setOpen(false);
  };

  const { t } = useTranslation();
  return (
    <div className="period-picker" ref={root}>
      <button
        type="button"
        className="period-control"
        aria-expanded={open}
        aria-haspopup="dialog"
        onClick={toggle}
      >
        <span className="period-control__dot" />
        {display(selectedFrom)} — {display(selectedTo)}{" "}
        <ChevronRight
          size={14}
          className={
            open
              ? "period-control__chevron period-control__chevron--open"
              : "period-control__chevron"
          }
        />
      </button>
      {open && (
        <form
          className="period-popover"
          role="dialog"
          aria-label={t("common.selectPeriod")}
          onSubmit={apply}
        >
          <div className="period-popover__heading">
            <CalendarDays size={17} />
            <span>
              <strong>{t("common.choosePeriod")}</strong>
              <small>{t("common.periodUpdated")}</small>
            </span>
          </div>
          <div className="period-popover__fields">
            <label>
              <span>{t("common.from")}</span>
              <input
                type="date"
                value={from}
                max={to}
                onChange={(event) => setFrom(event.target.value)}
                required
              />
            </label>
            <label>
              <span>{t("common.to")}</span>
              <input
                type="date"
                value={to}
                min={from}
                onChange={(event) => setTo(event.target.value)}
                required
              />
            </label>
          </div>
          {from > to && (
            <p className="period-popover__error" role="alert">
              {t("common.endDateError")}
            </p>
          )}
          <div className="period-popover__actions">
            <button type="button" className="period-popover__reset" onClick={reset}>
              {t("common.thisMonth")}
            </button>
            <Button type="submit" className="button--small" disabled={from > to}>
              {t("common.apply")}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
