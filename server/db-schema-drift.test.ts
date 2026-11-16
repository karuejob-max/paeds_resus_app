import { describe, expect, it } from "vitest";
import { isUsersSchemaDriftError } from "./db";

describe("users schema-drift detection", () => {
  it("recognizes a direct mysql2 unknown-column error", () => {
    expect(
      isUsersSchemaDriftError({
        code: "ER_BAD_FIELD_ERROR",
        errno: 1054,
        message: "Unknown column 'users.cadre' in 'field list'",
      })
    ).toBe(true);
  });

  it("recognizes the original error when Drizzle wraps it as a cause", () => {
    expect(
      isUsersSchemaDriftError({
        message: "Failed query: select ... from users",
        cause: {
          code: "ER_BAD_FIELD_ERROR",
          errno: 1054,
          message: "Unknown column 'users.cadreOther' in 'field list'",
        },
      })
    ).toBe(true);
  });

  it("does not classify connection or authentication failures as schema drift", () => {
    expect(isUsersSchemaDriftError(new Error("connect ETIMEDOUT db.example"))).toBe(false);
    expect(isUsersSchemaDriftError({ code: "ER_ACCESS_DENIED_ERROR", message: "Access denied" })).toBe(false);
  });
});
