import { describe, it, expect, vi, beforeEach } from "vitest";

/**
 * Tests for the master LLM kill switch (2026-07-29, added after discovering
 * the Gemini key was still on Google's free tier while user-facing AI
 * features and the Care Signal redaction cron were already live). See
 * ENV.llmFeaturesEnabled's doc comment in server/_core/env.ts for the full
 * rationale, and care-signal-redact.ts / ai-assistant.ts for how callers
 * are expected to handle LlmFeaturesDisabledError.
 *
 * ENV is a plain object computed once at module import time from
 * process.env, so each test that needs a specific value mocks the whole
 * ../_core/env module rather than mutating process.env after the fact
 * (which would have no effect on an already-imported ENV object).
 */

describe("invokeLLM kill switch (ENV.llmFeaturesEnabled)", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("throws LlmFeaturesDisabledError, not a generic Error, when the flag is off (today's actual default/production state)", async () => {
    vi.doMock("../_core/env", () => ({
      ENV: { llmFeaturesEnabled: false, geminiApiKey: "", forgeApiUrl: "", forgeApiKey: "" },
    }));
    const { invokeLLM, LlmFeaturesDisabledError } = await import("./llm");

    await expect(invokeLLM({ messages: [{ role: "user", content: "hi" }] })).rejects.toBeInstanceOf(
      LlmFeaturesDisabledError
    );
  });

  it("checks the kill switch BEFORE the API-key check, so a misleading 'not configured' error never masks the real reason (deliberately paused, not misconfigured)", async () => {
    vi.doMock("../_core/env", () => ({
      // Deliberately give it a real-looking key too, to prove the switch
      // is checked first regardless of whether a key is present.
      ENV: { llmFeaturesEnabled: false, geminiApiKey: "fake-key-that-looks-valid", forgeApiUrl: "", forgeApiKey: "" },
    }));
    const { invokeLLM, LlmFeaturesDisabledError } = await import("./llm");

    await expect(invokeLLM({ messages: [{ role: "user", content: "hi" }] })).rejects.toBeInstanceOf(
      LlmFeaturesDisabledError
    );
  });

  it("does NOT throw LlmFeaturesDisabledError when the flag is on (falls through to the normal API-key check instead)", async () => {
    vi.doMock("../_core/env", () => ({
      ENV: { llmFeaturesEnabled: true, geminiApiKey: "", forgeApiUrl: "", forgeApiKey: "" },
    }));
    const { invokeLLM, LlmFeaturesDisabledError } = await import("./llm");

    // No API key configured either, so it should still reject -- just with
    // the normal "not configured" error, never LlmFeaturesDisabledError.
    await expect(invokeLLM({ messages: [{ role: "user", content: "hi" }] })).rejects.not.toBeInstanceOf(
      LlmFeaturesDisabledError
    );
  });
});
