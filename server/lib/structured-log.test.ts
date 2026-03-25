import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { logStructured } from "./structured-log";

describe("logStructured", () => {
  beforeEach(() => {
    vi.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("emits one JSON line with ts, tag, and fields", () => {
    logStructured("test_event", { id: 1, ok: true, note: null });

    expect(console.log).toHaveBeenCalledTimes(1);
    const line = (console.log as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
    const parsed = JSON.parse(line) as Record<string, unknown>;

    expect(parsed.tag).toBe("test_event");
    expect(parsed.id).toBe(1);
    expect(parsed.ok).toBe(true);
    expect(parsed.note).toBeNull();
    expect(typeof parsed.ts).toBe("string");
  });
});
