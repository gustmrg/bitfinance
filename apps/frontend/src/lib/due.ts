const dateOnlyPattern = /^(\d{4})-(\d{2})-(\d{2})/;

function startOfDay(value: string | Date) {
  if (value instanceof Date)
    return new Date(value.getFullYear(), value.getMonth(), value.getDate());
  const match = dateOnlyPattern.exec(value);
  if (match) return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  const date = new Date(value);
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function daysUntil(value: string | Date, today: Date = new Date()) {
  const diff = startOfDay(value).getTime() - startOfDay(today).getTime();
  return Math.round(diff / 86_400_000);
}

export type DueState =
  | { kind: "paid" }
  | { kind: "cancelled" }
  | { kind: "overdue"; days: number }
  | { kind: "today" }
  | { kind: "tomorrow" }
  | { kind: "soon"; days: number }
  | { kind: "later"; days: number };

export function dueState(dueDate: string, status: string): DueState {
  if (status === "paid") return { kind: "paid" };
  if (status === "cancelled") return { kind: "cancelled" };
  const days = daysUntil(dueDate);
  if (days < 0 || status === "overdue") return { kind: "overdue", days: Math.max(-days, 0) };
  if (days === 0) return { kind: "today" };
  if (days === 1) return { kind: "tomorrow" };
  if (days <= 3) return { kind: "soon", days };
  return { kind: "later", days };
}
