import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const repoRoot = path.resolve(__dirname, "../..");

describe("IERP boundary contract", () => {
  it("keeps self-service learner entry independent of the institutional roster and IERS permissions", () => {
    const source = fs.readFileSync(path.join(repoRoot, "server/routers/ierp.ts"), "utf8");
    expect(source).not.toContain("institutionalStaffMembers");
    expect(source).not.toContain("assertInstitutionAccess");
    expect(source).toContain('programKey: "ierp"');
  });

  it("keeps promotional campaign code away from delivery services", () => {
    const source = fs.readFileSync(path.join(repoRoot, "server/routers/ierp-campaigns.ts"), "utf8");
    expect(source).not.toContain("email-service");
    expect(source).not.toContain("sendEmail");
    expect(source).toContain("send_blocked");
  });
});
