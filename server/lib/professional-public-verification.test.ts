import { describe, expect, it } from "vitest";
import { publicVerificationSnapshot } from "./professional-public-verification";

describe("public professional report verification", () => {
  it("returns an allowlisted minimum-disclosure projection", () => {
    const result = publicVerificationSnapshot({
      subject: { name: "Job Karue", email: "private@example.com", cadre: "PICU Nurse" },
      period: { type: "monthly", start: "2026-10-01", end: "2026-10-31" },
      reportScope: "activity",
      lifeSupport: [{ program: "BLS", percentage: 75, recordStatus: "in_progress", source: "NERP" }],
      certificates: [{ programType: "BLS", certificateNumber: "PRIVATE-CERT", verificationCode: "PUBLIC-CODE", verificationStatus: "verified" }],
      cpd: { verifiedSessions: 2, points: 4 },
      privateNarrative: "must not leak",
    });
    expect(result.subject).toEqual({ name: "Job Karue", cadre: "PICU Nurse" });
    expect(result.subject).not.toHaveProperty("email");
    expect(result.lifeSupport[0]).not.toHaveProperty("percentage");
    expect(result.certificates[0]).not.toHaveProperty("certificateNumber");
    expect(result).not.toHaveProperty("privateNarrative");
  });
});
