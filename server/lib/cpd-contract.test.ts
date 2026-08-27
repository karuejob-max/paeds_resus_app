import { describe, expect, it } from "vitest";
import {
  canArchiveEvent,
  canRegisterForEvent,
  canReviewAttendanceTransition,
  countsAsVerifiedAttendance,
  disambiguatedMemberLabel,
  isAudienceEligible,
} from "./cpd-contract";

describe("CPD remediation contract", () => {
  it("counts only attendance_verified as attendance", () => {
    expect(countsAsVerifiedAttendance("registered")).toBe(false);
    expect(countsAsVerifiedAttendance("checked_in")).toBe(false);
    expect(countsAsVerifiedAttendance("attendance_verified")).toBe(true);
    expect(countsAsVerifiedAttendance("excused")).toBe(false);
    expect(countsAsVerifiedAttendance(null)).toBe(false);
  });

  it("allows registration only for an open event", () => {
    expect(canRegisterForEvent("open", true)).toBe(true);
    expect(canRegisterForEvent("scheduled", true)).toBe(true);
    expect(canRegisterForEvent("closed", true)).toBe(false);
    expect(canRegisterForEvent("open", false)).toBe(false);
  });

  it("does not allow re-archiving voided or archived sessions", () => {
    expect(canArchiveEvent("open")).toBe(true);
    expect(canArchiveEvent("closed")).toBe(true);
    expect(canArchiveEvent("archived")).toBe(false);
    expect(canArchiveEvent("voided")).toBe(false);
  });

  it("keeps attendance review forward-only after a terminal decision", () => {
    expect(canReviewAttendanceTransition("registered", "checked_in")).toBe(true);
    expect(canReviewAttendanceTransition("checked_in", "attendance_verified")).toBe(true);
    expect(canReviewAttendanceTransition("registered", "attendance_verified")).toBe(true);
    expect(canReviewAttendanceTransition("attendance_verified", "attendance_verified")).toBe(true);
    expect(canReviewAttendanceTransition("attendance_verified", "registered")).toBe(false);
    expect(canReviewAttendanceTransition("excused", "checked_in")).toBe(false);
    expect(canReviewAttendanceTransition("cancelled", "attendance_verified")).toBe(false);
  });

  it("enforces department and other-cadre audience matching", () => {
    expect(isAudienceEligible({
      audienceScope: "department",
      audienceLabel: null,
      attendeeCadre: "RN",
      attendeeDepartmentId: 4,
      eventDepartmentId: 4,
    })).toBe(true);
    expect(isAudienceEligible({
      audienceScope: "department",
      audienceLabel: null,
      attendeeCadre: "RN",
      attendeeDepartmentId: 5,
      eventDepartmentId: 4,
    })).toBe(false);
    expect(isAudienceEligible({
      audienceScope: "other_cadre",
      audienceLabel: "Laboratory",
      attendeeCadre: "Nursing",
      attendeeDepartmentId: null,
      eventDepartmentId: null,
    })).toBe(false);
  });

  it("enforces nursing and clinical audience boundaries", () => {
    expect(isAudienceEligible({
      audienceScope: "nursing_wide",
      audienceLabel: null,
      attendeeCadre: "RN",
      attendeeDepartmentId: null,
      eventDepartmentId: null,
    })).toBe(true);
    expect(isAudienceEligible({
      audienceScope: "nursing_wide",
      audienceLabel: null,
      attendeeCadre: "Doctor",
      attendeeDepartmentId: null,
      eventDepartmentId: null,
    })).toBe(false);
    expect(isAudienceEligible({
      audienceScope: "clinical",
      audienceLabel: null,
      attendeeCadre: "Support Staff",
      attendeeDepartmentId: null,
      eventDepartmentId: null,
    })).toBe(false);
    expect(isAudienceEligible({
      audienceScope: "m_and_m",
      audienceLabel: null,
      attendeeCadre: "Doctor",
      attendeeDepartmentId: null,
      eventDepartmentId: null,
    })).toBe(true);
  });

  it("disambiguates presenters who share names", () => {
    expect(disambiguatedMemberLabel({
      fullName: "Esther Mwangi",
      department: "Paediatrics",
      cadre: "RN",
      email: "esther@example.com",
    })).toBe("Esther Mwangi · Paediatrics · RN · esther@example.com");
  });
});
