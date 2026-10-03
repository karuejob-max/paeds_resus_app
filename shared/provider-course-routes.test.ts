import { describe, expect, it } from "vitest";
import {
  getAhaNextPhaseAction,
  getIerpNextAction,
  getNerpNextAction,
  getProviderCourseDestination,
  isProviderProgramSlug,
} from "./provider-course-routes";

describe("provider course routes", () => {
  it("recognizes Institutional Life Support as a provider programme, not an AHA slug", () => {
    expect(isProviderProgramSlug("paeds_resus_ils")).toBe(true);
  });

  it("opens Institutional Life Support in the shared interactive course player", () => {
    expect(getProviderCourseDestination("paeds_resus_ils", 42)).toBe(
      "/micro-course/paeds-resus-competency?programType=paeds_resus_ils&enrollmentId=42"
    );
  });
});

describe("getAhaNextPhaseAction", () => {
  it("opens the course player for unfinished cognitive learning", () => {
    expect(getAhaNextPhaseAction("bls", 301, 47, false, false, "active")).toEqual({
      phase: "cognitive",
      destination: "/micro-course/47?programType=bls&enrollmentId=301",
      label: "Continue cognitive modules",
    });
  });

  it("opens practical booking after cognitive completion", () => {
    expect(getAhaNextPhaseAction("acls", 302, 52, true, false, "active")).toEqual({
      phase: "practical",
      destination: "/aha-book-session?programType=acls&enrollmentId=302",
      label: "Book hands-on session",
    });
  });

  it("opens certificates after both phases are complete", () => {
    expect(getAhaNextPhaseAction("pals", 303, undefined, true, true, "active")).toEqual({
      phase: "completed",
      destination: "/certificates",
      label: "View course certificates",
    });
  });

  it("routes cancelled enrollments to review instead of resuming them", () => {
    expect(getAhaNextPhaseAction("nrp", 304, undefined, false, false, "cancelled")).toEqual({
      phase: "review",
      destination: "/aha-courses",
      label: "Review enrollment",
    });
  });
});

describe("pathway next actions", () => {
  it("routes NERP to the unfinished BLS, then Phase 2, payment, and Phase 3", () => {
    expect(getNerpNextAction({ bls: { id: 11, courseId: 101 }, acls: { id: 12, courseId: 102 }, phase2Verified: false, phase3Verified: false, paymentComplete: false })).toMatchObject({ phase: "phase_1", label: "Continue BLS cognitive learning", destination: "/micro-course/101?programType=bls&enrollmentId=11&pathway=nerp" });
    expect(getNerpNextAction({ bls: { id: 11, courseId: 101, cognitiveComplete: true }, acls: { id: 12, courseId: 102 }, phase2Verified: false, phase3Verified: false, paymentComplete: false }).label).toBe("Continue ACLS cognitive learning");
    expect(getNerpNextAction({ bls: { cognitiveComplete: true }, acls: { cognitiveComplete: true }, phase2Verified: false, phase3Verified: false, paymentComplete: false }).phase).toBe("phase_2");
    expect(getNerpNextAction({ bls: { cognitiveComplete: true }, acls: { cognitiveComplete: true }, phase2Verified: true, phase3Verified: false, paymentComplete: false }).phase).toBe("payment");
    expect(getNerpNextAction({ bls: { cognitiveComplete: true }, acls: { cognitiveComplete: true }, phase2Verified: true, phase3Verified: false, paymentComplete: true }).phase).toBe("phase_3");
  });

  it("routes IERP to evidence, simulations, payment, and Phase 3 after BLS/ACLS", () => {
    expect(getIerpNextAction({ bls: { id: 21, courseId: 201 }, acls: { id: 22, courseId: 202 }, phaseStatus: "phase_1", phase1Complete: false, paymentComplete: false })).toMatchObject({ phase: "phase_1", label: "Continue IERP BLS learning" });
    expect(getIerpNextAction({ bls: { cognitiveComplete: true }, acls: { cognitiveComplete: true }, phaseStatus: "phase_1", phase1Complete: false, paymentComplete: false }).label).toBe("Submit IERP Phase 1 evidence");
    expect(getIerpNextAction({ bls: { cognitiveComplete: true }, acls: { cognitiveComplete: true }, phaseStatus: "phase_2", phase1Complete: true, paymentComplete: false }).phase).toBe("phase_2");
    expect(getIerpNextAction({ bls: { cognitiveComplete: true }, acls: { cognitiveComplete: true }, phaseStatus: "phase_3", phase1Complete: true, paymentComplete: false }).phase).toBe("payment");
    expect(getIerpNextAction({ bls: { cognitiveComplete: true }, acls: { cognitiveComplete: true }, phaseStatus: "phase_3", phase1Complete: true, paymentComplete: true }).phase).toBe("phase_3");
  });
});
