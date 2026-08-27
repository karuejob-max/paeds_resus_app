import { describe, expect, it } from "vitest";
import {
  getIlsAssessmentGovernanceGaps,
  getIlsDeliveryReadinessGaps,
  shouldReleaseIlsCapacityOnPaymentFailure,
  getIlsPilotAcceptanceGaps,
  isIlsCertificateEligible,
  isIlsOrderReadyForPayment,
  canReplaceIlsProvider,
  getIlsSupportSlaHours,
  isIlsReminderDue,
} from "./ils-operations";

describe("ILS operational controls", () => {
  it("blocks payment readiness until every delivery gate is complete", () => {
    const gaps = getIlsDeliveryReadinessGaps({
      providerCount: 5,
      paymentStatus: "pending",
      deliverySessionStatus: "proposed",
      capacityConfirmed: false,
      instructorConfirmed: true,
      venueConfirmed: false,
      equipmentConfirmed: true,
      claimsAcknowledged: false,
      rosterConfirmed: false,
      practicalDateConfirmed: false,
    });

    expect(gaps).toEqual([
      "confirmed delivery session",
      "payment confirmation",
      "available delivery capacity",
      "venue",
      "certificate and AHA boundary acknowledgement",
      "final provider roster confirmation",
      "practical assessment date",
    ]);
    expect(
      isIlsOrderReadyForPayment({
        providerCount: 5,
        capacityConfirmed: false,
        instructorConfirmed: true,
        venueConfirmed: false,
        equipmentConfirmed: true,
        claimsAcknowledged: false,
        rosterConfirmed: false,
        practicalDateConfirmed: false,
      })
    ).toBe(false);
  });

  it("allows payment readiness only after delivery is confirmed", () => {
    expect(
      isIlsOrderReadyForPayment({
        providerCount: 5,
        deliverySessionStatus: "confirmed",
        capacityConfirmed: true,
        instructorConfirmed: true,
        venueConfirmed: true,
        equipmentConfirmed: true,
        claimsAcknowledged: true,
        rosterConfirmed: true,
        practicalDateConfirmed: true,
      })
    ).toBe(true);
  });

  it("requires paid cognitive completion and a practical pass for certification", () => {
    expect(
      isIlsCertificateEligible({
        paymentStatus: "completed",
        cognitiveModulesComplete: true,
        practicalResult: "pass",
      })
    ).toBe(true);
    expect(
      isIlsCertificateEligible({
        paymentStatus: "completed",
        cognitiveModulesComplete: true,
        practicalResult: "remediation_required",
      })
    ).toBe(false);
  });

  it("allows provider replacement only before learning or delivery starts", () => {
    expect(
      canReplaceIlsProvider({
        orderStatus: "payment_pending",
        sessionStatus: "confirmed",
        cognitiveModulesComplete: false,
        practicalSkillsSignedOff: false,
      })
    ).toBe(true);
    expect(
      canReplaceIlsProvider({
        orderStatus: "paid",
        sessionStatus: "in_progress",
        cognitiveModulesComplete: false,
        practicalSkillsSignedOff: false,
      })
    ).toBe(false);
    expect(
      canReplaceIlsProvider({
        orderStatus: "paid",
        sessionStatus: "confirmed",
        cognitiveModulesComplete: true,
        practicalSkillsSignedOff: false,
      })
    ).toBe(false);
  });

  it("blocks pilot expansion until the operational thresholds are met", () => {
    expect(
      getIlsPilotAcceptanceGaps({
        paymentToAccessSuccessPercent: 100,
        activationWithin7dPercent: 85,
        cognitiveWithin30dPercent: 82,
        practicalOpportunityWithin14dPercent: 95,
      })
    ).toEqual([]);
    expect(
      getIlsPilotAcceptanceGaps({
        paymentToAccessSuccessPercent: 80,
        activationWithin7dPercent: 70,
        cognitiveWithin30dPercent: 90,
        practicalOpportunityWithin14dPercent: 50,
      })
    ).toEqual([
      "payment-to-access success ≥90%",
      "provider activation within 7 days ≥80%",
      "practical opportunity within 14 days ≥90%",
    ]);
  });

  it("releases capacity only for an unpaid, non-terminal order after payment failure", () => {
    expect(
      shouldReleaseIlsCapacityOnPaymentFailure({
        orderStatus: "payment_pending",
        paymentStatus: "pending",
      })
    ).toBe(true);
    expect(
      shouldReleaseIlsCapacityOnPaymentFailure({
        orderStatus: "blocked",
        paymentStatus: "failed",
      })
    ).toBe(false);
    expect(
      shouldReleaseIlsCapacityOnPaymentFailure({
        orderStatus: "cancelled",
        paymentStatus: "failed",
      })
    ).toBe(false);
    expect(
      shouldReleaseIlsCapacityOnPaymentFailure({
        orderStatus: "paid",
        paymentStatus: "completed",
      })
    ).toBe(false);
  });

  it("requires calibrated checklist evidence and second review for remediation", () => {
    expect(
      getIlsAssessmentGovernanceGaps({
        result: "pass",
        checklistVersion: "ils-v1",
        assessorCalibrationConfirmed: true,
        hasSecondAssessor: false,
      })
    ).toEqual([]);
    expect(
      getIlsAssessmentGovernanceGaps({
        result: "remediation_required",
        checklistVersion: "ils-v1",
        assessorCalibrationConfirmed: false,
        hasSecondAssessor: false,
      })
    ).toEqual([
      "assessor calibration confirmation",
      "second approved assessor",
    ]);
    expect(
      getIlsAssessmentGovernanceGaps({
        result: "fail",
        checklistVersion: "",
        assessorCalibrationConfirmed: true,
        hasSecondAssessor: false,
      })
    ).toEqual(["checklist version"]);
  });

  it("uses bounded response targets for operational support priorities", () => {
    expect(getIlsSupportSlaHours("critical")).toBe(4);
    expect(getIlsSupportSlaHours("high")).toBe(24);
    expect(getIlsSupportSlaHours("normal")).toBe(72);
    expect(getIlsSupportSlaHours("low")).toBe(168);
  });

  it("only dispatches reminders at or after the due time and never twice", () => {
    const dueAt = new Date("2026-08-27T10:00:00Z");
    expect(
      isIlsReminderDue({
        dueAt,
        sentAt: null,
        now: new Date("2026-08-27T10:00:00Z"),
      })
    ).toBe(true);
    expect(
      isIlsReminderDue({
        dueAt,
        sentAt: null,
        now: new Date("2026-08-27T09:59:59Z"),
      })
    ).toBe(false);
    expect(
      isIlsReminderDue({
        dueAt,
        sentAt: new Date("2026-08-27T10:00:00Z"),
        now: new Date("2026-08-27T12:00:00Z"),
      })
    ).toBe(false);
  });
});
