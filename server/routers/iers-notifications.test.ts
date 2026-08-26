import { describe, expect, it } from "vitest";
import {
  dispatchIersActivationClosurePush,
  dispatchIersActivationPush,
  endpointHash,
  isIersWebPushConfigured,
} from "./iers-notifications";

describe("IERS notification delivery", () => {
  it("does not attempt push delivery until all VAPID settings are configured", async () => {
    expect(isIersWebPushConfigured()).toBe(false);
    await expect(
      dispatchIersActivationPush(
        null,
        {
          activationEventId: 42,
          title: "Code Blue activation",
          body: "Location: Resuscitation Bay",
          url: "/resus?activationId=42",
          tag: "iers-activation-42",
        },
        [7]
      )
    ).resolves.toEqual({
      configured: false,
      attempted: 0,
      sent: 0,
      failed: 0,
      expired: 0,
    });
  });

  it("does not attempt closure delivery until all VAPID settings are configured", async () => {
    await expect(
      dispatchIersActivationClosurePush(
        null,
        {
          activationEventId: 42,
          status: "cancelled",
          tag: "iers-activation-42",
        },
        [7]
      )
    ).resolves.toEqual({
      configured: false,
      attempted: 0,
      sent: 0,
      failed: 0,
      expired: 0,
    });
  });

  it("hashes an endpoint to a stable fixed-length storage key", () => {
    const endpoint = "https://push.example.test/send/test-endpoint";
    const first = endpointHash(endpoint);
    expect(first).toHaveLength(64);
    expect(first).toMatch(/^[a-f0-9]+$/);
    expect(endpointHash(endpoint)).toBe(first);
    expect(endpointHash(`${endpoint}/different`)).not.toBe(first);
  });
});
