import { describe, expect, it } from "vitest";
import { examKindFromQuizTitle, summativePassed } from "../../shared/microcourse-exam-policy";

describe("microcourse-exam-gate helpers", () => {
  it("recognises governance quiz titles", () => {
    expect(examKindFromQuizTitle("Diagnostic baseline")).toBe("diagnostic");
    expect(examKindFromQuizTitle("Summative knowledge check")).toBe("summative");
  });

  it("summative pass threshold is 80", () => {
    expect(summativePassed(80)).toBe(true);
    expect(summativePassed(79)).toBe(false);
  });
});
