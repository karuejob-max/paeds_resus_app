import { describe, it, expect } from "vitest";
import {
  defaultIssueTypeForCategory,
  defaultSeverityForCategory,
  FEEDBACK_STATUS_LABELS,
} from "./platform-feedback";

describe("platform-feedback helpers", () => {
  it("maps product category to default issue type", () => {
    expect(defaultIssueTypeForCategory("course_content")).toBe("content");
    expect(defaultIssueTypeForCategory("payment_technical")).toBe("billing");
    expect(defaultIssueTypeForCategory("safety_concern")).toBe("clinical");
  });

  it("elevates severity for safety", () => {
    expect(defaultSeverityForCategory("other")).toBe("medium");
    expect(defaultSeverityForCategory("safety_concern", "safety")).toBe("high");
  });

  it("uses CEO-friendly status labels", () => {
    expect(FEEDBACK_STATUS_LABELS.open).toBe("Pending");
    expect(FEEDBACK_STATUS_LABELS.resolved).toBe("Fixed");
  });
});
