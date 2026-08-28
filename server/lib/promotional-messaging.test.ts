import { describe, expect, it } from "vitest";
import {
  createPromotionalUnsubscribeToken,
  renderPromotionalMessage,
  verifyPromotionalUnsubscribeToken,
} from "./promotional-messaging";

describe("promotional messaging governance", () => {
  process.env.NERP_CAMPAIGN_TOKEN_SECRET = "test-promotional-secret";

  it("renders a soft optional-consent message with a recipient-specific unsubscribe link", () => {
    const message = renderPromotionalMessage({
      subject: "Learning opportunity",
      displayName: "Esther Mwangi",
      bodyText: "This is optional.\n\nPlease review it when convenient.",
      unsubscribeUrl:
        "https://www.paedsresus.com/api/promotional/unsubscribe?token=abc",
    });
    expect(message.text).toContain("Hello Esther,");
    expect(message.text).toContain("optional Paeds Resus programme messages");
    expect(message.html).toContain("unsubscribe here");
    expect(message.html).toContain("Esther");
    expect(message.html).not.toContain("<script>");
  });

  it("escapes campaign body HTML while preserving readable paragraphs", () => {
    const message = renderPromotionalMessage({
      subject: "Subject",
      displayName: "Provider",
      bodyText: "Safe <content>\n\nSecond paragraph",
      unsubscribeUrl: "https://example.test/unsubscribe",
    });
    expect(message.html).toContain("Safe &lt;content&gt;");
    expect(message.html).not.toContain("Safe <content>");
    expect(message.html).toContain("Second paragraph");
  });

  it("verifies recipient-specific unsubscribe tokens without exposing email addresses", () => {
    const token = createPromotionalUnsubscribeToken("promo-123", 42);
    expect(verifyPromotionalUnsubscribeToken(token)).toEqual({
      campaignKey: "promo-123",
      recipientId: 42,
    });
    expect(token).not.toContain("@");
    expect(verifyPromotionalUnsubscribeToken(`${token}x`)).toBeNull();
  });
});
