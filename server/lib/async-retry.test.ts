import { describe, it, expect, vi } from "vitest";
import { runWithRetries } from "./async-retry";

describe("runWithRetries", () => {
  it("returns result on first success", async () => {
    const fn = vi.fn().mockResolvedValue(42);
    await expect(runWithRetries(fn, { retries: 3, delayMs: 1 })).resolves.toBe(42);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("retries then succeeds", async () => {
    const fn = vi
      .fn()
      .mockRejectedValueOnce(new Error("transient"))
      .mockResolvedValueOnce("ok");
    await expect(runWithRetries(fn, { retries: 3, delayMs: 1 })).resolves.toBe("ok");
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it("throws last error after exhausting retries", async () => {
    const err = new Error("hard fail");
    const fn = vi.fn().mockRejectedValue(err);
    await expect(runWithRetries(fn, { retries: 2, delayMs: 1 })).rejects.toThrow("hard fail");
    expect(fn).toHaveBeenCalledTimes(2);
  });
});
