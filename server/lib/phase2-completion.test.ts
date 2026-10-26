import { describe, expect, it } from "vitest";
import { decidePhase2CompletionAction } from "./phase2-completion";

const V = "phase2-current";
const active = (version = V) => ({ active: true, requirementSetVersion: version });
const revoked = { active: false, requirementSetVersion: V };

describe("decidePhase2CompletionAction", () => {
  it("creates a completion when a supported lane becomes ready and none exists", () => {
    expect(decidePhase2CompletionAction({ supported: true, ready: true, existing: null, currentVersion: V })).toBe("upsert");
  });
  it("is idempotent when an active current-version completion already exists", () => {
    expect(decidePhase2CompletionAction({ supported: true, ready: true, existing: active(), currentVersion: V })).toBe("noop");
  });
  it("refreshes a stale-version or previously revoked completion when the learner is ready again", () => {
    expect(decidePhase2CompletionAction({ supported: true, ready: true, existing: active("old"), currentVersion: V })).toBe("upsert");
    expect(decidePhase2CompletionAction({ supported: true, ready: true, existing: revoked, currentVersion: V })).toBe("upsert");
  });
  it("revokes an active completion that is no longer ready", () => {
    expect(decidePhase2CompletionAction({ supported: true, ready: false, existing: active(), currentVersion: V })).toBe("revoke");
  });
  it("does nothing when not ready and nothing is active", () => {
    expect(decidePhase2CompletionAction({ supported: true, ready: false, existing: null, currentVersion: V })).toBe("noop");
    expect(decidePhase2CompletionAction({ supported: true, ready: false, existing: revoked, currentVersion: V })).toBe("noop");
  });
  it("never creates a completion for an unsupported lane, even when evidence looks ready", () => {
    expect(decidePhase2CompletionAction({ supported: false, ready: true, existing: null, currentVersion: V })).toBe("noop");
    expect(decidePhase2CompletionAction({ supported: false, ready: true, existing: revoked, currentVersion: V })).toBe("noop");
  });
  it("revokes any active completion held by an unsupported lane", () => {
    expect(decidePhase2CompletionAction({ supported: false, ready: true, existing: active(), currentVersion: V })).toBe("revoke");
    expect(decidePhase2CompletionAction({ supported: false, ready: false, existing: active(), currentVersion: V })).toBe("revoke");
  });
});
