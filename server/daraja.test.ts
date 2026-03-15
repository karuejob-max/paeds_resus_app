import { describe, it, expect } from "vitest";

/**
 * Test Daraja API credentials by attempting to get a Bearer token
 * This validates that DARAJA_CONSUMER_KEY and DARAJA_CONSUMER_SECRET are correct
 */
describe("Daraja API Credentials", () => {
  it("should successfully authenticate with Daraja API and get Bearer token", async () => {
    const consumerKey = process.env.DARAJA_CONSUMER_KEY;
    const consumerSecret = process.env.DARAJA_CONSUMER_SECRET;

    expect(consumerKey).toBeDefined();
    expect(consumerSecret).toBeDefined();

    // Base64 encode credentials for Basic Auth
    const credentials = Buffer.from(`${consumerKey}:${consumerSecret}`).toString(
      "base64"
    );

    try {
      const response = await fetch(
        "https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials",
        {
          method: "GET",
          headers: {
            Authorization: `Basic ${credentials}`,
            "Content-Type": "application/json",
          },
        }
      );

      expect(response.status).toBe(200);

      const data = (await response.json()) as {
        access_token?: string;
        expires_in?: string | number;
      };

      expect(data.access_token).toBeDefined();
      expect(data.access_token).toMatch(/^[a-zA-Z0-9_-]+$/);
      const expiresIn = typeof data.expires_in === "string" ? parseInt(data.expires_in) : data.expires_in;
      expect(expiresIn).toBeGreaterThan(0);

      console.log("✅ Daraja credentials are valid");
      console.log(`   Access token expires in: ${expiresIn} seconds`);
    } catch (error) {
      throw new Error(
        `Failed to authenticate with Daraja: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  });
});
