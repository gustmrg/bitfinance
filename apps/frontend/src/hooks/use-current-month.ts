import { useMemo } from "react";
import { useSearchParams } from "react-router-dom";

export function useCurrentMonth() {
  const [searchParams] = useSearchParams();
  const fromParam = searchParams.get("from");
  const toParam = searchParams.get("to");
  return useMemo(() => {
    const now = new Date();
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
  }, [fromParam, toParam]);
}
