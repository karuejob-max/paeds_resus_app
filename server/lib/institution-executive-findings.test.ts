import { describe, expect, it } from "vitest";
import { buildExecutiveFindings, type ExecutiveDepartment } from "./institution-executive-findings";

const config = { minimumStaff: 5, lifeSupportFloor: 0.8, cpdAttendanceFloor: 0.5 };
const department = (overrides: Partial<ExecutiveDepartment> = {}): ExecutiveDepartment => ({ id: 1, name: "Paediatric Ward", activeStaff: 10, lifeSupportCurrentOrExpiring: 9, lifeSupportMissing: 1, credentialsExpired: 0, credentialsExpiringWithin90Days: 0, cpdVerifiedAttendance: 8, cpdAttendanceDenominator: 10, qiOverdueActions: 0, smallGroup: false, ...overrides });

describe("buildExecutiveFindings", () => {
  it("handles no departments and missing history without inventing conclusions", () => {
    const result = buildExecutiveFindings([], config);
    expect(result.headline[0].ruleId).toBe("HEADLINE_NO_DEPARTMENTS");
    expect(result.comparison.ruleId).toBe("COMPARISON_NO_PRIOR_SNAPSHOT");
    expect(result.needsSupport).toHaveLength(0);
  });

  it("flags life support, credential, CPD, and QI support rules with traceable metrics", () => {
    const result = buildExecutiveFindings([department({ lifeSupportCurrentOrExpiring: 5, lifeSupportMissing: 5, credentialsExpired: 1, cpdVerifiedAttendance: 1, qiOverdueActions: 2 })], config);
    expect(result.needsSupport.map(item => item.ruleId)).toEqual(expect.arrayContaining(["NEEDS_SUPPORT_LIFE_SUPPORT_FLOOR", "NEEDS_SUPPORT_EXPIRED_CREDENTIALS", "NEEDS_SUPPORT_CPD_ACTIVITY_FLOOR", "NEEDS_SUPPORT_OVERDUE_QI"]));
    expect(result.needsSupport.every(item => item.metric.numerator != null && item.metric.denominator != null)).toBe(true);
  });

  it("excludes tiny departments from strongest/weakest-style doing-well findings", () => {
    const result = buildExecutiveFindings([department({ activeStaff: 4, smallGroup: true, lifeSupportCurrentOrExpiring: 4 })], config);
    expect(result.doingWell).toHaveLength(0);
  });

  it("handles zero staff and unavailable metrics without divide-by-zero", () => {
    const result = buildExecutiveFindings([department({ activeStaff: 0, lifeSupportCurrentOrExpiring: null, lifeSupportMissing: null, cpdVerifiedAttendance: null, cpdAttendanceDenominator: null })], config);
    expect(result.needsSupport).toHaveLength(0);
    expect(result.doingWell).toHaveLength(0);
  });

  it("preserves ties rather than creating a composite rank", () => {
    const result = buildExecutiveFindings([department({ id: 1, name: "A" }), department({ id: 2, name: "B" })], config);
    expect(result.doingWell.filter(item => item.ruleId === "DOING_WELL_LIFE_SUPPORT_MAX")).toHaveLength(2);
  });

  it("returns a safe comparison statement when history exists", () => {
    expect(buildExecutiveFindings([department()], config, true).comparison.ruleId).toBe("COMPARISON_SAFE_PRIOR_AVAILABLE");
  });
});
