import { afterEach, describe, expect, it } from "vitest";
import { NERP_PATHWAY_ENTRY_PATH } from "../../shared/nerp-pathway";
import {
  createNerpCampaignMessage,
  createUnsubscribeToken,
  verifyUnsubscribeToken,
  NERP_SUPPORT_EMAIL,
  NERP_SUPPORT_PHONE,
} from "./nerp-campaign-email";

describe("governed NERP campaign email", () => {
  const originalSecret = process.env.NERP_CAMPAIGN_TOKEN_SECRET;

  afterEach(() => {
    if (originalSecret === undefined)
      delete process.env.NERP_CAMPAIGN_TOKEN_SECRET;
    else process.env.NERP_CAMPAIGN_TOKEN_SECRET = originalSecret;
  });

  it("signs and verifies a recipient-specific unsubscribe token", () => {
    process.env.NERP_CAMPAIGN_TOKEN_SECRET = "test-secret";
    const token = createUnsubscribeToken("nerp-campaign-1", 42);
    expect(verifyUnsubscribeToken(token)).toEqual({
      campaignKey: "nerp-campaign-1",
      recipientId: 42,
    });
    expect(verifyUnsubscribeToken(`${token}tampered`)).toBeNull();
  });

  it("escapes the recipient name and includes the enrollment and unsubscribe links", () => {
    const message = createNerpCampaignMessage({
      displayName: "<Nurse>",
      enrollmentUrl: `https://www.paedsresus.com${NERP_PATHWAY_ENTRY_PATH}`,
      unsubscribeUrl:
        "https://www.paedsresus.com/api/nerp/campaign/unsubscribe?token=x",
    });
    expect(message.subject).toContain("AHA ACLS");
    expect(message.html).toContain("&lt;Nurse&gt;");
    expect(message.html).toContain(NERP_PATHWAY_ENTRY_PATH);
    expect(message.html).not.toContain("/programs/nerp-acls/enroll");
    expect(message.html).toContain("/api/nerp/campaign/unsubscribe");
    expect(message.html).toContain(NERP_SUPPORT_PHONE);
    expect(message.html).toContain(`mailto:${NERP_SUPPORT_EMAIL}`);
    expect(message.text).toContain("Hello <Nurse>");
    expect(message.text).toContain(NERP_SUPPORT_PHONE);
    expect(message.text).toContain(NERP_SUPPORT_EMAIL);
  });
});
