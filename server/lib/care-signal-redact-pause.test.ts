import { describe, it, expect, vi } from "vitest";

/**
 * Tests the redaction cron's kill-switch behavior specifically -- separate
 * from care-signal-redact.test.ts's DB-dependent tests (which mock the
 * switch as always-on so they can focus on the actual processing logic).
 *
 * This is the more important test file of the two in day-to-day terms:
 * as of 2026-07-29, LLM_FEATURES_ENABLED defaults to off, meaning THIS is
 * the code path actually running in production every 10 minutes right
 * now, not the one in care-signal-redact.test.ts. It needs no database at
 * all, since redactPendingNarratives returns before ever querying one --
 * proven here by passing a `db` stub that throws if touched.
 */

vi.mock("../_core/env", () => ({
  ENV: { llmFeaturesEnabled: false },
}));

const mockInvokeLLM = vi.fn();
vi.mock("../_core/llm", () => ({
  invokeLLM: (params: any) => mockInvokeLLM(params),
}));

describe("redactPendingNarratives kill-switch path (LLM_FEATURES_ENABLED=false, today's actual default)", () => {
  it("returns processed=0 immediately without touching the database at all", async () => {
    const { redactPendingNarratives } = await import("./care-signal-redact");

    const dbThatThrowsIfQueried = {
      select: () => {
        throw new Error("redactPendingNarratives queried the database despite the kill switch being off");
      },
    } as any;

    const result = await redactPendingNarratives(dbThatThrowsIfQueried);

    expect(result).toEqual({ processed: 0, succeeded: 0, failed: 0, skippedBackoff: 0 });
  });

  it("never calls invokeLLM while paused", async () => {
    const { redactPendingNarratives } = await import("./care-signal-redact");
    const dbThatThrowsIfQueried = { select: () => { throw new Error("should not be queried"); } } as any;

    await redactPendingNarratives(dbThatThrowsIfQueried);

    expect(mockInvokeLLM).not.toHaveBeenCalled();
  });
});
