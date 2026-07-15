import { format, formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

export function formatCurrency(value: number, locale = "en-US") {
  return new Intl.NumberFormat(locale, { style: "currency", currency: locale === "pt-BR" ? "BRL" : "USD", maximumFractionDigits: 2 }).format(value);
}

export function formatDate(value: string, locale = "en-US") {
  return new Intl.DateTimeFormat(locale, { month: "short", day: "numeric" }).format(new Date(value));
}

export function formatLongDate(value: string, locale = "en-US") {
  return new Intl.DateTimeFormat(locale, { month: "long", day: "numeric", year: "numeric" }).format(new Date(value));
}

export function relativeDate(value: string, locale = "en-US") {
  return formatDistanceToNow(new Date(value), { addSuffix: true, locale: locale === "pt-BR" ? ptBR : undefined });
}

export function inputDate(value: string) {
  return format(new Date(value), "yyyy-MM-dd");
}

export function initials(firstName: string, lastName: string) {
  return `${firstName[0] ?? ""}${lastName[0] ?? ""}`.toUpperCase();
}
