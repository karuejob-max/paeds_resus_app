import { describe, expect, it } from "vitest";
import { normalizeSesNotification } from "./ses-feedback";

describe("SES feedback normalization", () => {
  it("normalizes a delivery notification to the recipient and provider message id", () => {
    const events = normalizeSesNotification("sns-1", {
      eventType: "Delivery",
      mail: {
        messageId: "ses-1",
        destination: ["User@Example.com"],
      },
      delivery: { timestamp: "2026-08-28T10:00:00.000Z" },
    });

    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({
      providerEventId: "sns-1:delivery:user@example.com",
      providerMessageId: "ses-1",
      eventType: "delivery",
      outcome: "delivered",
      recipientEmail: "user@example.com",
    });
  });

  it("handles multiple bounced recipients without leaking extra recipient fields", () => {
    const events = normalizeSesNotification("sns-2", {
      notificationType: "Bounce",
      mail: {
        messageId: "ses-2",
        destination: ["one@example.com", "two@example.com"],
      },
      bounce: {
        timestamp: "2026-08-28T10:01:00.000Z",
        bouncedRecipients: [
          { emailAddress: "one@example.com", diagnosticCode: "smtp; 550" },
          { emailAddress: "two@example.com", status: "5.1.1" },
        ],
      },
    });

    expect(events).toHaveLength(2);
    expect(events.map(event => event.recipientEmail)).toEqual([
      "one@example.com",
      "two@example.com",
    ]);
    expect(events.every(event => event.outcome === "bounced")).toBe(true);
  });

  it("returns no event when SES does not provide its provider message id", () => {
    expect(
      normalizeSesNotification("sns-3", {
        eventType: "Delivery",
        mail: { destination: ["user@example.com"] },
      })
    ).toEqual([]);
  });
});
