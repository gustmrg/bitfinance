import { useMemo, useSyncExternalStore } from "react";
import { useSearchParams } from "react-router-dom";
import { currentLocalHour, subscribeToHour } from "@/lib/local-clock";

export function resolvePeriod(fromParam: string | null, toParam: string | null, now: Date) {
  const fallback = {
    from: new Date(now.getFullYear(), now.getMonth(), 1),
    to: new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999),
  };
  const parse = (value: string | null, endOfDay = false) => {
    if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
    const date = new Date(`${value}T${endOfDay ? "23:59:59.999" : "00:00:00.000"}`);
    return Number.isNaN(date.getTime()) ? null : date;
  };
  const from = parse(fromParam);
  const to = parse(toParam, true);
  return from && to && from <= to ? { from, to } : fallback;
}

export function useCurrentMonth() {
  const [searchParams] = useSearchParams();
  const fromParam = searchParams.get("from");
  const toParam = searchParams.get("to");
  const hour = useSyncExternalStore(subscribeToHour, currentLocalHour);
  return useMemo(() => {
    const now = new Date(hour);
    return { ...resolvePeriod(fromParam, toParam, now), now };
  }, [fromParam, toParam, hour]);
}
