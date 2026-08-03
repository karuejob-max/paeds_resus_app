import { describe, it, expect, vi, beforeEach } from "vitest";

/**
 * Rewritten 2026-07-29 to close a real gap found in code review: these
 * tests previously required a live DATABASE_URL (a describe-level guard
 * checking for hasDatabase before running), which CI never sets --
 * meaning they had never actually executed even once in the pipeline
 * that's supposed to protect merges. This version fully mocks the
 * database layer, following the same pattern already used by
 * care-signal-redact-pause.test.ts and care-signal-redact-backoff.test.ts,
 * so these now run for real on every CI pass with no infrastructure change.
 *
 * See scripts/check-db-test-coverage.mjs (added separately, also
 * 2026-07-29) for the complementary fix: making it loud and visible in CI
 * output whenever some OTHER test file still needs a real database and
 * therefore silently skipped, so a green check is never mistaken for
 * "everything ran."
 */

vi.mock("../_core/env", () => ({
  ENV: { llmFeaturesEnabled: true },
}));

const mockInvokeLLM = vi.fn();
vi.mock("../_core/llm", () => ({
  invokeLLM: (params: any) => mockInvokeLLM(params),
}));

/**
 * Builds a minimal mock DbClient covering exactly the chain shapes
 * redactPendingNarratives actually calls: db.select().from().where().limit()
 * for candidates, and db.update().set().where() for writing results.
 * `candidates` is what the mocked select resolves to; `updateSpy` lets a
 * test assert on the exact payload passed to .set(...).
 */
function buildMockDb(candidates: any[]) {
  const updateSpy = vi.fn();
  const mockDb = {
    select: vi.fn().mockReturnValue({
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue(candidates),
    }),
    update: vi.fn().mockReturnValue({
      set: (payload: any) => {
        updateSpy(payload);
        return { where: vi.fn().mockResolvedValue(undefined) };
      },
    }),
  };
  return { mockDb, updateSpy };
}

describe("redactPendingNarratives (fully mocked, no database needed)", () => {
  beforeEach(() => {
    mockInvokeLLM.mockReset();
  });

  it("processes a pending narrative successfully and writes the redacted text plus updated retry state", async () => {
    const { redactPendingNarratives } = await import("./care-signal-redact");
    const rawNarrative = "My patient John Doe was treated at Consolata Hospital.";
    const { mockDb, updateSpy } = buildMockDb([
      { id: 42, rawNarrative, redactionAttempts: 0, redactionLastAttemptAt: null },
    ]);

    mockInvokeLLM.mockResolvedValueOnce({
      choices: [{ message: { role: "assistant", content: "My patient [PATIENT] was treated at [FACILITY]." } }],
    });

    const result = await redactPendingNarratives(mockDb as any);

    expect(result.processed).toBe(1);
    expect(result.succeeded).toBe(1);
    expect(result.failed).toBe(0);

    // The narrative sent to the LLM should be the raw, unredacted text.
    expect(mockInvokeLLM).toHaveBeenCalledTimes(1);
    const callArgs = mockInvokeLLM.mock.calls[0][0];
    expect(callArgs.messages[1].content).toBe(rawNarrative);

    // The write should carry the redacted text, an incremented attempt
    // count, a fresh lastAttemptAt, and a cleared error field.
    expect(updateSpy).toHaveBeenCalledTimes(1);
    const setPayload = updateSpy.mock.calls[0][0];
    expect(setPayload.redactedNarrative).toBe("My patient [PATIENT] was treated at [FACILITY].");
    expect(setPayload.redactionAttempts).toBe(1);
    expect(setPayload.redactionLastAttemptAt).toBeInstanceOf(Date);
    expect(setPayload.redactionLastError).toBeNull();
  });

  it("records the failure and increments attempts on a rate-limit error, without writing a redactedNarrative", async () => {
    const { redactPendingNarratives } = await import("./care-signal-redact");
    const { mockDb, updateSpy } = buildMockDb([
      { id: 7, rawNarrative: "Another raw narrative context.", redactionAttempts: 0, redactionLastAttemptAt: null },
    ]);

    mockInvokeLLM.mockRejectedValueOnce(new Error("LLM invoke failed: 429 Too Many Requests"));

    const result = await redactPendingNarratives(mockDb as any);

    expect(result.processed).toBe(1);
    expect(result.succeeded).toBe(0);
    expect(result.failed).toBe(1);

    expect(updateSpy).toHaveBeenCalledTimes(1);
    const setPayload = updateSpy.mock.calls[0][0];
    expect(setPayload.redactedNarrative).toBeUndefined();
    expect(setPayload.redactionAttempts).toBe(1);
    expect(setPayload.redactionLastError).toContain("429");
  });

  it("stops processing the rest of the batch after a rate-limit error, rather than hammering every remaining candidate", async () => {
    const { redactPendingNarratives } = await import("./care-signal-redact");
    const { mockDb } = buildMockDb([
      { id: 1, rawNarrative: "First narrative.", redactionAttempts: 0, redactionLastAttemptAt: null },
      { id: 2, rawNarrative: "Second narrative.", redactionAttempts: 0, redactionLastAttemptAt: null },
      { id: 3, rawNarrative: "Third narrative.", redactionAttempts: 0, redactionLastAttemptAt: null },
    ]);

    mockInvokeLLM.mockRejectedValueOnce(new Error("429 Too Many Requests"));

    await redactPendingNarratives(mockDb as any);

    // Only the first candidate should have been attempted before the
    // batch-level early exit on a rate limit.
    expect(mockInvokeLLM).toHaveBeenCalledTimes(1);
  });

  it("treats an empty/whitespace-only narrative as immediately resolved, not a failure -- and never touches retry state for it", async () => {
    const { redactPendingNarratives } = await import("./care-signal-redact");
    const { mockDb, updateSpy } = buildMockDb([
      { id: 9, rawNarrative: "   ", redactionAttempts: 0, redactionLastAttemptAt: null },
    ]);

    const result = await redactPendingNarratives(mockDb as any);

    expect(result.succeeded).toBe(1);
    expect(mockInvokeLLM).not.toHaveBeenCalled();
    expect(updateSpy).toHaveBeenCalledWith({ redactedNarrative: "" });
  });
});
