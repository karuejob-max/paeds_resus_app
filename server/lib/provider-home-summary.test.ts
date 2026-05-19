import { describe, expect, it } from "vitest";

import { selectProviderHomePrimaryAction } from "./provider-home-summary";

const activeAccess = {
  canUse: true,
  mode: "active" as const,
  expiresAt: new Date().toISOString(),
  daysRemaining: 12,
  headline: "ResusGPS access active",
  detail: "Active.",
};

const expiredAccess = {
  canUse: false,
  mode: "expired" as const,
  expiresAt: new Date().toISOString(),
  daysRemaining: 0,
  headline: "ResusGPS access paused",
  detail: "Expired.",
};

describe("selectProviderHomePrimaryAction", () => {
  it("starts a not-yet-started micro-course even when an AHA enrollment is still pending payment", () => {
    const action = selectProviderHomePrimaryAction({
      ahaEnrollments: [
        {
          id: 11,
          programType: "bls",
          paymentStatus: "pending",
          createdAt: new Date("2026-04-13T10:00:00.000Z"),
        },
      ],
      microEnrollments: [
        {
          id: 22,
          enrollmentStatus: "active",
          paymentStatus: "completed",
          progressPercentage: 0,
          createdAt: new Date("2026-04-13T09:00:00.000Z"),
          course: { courseId: "pals_septic", title: "Paediatric Septic Shock I" },
        },
      ],
      resusAccess: expiredAccess,
    });

    expect(action.key).toBe("start_course");
    expect(action.destination).toBe(
      "/micro-course/pals_septic?programType=pals&enrollmentId=22",
    );
  });

  it("starts a paid course before continuing another area", () => {
    const action = selectProviderHomePrimaryAction({
      ahaEnrollments: [],
      microEnrollments: [
        {
          id: 22,
          enrollmentStatus: "active",
          paymentStatus: "completed",
          progressPercentage: 0,
          createdAt: new Date("2026-04-13T09:00:00.000Z"),
          course: { courseId: "pals_septic", title: "Paediatric Septic Shock I" },
        },
      ],
      resusAccess: activeAccess,
    });

    expect(action.key).toBe("start_course");
    expect(action.destination).toBe(
      "/micro-course/pals_septic?programType=pals&enrollmentId=22",
    );
  });

  it("continues an in-progress course when no payment recovery is needed", () => {
    const action = selectProviderHomePrimaryAction({
      ahaEnrollments: [],
      microEnrollments: [
        {
          id: 33,
          enrollmentStatus: "active",
          paymentStatus: "free",
          progressPercentage: 40,
          createdAt: new Date("2026-04-13T09:00:00.000Z"),
          course: { courseId: "bls", title: "BLS" },
        },
      ],
      resusAccess: activeAccess,
    });

    expect(action.key).toBe("continue_learning");
    expect(action.destination).toBe(
      "/micro-course/bls?programType=bls&enrollmentId=33",
    );
  });

  it("nudges access renewal when learning is clear but ResusGPS is paused", () => {
    const action = selectProviderHomePrimaryAction({
      ahaEnrollments: [],
      microEnrollments: [],
      resusAccess: expiredAccess,
    });

    expect(action.key).toBe("renew_resusgps");
    expect(action.destination).toBe("/fellowship");
  });

  it("opens ResusGPS when no stronger action exists", () => {
    const action = selectProviderHomePrimaryAction({
      ahaEnrollments: [],
      microEnrollments: [],
      resusAccess: activeAccess,
    });

    expect(action.key).toBe("open_resusgps");
    expect(action.destination).toBe("/resus");
  });
});
