import { describe, expect, it } from "vitest";
import {
  EXAM_POLICY_ANCHOR_AHA,
  EXAM_POLICY_ANCHOR_FELLOWSHIP,
  EXAM_POLICY_TRACK_INTROS,
  examPolicyHref,
} from "./exam-policy-learner-content";

describe("exam-policy-learner-content", () => {
  it("builds deep links for Fellowship and AHA sections", () => {
    expect(examPolicyHref()).toBe("/learning/exam-policy");
    expect(examPolicyHref("fellowship")).toBe(
      `/learning/exam-policy#${EXAM_POLICY_ANCHOR_FELLOWSHIP}`
    );
    expect(examPolicyHref("aha")).toBe(`/learning/exam-policy#${EXAM_POLICY_ANCHOR_AHA}`);
  });

  it("defines track intro anchors for deep links", () => {
    const ids = EXAM_POLICY_TRACK_INTROS.map((t) => t.id);
    expect(ids).toContain(EXAM_POLICY_ANCHOR_FELLOWSHIP);
    expect(ids).toContain(EXAM_POLICY_ANCHOR_AHA);
  });
});
