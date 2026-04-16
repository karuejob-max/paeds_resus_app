import { describe, it, expect } from "vitest";
import { sanitizeNextPath, buildLoginUrl, readSafeNextPathFromSearch } from "./authRedirect";

describe("sanitizeNextPath", () => {
  it("returns fallback when nextPath is null, empty, or missing leading slash", () => {
    expect(sanitizeNextPath(null, "/home")).toBe("/home");
    expect(sanitizeNextPath("", "/home")).toBe("/home");
    expect(sanitizeNextPath("home", "/home")).toBe("/home");
  });

  it("allows normal in-app relative paths", () => {
    expect(sanitizeNextPath("/home", "/fallback")).toBe("/home");
    expect(sanitizeNextPath("/resus?x=1", "/fallback")).toBe("/resus?x=1");
    expect(sanitizeNextPath("/parent-safe-truth#section", "/fallback")).toBe(
      "/parent-safe-truth#section",
    );
  });

  it("rejects protocol-relative and suspicious prefixes", () => {
    expect(sanitizeNextPath("//evil.com", "/home")).toBe("/home");
    expect(sanitizeNextPath("/\\evil", "/home")).toBe("/home");
  });

  it("rejects full URLs and other non-relative values", () => {
    expect(sanitizeNextPath("https://evil.com/path", "/home")).toBe("/home");
    expect(sanitizeNextPath("javascript:alert(1)", "/home")).toBe("/home");
  });
});

describe("buildLoginUrl", () => {
  it("returns bare /login when nextPath is missing or sanitized away", () => {
    expect(buildLoginUrl()).toBe("/login");
    // Full URL gets dropped by sanitizeNextPath, so no next param.
    expect(buildLoginUrl("https://evil.com")).toBe("/login");
  });

  it("encodes safe next paths as query parameter", () => {
    expect(buildLoginUrl("/home")).toBe("/login?next=%2Fhome");
    expect(buildLoginUrl("/resus?from=/home")).toBe(
      "/login?next=%2Fresus%3Ffrom%3D%2Fhome",
    );
  });
});

describe("readSafeNextPathFromSearch", () => {
  it("returns sanitized next from search when present and safe", () => {
    const search = "?next=%2Fhome";
    expect(readSafeNextPathFromSearch(search, "/fallback")).toBe("/home");
  });
  it("falls back when next is missing or unsafe", () => {
    expect(readSafeNextPathFromSearch("", "/home")).toBe("/home");
    expect(readSafeNextPathFromSearch("?other=1", "/home")).toBe("/home");
    expect(
      readSafeNextPathFromSearch("?next=https%3A%2F%2Fevil.com", "/home"),
    ).toBe("/home");
  });
});

