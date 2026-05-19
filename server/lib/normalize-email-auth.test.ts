import { describe, expect, it } from "vitest";
import { normalizeEmailForAuth } from "@shared/normalize-email";

describe("normalizeEmailForAuth", () => {
  it("trims and lowercases", () => {
    expect(normalizeEmailForAuth("  User@Example.COM  ")).toBe("user@example.com");
  });
});
