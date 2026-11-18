import { afterEach, expect, it, vi } from "vitest";
import { currentLocalHour, subscribeToHour } from "../lib/local-clock";
import { resolvePeriod } from "./use-current-month";

afterEach(() => vi.useRealTimers());

it("updates the default period at local midnight and preserves an explicit range", () => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date(2026, 11, 31, 23, 59, 59, 999));
  const period = () => resolvePeriod(null, null, new Date(currentLocalHour()));
  expect(period().to).toEqual(new Date(2026, 11, 31, 23, 59, 59, 999));
  const notify = vi.fn();
  const unsubscribe = subscribeToHour(notify);

  vi.advanceTimersByTime(1);
  expect(notify).toHaveBeenCalledTimes(1);
  const now = new Date(currentLocalHour());
  expect(now).toEqual(new Date(2027, 0, 1));
  expect(period().from).toEqual(now);
  expect(period().to).toEqual(new Date(2027, 0, 31, 23, 59, 59, 999));
  expect(resolvePeriod("2026-12-10", "2026-12-12", now)).toEqual({
    from: new Date(2026, 11, 10),
    to: new Date(2026, 11, 12, 23, 59, 59, 999),
  });

  vi.advanceTimersByTime(3_600_000);
  expect(notify).toHaveBeenCalledTimes(2);
  unsubscribe();
  vi.advanceTimersByTime(3_600_000);
  expect(notify).toHaveBeenCalledTimes(2);
});
