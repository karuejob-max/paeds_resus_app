import { describe, expect, it } from "vitest";
import {
  createSession,
  exportSessionSummaryOnePager,
  startQuickAssessment,
} from "./resus/abcdeEngine";

describe("exportSessionSummaryOnePager", () => {
  it("returns a compact summary with training disclaimer", () => {
    let s = createSession(12, "4 years", false);
    s = startQuickAssessment(s);
    const text = exportSessionSummaryOnePager(s);
    expect(text).toContain("HANDOFF SUMMARY");
    expect(text).toContain("Weight 12 kg");
    expect(text).toContain("Training only");
  });
});
