import { beforeEach, describe, expect, it, vi } from "vitest";
import { ahaPracticeLabAttempts, simulationWorldEvidence } from "../../drizzle/schema";
import { createAdultAclsSimulation, type AdultAclsState } from "../../shared/adult-acls-simulation-world";
import { persistAdultAclsCompletion } from "./persist-acls-completion";
import { reconcilePhase2Completion } from "./phase2-completion";

vi.mock("./phase2-completion", () => ({
  reconcilePhase2Completion: vi.fn(async () => ({ status: {}, action: "unchanged" })),
}));

type InsertCall = { table: unknown; values: Record<string, unknown> };

function makeDb(calls: InsertCall[]) {
  return {
    insert(table: unknown) {
      return {
        async values(values: Record<string, unknown>) {
          calls.push({ table, values });
        },
      };
    },
  };
}

function params(mode?: "guided" | "standard") {
  const state = createAdultAclsSimulation("unstable-bradycardia", "team_leader", mode ?? "standard");
  return {
    db: undefined as unknown,
    session: {
      id: 44,
      userId: 7,
      enrollmentId: 88,
      scenarioId: state.scenarioId,
      scenarioVersion: "test-version",
      role: "team_leader",
      ...(mode === undefined ? {} : { mode }),
    },
    state: state as AdultAclsState,
    score: 80,
    scoreBreakdown: { score: 80, reasons: [], components: [] } as never,
    userId: 7,
  };
}

describe("persistAdultAclsCompletion", () => {
  beforeEach(() => vi.clearAllMocks());

  it("writes one qualifying attempt and evidence row, then reconciles Standard", async () => {
    const calls: InsertCall[] = [];
    const input = params("standard");
    const result = await persistAdultAclsCompletion({ ...input, db: makeDb(calls) });

    expect(result).toMatchObject({ countsTowardPhase2: true, evidenceStatus: "review_required" });
    expect(calls).toHaveLength(2);
    expect(calls.map((call) => call.table)).toEqual([ahaPracticeLabAttempts, simulationWorldEvidence]);
    expect(reconcilePhase2Completion).toHaveBeenCalledTimes(1);
  });

  it("writes only formative evidence for Guided and never reconciles", async () => {
    const calls: InsertCall[] = [];
    const input = params("guided");
    const result = await persistAdultAclsCompletion({ ...input, db: makeDb(calls) });

    expect(result).toMatchObject({ countsTowardPhase2: false, evidenceStatus: "formative_only" });
    expect(calls).toHaveLength(1);
    expect(calls[0].table).toBe(simulationWorldEvidence);
    expect(calls[0].values).toMatchObject({ evidenceStatus: "rejected" });
    expect(reconcilePhase2Completion).not.toHaveBeenCalled();
  });

  it("treats a missing legacy mode as Standard", async () => {
    const calls: InsertCall[] = [];
    const input = params();
    const result = await persistAdultAclsCompletion({ ...input, db: makeDb(calls) });

    expect(result.countsTowardPhase2).toBe(true);
    expect(calls).toHaveLength(2);
    expect(reconcilePhase2Completion).toHaveBeenCalledTimes(1);
  });
});
