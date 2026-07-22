import { describe, expect, it } from "vitest";
import { TRPCError } from "@trpc/server";
import {
  assertCareSignalProviderOrAdmin,
  getCareSignalAccessDeniedMessage,
  isCareSignalProviderUser,
} from "./care-signal-access";

describe("care-signal-access", () => {
  it("treats individual and institutional users as providers", () => {
    expect(isCareSignalProviderUser({ userType: "individual" })).toBe(true);
    expect(isCareSignalProviderUser({ userType: "institutional" })).toBe(true);
    expect(isCareSignalProviderUser({ userType: null })).toBe(false);
  });

  it("points non-providers to Safe-Truth (no account needed) in the denial copy", () => {
    // userType "parent" is retired (North Star §6.1) but the access-check
    // functions still take a bare `string | null` — this exercises the
    // generic non-provider path any unrecognized/legacy value would hit.
    expect(getCareSignalAccessDeniedMessage({ userType: "parent" })).toContain(
      "Safe-Truth"
    );
  });

  it("returns signup fix copy when userType is missing or unknown", () => {
    expect(getCareSignalAccessDeniedMessage({ userType: null })).toContain("Account Settings");
    expect(getCareSignalAccessDeniedMessage({ userType: undefined })).toContain(
      "healthcare provider"
    );
  });

  it("allows individual provider without providerType profession set", () => {
    expect(() =>
      assertCareSignalProviderOrAdmin({ role: "user", userType: "individual" })
    ).not.toThrow();
  });

  it("allows admin regardless of userType", () => {
    expect(() =>
      assertCareSignalProviderOrAdmin({ role: "admin", userType: "parent" })
    ).not.toThrow();
  });

  it("blocks non-provider accounts with FORBIDDEN", () => {
    try {
      assertCareSignalProviderOrAdmin({ role: "user", userType: "parent" });
      expect.fail("expected throw");
    } catch (error) {
      expect(error).toBeInstanceOf(TRPCError);
      expect((error as TRPCError).code).toBe("FORBIDDEN");
      expect((error as TRPCError).message).toContain("Safe-Truth");
    }
  });
});
