import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { streamUpdates } from "./stream-updates";

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

it("coalesces a burst without losing tokens and flushes the final response", () => {
  const publish = vi.fn();
  const updates = streamUpdates(publish);
  for (let i = 0; i < 100; i++) updates.append("x");
  expect(publish).not.toHaveBeenCalled();
  vi.advanceTimersByTime(50);
  expect(publish).toHaveBeenCalledTimes(1);
  expect(publish).toHaveBeenLastCalledWith("x".repeat(100));
  updates.append("end");
  updates.flush();
  expect(publish).toHaveBeenLastCalledWith("x".repeat(100) + "end");
  vi.runAllTimers();
  expect(publish).toHaveBeenCalledTimes(2);
});

it("discards pending partial output before retry and cancels its timer", () => {
  const publish = vi.fn();
  const updates = streamUpdates(publish);
  updates.append("failed partial");
  updates.reset();
  updates.append("complete retry");
  updates.flush();
  vi.runAllTimers();
  expect(publish.mock.calls).toEqual([[""], ["complete retry"]]);
});
