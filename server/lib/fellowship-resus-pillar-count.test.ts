import { describe, expect, it } from "vitest";
import {
  isFellowshipMicrocourseResusCondition,
  normalizeToFellowshipResusConditionId,
} from "../../shared/fellowship-microcourse-resus-conditions";

/** Mirrors calculateResusGPSPillar credit aggregation (one credit per completed session). */
function countFellowshipResusCredits(input: {
  sessions: Array<{ sessionId: string; primaryDiagnosis: string; status: string }>;
  cases: Array<{ sessionId: string; diagnosis: string }>;
}): Record<string, number> {
  const completedSessionIds = new Set(
    input.sessions.filter((s) => s.status === "completed").map((s) => s.sessionId)
  );
  const creditBySession = new Map<string, string>();

  for (const s of input.sessions) {
    if (s.status !== "completed") continue;
    const condition = normalizeToFellowshipResusConditionId(s.primaryDiagnosis);
    if (isFellowshipMicrocourseResusCondition(condition)) {
      creditBySession.set(s.sessionId, condition);
    }
  }

  for (const c of input.cases) {
    if (!completedSessionIds.has(c.sessionId)) continue;
    const condition = normalizeToFellowshipResusConditionId(c.diagnosis);
    if (isFellowshipMicrocourseResusCondition(condition)) {
      creditBySession.set(c.sessionId, condition);
    }
  }

  const casesByCondition: Record<string, number> = {};
  for (const condition of creditBySession.values()) {
    casesByCondition[condition] = (casesByCondition[condition] || 0) + 1;
  }
  return casesByCondition;
}

describe("Fellowship ResusGPS pillar counting", () => {
  it("credits completed session primary diagnosis when no case row exists", () => {
    const counts = countFellowshipResusCredits({
      sessions: [
        { sessionId: "resus-1", primaryDiagnosis: "severe_asthma", status: "completed" },
      ],
      cases: [],
    });
    expect(counts.severe_asthma).toBe(1);
  });

  it("prefers case diagnosis over session primary for the same session", () => {
    const counts = countFellowshipResusCredits({
      sessions: [
        { sessionId: "resus-1", primaryDiagnosis: "general_resus", status: "completed" },
      ],
      cases: [{ sessionId: "resus-1", diagnosis: "severe_asthma" }],
    });
    expect(counts.severe_asthma).toBe(1);
    expect(counts.general_resus).toBeUndefined();
  });

  it("does not double-count when session and case match", () => {
    const counts = countFellowshipResusCredits({
      sessions: [
        { sessionId: "resus-1", primaryDiagnosis: "severe_asthma", status: "completed" },
      ],
      cases: [{ sessionId: "resus-1", diagnosis: "severe_asthma" }],
    });
    expect(counts.severe_asthma).toBe(1);
  });

  it("credits DKA primary diagnosis on completed session", () => {
    const counts = countFellowshipResusCredits({
      sessions: [{ sessionId: "resus-dka", primaryDiagnosis: "dka", status: "completed" }],
      cases: [],
    });
    expect(counts.dka).toBe(1);
  });

  it("ignores cases whose session is not completed", () => {
    const counts = countFellowshipResusCredits({
      sessions: [
        { sessionId: "resus-1", primaryDiagnosis: "severe_asthma", status: "ongoing" },
      ],
      cases: [{ sessionId: "resus-1", diagnosis: "severe_asthma" }],
    });
    expect(counts.severe_asthma).toBeUndefined();
  });
});
