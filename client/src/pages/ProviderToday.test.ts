import { describe, expect, it } from "vitest";
import { buildProviderTodayAttention, type ProviderTodaySignals } from "./ProviderToday";

const baseSignals: ProviderTodaySignals = {
  activeActivation: null,
  pendingMembership: null,
  currentPendingRole: null,
  pendingReadiness: false,
  nextUtl: null,
  nextErtl: null,
};

describe("buildProviderTodayAttention", () => {
  it("prioritizes a live activation over all other provider tasks", () => {
    const result = buildProviderTodayAttention({
      ...baseSignals,
      activeActivation: { location: "Ward 3", department: "Paediatrics" },
      currentPendingRole: { roleScope: "ert_member", roleKey: "airway_lead" },
      pendingReadiness: true,
      nextUtl: { departmentName: "Paediatrics", shiftDate: "2026-09-01" },
    });

    expect(result).toMatchObject({
      eyebrow: "Live action",
      action: "Open activation response",
      destination: "/my-shift?tab=respond",
      tone: "red",
    });
  });

  it("prompts an institutional responsibility invitation before a dated role", () => {
    const result = buildProviderTodayAttention({
      ...baseSignals,
      pendingMembership: { companyName: "Example Hospital" },
      currentPendingRole: { roleScope: "ertl", roleKey: "ertl" },
    });

    expect(result).toMatchObject({
      eyebrow: "Institutional responsibility",
      action: "Review invitation",
      destination: "/my-shift?tab=team",
    });
  });

  it("routes a pending ERTL response to the team tab", () => {
    const result = buildProviderTodayAttention({
      ...baseSignals,
      currentPendingRole: { roleScope: "ertl", roleKey: "ertl" },
      pendingReadiness: true,
    });

    expect(result).toMatchObject({
      eyebrow: "Shift responsibility",
      title: "Review your ERTL / Scene Commander role",
      destination: "/my-shift?tab=team",
      tone: "amber",
    });
  });

  it("shows readiness before a routine next shift", () => {
    const result = buildProviderTodayAttention({
      ...baseSignals,
      pendingReadiness: true,
      nextUtl: {
        departmentName: "Paediatrics",
        shiftDate: "2026-09-01",
        shiftStartTime: "07:30:00",
        shiftEndTime: "17:30:00",
        shiftEndDayOffset: 0,
      },
    });

    expect(result).toMatchObject({
      eyebrow: "Readiness",
      action: "Open readiness",
      destination: "/my-shift?tab=readiness",
    });
  });

  it("falls back to ResusGPS when no provider action is waiting", () => {
    expect(buildProviderTodayAttention(baseSignals)).toMatchObject({
      eyebrow: "Ready when needed",
      action: "Open ResusGPS",
      destination: "/resus",
      tone: "teal",
    });
  });
});
