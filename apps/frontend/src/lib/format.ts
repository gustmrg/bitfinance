import { format, formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

const dateOnlyPattern = /^(\d{4})-(\d{2})-(\d{2})$/;

function parseDate(value: string) {
  const dateOnly = dateOnlyPattern.exec(value);
  if (!dateOnly) return new Date(value);

  return new Date(Number(dateOnly[1]), Number(dateOnly[2]) - 1, Number(dateOnly[3]));
}

export function formatCurrency(value: number, locale = "en-US") {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: locale === "pt-BR" ? "BRL" : "USD",
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatDate(value: string, locale = "en-US") {
  return new Intl.DateTimeFormat(locale, { month: "short", day: "numeric" }).format(
    parseDate(value),
  );
}

export function formatLongDate(value: string, locale = "en-US") {
  return new Intl.DateTimeFormat(locale, { month: "long", day: "numeric", year: "numeric" }).format(
    parseDate(value),
  );
}

export function relativeDate(value: string, locale = "en-US") {
  return formatDistanceToNow(parseDate(value), {
    addSuffix: true,
    locale: locale === "pt-BR" ? ptBR : undefined,
  });
}

export function inputDate(value: string) {
  return format(parseDate(value), "yyyy-MM-dd");
}

export function initials(firstName: string, lastName: string) {
  return `${firstName[0] ?? ""}${lastName[0] ?? ""}`.toUpperCase();
}
