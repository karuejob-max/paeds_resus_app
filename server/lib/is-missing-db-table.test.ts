import { describe, expect, it } from "vitest";
import { isMissingTableError } from "./is-missing-db-table";

describe("isMissingTableError", () => {
  it("detects Drizzle missing-table messages", () => {
    const err = new Error(
      "Failed query: select count(*) from `inAppNotifications` where (`inAppNotifications`.`userId` = ? and `inAppNotifications`.`read` = ?)"
    );
    expect(isMissingTableError(err, "inAppNotifications")).toBe(true);
    expect(isMissingTableError(err, "providerSampleHistory")).toBe(false);
  });

  it("returns false for unrelated errors", () => {
    expect(isMissingTableError(new Error("connection refused"))).toBe(false);
  });
});
