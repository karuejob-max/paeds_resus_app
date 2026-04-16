import { describe, expect, it } from "vitest";
import * as db from "./db";

describe("db compatibility exports", () => {
  it("exposes legacy auth router helpers", () => {
    expect(typeof db.getUserById).toBe("function");
    expect(typeof db.createAuditLog).toBe("function");
  });
});
