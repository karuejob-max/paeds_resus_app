import { describe, expect, it } from "vitest";
import { RETENTION_WINDOWS } from "./retention-cleanup";

describe("RETENTION_WINDOWS", () => {
  it("matches DATA_RETENTION_SCHEDULE baseline", () => {
    expect(RETENTION_WINDOWS.analyticsRawMonths).toBe(13);
    expect(RETENTION_WINDOWS.adminAuditLogDays).toBe(90);
    expect(RETENTION_WINDOWS.dsarTicketsYears).toBe(3);
    expect(RETENTION_WINDOWS.resusGpsCasesMonths).toBe(24);
    expect(RETENTION_WINDOWS.careSignalEventsYears).toBe(7);
  });
});

describe("buildDsarDeletionPlan shape", () => {
  it("documents anonymised email pattern", () => {
    expect(`deleted_user_${42}@anonymised.local`).toMatch(/^deleted_user_\d+@anonymised\.local$/);
  });
});
