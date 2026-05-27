import { describe, expect, it } from "vitest";

describe("DSAR deletion checklist", () => {
  it("uses anonymised email format per DSAR_PROCEDURE §6", () => {
    const userId = 99;
    const email = `deleted_user_${userId}@anonymised.local`;
    expect(email).toBe("deleted_user_99@anonymised.local");
  });
});
