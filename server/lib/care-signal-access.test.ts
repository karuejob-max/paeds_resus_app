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
    expect(isCareSignalProviderUser({ userType: "parent" })).toBe(false);
    expect(isCareSignalProviderUser({ userType: null })).toBe(false);
  });

  it("returns Parent Safe-Truth copy for parent accounts", () => {
    expect(getCareSignalAccessDeniedMessage({ userType: "parent" })).toContain(
      "Parent Safe-Truth"
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

  it("blocks parent accounts with FORBIDDEN", () => {
    try {
      assertCareSignalProviderOrAdmin({ role: "user", userType: "parent" });
      expect.fail("expected throw");
    } catch (error) {
      expect(error).toBeInstanceOf(TRPCError);
      expect((error as TRPCError).code).toBe("FORBIDDEN");
      expect((error as TRPCError).message).toContain("Parent Safe-Truth");
    }
  });
});
