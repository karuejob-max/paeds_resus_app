import { describe, expect, it } from "vitest";
import { toCanonicalNotification } from "./notifications";

describe("canonical notifications", () => {
  const base = {
    id: 7,
    userId: 42,
    type: "institution_role_assignment",
    domain: null,
    severity: null,
    requiresAction: false,
    title: "Role assigned",
    body: "Accept this role.",
    actionUrl: "/my-shift?tab=team",
    relatedId: 12,
    dataJson: JSON.stringify({ roleKey: "department_head" }),
    dedupeKey: null,
    read: false,
    readAt: null,
    dismissedAt: null,
    expiresAt: null,
    createdAt: new Date("2026-09-27T20:00:00.000Z"),
  } as any;

  it("categorizes pre-migration role notifications safely", () => {
    const notification = toCanonicalNotification(base);
    expect(notification.domain).toBe("role");
    expect(notification.severity).toBe("action_required");
    expect(notification.requiresAction).toBe(true);
    expect(notification.data).toEqual({ roleKey: "department_head" });
  });

  it("preserves explicit taxonomy and handles malformed metadata", () => {
    const notification = toCanonicalNotification({
      ...base,
      type: "care_signal_review",
      domain: "clinical",
      severity: "info",
      requiresAction: false,
      dataJson: "not-json",
    });
    expect(notification.domain).toBe("clinical");
    expect(notification.severity).toBe("info");
    expect(notification.requiresAction).toBe(false);
    expect(notification.data).toBeNull();
  });
});
