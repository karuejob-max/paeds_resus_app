import { describe, expect, it } from "vitest";
import { institutionLearningRouter } from "../routers/institution-learning";

const createSessionInput = (overrides: Record<string, unknown> = {}) => ({
  institutionId: 1,
  name: "Paediatric sepsis recognition",
  eventDate: "2026-08-31",
  eventDateAt: "2026-08-31",
  eventType: "cpd_general",
  audienceScope: "facility_wide",
  presenterUserId: 42,
  ...overrides,
});

describe("institution learning createSession contract", () => {
  const inputParser = (
    institutionLearningRouter._def.procedures.createSession as any
  )._def.inputs[0];

  it("accepts a session with a lead presenter and no co-presenters", () => {
    const result = inputParser.safeParse(createSessionInput());

    expect(result.success).toBe(true);
    expect(result.data.coPresenters).toEqual([]);
  });

  it("treats a legacy blank co-presenter row as no co-presenter", () => {
    const result = inputParser.safeParse(
      createSessionInput({ coPresenters: [{ userId: "" }] })
    );

    expect(result.success).toBe(true);
    expect(result.data.coPresenters).toEqual([]);
  });

  it("continues to reject a nonblank co-presenter without a valid member id", () => {
    const result = inputParser.safeParse(
      createSessionInput({ coPresenters: [{ userId: "not-a-member" }] })
    );

    expect(result.success).toBe(false);
    expect(
      result.error?.issues.some(
        (issue: { path: (string | number)[] }) =>
          issue.path.join(".") === "coPresenters.0.userId"
      )
    ).toBe(true);
  });
});
